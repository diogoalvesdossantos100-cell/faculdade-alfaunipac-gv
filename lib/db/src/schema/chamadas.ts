import { pgTable, text, serial, integer, boolean, timestamp, index } from "drizzle-orm/pg-core";
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
}, (t) => [
  // FK indexes — Postgres não cria automaticamente (regra: schema-foreign-key-indexes)
  index("chamadas_turma_id_idx").on(t.turmaId),
  index("chamadas_aluno_id_idx").on(t.alunoId),
  // Composite para query: "todas as chamadas de uma turma em uma data"
  index("chamadas_turma_data_idx").on(t.turmaId, t.data),
  // Composite para relatório de frequência por aluno
  index("chamadas_aluno_turma_idx").on(t.alunoId, t.turmaId),
]);

export const insertChamadaSchema = createInsertSchema(chamadasTable).omit({ id: true, createdAt: true });
export type InsertChamada = z.infer<typeof insertChamadaSchema>;
export type Chamada = typeof chamadasTable.$inferSelect;
