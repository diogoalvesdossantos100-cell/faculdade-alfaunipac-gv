import { pgTable, text, serial, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Submissões do formulário público do Vestibular
export const vestibularCandidatosTable = pgTable("vestibular_candidatos", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  cpf: text("cpf").notNull(),
  rg: text("rg"),
  nascimento: text("nascimento"),
  email: text("email").notNull(),
  telefone: text("telefone").notNull(),
  // 'colaborador' | 'beneficiario' | 'pagante'
  convenio: text("convenio").notNull(),
  colaborador: text("colaborador"),
  curso1: text("curso1").notNull(),
  curso2: text("curso2").notNull(),
  turno: text("turno").notNull(),
  // 'Inscrito' | 'Aprovado' | 'Matriculado' | 'Desistente'
  status: text("status").notNull().default("Inscrito"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVestibularCandidatoSchema = createInsertSchema(vestibularCandidatosTable).omit({ id: true, createdAt: true });
export type InsertVestibularCandidato = z.infer<typeof insertVestibularCandidatoSchema>;
export type VestibularCandidato = typeof vestibularCandidatosTable.$inferSelect;

// Lista de aprovados gerenciada pelo admin
export const vestibularAprovadosTable = pgTable("vestibular_aprovados", {
  id: serial("id").primaryKey(),
  nome: text("nome").notNull(),
  curso: text("curso").notNull(),
  turno: text("turno"),
  matriculado: boolean("matriculado").notNull().default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVestibularAprovadoSchema = createInsertSchema(vestibularAprovadosTable).omit({ id: true, createdAt: true });
export type InsertVestibularAprovado = z.infer<typeof insertVestibularAprovadoSchema>;
export type VestibularAprovado = typeof vestibularAprovadosTable.$inferSelect;
