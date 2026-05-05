import { pgTable, text, serial, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const disciplinasTable = pgTable("disciplinas", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  curso: text("curso").notNull(),
  semestre: integer("semestre").notNull().default(1),
  cargaHorariaTotal: integer("carga_horaria_total").notNull().default(60),
  professor: text("professor"),
});

export const insertDisciplinaSchema = createInsertSchema(disciplinasTable).omit({ id: true });
export type InsertDisciplina = z.infer<typeof insertDisciplinaSchema>;
export type Disciplina = typeof disciplinasTable.$inferSelect;
