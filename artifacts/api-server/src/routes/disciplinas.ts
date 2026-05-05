import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, disciplinasTable } from "@workspace/db";
import { CreateDisciplinaBody, UpdateDisciplinaBody, UpdateDisciplinaParams, DeleteDisciplinaParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/disciplinas", async (req, res): Promise<void> => {
  const { curso } = req.query as Record<string, string>;
  const disciplinas = await db
    .select()
    .from(disciplinasTable)
    .where(curso ? eq(disciplinasTable.curso, curso) : undefined)
    .orderBy(disciplinasTable.nome);
  res.json(disciplinas);
});

router.post("/disciplinas", async (req, res): Promise<void> => {
  const parsed = CreateDisciplinaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [disciplina] = await db.insert(disciplinasTable).values(parsed.data).returning();
  res.status(201).json(disciplina);
});

router.patch("/disciplinas/:id", async (req, res): Promise<void> => {
  const params = UpdateDisciplinaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDisciplinaBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [disciplina] = await db
    .update(disciplinasTable)
    .set(parsed.data)
    .where(eq(disciplinasTable.id, params.data.id))
    .returning();
  if (!disciplina) {
    res.status(404).json({ error: "Disciplina não encontrada" });
    return;
  }
  res.json(disciplina);
});

router.delete("/disciplinas/:id", async (req, res): Promise<void> => {
  const params = DeleteDisciplinaParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(disciplinasTable).where(eq(disciplinasTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
