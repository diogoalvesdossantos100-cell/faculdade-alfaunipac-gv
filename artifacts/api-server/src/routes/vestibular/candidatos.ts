import { Router, type IRouter } from "express";
import { eq, ilike, or, and } from "drizzle-orm";
import { db, vestibularCandidatosTable, insertVestibularCandidatoSchema } from "@workspace/db";
import { requireAuth } from "../../middlewares/auth";

const router: IRouter = Router();

// PUBLIC — submit vestibular inscription form
router.post("/vestibular/candidatos", async (req, res): Promise<void> => {
  const parsed = insertVestibularCandidatoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [candidato] = await db
    .insert(vestibularCandidatosTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(candidato);
});

// ADMIN — list candidates with optional filters
router.get("/vestibular/candidatos", requireAuth, async (req, res): Promise<void> => {
  const { search, status, curso, turno } = req.query as Record<string, string>;

  const conditions = [];
  if (search) {
    conditions.push(
      or(
        ilike(vestibularCandidatosTable.nome, `%${search}%`),
        ilike(vestibularCandidatosTable.cpf, `%${search}%`),
      ),
    );
  }
  if (status) conditions.push(eq(vestibularCandidatosTable.status, status));
  if (curso) {
    conditions.push(
      or(
        eq(vestibularCandidatosTable.curso1, curso),
        eq(vestibularCandidatosTable.curso2, curso),
      ),
    );
  }
  if (turno) conditions.push(eq(vestibularCandidatosTable.turno, turno));

  const candidatos = await db
    .select()
    .from(vestibularCandidatosTable)
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(vestibularCandidatosTable.nome);

  res.json(candidatos);
});

// ADMIN — get single candidate
router.get("/vestibular/candidatos/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const [candidato] = await db
    .select()
    .from(vestibularCandidatosTable)
    .where(eq(vestibularCandidatosTable.id, id));

  if (!candidato) { res.status(404).json({ error: "Candidato não encontrado" }); return; }
  res.json(candidato);
});

// ADMIN — update status
router.patch("/vestibular/candidatos/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const allowed = ["status", "email", "telefone"] as const;
  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  const [candidato] = await db
    .update(vestibularCandidatosTable)
    .set(update)
    .where(eq(vestibularCandidatosTable.id, id))
    .returning();

  if (!candidato) { res.status(404).json({ error: "Candidato não encontrado" }); return; }
  res.json(candidato);
});

// ADMIN — delete
router.delete("/vestibular/candidatos/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const [deleted] = await db
    .delete(vestibularCandidatosTable)
    .where(eq(vestibularCandidatosTable.id, id))
    .returning();

  if (!deleted) { res.status(404).json({ error: "Candidato não encontrado" }); return; }
  res.json({ ok: true });
});

export default router;
