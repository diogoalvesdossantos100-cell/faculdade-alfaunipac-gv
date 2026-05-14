import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Controla quais formulários públicos estão ativos
// Uma linha por formulário: 'vestibular' | 'pesquisa' | 'mba' | 'manchester' | 'portacath' | 'workshop'
export const vestibularFormulariosConfigTable = pgTable("vestibular_formularios_config", {
  id: serial("id").primaryKey(),
  formulario: text("formulario").notNull().unique(),
  ativo: boolean("ativo").notNull().default(true),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVestibularFormularioConfigSchema = createInsertSchema(vestibularFormulariosConfigTable).omit({ id: true });
export type InsertVestibularFormularioConfig = z.infer<typeof insertVestibularFormularioConfigSchema>;
export type VestibularFormularioConfig = typeof vestibularFormulariosConfigTable.$inferSelect;
