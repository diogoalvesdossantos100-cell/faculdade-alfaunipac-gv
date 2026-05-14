import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// Campos comuns a todos os eventos (MBA, Manchester, Port-a-Cath, Workshop)
function eventoColumns() {
  return {
    id: serial("id").primaryKey(),
    nome: text("nome").notNull(),
    cpf: text("cpf").notNull(),
    rg: text("rg"),
    nascimento: text("nascimento"),
    email: text("email").notNull(),
    telefone: text("telefone").notNull(),
    // 'Sim' | 'Não'
    concluiuGraduacao: text("concluiu_graduacao").notNull(),
    cursoGraduacao: text("curso_graduacao"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  };
}

export const vestibularInscricoesMbaTable = pgTable("vestibular_inscricoes_mba", eventoColumns());
export const insertVestibularInscricaoMbaSchema = createInsertSchema(vestibularInscricoesMbaTable).omit({ id: true, createdAt: true });
export type InsertVestibularInscricaoMba = z.infer<typeof insertVestibularInscricaoMbaSchema>;
export type VestibularInscricaoMba = typeof vestibularInscricoesMbaTable.$inferSelect;

export const vestibularInscricoesManchesterTable = pgTable("vestibular_inscricoes_manchester", eventoColumns());
export const insertVestibularInscricaoManchesterSchema = createInsertSchema(vestibularInscricoesManchesterTable).omit({ id: true, createdAt: true });
export type InsertVestibularInscricaoManchester = z.infer<typeof insertVestibularInscricaoManchesterSchema>;
export type VestibularInscricaoManchester = typeof vestibularInscricoesManchesterTable.$inferSelect;

export const vestibularInscricoesPortaCathTable = pgTable("vestibular_inscricoes_portacath", eventoColumns());
export const insertVestibularInscricaoPortaCathSchema = createInsertSchema(vestibularInscricoesPortaCathTable).omit({ id: true, createdAt: true });
export type InsertVestibularInscricaoPortaCath = z.infer<typeof insertVestibularInscricaoPortaCathSchema>;
export type VestibularInscricaoPortaCath = typeof vestibularInscricoesPortaCathTable.$inferSelect;

export const vestibularInscricoesWorkshopTable = pgTable("vestibular_inscricoes_workshop", eventoColumns());
export const insertVestibularInscricaoWorkshopSchema = createInsertSchema(vestibularInscricoesWorkshopTable).omit({ id: true, createdAt: true });
export type InsertVestibularInscricaoWorkshop = z.infer<typeof insertVestibularInscricaoWorkshopSchema>;
export type VestibularInscricaoWorkshop = typeof vestibularInscricoesWorkshopTable.$inferSelect;
