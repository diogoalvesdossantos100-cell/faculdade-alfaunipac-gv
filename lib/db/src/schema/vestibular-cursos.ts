import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const vestibularCursosTable = pgTable("vestibular_cursos", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull().unique(),
  periodo: text("periodo").notNull().default("2026/2"),
  ativo: boolean("ativo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVestibularCursoSchema = createInsertSchema(vestibularCursosTable).omit({ id: true, createdAt: true });
export type InsertVestibularCurso = z.infer<typeof insertVestibularCursoSchema>;
export type VestibularCurso = typeof vestibularCursosTable.$inferSelect;
