import { Router, type IRouter } from "express";
import { eq, and, sql } from "drizzle-orm";
import { db, bapMensalTable, alunosTable } from "@workspace/db";
import { GenerateBapBody, UpdateBapStatusBody, UpdateBapStatusParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/bap/historico", async (_req, res): Promise<void> => {
  const rows = await db
    .select({
      mes: bapMensalTable.mes,
      ano: bapMensalTable.ano,
    })
    .from(bapMensalTable)
    .groupBy(bapMensalTable.mes, bapMensalTable.ano)
    .orderBy(bapMensalTable.ano, bapMensalTable.mes);

  const result = await Promise.all(
    rows.map(async ({ mes, ano }) => {
      const records = await db
        .select()
        .from(bapMensalTable)
        .where(and(eq(bapMensalTable.mes, mes), eq(bapMensalTable.ano, ano)));
      const totalValor = records.reduce((sum, r) => sum + parseFloat(r.valorMensalidade), 0);
      const allConfirmed = records.every((r) => r.statusPagamento === "Confirmado");
      return {
        mes,
        ano,
        totalAlunos: records.length,
        totalValor,
        status: allConfirmed ? "Confirmado" : "Pendente",
      };
    })
  );

  res.json(result);
});

router.get("/bap", async (req, res): Promise<void> => {
  const { mes, ano } = req.query as Record<string, string>;

  const rows = await db
    .select({
      id: bapMensalTable.id,
      mes: bapMensalTable.mes,
      ano: bapMensalTable.ano,
      alunoId: bapMensalTable.alunoId,
      curso: bapMensalTable.curso,
      valorMensalidade: bapMensalTable.valorMensalidade,
      statusPagamento: bapMensalTable.statusPagamento,
      alunoNome: alunosTable.nomeCompleto,
    })
    .from(bapMensalTable)
    .leftJoin(alunosTable, eq(bapMensalTable.alunoId, alunosTable.id))
    .where(
      mes && ano
        ? and(eq(bapMensalTable.mes, parseInt(mes)), eq(bapMensalTable.ano, parseInt(ano)))
        : undefined
    )
    .orderBy(bapMensalTable.curso, alunosTable.nomeCompleto);

  res.json(rows.map((r) => ({ ...r, valorMensalidade: parseFloat(r.valorMensalidade), alunoNome: r.alunoNome ?? "N/A" })));
});

router.post("/bap", async (req, res): Promise<void> => {
  const parsed = GenerateBapBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { mes, ano } = parsed.data;

  // Delete existing BAP for this period and regenerate
  await db.delete(bapMensalTable).where(and(eq(bapMensalTable.mes, mes), eq(bapMensalTable.ano, ano)));

  // Get all active students
  const alunos = await db.select().from(alunosTable).where(eq(alunosTable.status, "Ativo"));

  if (alunos.length === 0) {
    res.json({ generated: 0, total: 0, records: [] });
    return;
  }

  const values = alunos.map((a) => ({
    mes,
    ano,
    alunoId: a.id,
    curso: a.curso,
    valorMensalidade: a.valorMensalidade,
    statusPagamento: "Pendente" as const,
  }));

  const inserted = await db.insert(bapMensalTable).values(values).returning();

  const records = await Promise.all(
    inserted.map(async (r) => {
      const [aluno] = await db.select().from(alunosTable).where(eq(alunosTable.id, r.alunoId));
      return {
        ...r,
        valorMensalidade: parseFloat(r.valorMensalidade),
        alunoNome: aluno?.nomeCompleto ?? "N/A",
      };
    })
  );

  const total = records.reduce((sum, r) => sum + r.valorMensalidade, 0);

  res.json({ generated: records.length, total, records });
});

router.patch("/bap/:id", async (req, res): Promise<void> => {
  const params = UpdateBapStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateBapStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [bap] = await db
    .update(bapMensalTable)
    .set({ statusPagamento: parsed.data.statusPagamento })
    .where(eq(bapMensalTable.id, params.data.id))
    .returning();

  if (!bap) {
    res.status(404).json({ error: "Registro BAP não encontrado" });
    return;
  }

  res.json({ ...bap, valorMensalidade: parseFloat(bap.valorMensalidade) });
});

export default router;
