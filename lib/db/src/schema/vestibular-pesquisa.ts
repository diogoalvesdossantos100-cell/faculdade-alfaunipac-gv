import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Pesquisa de Interesse em novos cursos
export const vestibularPesquisaTable = pgTable("vestibular_pesquisa", {
  id: serial("id").primaryKey(),
  nome: text("nome"),
  cpf: text("cpf").unique(),
  rg: text("rg"),
  nascimento: text("nascimento"),
  email: text("email"),
  telefone: text("telefone"),
  convenio: text("convenio"),
  colaborador: text("colaborador"),
  curso: text("curso"),
  cursoAlternativo: text("curso_alternativo"),
  turno: text("turno").default("Noturno"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertVestibularPesquisaSchema = createInsertSchema(vestibularPesquisaTable).omit({ id: true, createdAt: true });
export type InsertVestibularPesquisa = z.infer<typeof insertVestibularPesquisaSchema>;
export type VestibularPesquisa = typeof vestibularPesquisaTable.$inferSelect;
