import { pgTable, text, serial, boolean, timestamp, index } from "drizzle-orm/pg-core";
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
}, (t) => [
  index("vc_cpf_idx").on(t.cpf),
  index("vc_status_idx").on(t.status),
  index("vc_curso1_idx").on(t.curso1),
  index("vc_curso2_idx").on(t.curso2),
]);

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
  // ── Gestão de matrícula ─────────────────────────────────────────────────
  // 'Providenciando Docs' | 'Doc. Pendente' | 'Doc. Completa' | 'Matriculado' | 'Desistente'
  statusMatricula: text("status_matricula").default("Providenciando Docs"),
  telefone: text("telefone"),
  prazoDocs: text("prazo_docs"),
  // Checklist — documentação recebida
  docRg: boolean("doc_rg").default(false),
  docTitulo: boolean("doc_titulo").default(false),
  docNascimento: boolean("doc_nascimento").default(false),
  docCasamento: boolean("doc_casamento").default(false),
  docEndereco: boolean("doc_endereco").default(false),
  docMedio: boolean("doc_medio").default(false),
  docSuperior: boolean("doc_superior").default(false),
  // Checklist — secretaria
  checkGrupoAvisos: boolean("check_grupo_avisos").default(false),
  checkGrupoTurma: boolean("check_grupo_turma").default(false),
  checkFacial: boolean("check_facial").default(false),
  checkDigitalizado: boolean("check_digitalizado").default(false),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  index("va_status_matricula_idx").on(t.statusMatricula),
  index("va_curso_idx").on(t.curso),
]);

export const insertVestibularAprovadoSchema = createInsertSchema(vestibularAprovadosTable).omit({ id: true, createdAt: true });
export type InsertVestibularAprovado = z.infer<typeof insertVestibularAprovadoSchema>;
export type VestibularAprovado = typeof vestibularAprovadosTable.$inferSelect;
