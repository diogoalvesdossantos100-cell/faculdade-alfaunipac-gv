import { Router, type IRouter } from "express";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db, chamadasTable, matriculasTable, alunosTable, turmasTable, disciplinasTable, retencaoTable, retencaoAuditLogTable } from "@workspace/db";
import { SaveChamadaBody, GetFrequenciaAlunoParams, GetDatasRegistradasParams } from "@workspace/api-zod";

const router: IRouter = Router();

function buildChamadaWhere(turmaId?: string, alunoId?: string, data?: string, dataInicio?: string, dataFim?: string) {
  const conditions = [];
  if (turmaId) conditions.push(eq(chamadasTable.turmaId, parseInt(turmaId)));
  if (alunoId) conditions.push(eq(chamadasTable.alunoId, parseInt(alunoId)));
  if (data) conditions.push(eq(chamadasTable.data, data));
  if (dataInicio) conditions.push(gte(chamadasTable.data, dataInicio));
  if (dataFim) conditions.push(lte(chamadasTable.data, dataFim));
  return conditions.length > 0 ? and(...conditions) : undefined;
}

router.get("/chamadas", async (req, res): Promise<void> => {
  const { turmaId, alunoId, data, dataInicio, dataFim } = req.query as Record<string, string>;

  const chamadas = await db
    .select({
      id: chamadasTable.id,
      turmaId: chamadasTable.turmaId,
      alunoId: chamadasTable.alunoId,
      data: chamadasTable.data,
      presente: chamadasTable.presente,
      justificada: chamadasTable.justificada,
      tipoJustificativa: chamadasTable.tipoJustificativa,
      observacao: chamadasTable.observacao,
      alunoNome: alunosTable.nomeCompleto,
    })
    .from(chamadasTable)
    .leftJoin(alunosTable, eq(chamadasTable.alunoId, alunosTable.id))
    .where(buildChamadaWhere(turmaId, alunoId, data, dataInicio, dataFim))
    .orderBy(chamadasTable.data);

  res.json(chamadas);
});

router.post("/chamadas", async (req, res): Promise<void> => {
  const parsed = SaveChamadaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { turmaId, data, registros } = parsed.data;
  let saved = 0;
  let retencaoFlagged = 0;

  for (const reg of registros) {
    // Upsert: delete existing and re-insert
    await db
      .delete(chamadasTable)
      .where(and(eq(chamadasTable.turmaId, turmaId), eq(chamadasTable.alunoId, reg.alunoId), eq(chamadasTable.data, data)));

    await db.insert(chamadasTable).values({
      turmaId,
      alunoId: reg.alunoId,
      data,
      presente: reg.presente,
      justificada: reg.justificada ?? false,
      tipoJustificativa: reg.tipoJustificativa ?? null,
      observacao: reg.observacao ?? null,
    });
    saved++;
  }

  // Check retention for all students in this turma
  const allChamadas = await db
    .select()
    .from(chamadasTable)
    .where(eq(chamadasTable.turmaId, turmaId));

  const studentMap = new Map<number, { totalAulas: number; faltas: number }>();
  for (const c of allChamadas) {
    if (!studentMap.has(c.alunoId)) {
      studentMap.set(c.alunoId, { totalAulas: 0, faltas: 0 });
    }
    const s = studentMap.get(c.alunoId)!;
    s.totalAulas++;
    if (!c.presente) s.faltas++;
  }

  for (const [alunoId, stats] of studentMap.entries()) {
    if (stats.totalAulas === 0) continue;
    const pct = (stats.faltas / stats.totalAulas) * 100;
    if (pct > 25) {
      const [existing] = await db
        .select()
        .from(retencaoTable)
        .where(and(eq(retencaoTable.alunoId, alunoId), eq(retencaoTable.turmaId, turmaId)));

      if (!existing) {
        const today = new Date().toISOString().split("T")[0];
        const [novo] = await db.insert(retencaoTable).values({
          alunoId,
          turmaId,
          percentualFaltas: String(Math.round(pct * 100) / 100),
          status: "Identificado",
          responsavel: "Secretaria",
          dataNotificacao: today,
        }).returning();
        await db.insert(retencaoAuditLogTable).values({
          retencaoId: novo.id,
          acao: "Identificado automaticamente por excesso de faltas",
          observacao: `Percentual de faltas: ${Math.round(pct * 100) / 100}%`,
          realizadoPor: "Sistema",
        });
        retencaoFlagged++;
      } else {
        await db
          .update(retencaoTable)
          .set({ percentualFaltas: String(Math.round(pct * 100) / 100) })
          .where(eq(retencaoTable.id, existing.id));
      }
    }
  }

  res.json({ saved, retencaoFlagged });
});

router.get("/chamadas/frequencia/:alunoId", async (req, res): Promise<void> => {
  const params = GetFrequenciaAlunoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const matriculas = await db
    .select({ turmaId: matriculasTable.turmaId })
    .from(matriculasTable)
    .where(eq(matriculasTable.alunoId, params.data.alunoId));

  const result = [];
  for (const m of matriculas) {
    const [turma] = await db.select().from(turmasTable).where(eq(turmasTable.id, m.turmaId));
    if (!turma) continue;
    const [disciplina] = await db.select().from(disciplinasTable).where(eq(disciplinasTable.id, turma.disciplinaId));

    const chamadas = await db
      .select()
      .from(chamadasTable)
      .where(and(eq(chamadasTable.turmaId, m.turmaId), eq(chamadasTable.alunoId, params.data.alunoId)));

    const totalAulas = chamadas.length;
    const presencas = chamadas.filter((c) => c.presente).length;
    const faltasJustificadas = chamadas.filter((c) => !c.presente && c.justificada).length;
    const faltas = totalAulas - presencas;
    const percentualFaltas = totalAulas > 0 ? (faltas / totalAulas) * 100 : 0;

    const [retencao] = await db
      .select()
      .from(retencaoTable)
      .where(and(eq(retencaoTable.alunoId, params.data.alunoId), eq(retencaoTable.turmaId, m.turmaId)));

    result.push({
      turmaId: m.turmaId,
      disciplinaNome: disciplina?.nome ?? "N/A",
      periodo: turma.periodo,
      totalAulas,
      presencas,
      faltas,
      faltasJustificadas,
      percentualFaltas: Math.round(percentualFaltas * 100) / 100,
      emRetencao: !!retencao && retencao.status === "Em_Acompanhamento",
    });
  }

  res.json(result);
});

router.get("/chamadas/datas/:turmaId", async (req, res): Promise<void> => {
  const params = GetDatasRegistradasParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const rows = await db
    .selectDistinct({ data: chamadasTable.data })
    .from(chamadasTable)
    .where(eq(chamadasTable.turmaId, params.data.turmaId))
    .orderBy(chamadasTable.data);

  res.json(rows.map((r) => r.data));
});

export default router;
