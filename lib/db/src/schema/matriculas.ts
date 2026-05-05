import { pgTable, serial, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { turmasTable } from "./turmas";
import { alunosTable } from "./alunos";

export const matriculasTable = pgTable("matriculas", {
  id: serial("id").primaryKey(),
  turmaId: integer("turma_id").notNull().references(() => turmasTable.id),
  alunoId: integer("aluno_id").notNull().references(() => alunosTable.id),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  unique().on(t.turmaId, t.alunoId),
]);

export const insertMatriculaSchema = createInsertSchema(matriculasTable).omit({ id: true, createdAt: true });
export type InsertMatricula = z.infer<typeof insertMatriculaSchema>;
export type Matricula = typeof matriculasTable.$inferSelect;
