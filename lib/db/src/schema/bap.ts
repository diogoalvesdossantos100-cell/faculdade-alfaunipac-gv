import { pgTable, serial, integer, numeric, text, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { alunosTable } from "./alunos";

export const bapMensalTable = pgTable("bap_mensal", {
  id: serial("id").primaryKey(),
  mes: integer("mes").notNull(),
  ano: integer("ano").notNull(),
  alunoId: integer("aluno_id").notNull().references(() => alunosTable.id),
  curso: text("curso").notNull(),
  valorMensalidade: numeric("valor_mensalidade", { precision: 10, scale: 2 }).notNull().default("979.00"),
  statusPagamento: text("status_pagamento").notNull().default("Pendente"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertBapMensalSchema = createInsertSchema(bapMensalTable).omit({ id: true, createdAt: true });
export type InsertBapMensal = z.infer<typeof insertBapMensalSchema>;
export type BapMensal = typeof bapMensalTable.$inferSelect;
