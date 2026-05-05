import { Router, type IRouter } from "express";
import { eq, and, desc } from "drizzle-orm";
import {
  db,
  retencaoTable,
  retencaoAuditLogTable,
  alunosTable,
  turmasTable,
  disciplinasTable,
  matriculasTable,
  chamadasTable,
  bapMensalTable,
} from "@workspace/db";
import {
  UpdateRetencaoParams,
  UpdateRetencaoBody,
  GetRetencaoTimelineParams,
  NotificarAlunoParams,
  NotificarAlunoBody,
  GetRetencaoDetalheParams,
  ExecutarAcaoRetencaoParams,
  ExecutarAcaoRetencaoBody,
} from "@workspace/api-zod";
import { verifyToken } from "./auth";

const router: IRouter = Router();

// ── helpers ────────────────────────────────────────────────────────────────

function getUserFromRequest(req: import("express").Request): { role: string; nome: string } | null {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const payload = verifyToken(auth.slice(7));
    return { role: (payload as { role: string }).role, nome: (payload as { email: string }).email };
  } catch {
    return null;
  }
}

async function buildDetalhada(r: typeof retencaoTable.$inferSelect) {
  const [aluno] = await db.select().from(alunosTable).where(eq(alunosTable.id, r.alunoId));
  const [turma] = await db.select().from(turmasTable).where(eq(turmasTable.id, r.turmaId));
  const [disciplina] = turma
    ? await db.select().from(disciplinasTable).where(eq(disciplinasTable.id, turma.disciplinaId))
    : [];

  return {
    ...r,
    percentualFaltas: parseFloat(r.percentualFaltas),
    alunoNome: aluno?.nomeCompleto ?? "N/A",
    alunoCurso: aluno?.curso ?? "N/A",
    alunoMatricula: aluno?.matricula ?? "N/A",
    disciplinaNome: disciplina?.nome ?? "N/A",
    periodo: turma?.periodo ?? "N/A",
  };
}

async function buildDetalhadaCompleta(r: typeof retencaoTable.$inferSelect) {
  const base = await buildDetalhada(r);
  const [aluno] = await db.select().from(alunosTable).where(eq(alunosTable.id, r.alunoId));

  // Get all turmas for this student and compute faltas per disciplina
  const matriculas = await db
    .select({ turmaId: matriculasTable.turmaId })
    .from(matriculasTable)
    .where(eq(matriculasTable.alunoId, r.alunoId));

  const disciplinas = [];
  for (const m of matriculas) {
    const [turma] = await db.select().from(turmasTable).where(eq(turmasTable.id, m.turmaId));
    if (!turma) continue;
    const [disc] = await db.select().from(disciplinasTable).where(eq(disciplinasTable.id, turma.disciplinaId));
    const chamadas = await db
      .select()
      .from(chamadasTable)
      .where(and(eq(chamadasTable.turmaId, m.turmaId), eq(chamadasTable.alunoId, r.alunoId)));

    const totalAulas = chamadas.length;
    const faltas = chamadas.filter((c) => !c.presente).length;
    const percentualFaltas = totalAulas > 0 ? Math.round((faltas / totalAulas) * 10000) / 100 : 0;
    disciplinas.push({ disciplinaNome: disc?.nome ?? "N/A", totalAulas, faltas, percentualFaltas });
  }

  const timeline = await db
    .select()
    .from(retencaoAuditLogTable)
    .where(eq(retencaoAuditLogTable.retencaoId, r.id))
    .orderBy(retencaoAuditLogTable.createdAt);

  return {
    ...base,
    alunoValorMensalidade: parseFloat(aluno?.valorMensalidade ?? "979.00"),
    disciplinas,
    timeline,
  };
}

// ── state machine ──────────────────────────────────────────────────────────

const TRANSITIONS: Record<
  string,
  { from: string[]; to: string; roles: string[]; acaoLabel: string; responsavel?: string }
