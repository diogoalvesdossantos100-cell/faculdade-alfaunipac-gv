import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, vestibularAprovadosTable, insertVestibularAprovadoSchema } from "@workspace/db";
import { requireAuth } from "../../middlewares/auth";

const router: IRouter = Router();

router.get("/vestibular/aprovados", requireAuth, async (_req, res): Promise<void> => {
  const aprovados = await db
    .select()
    .from(vestibularAprovadosTable)
    .orderBy(vestibularAprovadosTable.nome);

  res.json(aprovados);
});

router.post("/vestibular/aprovados", requireAuth, async (req, res): Promise<void> => {
  const parsed = insertVestibularAprovadoSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [aprovado] = await db
    .insert(vestibularAprovadosTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(aprovado);
});

router.patch("/vestibular/aprovados/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const allowed = [
    "matriculado", "curso", "turno",
    "statusMatricula", "telefone", "prazoDocs",
    "docRg", "docTitulo", "docNascimento", "docCasamento",
    "docEndereco", "docMedio", "docSuperior",
    "checkGrupoAvisos", "checkGrupoTurma", "checkFacial", "checkDigitalizado",
  ] as const;

  const update: Record<string, unknown> = {};
  for (const key of allowed) {
    if (req.body[key] !== undefined) update[key] = req.body[key];
  }

  const [aprovado] = await db
    .update(vestibularAprovadosTable)
    .set(update)
    .where(eq(vestibularAprovadosTable.id, id))
    .returning();

  if (!aprovado) { res.status(404).json({ error: "Aprovado não encontrado" }); return; }
  res.json(aprovado);
});

router.delete("/vestibular/aprovados/:id", requireAuth, async (req, res): Promise<void> => {
  const id = parseInt(String(req.params.id), 10);
  if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }

  const [deleted] = await db
    .delete(vestibularAprovadosTable)
    .where(eq(vestibularAprovadosTable.id, id))
    .returning();

  if (!deleted) { res.status(404).json({ error: "Aprovado não encontrado" }); return; }
  res.json({ ok: true });
});

export default router;
