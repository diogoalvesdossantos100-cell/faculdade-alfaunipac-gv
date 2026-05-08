import { Router, type IRouter } from "express";
import { eq, and, gte, lte } from "drizzle-orm";
import { db, alunosTable, retencaoTable, documentosTable, chamadasTable, turmasTable } from "@workspace/db";

const router: IRouter = Router();

router.get("/dashboard/stats", async (_req, res): Promise<void> => {
  const ativos = await db.select().from(alunosTable).where(eq(alunosTable.status, "Ativo"));
  const totalAlunosAtivos = ativos.length;

  const emRetencao = await db
    .select()
    .from(retencaoTable)
    .where(eq(retencaoTable.status, "Em_Acompanhamento"));
  const alunosEmRetencao = emRetencao.length;

  const pendentes = await db
    .select()
    .from(documentosTable)
    .where(eq(documentosTable.status, "Pendente"));
  const documentosPendentes = pendentes.length;

  const now = new Date();
  const mesStr = String(now.getMonth() + 1).padStart(2, "0");
  const anoStr = String(now.getFullYear());
  const dataInicio = `${anoStr}-${mesStr}-01`;
  const dataFim = `${anoStr}-${mesStr}-31`;

  const chamadas = await db
    .select()
    .from(chamadasTable)
    .where(and(gte(chamadasTable.data, dataInicio), lte(chamadasTable.data, dataFim)));

  const total = chamadas.length;
  const presencas = chamadas.filter((c) => c.presente).length;
  const frequenciaMediaMes = total > 0 ? Math.round((presencas / total) * 10000) / 100 : 0;

  const cursos = ["Administração", "Enfermagem", "Farmácia", "Fisioterapia", "Nutrição"];
  const alunosPorCurso = await Promise.all(
    cursos.map(async (curso) => {
      const rows = await db
        .select()
        .from(alunosTable)
        .where(and(eq(alunosTable.curso, curso), eq(alunosTable.status, "Ativo")));
      return { curso, count: rows.length };
    })
  );

  res.json({
    totalAlunosAtivos,
    alunosEmRetencao,
    documentosPendentes,
    frequenciaMediaMes,
    totalCursos: cursos.length,
    alunosPorCurso,
  });
});

router.get("/dashboard/proximas-chamadas", async (_req, res): Promise<void> => {
  const distinctRows = await db
    .selectDistinct({ turmaId: chamadasTable.turmaId, data: chamadasTable.data })
    .from(chamadasTable)
    .orderBy(chamadasTable.data);

  const recent = distinctRows.slice(-10).reverse();

  const result = [];
  for (const row of recent) {
    const [turma] = await db.select().from(turmasTable).where(eq(turmasTable.id, row.turmaId));
    if (!turma) continue;

    const chamadas = await db
      .select()
      .from(chamadasTable)
      .where(and(eq(chamadasTable.turmaId, row.turmaId), eq(chamadasTable.data, row.data)));

    const presentes = chamadas.filter((c) => c.presente).length;
    const ausentes = chamadas.filter((c) => !c.presente).length;

    result.push({
      turmaId: row.turmaId,
      turmaNome: turma.nome,
      curso: turma.curso,
      periodo: turma.periodo,
      data: row.data,
      presentes,
      ausentes,
    });
  }

  res.json(result);
});

export default router;
