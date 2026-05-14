import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import {
  db,
  vestibularInscricoesMbaTable,
  vestibularInscricoesManchesterTable,
  vestibularInscricoesPortaCathTable,
  vestibularInscricoesWorkshopTable,
  insertVestibularInscricaoMbaSchema,
  insertVestibularInscricaoManchesterSchema,
  insertVestibularInscricaoPortaCathSchema,
  insertVestibularInscricaoWorkshopSchema,
} from "@workspace/db";
import type { PgTableWithColumns } from "drizzle-orm/pg-core";
import { requireAuth } from "../../middlewares/auth";

const router: IRouter = Router();

type AnyTable = PgTableWithColumns<any>; // eslint-disable-line @typescript-eslint/no-explicit-any
type AnySchema = { safeParse: (data: unknown) => { success: boolean; data?: unknown; error?: { message: string } } };

// Factory: mount POST (public) + GET (admin) for an event table
function mountEvento(path: string, table: AnyTable, schema: AnySchema) {
  router.post(path, async (req, res): Promise<void> => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error!.message });
      return;
    }
    const [entry] = await db.insert(table).values(parsed.data as Record<string, unknown>).returning();
    res.status(201).json(entry);
  });

  router.get(path, requireAuth, async (_req, res): Promise<void> => {
    const entries = await db.select().from(table).orderBy(table.createdAt);
    res.json(entries);
  });

  router.delete(`${path}/:id`, requireAuth, async (req, res): Promise<void> => {
    const id = parseInt(String(req.params.id), 10);
    if (isNaN(id)) { res.status(400).json({ error: "ID inválido" }); return; }
    const [deleted] = await db.delete(table).where(eq(table.id, id)).returning();
    if (!deleted) { res.status(404).json({ error: "Inscrição não encontrada" }); return; }
    res.json({ ok: true });
  });
}

mountEvento("/vestibular/inscricoes/mba",        vestibularInscricoesMbaTable,       insertVestibularInscricaoMbaSchema);
mountEvento("/vestibular/inscricoes/manchester",  vestibularInscricoesManchesterTable, insertVestibularInscricaoManchesterSchema);
mountEvento("/vestibular/inscricoes/portacath",   vestibularInscricoesPortaCathTable,  insertVestibularInscricaoPortaCathSchema);
mountEvento("/vestibular/inscricoes/workshop",    vestibularInscricoesWorkshopTable,   insertVestibularInscricaoWorkshopSchema);

export default router;
