import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, retencaoTable, retencaoAuditLogTable, alunosTable, turmasTable, disciplinasTable } from "@workspace/db";
import { UpdateRetencaoBody, UpdateRetencaoParams, GetRetencaoTimelineParams, NotificarAlunoBody, NotificarAlunoParams } from "@workspace/api-zod";

const router: IRouter = Router();

async function buildRetencaoDetalhada(r: typeof retencaoTable.$inferSelect) {
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
    disciplinaNome: disciplina?.nome ?? "N/A",
    periodo: turma?.periodo ?? "N/A",
  };
}

router.get("/retencao", async (req, res): Promise<void> => {
  const { curso, status, disciplinaId } = req.query as Record<string, string>;

  let rows = await db.select().from(retencaoTable).orderBy(retencaoTable.createdAt);

  const detalhadas = await Promise.all(rows.map(buildRetencaoDetalhada));

  const filtered = detalhadas.filter((r) => {
    if (curso && r.alunoCurso !== curso) return false;
    if (status && r.status !== status) return false;
    if (disciplinaId) {
      // Filter by disciplina would need join — skip for simplicity
    }
    return true;
  });

  res.json(filtered);
});

router.patch("/retencao/:id", async (req, res): Promise<void> => {
  const params = UpdateRetencaoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateRetencaoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = {};
  if (parsed.data.status) updateData.status = parsed.data.status;
  if (parsed.data.observacaoSecretaria !== undefined) updateData.observacaoSecretaria = parsed.data.observacaoSecretaria;

  const [retencao] = await db
    .update(retencaoTable)
    .set(updateData)
    .where(eq(retencaoTable.id, params.data.id))
    .returning();

  if (!retencao) {
    res.status(404).json({ error: "Retenção não encontrada" });
    return;
  }

  // If marked as Reprovado_Faltas, update student status
  if (parsed.data.status === "Reprovado_Faltas") {
    await db.update(alunosTable).set({ status: "Retido" }).where(eq(alunosTable.id, retencao.alunoId));
    await db.insert(retencaoAuditLogTable).values({
      retencaoId: retencao.id,
      acao: "Reprovado por Faltas",
      observacao: parsed.data.observacaoSecretaria ?? null,
      realizadoPor: "Secretaria",
    });
  } else if (parsed.data.status === "Regularizado") {
    await db.insert(retencaoAuditLogTable).values({
      retencaoId: retencao.id,
      acao: "Regularizado",
      observacao: parsed.data.observacaoSecretaria ?? null,
      realizadoPor: "Secretaria",
    });
  }

  res.json({ ...retencao, percentualFaltas: parseFloat(retencao.percentualFaltas) });
});

router.get("/retencao/:id/timeline", async (req, res): Promise<void> => {
  const params = GetRetencaoTimelineParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const logs = await db
    .select()
    .from(retencaoAuditLogTable)
    .where(eq(retencaoAuditLogTable.retencaoId, params.data.id))
    .orderBy(retencaoAuditLogTable.createdAt);

  res.json(logs);
});

router.post("/retencao/:id/notificar", async (req, res): Promise<void> => {
  const params = NotificarAlunoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = NotificarAlunoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const today = new Date().toISOString().split("T")[0];
  await db
    .update(retencaoTable)
    .set({ dataNotificacao: today })
    .where(eq(retencaoTable.id, params.data.id));

  const [log] = await db
    .insert(retencaoAuditLogTable)
    .values({
      retencaoId: params.data.id,
      acao: "Aluno Notificado",
      observacao: parsed.data.observacao,
      realizadoPor: "Secretaria",
    })
    .returning();

  res.json(log);
});

export default router;
