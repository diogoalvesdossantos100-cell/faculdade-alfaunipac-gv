import { Router, type IRouter } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, alunosTable, chamadasTable, retencaoTable, documentosTable, turmasTable, disciplinasTable, matriculasTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/relatorios/faltas-por-aluno", async (req, res): Promise<void> => {
  const { dataInicio, dataFim, curso, alunoId } = req.query as Record<string, string>;

  const matriculas = await db
    .select({
      alunoId: matriculasTable.alunoId,
      turmaId: matriculasTable.turmaId,
    })
    .from(matriculasTable);

  const result = [];
  const seenPairs = new Set<string>();

  for (const m of matriculas) {
    const pairKey = `${m.alunoId}-${m.turmaId}`;
    if (seenPairs.has(pairKey)) continue;
    seenPairs.add(pairKey);

    if (alunoId && m.alunoId !== parseInt(alunoId)) continue;

    const [aluno] = await db.select().from(alunosTable).where(eq(alunosTable.id, m.alunoId));
    if (!aluno) continue;
    if (curso && aluno.curso !== curso) continue;

    const [turma] = await db.select().from(turmasTable).where(eq(turmasTable.id, m.turmaId));
    if (!turma) continue;
    const [disciplina] = await db.select().from(disciplinasTable).where(eq(disciplinasTable.id, turma.disciplinaId));

    const conditions = [eq(chamadasTable.turmaId, m.turmaId), eq(chamadasTable.alunoId, m.alunoId)];
    if (dataInicio) conditions.push(gte(chamadasTable.data, dataInicio));
    if (dataFim) conditions.push(lte(chamadasTable.data, dataFim));

    const chamadas = await db.select().from(chamadasTable).where(and(...conditions));
    const totalAulas = chamadas.length;
    const presencas = chamadas.filter((c) => c.presente).length;
    const faltasJustificadas = chamadas.filter((c) => !c.presente && c.justificada).length;
    const faltas = totalAulas - presencas;
    const percentualFaltas = totalAulas > 0 ? (faltas / totalAulas) * 100 : 0;

    const [retencao] = await db
      .select()
      .from(retencaoTable)
      .where(and(eq(retencaoTable.alunoId, m.alunoId), eq(retencaoTable.turmaId, m.turmaId)));

    result.push({
      alunoId: aluno.id,
      alunoNome: aluno.nomeCompleto,
      curso: aluno.curso,
      turmaId: m.turmaId,
      disciplinaNome: disciplina?.nome ?? "N/A",
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

router.get("/relatorios/faltas-por-disciplina", async (req, res): Promise<void> => {
  const { dataInicio, dataFim, curso } = req.query as Record<string, string>;

  const turmas = await db
    .select({
      id: turmasTable.id,
      periodo: turmasTable.periodo,
      disciplinaId: turmasTable.disciplinaId,
    })
    .from(turmasTable);

  const result = [];
  for (const turma of turmas) {
    const [disciplina] = await db.select().from(disciplinasTable).where(eq(disciplinasTable.id, turma.disciplinaId));
    if (!disciplina) continue;
    if (curso && disciplina.curso !== curso) continue;

    const matriculas = await db
      .select()
      .from(matriculasTable)
      .where(eq(matriculasTable.turmaId, turma.id));

    const conditions = [eq(chamadasTable.turmaId, turma.id)];
    if (dataInicio) conditions.push(gte(chamadasTable.data, dataInicio));
    if (dataFim) conditions.push(lte(chamadasTable.data, dataFim));

    const chamadas = await db.select().from(chamadasTable).where(and(...conditions));
    const totalPresencas = chamadas.filter((c) => c.presente).length;
    const total = chamadas.length;
    const mediaPresenca = total > 0 ? (totalPresencas / total) * 100 : 0;

    const alunosEmRetencao = await db
      .select()
      .from(retencaoTable)
      .where(and(eq(retencaoTable.turmaId, turma.id), eq(retencaoTable.status, "Em_Acompanhamento")));

    result.push({
      disciplinaId: disciplina.id,
      disciplinaNome: disciplina.nome,
      curso: disciplina.curso,
      turmaId: turma.id,
      periodo: turma.periodo,
      totalAlunos: matriculas.length,
      mediaPresenca: Math.round(mediaPresenca * 100) / 100,
      alunosEmRetencao: alunosEmRetencao.length,
    });
  }

  res.json(result);
});

router.get("/relatorios/retencao", async (req, res): Promise<void> => {
  const { curso, status } = req.query as Record<string, string>;

  const rows = await db.select().from(retencaoTable);

  const result = [];
  for (const r of rows) {
    const [aluno] = await db.select().from(alunosTable).where(eq(alunosTable.id, r.alunoId));
    if (!aluno) continue;
    if (curso && aluno.curso !== curso) continue;
    if (status && r.status !== status) continue;

    const [turma] = await db.select().from(turmasTable).where(eq(turmasTable.id, r.turmaId));
    const [disciplina] = turma
      ? await db.select().from(disciplinasTable).where(eq(disciplinasTable.id, turma.disciplinaId))
      : [];

    result.push({
      alunoId: aluno.id,
      alunoNome: aluno.nomeCompleto,
      curso: aluno.curso,
      disciplinaNome: disciplina?.nome ?? "N/A",
      percentualFaltas: parseFloat(r.percentualFaltas),
      status: r.status,
      dataNotificacao: r.dataNotificacao ?? null,
    });
  }

  res.json(result);
});

router.get("/relatorios/documentos", async (req, res): Promise<void> => {
  const { dataInicio, dataFim, tipo } = req.query as Record<string, string>;

  const conditions = [];
  if (tipo) conditions.push(eq(documentosTable.tipo, tipo));
  if (dataInicio) conditions.push(gte(documentosTable.dataEntrega, dataInicio));
  if (dataFim) conditions.push(lte(documentosTable.dataEntrega, dataFim));

  const rows = await db
    .select({
      id: documentosTable.id,
      alunoId: documentosTable.alunoId,
      tipo: documentosTable.tipo,
      dataEntrega: documentosTable.dataEntrega,
      dataInicioPeriodo: documentosTable.dataInicioPeriodo,
      dataFimPeriodo: documentosTable.dataFimPeriodo,
      status: documentosTable.status,
      alunoNome: alunosTable.nomeCompleto,
      alunoCurso: alunosTable.curso,
    })
    .from(documentosTable)
    .leftJoin(alunosTable, eq(documentosTable.alunoId, alunosTable.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(documentosTable.dataEntrega);

  res.json(
    rows.map((r) => ({
      documentoId: r.id,
      alunoNome: r.alunoNome ?? "N/A",
      curso: r.alunoCurso ?? "N/A",
      tipo: r.tipo,
      dataEntrega: r.dataEntrega,
      periodo: `${r.dataInicioPeriodo} a ${r.dataFimPeriodo}`,
      status: r.status,
    }))
  );
});

router.get("/relatorios/resumo-mensal", async (req, res): Promise<void> => {
  const { mes, ano } = req.query as Record<string, string>;

  const cursos = ["Administração", "Enfermagem", "Farmácia", "Fisioterapia", "Nutrição"];
  const result = [];

  for (const curso of cursos) {
    const alunos = await db
      .select()
      .from(alunosTable)
      .where(and(eq(alunosTable.curso, curso), eq(alunosTable.status, "Ativo")));

    const totalAlunos = alunos.length;

    // Get turmas for this curso
    const disciplinas = await db
      .select()
      .from(disciplinasTable)
      .where(eq(disciplinasTable.curso, curso));

    let totalPresencas = 0;
    let totalAulas = 0;

    for (const d of disciplinas) {
      const turmasList = await db
        .select()
        .from(turmasTable)
        .where(eq(turmasTable.disciplinaId, d.id));

      for (const t of turmasList) {
        const conditions = [eq(chamadasTable.turmaId, t.id)];
        // Filter by month/year using string comparison (data format: YYYY-MM-DD)
        if (mes && ano) {
          const mesStr = String(parseInt(mes)).padStart(2, "0");
          conditions.push(gte(chamadasTable.data, `${ano}-${mesStr}-01`));
          conditions.push(lte(chamadasTable.data, `${ano}-${mesStr}-31`));
        }

        const chamadas = await db.select().from(chamadasTable).where(and(...conditions));
        totalAulas += chamadas.length;
        totalPresencas += chamadas.filter((c) => c.presente).length;
      }
    }

    const mediaPresenca = totalAulas > 0 ? (totalPresencas / totalAulas) * 100 : 0;

    const retencoes = await db
      .select({ alunoId: retencaoTable.alunoId })
      .from(retencaoTable)
      .where(eq(retencaoTable.status, "Em_Acompanhamento"));

    const alunosEmRetencao = retencoes.filter((r) =>
      alunos.some((a) => a.id === r.alunoId)
    ).length;

    result.push({
      curso,
      totalAlunos,
      mediaPresenca: Math.round(mediaPresenca * 100) / 100,
      alunosEmRetencao,
      totalAulas,
    });
  }

  res.json(result);
});

export default router;
