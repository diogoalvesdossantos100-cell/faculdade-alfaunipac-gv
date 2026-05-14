import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, vestibularFormulariosConfigTable } from "@workspace/db";
import { requireAuth } from "../../middlewares/auth";

const router: IRouter = Router();

// PUBLIC — which forms are active (frontend reads this to show/hide form cards)
router.get("/vestibular/config", async (_req, res): Promise<void> => {
  const configs = await db.select().from(vestibularFormulariosConfigTable);
  res.json(configs);
});

// ADMIN — toggle a form on/off
// PATCH /vestibular/config/:formulario   body: { ativo: boolean }
router.patch("/vestibular/config/:formulario", requireAuth, async (req, res): Promise<void> => {
  const formulario = String(req.params.formulario);
  const { ativo } = req.body;

  if (typeof ativo !== "boolean") {
    res.status(400).json({ error: "Campo 'ativo' deve ser booleano" });
    return;
  }

  const existing = await db
    .select()
    .from(vestibularFormulariosConfigTable)
    .where(eq(vestibularFormulariosConfigTable.formulario, formulario));

  let result;

  if (existing.length === 0) {
    // Upsert: create row on first toggle
    [result] = await db
      .insert(vestibularFormulariosConfigTable)
      .values({ formulario, ativo, updatedAt: new Date() })
      .returning();
  } else {
    [result] = await db
      .update(vestibularFormulariosConfigTable)
      .set({ ativo, updatedAt: new Date() })
      .where(eq(vestibularFormulariosConfigTable.formulario, formulario))
      .returning();
  }

  res.json(result);
});

export default router;
