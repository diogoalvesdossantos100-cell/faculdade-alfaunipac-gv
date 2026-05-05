import { pgTable, text, serial, integer, numeric, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { turmasTable } from "./turmas";
import { alunosTable } from "./alunos";

export const retencaoTable = pgTable("retencao", {
  id: serial("id").primaryKey(),
  alunoId: integer("aluno_id").notNull().references(() => alunosTable.id),
  turmaId: integer("turma_id").notNull().references(() => turmasTable.id),
  percentualFaltas: numeric("percentual_faltas", { precision: 5, scale: 2 }).notNull(),
  dataNotificacao: text("data_notificacao"),
  status: text("status").notNull().default("Identificado"),
  observacaoSecretaria: text("observacao_secretaria"),
  responsavel: text("responsavel").notNull().default("Secretaria"),
  motivoCancelamento: text("motivo_cancelamento"),
  dataDecisaoAluno: text("data_decisao_aluno"),
  nomeCoordinadora: text("nome_coordinadora"),
  dataAssinatura: text("data_assinatura"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const retencaoAuditLogTable = pgTable("retencao_audit_log", {
  id: serial("id").primaryKey(),
  retencaoId: integer("retencao_id").notNull().references(() => retencaoTable.id),
  acao: text("acao").notNull(),
  observacao: text("observacao"),
  realizadoPor: text("realizado_por"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertRetencaoSchema = createInsertSchema(retencaoTable).omit({ id: true, createdAt: true });
export type InsertRetencao = z.infer<typeof insertRetencaoSchema>;
export type Retencao = typeof retencaoTable.$inferSelect;

export const insertRetencaoAuditLogSchema = createInsertSchema(retencaoAuditLogTable).omit({ id: true, createdAt: true });
export type InsertRetencaoAuditLog = z.infer<typeof insertRetencaoAuditLogSchema>;
export type RetencaoAuditLog = typeof retencaoAuditLogTable.$inferSelect;
