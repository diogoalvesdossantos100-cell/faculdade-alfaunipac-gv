import { pgTable, text, serial, timestamp, numeric, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alunosTable = pgTable("alunos", {
  id: serial("id").primaryKey(),
  nomeCompleto: text("nome_completo").notNull(),
  cpf: text("cpf").notNull().unique(),       // unique já cria índice ✅
  matricula: text("matricula").notNull().unique(), // unique já cria índice ✅
  curso: text("curso").notNull(),
  turno: text("turno").notNull().default("Matutino"),
  status: text("status").notNull().default("Ativo"),
  valorMensalidade: numeric("valor_mensalidade", { precision: 10, scale: 2 }).notNull().default("979.00"),
  financiador: text("financiador").notNull().default("Hospital Bom Samaritano"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  // Status — queries frequentes filtram por 'Ativo'
  index("alunos_status_idx").on(t.status),
  // Curso — relatórios agrupam por curso
  index("alunos_curso_idx").on(t.curso),
  // Composite para "alunos ativos por curso"
  index("alunos_status_curso_idx").on(t.status, t.curso),
]);

export const insertAlunoSchema = createInsertSchema(alunosTable).omit({ id: true, createdAt: true });
export type InsertAluno = z.infer<typeof insertAlunoSchema>;
export type Aluno = typeof alunosTable.$inferSelect;
