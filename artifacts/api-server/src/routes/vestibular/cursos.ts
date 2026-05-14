import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, vestibularCursosTable, insertVestibularCursoSchema } from "@workspace/db";
import { requireAuth } from "../../middlewares/auth";

const router: IRouter = Router();

// PUBLIC — list active courses for dropdown in forms
router.get("/vestibular/cursos", async (_req, res): Promise<void> => {
  const cursos = await db
    .select()
    .from(vestibularCursosTable)
    .where(eq(vestibularCursosTable.ativo, true))
    .orderBy(vestibularCursosTable.nome);

  res.json(cursos);
});

// ADMIN — add course
router.post("/vestibular/cursos", requireAuth, async (req, res): Promise<void> => {
  const parsed = insertVestibularCursoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [curso] = await db
    .insert(vestibularCursosTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(curso);
});

// ADMIN — update course (name, period, active flag)
router.patch("/vestibular/cursos/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const allowed = ["nome", "periodo", "ativo"] as const;
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  const [curso] = await db
    .update(vestibularCursosTable)
    .set(update)
    .where(eq(vestibularCursosTable.id, id))
    .returning();

  if (!curso) { res.status(404).json({ error: "Curso não encontrado" }); return; }
  res.json(curso);
});

// ADMIN — remove course
router.delete("/vestibular/cursos/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const [deleted] = await db
    .delete(vestibularCursosTable)
    .where(eq(vestibularCursosTable.id, id))
    .returning();

  if (!deleted) { res.status(404).json({ error: "Curso não encontrado" }); return; }
  res.json({ ok: true });
});

export default router;
