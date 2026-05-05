import { pgTable, text, serial, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const alunosTable = pgTable("alunos", {
  id: serial("id").primaryKey(),
  nomeCompleto: text("nome_completo").notNull(),
  cpf: text("cpf").notNull().unique(),
  matricula: text("matricula").notNull().unique(),
  curso: text("curso").notNull(),
  turno: text("turno").notNull().default("Matutino"),
  status: text("status").notNull().default("Ativo"),
  valorMensalidade: numeric("valor_mensalidade", { precision: 10, scale: 2 }).notNull().default("979.00"),
  financiador: text("financiador").notNull().default("Hospital Bom Samaritano"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAlunoSchema = createInsertSchema(alunosTable).omit({ id: true, createdAt: true });
export type InsertAluno = z.infer<typeof insertAlunoSchema>;
export type Aluno = typeof alunosTable.$inferSelect;
