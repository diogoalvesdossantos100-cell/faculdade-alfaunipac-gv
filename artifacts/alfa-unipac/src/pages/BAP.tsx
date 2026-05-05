import { useState } from "react";
import {
  useListBap,
  getListBapQueryKey,
  useGenerateBap,
  useGetBapHistorico,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Receipt, RefreshCw, FileDown, FileSpreadsheet } from "lucide-react";
import { toast } from "sonner";
import { exportBapPdf, exportBapXlsx } from "../utils/export";

const MESES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

function formatCurrency(val: number): string {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function BAP() {
  const qc = useQueryClient();
  const now = new Date();
  const [mes, setMes] = useState(now.getMonth() + 1);
  const [ano, setAno] = useState(now.getFullYear());
  const [confirmGenerate, setConfirmGenerate] = useState(false);

  const { data: bapList, isLoading } = useListBap({ mes, ano });
  const { data: historico } = useGetBapHistorico();

  const generateMutation = useGenerateBap({
    mutation: {
      onSuccess(result) {
        toast.success(`BAP gerado! ${result.generated} alunos — Total: ${formatCurrency(result.total ?? 0)}`);
        qc.invalidateQueries({ queryKey: getListBapQueryKey() });
        setConfirmGenerate(false);
      },
      onError() { toast.error("Erro ao gerar BAP."); },
    },
  });

  const totalValor = bapList?.reduce((sum, r) => sum + r.valorMensalidade, 0) ?? 0;

  const handleGenerate = () => {
    if (bapList && bapList.length > 0) {
      setConfirmGenerate(true);
    } else {
      generateMutation.mutate({ data: { mes, ano } });
    }
  };

  const handleExportPdf = () => {
    if (!bapList?.length) { toast.error("Gere o BAP antes de exportar."); return; }
    exportBapPdf(bapList.map((r) => ({ alunoNome: r.alunoNome, curso: r.curso, valorMensalidade: r.valorMensalidade })), mes, ano);
    toast.success("PDF gerado com sucesso.");
  };

  const handleExportXlsx = () => {
    if (!bapList?.length) { toast.error("Gere o BAP antes de exportar."); return; }
    exportBapXlsx(bapList.map((r) => ({ alunoNome: r.alunoNome, curso: r.curso, valorMensalidade: r.valorMensalidade })), mes, ano);
    toast.success("Planilha gerada com sucesso.");
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">BAP — Benefício de Auxílio Pedagógico</h1>
          <p className="text-slate-500 text-sm mt-0.5">Lista mensal de cobranças</p>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-6 flex flex-wrap items-end gap-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Mês</label>
          <select
            value={mes}
            onChange={(e) => setMes(parseInt(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            {MESES.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Ano</label>
          <select
            value={ano}
            onChange={(e) => setAno(parseInt(e.target.value))}
            className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
          >
            {[2024, 2025, 2026, 2027].map((a) => <option key={a}>{a}</option>)}
          </select>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generateMutation.isPending}
          className="flex items-center gap-2 bg-[#0A192F] hover:bg-slate-800 text-white font-semibold text-sm px-5 py-2.5 rounded-lg transition-colors disabled:opacity-60"
        >
          <RefreshCw className={`w-4 h-4 ${generateMutation.isPending ? "animate-spin" : ""}`} />
          {generateMutation.isPending ? "Gerando..." : "Gerar BAP"}
        </button>
        <div className="flex gap-2 ml-auto">
          <button
            onClick={handleExportPdf}
            disabled={!bapList?.length}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm px-4 py-2.5 rounded-lg transition-colors disabled:opacity-40"
            title="Exportar PDF no formato oficial"
          >
            <FileDown className="w-4 h-4 text-red-500" />
            PDF
          </button>
          <button
            onClick={handleExportXlsx}
            disabled={!bapList?.length}
            className="flex items-center gap-1.5 border border-slate-200 text-slate-700 hover:bg-slate-50 font-medium text-sm px-4 py-2.5 rounded-lg transition-colors disabled:opacity-40"
            title="Exportar planilha Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-green-600" />
            Excel
          </button>
        </div>
      </div>

      {/* BAP Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="text-base font-semibold text-slate-900">
            {MESES[mes - 1]} / {ano}
          </h2>
          {bapList && bapList.length > 0 && (
            <span className="text-sm text-slate-500">{bapList.length} alunos</span>
          )}
        </div>
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => <div key={i} className="h-10 bg-slate-50 rounded animate-pulse" />)}
          </div>
        ) : !bapList?.length ? (
          <div className="text-center py-16 text-slate-400">
            <Receipt className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Nenhum registro para este período.</p>
            <p className="text-sm mt-1">Clique em "Gerar BAP" para criar a lista.</p>
          </div>
        ) : (
          <>
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                  <th className="px-5 py-3">#</th>
                  <th className="px-5 py-3">Aluno</th>
                  <th className="px-5 py-3">Curso</th>
                  <th className="px-5 py-3 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {bapList.map((r, i) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 text-slate-400 text-xs">{i + 1}</td>
                    <td className="px-5 py-3 font-medium text-slate-800">{r.alunoNome}</td>
                    <td className="px-5 py-3 text-slate-500">{r.curso}</td>
                    <td className="px-5 py-3 text-right font-mono text-slate-800">{formatCurrency(r.valorMensalidade)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 border-t border-slate-200">
                <tr>
                  <td colSpan={3} className="px-5 py-3 text-sm font-semibold text-slate-700">Total</td>
                  <td className="px-5 py-3 text-right font-bold text-slate-900 font-mono">{formatCurrency(totalValor)}</td>
                </tr>
              </tfoot>
            </table>
          </>
        )}
      </div>

      {/* Histórico */}
      {historico && historico.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Histórico de Períodos</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {historico.map((h) => (
              <button
                key={`${h.mes}-${h.ano}`}
                onClick={() => { setMes(h.mes); setAno(h.ano); }}
                className="p-3 rounded-lg border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50 transition-all text-left"
              >
                <p className="text-sm font-semibold text-slate-800">{MESES[h.mes - 1]}/{h.ano}</p>
                <p className="text-xs text-slate-500 mt-0.5">{h.totalAlunos} alunos</p>
                <p className="text-xs font-medium text-slate-700 mt-0.5">{formatCurrency(h.totalValor)}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Generate */}
      {confirmGenerate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Regenerar BAP</h2>
            <p className="text-slate-500 text-sm mb-6">
              Já existe um BAP gerado para {MESES[mes - 1]}/{ano}. Deseja regenerar? Os registros existentes serão substituídos.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmGenerate(false)} className="flex-1 border border-slate-200 text-slate-700 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => generateMutation.mutate({ data: { mes, ano } })}
                disabled={generateMutation.isPending}
                className="flex-1 bg-[#0A192F] hover:bg-slate-800 text-white font-semibold rounded-lg py-2.5 text-sm disabled:opacity-60 transition-colors"
              >
                {generateMutation.isPending ? "Gerando..." : "Regenerar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
