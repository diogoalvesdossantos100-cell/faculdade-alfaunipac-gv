import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, turmasTable, disciplinasTable, matriculasTable, alunosTable } from "@workspace/db";
import {
  CreateTurmaBody,
  UpdateTurmaBody,
  UpdateTurmaParams,
  GetTurmaParams,
  GetTurmaAlunosParams,
  MatricularAlunoBody,
  MatricularAlunoParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/turmas", async (req, res): Promise<void> => {
  const { disciplinaId, periodo } = req.query as Record<string, string>;

  const turmas = await db
    .select({
      id: turmasTable.id,
      disciplinaId: turmasTable.disciplinaId,
      periodo: turmasTable.periodo,
      dataInicio: turmasTable.dataInicio,
      dataFim: turmasTable.dataFim,
      disciplinaNome: disciplinasTable.nome,
      curso: disciplinasTable.curso,
    })
    .from(turmasTable)
    .leftJoin(disciplinasTable, eq(turmasTable.disciplinaId, disciplinasTable.id))
    .where(
      disciplinaId && periodo
        ? and(eq(turmasTable.disciplinaId, parseInt(disciplinaId)), eq(turmasTable.periodo, periodo))
        : disciplinaId
        ? eq(turmasTable.disciplinaId, parseInt(disciplinaId))
        : periodo
        ? eq(turmasTable.periodo, periodo)
        : undefined
    )
    .orderBy(turmasTable.periodo);

  res.json(turmas);
});

router.post("/turmas", async (req, res): Promise<void> => {
  const parsed = CreateTurmaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [turma] = await db.insert(turmasTable).values(parsed.data).returning();
  const [disciplina] = await db
    .select()
    .from(disciplinasTable)
    .where(eq(disciplinasTable.id, turma.disciplinaId));
  res.status(201).json({
    ...turma,
    disciplinaNome: disciplina?.nome ?? null,
    curso: disciplina?.curso ?? null,
  });
});

router.get("/turmas/:id/alunos", async (req, res): Promise<void> => {
  const params = GetTurmaAlunosParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const alunos = await db
    .select({
      id: alunosTable.id,
      nomeCompleto: alunosTable.nomeCompleto,
      cpf: alunosTable.cpf,
      matricula: alunosTable.matricula,
      curso: alunosTable.curso,
      turno: alunosTable.turno,
      status: alunosTable.status,
      valorMensalidade: alunosTable.valorMensalidade,
      financiador: alunosTable.financiador,
      createdAt: alunosTable.createdAt,
    })
    .from(matriculasTable)
    .innerJoin(alunosTable, eq(matriculasTable.alunoId, alunosTable.id))
    .where(eq(matriculasTable.turmaId, params.data.id))
    .orderBy(alunosTable.nomeCompleto);

  res.json(alunos.map((a) => ({ ...a, valorMensalidade: parseFloat(a.valorMensalidade) })));
});

router.post("/turmas/:id/matricular", async (req, res): Promise<void> => {
  const params = MatricularAlunoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = MatricularAlunoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [matricula] = await db
    .insert(matriculasTable)
    .values({ turmaId: params.data.id, alunoId: parsed.data.alunoId })
    .onConflictDoNothing()
    .returning();

  res.status(201).json(matricula ?? { turmaId: params.data.id, alunoId: parsed.data.alunoId });
});

router.get("/turmas/:id", async (req, res): Promise<void> => {
  const params = GetTurmaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [turma] = await db
    .select()
    .from(turmasTable)
    .where(eq(turmasTable.id, params.data.id));

  if (!turma) {
    res.status(404).json({ error: "Turma não encontrada" });
    return;
  }

  const [disciplina] = await db
    .select()
    .from(disciplinasTable)
    .where(eq(disciplinasTable.id, turma.disciplinaId));

  const [{ count }] = await db
    .select({ count: matriculasTable.id })
    .from(matriculasTable)
    .where(eq(matriculasTable.turmaId, turma.id))
    .then((rows) => (rows.length > 0 ? rows : [{ count: 0 }]));

  res.json({
    ...turma,
    disciplina: disciplina ?? null,
    totalAlunos: typeof count === "number" ? count : 0,
  });
});

router.patch("/turmas/:id", async (req, res): Promise<void> => {
  const params = UpdateTurmaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateTurmaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [turma] = await db
    .update(turmasTable)
    .set(parsed.data)
    .where(eq(turmasTable.id, params.data.id))
    .returning();
  if (!turma) {
    res.status(404).json({ error: "Turma não encontrada" });
    return;
  }
  const [disciplina] = await db
    .select()
    .from(disciplinasTable)
    .where(eq(disciplinasTable.id, turma.disciplinaId));
  res.json({ ...turma, disciplinaNome: disciplina?.nome ?? null, curso: disciplina?.curso ?? null });
});

export default router;
