import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

const MESES = [
  "Janeiro","Fevereiro","Março","Abril","Maio","Junho",
  "Julho","Agosto","Setembro","Outubro","Novembro","Dezembro",
];

function mesLabel(mes: number, ano: number) {
  return `${MESES[mes - 1].toUpperCase()}/${ano}`;
}

function fmtCurrency(val: number) {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function fmtDate(d: string | null | undefined): string {
  if (!d) return "—";
  const p = (d.split("T")[0] ?? d).split("-");
  if (p.length !== 3) return d;
  return `${p[2]}/${p[1]}/${p[0]}`;
}

// ── BAP ────────────────────────────────────────────────────────────────────

export interface BapRow {
  alunoNome: string;
  curso: string;
  valorMensalidade: number;
}

export function exportBapPdf(rows: BapRow[], mes: number, ano: number) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const title = `GOVERNADOR VALADARES — ${mesLabel(mes, ano)}`;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, 105, 18, { align: "center" });

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Faculdade AlfaUnipac — Campus Governador Valadares/MG", 105, 24, { align: "center" });
  doc.text("LISTA BAP — BENEFÍCIO DE AUXÍLIO PEDAGÓGICO", 105, 29, { align: "center" });

  const total = rows.reduce((s, r) => s + r.valorMensalidade, 0);

  autoTable(doc, {
    startY: 34,
    head: [["#", "ALUNO", "CURSO", "VALOR"]],
    body: rows.map((r, i) => [
      String(i + 1),
      r.alunoNome,
      r.curso,
      fmtCurrency(r.valorMensalidade),
    ]),
    foot: [["", "", "TOTAL", fmtCurrency(total)]],
    headStyles: { fillColor: [10, 25, 47], textColor: 255, fontStyle: "bold", fontSize: 9 },
    footStyles: { fillColor: [240, 240, 240], textColor: [10, 25, 47], fontStyle: "bold", fontSize: 9 },
    bodyStyles: { fontSize: 8, textColor: [30, 30, 30] },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      3: { halign: "right", cellWidth: 32 },
    },
    alternateRowStyles: { fillColor: [250, 250, 252] },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable?.finalY ?? 200;

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  const footer1 = "POR EXPRESSÃO DE VERDADE, ASSINO, VALIDO E DOU FÉ NA PRESENTE DECLARAÇÃO DE FREQUÊNCIA";
  const footer2 = "SECRETARIA DO POLO DE GOVERNADOR VALADARES";
  doc.text(footer1, 105, finalY + 14, { align: "center" });
  doc.text(footer2, 105, finalY + 19, { align: "center" });

  doc.save(`BAP_${mesLabel(mes, ano)}.pdf`);
}

