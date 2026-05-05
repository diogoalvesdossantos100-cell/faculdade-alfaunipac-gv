import { Router, type IRouter } from "express";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db, documentosTable, alunosTable, chamadasTable } from "@workspace/db";
import {
  CreateDocumentoBody,
  UpdateDocumentoStatusBody,
  UpdateDocumentoStatusParams,
  GetDocumentoParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

function buildDocumentoWhere(alunoId?: string, tipo?: string, status?: string, curso?: string, dataInicio?: string, dataFim?: string) {
  const conditions = [];
  if (alunoId) conditions.push(eq(documentosTable.alunoId, parseInt(alunoId)));
  if (tipo) conditions.push(eq(documentosTable.tipo, tipo));
  if (status) conditions.push(eq(documentosTable.status, status));
  if (dataInicio) conditions.push(gte(documentosTable.dataEntrega, dataInicio));
  if (dataFim) conditions.push(lte(documentosTable.dataEntrega, dataFim));
  return conditions.length > 0 ? and(...conditions) : undefined;
}

router.get("/documentos", async (req, res): Promise<void> => {
  const { alunoId, tipo, status, curso, dataInicio, dataFim } = req.query as Record<string, string>;

  const rows = await db
    .select({
      id: documentosTable.id,
      alunoId: documentosTable.alunoId,
      tipo: documentosTable.tipo,
      dataEntrega: documentosTable.dataEntrega,
      dataInicioPeriodo: documentosTable.dataInicioPeriodo,
      dataFimPeriodo: documentosTable.dataFimPeriodo,
      arquivoUrl: documentosTable.arquivoUrl,
      status: documentosTable.status,
      observacao: documentosTable.observacao,
      createdAt: documentosTable.createdAt,
      alunoNome: alunosTable.nomeCompleto,
      alunoCurso: alunosTable.curso,
    })
    .from(documentosTable)
    .leftJoin(alunosTable, eq(documentosTable.alunoId, alunosTable.id))
    .where(buildDocumentoWhere(alunoId, tipo, status, curso, dataInicio, dataFim))
    .orderBy(documentosTable.createdAt);

  const filtered = curso ? rows.filter((r) => r.alunoCurso === curso) : rows;
  res.json(filtered.map((r) => ({ ...r, alunoNome: r.alunoNome ?? "N/A", alunoCurso: r.alunoCurso ?? "N/A" })));
});

router.post("/documentos", async (req, res): Promise<void> => {
  const parsed = CreateDocumentoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [doc] = await db.insert(documentosTable).values({
    ...parsed.data,
    status: "Pendente",
    arquivoUrl: parsed.data.arquivoUrl ?? null,
    observacao: parsed.data.observacao ?? null,
  }).returning();

  res.status(201).json(doc);
});

router.get("/documentos/pendentes/count", async (_req, res): Promise<void> => {
  const rows = await db
    .select({ id: documentosTable.id })
    .from(documentosTable)
    .where(eq(documentosTable.status, "Pendente"));
  res.json({ count: rows.length });
});

router.get("/documentos/:id", async (req, res): Promise<void> => {
  const params = GetDocumentoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [doc] = await db
    .select({
      id: documentosTable.id,
      alunoId: documentosTable.alunoId,
      tipo: documentosTable.tipo,
      dataEntrega: documentosTable.dataEntrega,
      dataInicioPeriodo: documentosTable.dataInicioPeriodo,
      dataFimPeriodo: documentosTable.dataFimPeriodo,
      arquivoUrl: documentosTable.arquivoUrl,
      status: documentosTable.status,
      observacao: documentosTable.observacao,
      createdAt: documentosTable.createdAt,
      alunoNome: alunosTable.nomeCompleto,
      alunoCurso: alunosTable.curso,
    })
    .from(documentosTable)
    .leftJoin(alunosTable, eq(documentosTable.alunoId, alunosTable.id))
    .where(eq(documentosTable.id, params.data.id));

  if (!doc) {
    res.status(404).json({ error: "Documento não encontrado" });
    return;
  }

  res.json({ ...doc, alunoNome: doc.alunoNome ?? "N/A", alunoCurso: doc.alunoCurso ?? "N/A" });
});

router.patch("/documentos/:id", async (req, res): Promise<void> => {
  const params = UpdateDocumentoStatusParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateDocumentoStatusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [doc] = await db
    .update(documentosTable)
    .set({ status: parsed.data.status, observacao: parsed.data.observacao ?? null })
    .where(eq(documentosTable.id, params.data.id))
    .returning();

  if (!doc) {
    res.status(404).json({ error: "Documento não encontrado" });
    return;
  }

  // If approved, auto-justify corresponding absences
  if (parsed.data.status === "Aprovado") {
    // Find chamadas in the date range for this student that are absent
    const chamadas = await db
      .select()
      .from(chamadasTable)
      .where(
        and(
          eq(chamadasTable.alunoId, doc.alunoId),
          gte(chamadasTable.data, doc.dataInicioPeriodo),
          lte(chamadasTable.data, doc.dataFimPeriodo)
        )
      );

    for (const chamada of chamadas) {
      if (!chamada.presente) {
        await db
          .update(chamadasTable)
          .set({
            justificada: true,
            tipoJustificativa: doc.tipo,
            observacao: `Justificado por documento #${doc.id}`,
          })
          .where(eq(chamadasTable.id, chamada.id));
      }
    }
  }

  res.json(doc);
});

export default router;
