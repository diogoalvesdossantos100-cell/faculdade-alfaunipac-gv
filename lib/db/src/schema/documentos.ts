import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { alunosTable } from "./alunos";

export const documentosTable = pgTable("documentos", {
  id: serial("id").primaryKey(),
  alunoId: integer("aluno_id").notNull().references(() => alunosTable.id),
  tipo: text("tipo").notNull(),
  dataEntrega: text("data_entrega").notNull(),
  dataInicioPeriodo: text("data_inicio_periodo").notNull(),
  dataFimPeriodo: text("data_fim_periodo").notNull(),
  arquivoUrl: text("arquivo_url"),
  status: text("status").notNull().default("Pendente"),
  observacao: text("observacao"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertDocumentoSchema = createInsertSchema(documentosTable).omit({ id: true, createdAt: true });
export type InsertDocumento = z.infer<typeof insertDocumentoSchema>;
export type Documento = typeof documentosTable.$inferSelect;
