import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { turmasTable } from "./turmas";
import { alunosTable } from "./alunos";

export const chamadasTable = pgTable("chamadas", {
  id: serial("id").primaryKey(),
  turmaId: integer("turma_id").notNull().references(() => turmasTable.id),
  alunoId: integer("aluno_id").notNull().references(() => alunosTable.id),
  data: text("data").notNull(),
  presente: boolean("presente").notNull().default(false),
  justificada: boolean("justificada").notNull().default(false),
  tipoJustificativa: text("tipo_justificativa"),
  observacao: text("observacao"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertChamadaSchema = createInsertSchema(chamadasTable).omit({ id: true, createdAt: true });
export type InsertChamada = z.infer<typeof insertChamadaSchema>;
export type Chamada = typeof chamadasTable.$inferSelect;