> = {
  encaminhar: {
    from: ["Identificado"],
    to: "Encaminhado",
    roles: ["Secretaria", "Admin"],
    acaoLabel: "Encaminhado para o setor de Retenção",
    responsavel: "Retencao",
  },
  registrar_contato: {
    from: ["Encaminhado"],
    to: "Em_Contato",
    roles: ["Retencao", "Admin"],
    acaoLabel: "Contato com o aluno registrado",
    responsavel: "Retencao",
  },
  aguardar_resposta: {
    from: ["Em_Contato"],
    to: "Aguardando_Resposta",
    roles: ["Retencao", "Admin"],
    acaoLabel: "Aguardando retorno do aluno",
    responsavel: "Retencao",
  },
  retorno_confirmado: {
    from: ["Aguardando_Resposta"],
    to: "Retorno_Confirmado",
    roles: ["Retencao", "Admin"],
    acaoLabel: "Retorno confirmado — aluno decidiu continuar",
    responsavel: "Retencao",
  },
  cancelamento_solicitado: {
    from: ["Aguardando_Resposta"],
    to: "Cancelamento_Solicitado",
    roles: ["Retencao", "Admin"],
    acaoLabel: "Cancelamento solicitado pelo aluno",
    responsavel: "Secretaria",
  },
  preencher_formulario: {
    from: ["Cancelamento_Solicitado"],
    to: "Formulario_Preenchido",
    roles: ["Secretaria", "Admin"],
    acaoLabel: "Formulário de cancelamento preenchido e enviado para Retenção",
    responsavel: "Retencao",
  },
  encaminhar_assinatura: {
    from: ["Formulario_Preenchido"],
    to: "Aguardando_Assinatura",
    roles: ["Retencao", "Admin"],
    acaoLabel: "Encaminhado para assinatura da Coordenação Pedagógica",
    responsavel: "Coordenacao",
  },
  assinar: {
    from: ["Aguardando_Assinatura"],
    to: "Assinado",
    roles: ["Coordenador", "Admin"],
    acaoLabel: "Documento assinado pela Coordenação Pedagógica",
    responsavel: "Secretaria",
  },
  retirar_crm: {
    from: ["Assinado"],
    to: "Enviado_CRM",
    roles: ["Secretaria", "Admin"],
    acaoLabel: "Encaminhado para retirada do aluno do CRM",
    responsavel: "Secretaria",
  },
  remover_bap: {
    from: ["Enviado_CRM"],
    to: "Removido_BAP",
    roles: ["Secretaria", "Admin"],
    acaoLabel: "Aluno removido da BAP do mês corrente",
    responsavel: "Secretaria",
  },
  notificar_hbs: {
    from: ["Removido_BAP"],
    to: "HBS_Notificado",
    roles: ["Secretaria", "Admin"],
    acaoLabel: "Hospital Bom Samaritano notificado",
    responsavel: "Secretaria",
  },
  encerrar: {
    from: ["HBS_Notificado"],
    to: "Encerrado",
    roles: ["Secretaria", "Admin"],
    acaoLabel: "Processo de cancelamento encerrado",
    responsavel: "Secretaria",
  },
  reintegrar: {
    from: ["Retorno_Confirmado"],
    to: "Reintegrado",
    roles: ["Secretaria", "Admin"],
    acaoLabel: "Aluno reintegrado — status restaurado para Ativo",
    responsavel: "Secretaria",
  },
};

// ── routes ─────────────────────────────────────────────────────────────────

router.get("/retencao", async (req, res): Promise<void> => {
  const { curso, status } = req.query as Record<string, string>;

  const rows = await db.select().from(retencaoTable).orderBy(desc(retencaoTable.createdAt));
  const detalhadas = await Promise.all(rows.map(buildDetalhada));

  const filtered = detalhadas.filter((r) => {
    if (curso && r.alunoCurso !== curso) return false;
    if (status && r.status !== status) return false;
    return true;
  });

  res.json(filtered);
});

router.get("/retencao/:id", async (req, res): Promise<void> => {
  const params = GetRetencaoDetalheParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const [r] = await db.select().from(retencaoTable).where(eq(retencaoTable.id, params.data.id));
  if (!r) { res.status(404).json({ error: "Retenção não encontrada" }); return; }

  res.json(await buildDetalhadaCompleta(r));
});

