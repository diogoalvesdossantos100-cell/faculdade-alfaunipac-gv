import { Router, type IRouter } from "express";
import multer from "multer";
import * as XLSX from "xlsx";
import { db, alunosTable, chamadasTable, disciplinasTable, matriculasTable, retencaoTable, turmasTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { verifyToken } from "./auth";

const router: IRouter = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 20 * 1024 * 1024 } });

function requireAuth(req: import("express").Request, res: import("express").Response, next: import("express").NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith("Bearer ")) { res.status(401).json({ error: "Unauthorized" }); return; }
  try {
    verifyToken(auth.slice(7));
    next();
  } catch {
    res.status(401).json({ error: "Unauthorized" });
  }
}

const CURSOS_VALID = ["Administração", "Enfermagem", "Farmácia", "Fisioterapia", "Nutrição"];
const TURNOS_VALID = ["Matutino", "Vespertino", "Noturno"];

// ── POST /api/alunos/import ─────────────────────────────────────────────────

router.post("/api/alunos/import", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: "Nenhum arquivo enviado." }); return; }

  try {
    const wb = XLSX.read(req.file.buffer, { type: "buffer" });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

    if (rows.length === 0) { res.status(400).json({ error: "Planilha vazia." }); return; }

    const results = { inserted: 0, skipped: 0, errors: [] as string[] };

    for (const row of rows) {
      const nome = String(row["nome_completo"] ?? row["Nome"] ?? row["NOME"] ?? "").trim();
      const matricula = String(row["matricula"] ?? row["Matrícula"] ?? row["MATRICULA"] ?? "").trim();
      const cpf = String(row["cpf"] ?? row["CPF"] ?? "").trim() || "000.000.000-00";
      const curso = String(row["curso"] ?? row["Curso"] ?? row["CURSO"] ?? "").trim();
      const turno = String(row["turno"] ?? row["Turno"] ?? row["TURNO"] ?? "Noturno").trim();
      const valorRaw = row["valor_mensalidade"] ?? row["Valor"] ?? 979;
      const valor = typeof valorRaw === "number" ? valorRaw : parseFloat(String(valorRaw).replace(",", ".")) || 979;
      const financiador = String(row["financiador"] ?? row["Financiador"] ?? "Hospital Bom Samaritano").trim();

      if (!nome || !matricula || !curso) {
        results.errors.push(`Linha ignorada: nome='${nome}' matricula='${matricula}' curso='${curso}'`);
        results.skipped++;
        continue;
      }
      if (!CURSOS_VALID.includes(curso)) {
        results.errors.push(`Curso inválido '${curso}' para matrícula ${matricula}`);
        results.skipped++;
        continue;
      }
      const turnoFinal = TURNOS_VALID.includes(turno) ? turno : "Noturno";

      const existing = await db.select({ id: alunosTable.id }).from(alunosTable).where(eq(alunosTable.matricula, matricula));
      if (existing.length > 0) {
        results.skipped++;
        continue;
      }

      await db.insert(alunosTable).values({
        nomeCompleto: nome,
        matricula,
        cpf,
        curso,
        turno: turnoFinal,
        status: "Ativo",
        valorMensalidade: String(valor),
        financiador,
      });
      results.inserted++;
    }

    res.json({ message: `Importação concluída: ${results.inserted} inseridos, ${results.skipped} ignorados.`, ...results });
  } catch (err) {
    req.log.error(err, "Erro ao importar alunos");
    res.status(500).json({ error: "Erro ao processar o arquivo." });
  }
});

// ── POST /api/frequencia/import ────────────────────────────────────────────

