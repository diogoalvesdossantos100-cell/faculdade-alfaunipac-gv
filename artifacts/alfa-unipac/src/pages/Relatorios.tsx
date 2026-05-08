import { useState } from "react";
import {
  useGetRelatorioFaltasPorAluno,
  useGetRelatorioRetencao,
  useGetRelatorioDocumentos,
  useGetRelatorioResumoMensal,
  getGetRelatorioFaltasPorAlunoQueryKey,
  getGetRelatorioRetencaoQueryKey,
  getGetRelatorioDocumentosQueryKey,
  getGetRelatorioResumoMensalQueryKey,
} from "@workspace/api-client-react";
import { BarChart3, FileDown, FileSpreadsheet } from "lucide-react";
import {
  exportFaltasAlunoPdf, exportFaltasAlunoXlsx,
  exportRetencaoPdf, exportRetencaoXlsx,
  exportDocumentosPdf, exportDocumentosXlsx,
  exportMensalPdf, exportMensalXlsx,
} from "../utils/export";
import { toast } from "sonner";

const CURSOS = ["Administração", "Enfermagem", "Farmácia", "Fisioterapia", "Nutrição"];
const MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

type Tab = "faltas-aluno" | "retencao" | "documentos" | "mensal";

function formatDate(d: string | undefined | null): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function ExportButtons({ onPdf, onXlsx, disabled }: { onPdf: () => void; onXlsx: () => void; disabled?: boolean }) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => { if (!disabled) onPdf(); else toast.error("Nenhum dado para exportar."); }}
        className={`flex items-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs px-3 py-2 rounded-lg transition-colors ${disabled ? "opacity-40" : ""}`}
      >
        <FileDown className="w-3.5 h-3.5 text-red-500" /> PDF
      </button>
      <button
        onClick={() => { if (!disabled) onXlsx(); else toast.error("Nenhum dado para exportar."); }}
        className={`flex items-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-xs px-3 py-2 rounded-lg transition-colors ${disabled ? "opacity-40" : ""}`}
      >
        <FileSpreadsheet className="w-3.5 h-3.5 text-green-600" /> Excel
      </button>
    </div>
  );
}

