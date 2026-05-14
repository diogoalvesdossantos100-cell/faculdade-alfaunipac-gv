import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, vestibularPesquisaTable, insertVestibularPesquisaSchema } from "@workspace/db";
import { requireAuth } from "../../middlewares/auth";

const router: IRouter = Router();

// PUBLIC — submit research form
router.post("/vestibular/pesquisa", async (req, res): Promise<void> => {
  const parsed = insertVestibularPesquisaSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [entry] = await db
    .insert(vestibularPesquisaTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(entry);
});

// ADMIN — list research submissions
router.get("/vestibular/pesquisa", requireAuth, async (_req, res): Promise<void> => {
  const entries = await db
    .select()
    .from(vestibularPesquisaTable)
    .orderBy(vestibularPesquisaTable.createdAt);

  res.json(entries);
});

// ADMIN — delete research entry
router.delete("/vestibular/pesquisa/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const [deleted] = await db
    .delete(vestibularPesquisaTable)
    .where(eq(vestibularPesquisaTable.id, id))
    .returning();

  if (!deleted) { res.status(404).json({ error: "Registro não encontrado" }); return; }
  res.json({ ok: true });
});

export default router;
