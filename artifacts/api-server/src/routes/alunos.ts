import { Router, type IRouter } from "express";
import { eq, ilike, and, or, sql } from "drizzle-orm";
import { db, alunosTable } from "@workspace/db";
import { CreateAlunoBody, UpdateAlunoBody, GetAlunoParams, UpdateAlunoParams, DeleteAlunoParams, ImportAlunosBody } from "@workspace/api-zod";
import { retencaoTable, turmasTable, disciplinasTable, chamadasTable, documentosTable, matriculasTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/alunos", async (req, res): Promise<void> => {
  const { search, curso, status, turno } = req.query as Record<string, string>;

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(alunosTable.nomeCompleto, `%${search}%`),
        ilike(alunosTable.cpf, `%${search}%`),
        ilike(alunosTable.matricula, `%${search}%`)
      )
    );
  }
  if (curso) conditions.push(eq(alunosTable.curso, curso));
  if (status) conditions.push(eq(alunosTable.status, status));
  if (turno) conditions.push(eq(alunosTable.turno, turno));

  const alunos = await db
    .select()
    .from(alunosTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(alunosTable.nomeCompleto);

  res.json(
    alunos.map((a) => ({
      ...a,
      valorMensalidade: parseFloat(a.valorMensalidade),
    }))
  );
});

router.post("/alunos", async (req, res): Promise<void> => {
  const parsed = CreateAlunoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [aluno] = await db
    .insert(alunosTable)
    .values({
      ...parsed.data,
      valorMensalidade: String(parsed.data.valorMensalidade ?? 979),
      status: parsed.data.status ?? "Ativo",
      financiador: parsed.data.financiador ?? "Hospital Bom Samaritano",
    })
    .returning();

  res.status(201).json({ ...aluno, valorMensalidade: parseFloat(aluno.valorMensalidade) });
});

router.get("/alunos/import", async (_req, res): Promise<void> => {
  res.json({ message: "Use POST /api/alunos/import" });
});

router.post("/alunos/import", async (req, res): Promise<void> => {
  const parsed = ImportAlunosBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  let imported = 0;
  const errors: string[] = [];

  for (const a of parsed.data.alunos) {
    try {
      await db.insert(alunosTable).values({
        ...a,
        valorMensalidade: String(a.valorMensalidade ?? 979),
        status: a.status ?? "Ativo",
        financiador: a.financiador ?? "Hospital Bom Samaritano",
      });
      imported++;
    } catch (e: unknown) {
      errors.push(`${a.nomeCompleto}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  res.json({ imported, errors });
});

router.get("/alunos/:id", async (req, res): Promise<void> => {
  const params = GetAlunoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [aluno] = await db.select().from(alunosTable).where(eq(alunosTable.id, params.data.id));
  if (!aluno) {
    res.status(404).json({ error: "Aluno não encontrado" });
    return;
  }

  // Get frequency summary per turma
  const matriculas = await db
    .select({ turmaId: matriculasTable.turmaId })
    .from(matriculasTable)
    .where(eq(matriculasTable.alunoId, aluno.id));

  const frequencias = [];
  for (const m of matriculas) {
    const turma = await db
      .select({ id: turmasTable.id, periodo: turmasTable.periodo, disciplinaId: turmasTable.disciplinaId })
      .from(turmasTable)
      .where(eq(turmasTable.id, m.turmaId))
      .then((r) => r[0]);
    if (!turma) continue;

    const disciplina = await db
      .select({ nome: disciplinasTable.nome })
      .from(disciplinasTable)
      .where(eq(disciplinasTable.id, turma.disciplinaId))
      .then((r) => r[0]);

    const chamadas = await db
      .select()
      .from(chamadasTable)
      .where(and(eq(chamadasTable.turmaId, m.turmaId), eq(chamadasTable.alunoId, aluno.id)));

    const totalAulas = chamadas.length;
    const presencas = chamadas.filter((c) => c.presente).length;
    const faltasJustificadas = chamadas.filter((c) => !c.presente && c.justificada).length;
    const faltas = totalAulas - presencas;
    const percentualFaltas = totalAulas > 0 ? (faltas / totalAulas) * 100 : 0;

    const [retencao] = await db
      .select()
      .from(retencaoTable)
      .where(and(eq(retencaoTable.alunoId, aluno.id), eq(retencaoTable.turmaId, m.turmaId)));

    frequencias.push({
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

  // Get documents
  const documentos = await db
    .select()
    .from(documentosTable)
    .where(eq(documentosTable.alunoId, aluno.id));

  const [retencaoAtual] = await db
    .select()
    .from(retencaoTable)
    .where(and(eq(retencaoTable.alunoId, aluno.id), eq(retencaoTable.status, "Em_Acompanhamento")));

  res.json({
    ...aluno,
    valorMensalidade: parseFloat(aluno.valorMensalidade),
    frequencias,
    documentos: documentos.map((d) => ({ ...d })),
    emRetencao: !!retencaoAtual,
  });
});

router.patch("/alunos/:id", async (req, res): Promise<void> => {
  const params = UpdateAlunoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateAlunoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { ...parsed.data };
  if (parsed.data.valorMensalidade !== undefined) {
    updateData.valorMensalidade = String(parsed.data.valorMensalidade);
  }

  const [aluno] = await db
    .update(alunosTable)
    .set(updateData)
    .where(eq(alunosTable.id, params.data.id))
    .returning();

  if (!aluno) {
    res.status(404).json({ error: "Aluno não encontrado" });
    return;
  }

  res.json({ ...aluno, valorMensalidade: parseFloat(aluno.valorMensalidade) });
});

router.delete("/alunos/:id", async (req, res): Promise<void> => {
  const params = DeleteAlunoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [aluno] = await db
    .update(alunosTable)
    .set({ status: "Trancado" })
    .where(eq(alunosTable.id, params.data.id))
    .returning();

  if (!aluno) {
    res.status(404).json({ error: "Aluno não encontrado" });
    return;
  }

  res.json({ ...aluno, valorMensalidade: parseFloat(aluno.valorMensalidade) });
});

export default router;