router.post("/api/frequencia/import", requireAuth, upload.single("file"), async (req, res) => {
  if (!req.file) { res.status(400).json({ error: "Nenhum arquivo enviado." }); return; }

  try {
    const wb = XLSX.read(req.file.buffer, { type: "buffer" });
    const results = { chamadas: 0, retencaoFlagged: 0, errors: [] as string[], sheets: [] as string[] };

    for (const sheetName of wb.SheetNames) {
      const ws = wb.Sheets[sheetName];
      const aoa: unknown[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" }) as unknown[][];

      if (aoa.length < 6) continue;

      // Detect course name from row 0 or sheet name
      let curso = sheetName.trim();
      const row0 = String(aoa[0]?.[0] ?? "");
      if (row0.toLowerCase().startsWith("curso:")) {
        curso = row0.replace(/curso:/i, "").trim();
      }
      if (!CURSOS_VALID.includes(curso)) {
        results.errors.push(`Aba '${sheetName}': curso '${curso}' não reconhecido — ignorada.`);
        continue;
      }
      results.sheets.push(curso);

      // Row 3 (index 3): discipline group headers (D1, D2, D3...)
      // Row 4 (index 4): individual dates (DD/MM) + "TOTAL DE FALTAS"
      // Row 5+ (index 5+): student rows

      const disciplineRow = (aoa[3] ?? []).map((v) => String(v).trim());
      const dateRow = (aoa[4] ?? []).map((v) => String(v).trim());

      // Build mapping: colIndex → { disciplinaCode, date }
      // Track current discipline group as we scan across
      const colMap: Record<number, { discCode: string; date: string }> = {};
      let currentDisc = "";
      for (let col = 2; col < dateRow.length; col++) {
        // Update current discipline from row 3 if non-empty
        if (disciplineRow[col] && /^D\d+$/i.test(disciplineRow[col])) {
          currentDisc = disciplineRow[col].toUpperCase();
        }
        const dateVal = dateRow[col];
        if (!dateVal || dateVal === "TOTAL DE FALTAS" || !dateVal.includes("/")) continue;
        // Parse date DD/MM → full date string (assuming 2026)
        const parts = dateVal.split("/");
        if (parts.length < 2) continue;
        const day = parts[0].padStart(2, "0");
        const month = parts[1].padStart(2, "0");
        const year = "2026"; // default year — could be parsed from row 2
        colMap[col] = { discCode: currentDisc || "D1", date: `${year}-${month}-${day}` };
      }

      if (Object.keys(colMap).length === 0) {
        results.errors.push(`Aba '${sheetName}': nenhuma coluna de data encontrada.`);
        continue;
      }

      // Get all disciplines for this course
      const disciplinas = await db.select().from(disciplinasTable).where(eq(disciplinasTable.curso, curso));

      // Get all turmas for this course
      const turmas = await db
        .select({ id: turmasTable.id, disciplinaId: turmasTable.disciplinaId })
        .from(turmasTable)
        .innerJoin(disciplinasTable, eq(turmasTable.disciplinaId, disciplinasTable.id))
        .where(eq(disciplinasTable.curso, curso));

      // Process student rows starting at row index 5
      for (let r = 5; r < aoa.length; r++) {
        const rowData = aoa[r] ?? [];
        const matriculaRaw = String(rowData[0] ?? "").trim();
        const nomeRaw = String(rowData[1] ?? "").trim();

        if (!matriculaRaw || !nomeRaw) continue;
        if (matriculaRaw.toLowerCase().includes("total") || nomeRaw.toLowerCase().includes("total")) continue;

        // Find aluno by matricula
        const alunoArr = await db.select({ id: alunosTable.id }).from(alunosTable).where(eq(alunosTable.matricula, matriculaRaw));
        if (alunoArr.length === 0) continue;
        const alunoId = alunoArr[0].id;

        // Get matriculas for this student
        const studentMatriculas = await db
          .select({ turmaId: matriculasTable.turmaId })
          .from(matriculasTable)
          .where(eq(matriculasTable.alunoId, alunoId));
        const studentTurmaIds = new Set(studentMatriculas.map((m) => m.turmaId));

        // Group cells by discipline code
        const discMap: Record<string, { date: string; presente: boolean }[]> = {};
        for (const [colStr, { discCode, date }] of Object.entries(colMap)) {
          const colIdx = parseInt(colStr);
          const cellVal = String(rowData[colIdx] ?? "").trim().toLowerCase();
          const presente = cellVal !== "f";
          if (!discMap[discCode]) discMap[discCode] = [];
          discMap[discCode].push({ date, presente });
        }

        // For each discipline code, find the matching turma and upsert chamadas
        const discCodes = Object.keys(discMap).sort();
        for (let di = 0; di < discCodes.length; di++) {
          const discCode = discCodes[di];
          const entries = discMap[discCode];

          // Find matching disciplina (by order/index)
          const discIndex = di;
          const disc = disciplinas[discIndex] ?? disciplinas[0];
          if (!disc) continue;

          // Find matching turma
          const turma = turmas.find((t) => t.disciplinaId === disc.id && studentTurmaIds.has(t.id));
          if (!turma) continue;

          for (const { date, presente } of entries) {
            // Upsert: delete existing then insert
            await db.delete(chamadasTable).where(
              and(
                eq(chamadasTable.turmaId, turma.id),
                eq(chamadasTable.alunoId, alunoId),
                eq(chamadasTable.data, date),
              ),
            );
            await db.insert(chamadasTable).values({
              turmaId: turma.id,
              alunoId,
              data: date,
              presente,
              justificada: false,
            });
            results.chamadas++;
          }

          // Check retention threshold
          const allChamadas = await db
            .select({ presente: chamadasTable.presente })
            .from(chamadasTable)
            .where(and(eq(chamadasTable.turmaId, turma.id), eq(chamadasTable.alunoId, alunoId)));

          if (allChamadas.length === 0) continue;
          const faltas = allChamadas.filter((c) => !c.presente).length;
          const pct = (faltas / allChamadas.length) * 100;

          if (pct > 25) {
            const existingRet = await db
              .select({ id: retencaoTable.id })
              .from(retencaoTable)
              .where(and(eq(retencaoTable.alunoId, alunoId), eq(retencaoTable.turmaId, turma.id)));

            if (existingRet.length === 0) {
              await db.insert(retencaoTable).values({
                alunoId,
                turmaId: turma.id,
                percentualFaltas: String(pct.toFixed(2)),
                status: "Identificado",
                responsavel: "Secretaria",
              });
              results.retencaoFlagged++;
            } else {
              await db
                .update(retencaoTable)
                .set({ percentualFaltas: String(pct.toFixed(2)) })
                .where(eq(retencaoTable.id, existingRet[0].id));
            }
          }
        }
      }
    }

    res.json({
      message: `Importação concluída! ${results.chamadas} chamadas processadas, ${results.retencaoFlagged} alunos flagrados para retenção.`,
      ...results,
    });
  } catch (err) {
    req.log.error(err, "Erro ao importar frequência");
    res.status(500).json({ error: "Erro ao processar o arquivo de frequência." });
  }
});

export default router;