export default function Relatorios() {
  const [tab, setTab] = useState<Tab>("faltas-aluno");
  const [curso, setCurso] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [statusFiltro, setStatusFiltro] = useState("");
  const [mes, setMes] = useState(String(new Date().getMonth() + 1));
  const [ano, setAno] = useState(String(new Date().getFullYear()));

  const tabDefs = [
    { key: "faltas-aluno", label: "Faltas por Aluno" },
    { key: "retencao", label: "Retenção" },
    { key: "documentos", label: "Documentos" },
    { key: "mensal", label: "Resumo Mensal" },
  ] as { key: Tab; label: string }[];

  const faParams = { ...(curso ? { curso } : {}), ...(dataInicio ? { dataInicio } : {}), ...(dataFim ? { dataFim } : {}) };
  const retParams = { ...(curso ? { curso } : {}), ...(statusFiltro ? { status: statusFiltro } : {}) };
  const docParams = { ...(dataInicio ? { dataInicio } : {}), ...(dataFim ? { dataFim } : {}) };
  const mesNum = mes ? parseInt(mes) : undefined;
  const anoNum = ano ? parseInt(ano) : undefined;
  const mensalParams = { ...(mesNum ? { mes: mesNum } : {}), ...(anoNum ? { ano: anoNum } : {}) };

  const { data: faltasAluno, isLoading: faLoading } = useGetRelatorioFaltasPorAluno(faParams, { query: { enabled: tab === "faltas-aluno", queryKey: getGetRelatorioFaltasPorAlunoQueryKey(faParams) } });
  const { data: retencao, isLoading: retLoading } = useGetRelatorioRetencao(retParams, { query: { enabled: tab === "retencao", queryKey: getGetRelatorioRetencaoQueryKey(retParams) } });
  const { data: docs, isLoading: docsLoading } = useGetRelatorioDocumentos(docParams, { query: { enabled: tab === "documentos", queryKey: getGetRelatorioDocumentosQueryKey(docParams) } });
  const { data: mensal, isLoading: mensalLoading } = useGetRelatorioResumoMensal(mensalParams, { query: { enabled: tab === "mensal", queryKey: getGetRelatorioResumoMensalQueryKey(mensalParams) } });

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Relatórios</h1>
        <p className="text-slate-500 text-sm mt-0.5">Análises e indicadores do sistema acadêmico</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-5 overflow-x-auto">
        {tabDefs.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
              tab === key ? "border-cyan-400 text-cyan-600" : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Filters + Export */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm mb-5 flex flex-wrap gap-3 items-end">
        {(tab === "faltas-aluno" || tab === "retencao") && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Curso</label>
            <select value={curso} onChange={(e) => setCurso(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300">
              <option value="">Todos</option>
              {CURSOS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        )}
        {(tab === "faltas-aluno" || tab === "documentos") && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Data início</label>
              <input type="date" value={dataInicio} onChange={(e) => setDataInicio(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Data fim</label>
              <input type="date" value={dataFim} onChange={(e) => setDataFim(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300" />
            </div>
          </>
        )}
        {tab === "retencao" && (
          <div>
            <label className="block text-xs font-medium text-slate-500 mb-1">Status</label>
            <select value={statusFiltro} onChange={(e) => setStatusFiltro(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300">
              <option value="">Todos</option>
              <option value="Identificado">Identificado</option>
              <option value="Encaminhado">Encaminhado</option>
              <option value="Em_Contato">Em Contato</option>
              <option value="Encerrado">Encerrado</option>
              <option value="Reintegrado">Reintegrado</option>
            </select>
          </div>
        )}
        {tab === "mensal" && (
          <>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Mês</label>
              <select value={mes} onChange={(e) => setMes(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300">
                {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1">Ano</label>
              <select value={ano} onChange={(e) => setAno(e.target.value)} className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300">
                {[2024, 2025, 2026, 2027].map((a) => <option key={a}>{a}</option>)}
              </select>
            </div>
          </>
        )}

        {/* Export buttons aligned right */}
        <div className="ml-auto flex items-end">
          {tab === "faltas-aluno" && (
            <ExportButtons
              disabled={!faltasAluno?.length}
              onPdf={() => { exportFaltasAlunoPdf(faltasAluno!); toast.success("PDF gerado."); }}
              onXlsx={() => { exportFaltasAlunoXlsx(faltasAluno!); toast.success("Excel gerado."); }}
            />
          )}
          {tab === "retencao" && (
            <ExportButtons
              disabled={!retencao?.length}
              onPdf={() => { exportRetencaoPdf(retencao!.map((r) => ({ ...r, percentualFaltas: r.percentualFaltas ?? 0, dataNotificacao: r.dataNotificacao ?? null }))); toast.success("PDF gerado."); }}
              onXlsx={() => { exportRetencaoXlsx(retencao!.map((r) => ({ ...r, percentualFaltas: r.percentualFaltas ?? 0, dataNotificacao: r.dataNotificacao ?? null }))); toast.success("Excel gerado."); }}
            />
          )}
          {tab === "documentos" && (
            <ExportButtons
              disabled={!docs?.length}
              onPdf={() => { exportDocumentosPdf(docs!.map((r) => ({ ...r, dataEntrega: r.dataEntrega ?? null, periodo: r.periodo ?? "" }))); toast.success("PDF gerado."); }}
              onXlsx={() => { exportDocumentosXlsx(docs!.map((r) => ({ ...r, dataEntrega: r.dataEntrega ?? null, periodo: r.periodo ?? "" }))); toast.success("Excel gerado."); }}
            />
          )}
          {tab === "mensal" && (
            <ExportButtons
              disabled={!mensal?.length}
              onPdf={() => { exportMensalPdf(mensal!, mes, ano); toast.success("PDF gerado."); }}
              onXlsx={() => { exportMensalXlsx(mensal!, mes, ano); toast.success("Excel gerado."); }}
            />
          )}
        </div>
      </div>

      {/* Table area */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {tab === "faltas-aluno" && (
          faLoading ? <Skeleton /> : !faltasAluno?.length ? <Empty /> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3">Aluno</th>
                  <th className="px-5 py-3">Curso</th>
                  <th className="px-5 py-3">Turma</th>
                  <th className="px-5 py-3 text-center">Total</th>
                  <th className="px-5 py-3 text-center">Faltas</th>
                  <th className="px-5 py-3 text-center">% Faltas</th>
                  <th className="px-5 py-3 text-center">Retenção</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {faltasAluno.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{r.alunoNome}</td>
                    <td className="px-5 py-3 text-slate-500">{r.curso}</td>
                    <td className="px-5 py-3 text-slate-600">{r.turmaNome}</td>
                    <td className="px-5 py-3 text-center text-slate-600">{r.totalAulas}</td>
                    <td className="px-5 py-3 text-center text-slate-600">{r.faltas}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`font-semibold ${(r.percentualFaltas ?? 0) > 25 ? "text-red-600" : "text-green-700"}`}>
                        {(r.percentualFaltas ?? 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {r.emRetencao ? <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full">Sim</span> : <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full">Não</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {tab === "retencao" && (
          retLoading ? <Skeleton /> : !retencao?.length ? <Empty /> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3">Aluno</th>
                  <th className="px-5 py-3">Curso</th>
                  <th className="px-5 py-3 text-center">% Faltas</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">1ª Notif.</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {retencao.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{r.alunoNome}</td>
                    <td className="px-5 py-3 text-slate-500">{r.curso}</td>
                    <td className="px-5 py-3 text-center font-bold text-red-600">{(r.percentualFaltas ?? 0).toFixed(1)}%</td>
                    <td className="px-5 py-3 text-slate-600">{(r.status ?? "").replace(/_/g, " ")}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(r.dataNotificacao)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {tab === "documentos" && (
          docsLoading ? <Skeleton /> : !docs?.length ? <Empty /> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3">Aluno</th>
                  <th className="px-5 py-3">Curso</th>
                  <th className="px-5 py-3">Tipo</th>
                  <th className="px-5 py-3">Entregue em</th>
                  <th className="px-5 py-3">Período</th>
                  <th className="px-5 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {docs.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-medium text-slate-800">{r.alunoNome}</td>
                    <td className="px-5 py-3 text-slate-500">{r.curso}</td>
                    <td className="px-5 py-3 text-slate-600">{(r.tipo ?? "").replace(/_/g, " ")}</td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(r.dataEntrega)}</td>
                    <td className="px-5 py-3 text-slate-500">{r.periodo}</td>
                    <td className="px-5 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        r.status === "Aprovado" ? "bg-green-50 text-green-700" : r.status === "Rejeitado" ? "bg-red-50 text-red-600" : "bg-amber-50 text-amber-700"
                      }`}>{r.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {tab === "mensal" && (
          mensalLoading ? <Skeleton /> : !mensal?.length ? <Empty /> : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3">Curso</th>
                  <th className="px-5 py-3 text-center">Total Alunos</th>
                  <th className="px-5 py-3 text-center">Média Presença</th>
                  <th className="px-5 py-3 text-center">Em Retenção</th>
                  <th className="px-5 py-3 text-center">Total Aulas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {mensal.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="px-5 py-3 font-semibold text-slate-800">{r.curso}</td>
                    <td className="px-5 py-3 text-center text-slate-600">{r.totalAlunos}</td>
                    <td className="px-5 py-3 text-center">
                      <span className={`font-semibold ${(r.mediaPresenca ?? 0) < 75 ? "text-red-600" : "text-green-700"}`}>
                        {(r.mediaPresenca ?? 0).toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-center">
                      {(r.alunosEmRetencao ?? 0) > 0 ? (
                        <span className="text-xs bg-amber-50 text-amber-700 px-2 py-0.5 rounded-full font-semibold">{r.alunosEmRetencao}</span>
                      ) : (
                        <span className="text-slate-400 text-xs">0</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-center text-slate-600">{r.totalAulas}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="p-6 space-y-3">
      {[...Array(5)].map((_, i) => <div key={i} className="h-10 bg-slate-50 rounded animate-pulse" />)}
    </div>
  );
}

function Empty() {
  return (
    <div className="text-center py-16 text-slate-400">
      <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
      <p>Nenhum dado para os filtros selecionados.</p>
    </div>
  );
}