export function exportBapXlsx(rows: BapRow[], mes: number, ano: number) {
  const total = rows.reduce((s, r) => s + r.valorMensalidade, 0);
  const sheetData = [
    [`GOVERNADOR VALADARES — ${mesLabel(mes, ano)}`],
    ["Faculdade AlfaUnipac — Campus Governador Valadares/MG"],
    [],
    ["#", "ALUNO", "CURSO", "VALOR"],
    ...rows.map((r, i) => [i + 1, r.alunoNome, r.curso, r.valorMensalidade]),
    [],
    ["", "", "TOTAL", total],
  ];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws["!cols"] = [{ wch: 5 }, { wch: 45 }, { wch: 20 }, { wch: 15 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "BAP");
  XLSX.writeFile(wb, `BAP_${mesLabel(mes, ano)}.xlsx`);
}

// ── Generic report ──────────────────────────────────────────────────────────

export function exportRelatorioPdf(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string,
) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const now = new Date().toLocaleDateString("pt-BR");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text(title, 148, 14, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Gerado em: ${now} — AlfaUnipac GV`, 148, 19, { align: "center" });

  autoTable(doc, {
    startY: 24,
    head: [headers],
    body: rows.map((r) => r.map(String)),
    headStyles: { fillColor: [10, 25, 47], textColor: 255, fontStyle: "bold", fontSize: 8 },
    bodyStyles: { fontSize: 7.5, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [250, 250, 252] },
    margin: { left: 10, right: 10 },
  });

  doc.save(filename);
}

export function exportRelatorioXlsx(
  title: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string,
) {
  const sheetData = [
    [title],
    [`Gerado em: ${new Date().toLocaleDateString("pt-BR")} — AlfaUnipac GV`],
    [],
    headers,
    ...rows,
  ];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatório");
  XLSX.writeFile(wb, filename);
}

// ── Specific report data extractors ────────────────────────────────────────

export interface FaltasAlunoRow {
  alunoNome: string;
  curso: string;
  turmaNome: string;
  totalAulas: number;
  faltas: number;
  percentualFaltas: number;
  emRetencao: boolean;
}

export function exportFaltasAlunoPdf(rows: FaltasAlunoRow[]) {
  exportRelatorioPdf(
    "Relatório de Faltas por Aluno — AlfaUnipac GV",
    ["Aluno", "Curso", "Turma", "Total Aulas", "Faltas", "% Faltas", "Retenção"],
    rows.map((r) => [
      r.alunoNome, r.curso, r.turmaNome,
      r.totalAulas, r.faltas,
      `${r.percentualFaltas.toFixed(1)}%`,
      r.emRetencao ? "Sim" : "Não",
    ]),
    "Relatorio_Faltas_Aluno.pdf",
  );
}

export function exportFaltasAlunoXlsx(rows: FaltasAlunoRow[]) {
  exportRelatorioXlsx(
    "Relatório de Faltas por Aluno — AlfaUnipac GV",
    ["Aluno", "Curso", "Turma", "Total Aulas", "Faltas", "% Faltas", "Em Retenção"],
    rows.map((r) => [
      r.alunoNome, r.curso, r.turmaNome,
      r.totalAulas, r.faltas,
      parseFloat(r.percentualFaltas.toFixed(1)),
      r.emRetencao ? "Sim" : "Não",
    ]),
    "Relatorio_Faltas_Aluno.xlsx",
  );
}

export interface FaltasDisciplinaRow {
  disciplinaNome: string;
  curso: string;
  periodo: string;
  totalAlunos: number;
  mediaPresenca: number;
  alunosEmRetencao: number;
}

export function exportFaltasDisciplinaPdf(rows: FaltasDisciplinaRow[]) {
  exportRelatorioPdf(
    "Relatório de Faltas por Disciplina — AlfaUnipac GV",
    ["Disciplina", "Curso", "Período", "Total Alunos", "Média Presença %", "Em Retenção"],
    rows.map((r) => [
      r.disciplinaNome, r.curso, r.periodo,
      r.totalAlunos, `${r.mediaPresenca.toFixed(1)}%`, r.alunosEmRetencao,
    ]),
    "Relatorio_Faltas_Disciplina.pdf",
  );
}

export function exportFaltasDisciplinaXlsx(rows: FaltasDisciplinaRow[]) {
  exportRelatorioXlsx(
    "Relatório de Faltas por Disciplina — AlfaUnipac GV",
    ["Disciplina", "Curso", "Período", "Total Alunos", "Média Presença %", "Em Retenção"],
    rows.map((r) => [
      r.disciplinaNome, r.curso, r.periodo,
      r.totalAlunos, parseFloat(r.mediaPresenca.toFixed(1)), r.alunosEmRetencao,
    ]),
    "Relatorio_Faltas_Disciplina.xlsx",
  );
}

export interface RetencaoRelRow {
  alunoNome: string;
  curso: string;
  percentualFaltas: number;
  status: string;
  dataNotificacao: string | null;
}

export function exportRetencaoPdf(rows: RetencaoRelRow[]) {
  exportRelatorioPdf(
    "Relatório de Retenção — AlfaUnipac GV",
    ["Aluno", "Curso", "% Faltas", "Status", "1ª Notif."],
    rows.map((r) => [
      r.alunoNome, r.curso,
      `${r.percentualFaltas.toFixed(1)}%`,
      (r.status ?? "").replace(/_/g, " "),
      fmtDate(r.dataNotificacao),
    ]),
    "Relatorio_Retencao.pdf",
  );
}

export function exportRetencaoXlsx(rows: RetencaoRelRow[]) {
  exportRelatorioXlsx(
    "Relatório de Retenção — AlfaUnipac GV",
    ["Aluno", "Curso", "% Faltas", "Status", "1ª Notificação"],
    rows.map((r) => [
      r.alunoNome, r.curso,
      parseFloat(r.percentualFaltas.toFixed(1)),
      (r.status ?? "").replace(/_/g, " "),
      fmtDate(r.dataNotificacao),
    ]),
    "Relatorio_Retencao.xlsx",
  );
}

export interface DocumentoRelRow {
  alunoNome: string;
  curso: string;
  tipo: string;
  dataEntrega: string | null;
  periodo: string;
  status: string;
}

export function exportDocumentosPdf(rows: DocumentoRelRow[]) {
  exportRelatorioPdf(
    "Relatório de Documentos — AlfaUnipac GV",
    ["Aluno", "Curso", "Tipo", "Entregue em", "Período", "Status"],
    rows.map((r) => [
      r.alunoNome, r.curso,
      (r.tipo ?? "").replace(/_/g, " "),
      fmtDate(r.dataEntrega), r.periodo, r.status,
    ]),
    "Relatorio_Documentos.pdf",
  );
}

export function exportDocumentosXlsx(rows: DocumentoRelRow[]) {
  exportRelatorioXlsx(
    "Relatório de Documentos — AlfaUnipac GV",
    ["Aluno", "Curso", "Tipo", "Entregue em", "Período", "Status"],
    rows.map((r) => [
      r.alunoNome, r.curso,
      (r.tipo ?? "").replace(/_/g, " "),
      fmtDate(r.dataEntrega), r.periodo, r.status,
    ]),
    "Relatorio_Documentos.xlsx",
  );
}

export interface MensalRelRow {
  curso: string;
  totalAlunos: number;
  mediaPresenca: number;
  alunosEmRetencao: number;
  totalAulas: number;
}

export function exportMensalPdf(rows: MensalRelRow[], mes: string, ano: string) {
  exportRelatorioPdf(
    `Resumo Mensal por Curso — ${MESES[parseInt(mes) - 1] ?? mes}/${ano} — AlfaUnipac GV`,
    ["Curso", "Total Alunos", "Média Presença %", "Em Retenção", "Total Aulas"],
    rows.map((r) => [
      r.curso, r.totalAlunos,
      `${r.mediaPresenca.toFixed(1)}%`,
      r.alunosEmRetencao, r.totalAulas,
    ]),
    `Relatorio_Mensal_${mes}_${ano}.pdf`,
  );
}

export function exportMensalXlsx(rows: MensalRelRow[], mes: string, ano: string) {
  exportRelatorioXlsx(
    `Resumo Mensal por Curso — ${MESES[parseInt(mes) - 1] ?? mes}/${ano} — AlfaUnipac GV`,
    ["Curso", "Total Alunos", "Média Presença %", "Em Retenção", "Total Aulas"],
    rows.map((r) => [
      r.curso, r.totalAlunos,
      parseFloat(r.mediaPresenca.toFixed(1)),
      r.alunosEmRetencao, r.totalAulas,
    ]),
    `Relatorio_Mensal_${mes}_${ano}.xlsx`,
  );
}

// ── Formulário de Cancelamento PDF ─────────────────────────────────────────

export interface FormularioCancelamento {
  alunoNome: string;
  alunoMatricula: string;
  alunoCurso: string;
  alunoCpf?: string;
  motivoCancelamento?: string | null;
  dataDecisaoAluno?: string | null;
  nomeCoordinadora?: string | null;
  dataAssinatura?: string | null;
}

export function exportFormularioCancelamentoPdf(f: FormularioCancelamento) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const now = new Date().toLocaleDateString("pt-BR");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("FACULDADE ALFAUNIPAC", 105, 18, { align: "center" });
  doc.setFontSize(10);
  doc.text("Campus Governador Valadares / MG", 105, 24, { align: "center" });

  doc.setDrawColor(10, 25, 47);
  doc.setLineWidth(0.5);
  doc.line(14, 28, 196, 28);

  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text("FORMULÁRIO DE CANCELAMENTO DE MATRÍCULA", 105, 36, { align: "center" });

  doc.line(14, 40, 196, 40);

  let y = 50;
  const line = (label: string, value: string) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`${label}:`, 14, y);
    doc.setFont("helvetica", "normal");
    doc.text(value || "—", 60, y);
    doc.setDrawColor(200, 200, 200);
    doc.line(14, y + 2, 196, y + 2);
    y += 10;
  };

  line("Nome Completo", f.alunoNome);
  line("CPF", f.alunoCpf ?? "Não informado");
  line("Matrícula", f.alunoMatricula);
  line("Curso", f.alunoCurso);
  line("Data da Decisão", fmtDate(f.dataDecisaoAluno) !== "—" ? fmtDate(f.dataDecisaoAluno) : now);

  y += 4;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Motivo Declarado pelo Aluno:", 14, y);
  y += 6;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);

  const motivo = f.motivoCancelamento ?? "Não informado";
  const lines = doc.splitTextToSize(motivo, 180);
  doc.text(lines, 14, y);
  y += lines.length * 5 + 4;

  doc.setDrawColor(200, 200, 200);
  doc.line(14, y - 2, 196, y - 2);
  y += 10;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Assinatura do Aluno:", 14, y);
  y += 14;
  doc.line(14, y, 100, y);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Assinatura", 14, y + 4);

  y += 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Nome da Coordenadora Pedagógica:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(f.nomeCoordinadora ?? "___________________________________", 14, y + 8);
  y += 20;

  doc.setFont("helvetica", "bold");
  doc.text("Assinatura da Coordenadora / Carimbo Institucional:", 14, y);
  y += 20;
  doc.setDrawColor(10, 25, 47);
  doc.rect(14, y - 6, 80, 22);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text("Assinatura e Carimbo", 54, y + 10, { align: "center" });

  y += 32;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.text("Data de Assinatura:", 14, y);
  doc.setFont("helvetica", "normal");
  doc.text(
    f.dataAssinatura ? fmtDate(f.dataAssinatura) : "___ / ___ / ________",
    64, y,
  );

  y += 20;
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.text(
    "Por expressão de verdade, assino, valido e dou fé na presente declaração.",
    105, y, { align: "center" },
  );
  doc.text("SECRETARIA DO POLO DE GOVERNADOR VALADARES", 105, y + 5, { align: "center" });

  doc.save(`Formulario_Cancelamento_${f.alunoMatricula}.pdf`);
}

// ── Template de importação XLSX ────────────────────────────────────────────

export function downloadTemplateAlunosXlsx() {
  const sheetData = [
    ["nome_completo", "matricula", "cpf", "curso", "turno", "valor_mensalidade", "financiador"],
    ["João da Silva", "2026010001", "000.000.000-00", "Administração", "Noturno", 979, "Hospital Bom Samaritano"],
    ["Maria Souza", "2026020001", "000.000.000-01", "Enfermagem", "Noturno", 979, "Hospital Bom Samaritano"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(sheetData);
  ws["!cols"] = [{ wch: 35 }, { wch: 14 }, { wch: 16 }, { wch: 18 }, { wch: 12 }, { wch: 18 }, { wch: 28 }];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Alunos");
  XLSX.writeFile(wb, "template_importacao_alunos.xlsx");
}