router.post("/retencao/:id/acao", async (req, res): Promise<void> => {
  const params = ExecutarAcaoRetencaoParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const body = ExecutarAcaoRetencaoBody.safeParse(req.body);
  if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

  const user = getUserFromRequest(req);
  const userRole = user?.role ?? "Secretaria";
  const userName = user?.nome ?? "Sistema";

  const [retencao] = await db.select().from(retencaoTable).where(eq(retencaoTable.id, params.data.id));
  if (!retencao) { res.status(404).json({ error: "Retenção não encontrada" }); return; }

  const { acao, observacao, motivoCancelamento, nomeCoordinadora } = body.data;
  const transition = TRANSITIONS[acao];

  if (!transition) {
    res.status(400).json({ error: `Ação desconhecida: ${acao}` });
    return;
  }

  if (!transition.from.includes(retencao.status)) {
    res.status(400).json({
      error: `Ação "${acao}" não permitida no status atual "${retencao.status}". Status válidos: ${transition.from.join(", ")}`,
    });
    return;
  }

  // Allow Admin to bypass role checks
  if (userRole !== "Admin" && !transition.roles.includes(userRole)) {
    res.status(403).json({
      error: `Papel "${userRole}" não autorizado para a ação "${acao}". Requer: ${transition.roles.join(" ou ")}`,
    });
    return;
  }

  const updateData: Record<string, unknown> = {
    status: transition.to,
    responsavel: transition.responsavel ?? retencao.responsavel,
  };

  if (motivoCancelamento) updateData.motivoCancelamento = motivoCancelamento;
  if (nomeCoordinadora) {
    updateData.nomeCoordinadora = nomeCoordinadora;
    updateData.dataAssinatura = new Date().toISOString().split("T")[0];
  }

  // If encaminhar: set dataNotificacao
  if (acao === "encaminhar") {
    updateData.dataNotificacao = new Date().toISOString().split("T")[0];
  }

  // If reintegrar: update aluno status to Ativo
  if (acao === "reintegrar") {
    await db.update(alunosTable).set({ status: "Ativo" }).where(eq(alunosTable.id, retencao.alunoId));
  }

  // If remover_bap: remove from BAP of current month
  if (acao === "remover_bap") {
    const now = new Date();
    const mes = now.getMonth() + 1;
    const ano = now.getFullYear();
    await db
      .delete(bapMensalTable)
      .where(
        and(
          eq(bapMensalTable.alunoId, retencao.alunoId),
          eq(bapMensalTable.mes, mes),
          eq(bapMensalTable.ano, ano)
        )
      );
  }

  const [updated] = await db
    .update(retencaoTable)
    .set(updateData)
    .where(eq(retencaoTable.id, retencao.id))
    .returning();

  await db.insert(retencaoAuditLogTable).values({
    retencaoId: retencao.id,
    acao: transition.acaoLabel,
    observacao: observacao ?? null,
    realizadoPor: `${userRole} (${userName})`,
  });

  res.json(await buildDetalhadaCompleta(updated));
});

router.patch("/retencao/:id", async (req, res): Promise<void> => {
  const params = UpdateRetencaoParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateRetencaoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status) updateData.status = parsed.data.status;
  if (parsed.data.observacaoSecretaria !== undefined) updateData.observacaoSecretaria = parsed.data.observacaoSecretaria;

  const [retencao] = await db.update(retencaoTable).set(updateData).where(eq(retencaoTable.id, params.data.id)).returning();
  if (!retencao) { res.status(404).json({ error: "Retenção não encontrada" }); return; }

  res.json({ ...retencao, percentualFaltas: parseFloat(retencao.percentualFaltas) });
});

router.get("/retencao/:id/timeline", async (req, res): Promise<void> => {
  const params = GetRetencaoTimelineParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }

  const logs = await db
    .select()
    .from(retencaoAuditLogTable)
    .where(eq(retencaoAuditLogTable.retencaoId, params.data.id))
    .orderBy(retencaoAuditLogTable.createdAt);

  res.json(logs);
});

router.post("/retencao/:id/notificar", async (req, res): Promise<void> => {
  const params = NotificarAlunoParams.safeParse(req.params);
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = NotificarAlunoBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const today = new Date().toISOString().split("T")[0];
  await db.update(retencaoTable).set({ dataNotificacao: today }).where(eq(retencaoTable.id, params.data.id));

  const [log] = await db.insert(retencaoAuditLogTable).values({
    retencaoId: params.data.id,
    acao: "Aluno notificado",
    observacao: parsed.data.observacao,
    realizadoPor: "Secretaria",
  }).returning();

  res.json(log);
});

export default router;
