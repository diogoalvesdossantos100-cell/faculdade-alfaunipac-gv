import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { disciplinasTable } from "./disciplinas";

export const turmasTable = pgTable("turmas", {
  id: serial("id").primaryKey(),
  disciplinaId: integer("disciplina_id").notNull().references(() => disciplinasTable.id),
  periodo: text("periodo").notNull(),
  dataInicio: text("data_inicio").notNull(),
  dataFim: text("data_fim").notNull(),
});

export const insertTurmaSchema = createInsertSchema(turmasTable).omit({ id: true });
export type InsertTurma = z.infer<typeof insertTurmaSchema>;
export type Turma = typeof turmasTable.$inferSelect;
