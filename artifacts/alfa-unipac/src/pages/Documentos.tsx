import { useState } from "react";
import {
  useListDocumentos,
  getListDocumentosQueryKey,
  useCreateDocumento,
  useUpdateDocumentoStatus,
  useGetPendentesCount,
  useListAlunos,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { FileText, Plus, X, CheckCircle, XCircle } from "lucide-react";
import { toast } from "sonner";

const TIPOS = ["Atestado", "Declaracao_Trabalho", "Licenca_Maternidade"];
const STATUS_MAP: Record<string, string> = {
  Pendente: "bg-amber-50 text-amber-700 border border-amber-200",
  Aprovado: "bg-green-50 text-green-700 border border-green-200",
  Rejeitado: "bg-red-50 text-red-600 border border-red-200",
};

function formatDate(d: string | undefined | null): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function formatTipo(t: string) {
  return t.replace(/_/g, " ");
}

export default function Documentos() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"pendentes" | "todos">("pendentes");
  const [modalOpen, setModalOpen] = useState(false);
  const [analyzeDoc, setAnalyzeDoc] = useState<{ id: number; alunoNome: string; tipo: string; dataInicioPeriodo: string; dataFimPeriodo: string; observacao?: string | null } | null>(null);
  const [rejectObs, setRejectObs] = useState("");
  const [form, setForm] = useState({
    alunoId: "",
    tipo: "Atestado",
    dataEntrega: "",
    dataInicioPeriodo: "",
    dataFimPeriodo: "",
    observacao: "",
  });

  const statusFilter = tab === "pendentes" ? "Pendente" : undefined;
  const { data: documentos, isLoading } = useListDocumentos(statusFilter ? { status: statusFilter } : {});
  const { data: pendentesCount } = useGetPendentesCount();
  const { data: alunos } = useListAlunos();

  const createMutation = useCreateDocumento({
    mutation: {
      onSuccess() {
        toast.success("Documento registrado.");
        qc.invalidateQueries({ queryKey: getListDocumentosQueryKey() });
        setModalOpen(false);
        setForm({ alunoId: "", tipo: "Atestado", dataEntrega: "", dataInicioPeriodo: "", dataFimPeriodo: "", observacao: "" });
      },
      onError() { toast.error("Erro ao registrar documento."); },
    },
  });

  const statusMutation = useUpdateDocumentoStatus({
    mutation: {
      onSuccess(_, vars) {
        const action = vars.data.status === "Aprovado" ? "aprovado" : "rejeitado";
        toast.success(`Documento ${action}${vars.data.status === "Aprovado" ? ". Faltas justificadas automaticamente." : "."}`);
        qc.invalidateQueries({ queryKey: getListDocumentosQueryKey() });
        setAnalyzeDoc(null);
        setRejectObs("");
      },
      onError() { toast.error("Erro ao atualizar documento."); },
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.alunoId) { toast.error("Selecione um aluno."); return; }
    createMutation.mutate({
      data: {
        alunoId: parseInt(form.alunoId),
        tipo: form.tipo as "Atestado" | "Declaracao_Trabalho" | "Licenca_Maternidade",
        dataEntrega: form.dataEntrega,
        dataInicioPeriodo: form.dataInicioPeriodo,
        dataFimPeriodo: form.dataFimPeriodo,
        observacao: form.observacao || undefined,
      },
    });
  };

  const handleAprovar = (id: number) => {
    statusMutation.mutate({ id, data: { status: "Aprovado" } });
  };
  const handleRejeitar = (id: number) => {
    statusMutation.mutate({ id, data: { status: "Rejeitado", observacao: rejectObs || undefined } });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documentos</h1>
          <p className="text-slate-500 text-sm mt-0.5">Atestados, declarações e justificativas</p>
        </div>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-[#0A192F] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" /> Registrar Documento
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-5">
        {[
          { key: "pendentes", label: `Pendentes${pendentesCount?.count ? ` (${pendentesCount.count})` : ""}` },
          { key: "todos", label: "Todos" },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setTab(key as "pendentes" | "todos")}
            className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
              tab === key
                ? "border-cyan-400 text-cyan-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-12 bg-slate-50 rounded animate-pulse" />)}
          </div>
        ) : !documentos?.length ? (
          <div className="text-center py-16 text-slate-400">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Nenhum documento encontrado.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="px-5 py-3">Aluno</th>
                <th className="px-5 py-3">Tipo</th>
                <th className="px-5 py-3">Período</th>
                <th className="px-5 py-3">Entregue em</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documentos.map((doc) => (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3">
                    <p className="font-medium text-slate-800">{doc.alunoNome}</p>
                    <p className="text-xs text-slate-400">{doc.alunoCurso}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-600">{formatTipo(doc.tipo)}</td>
                  <td className="px-5 py-3 text-slate-500">
                    {formatDate(doc.dataInicioPeriodo)} a {formatDate(doc.dataFimPeriodo)}
                  </td>
                  <td className="px-5 py-3 text-slate-500">{formatDate(doc.dataEntrega)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_MAP[doc.status] ?? "bg-slate-100 text-slate-600"}`}>
                      {doc.status}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    {doc.status === "Pendente" && (
                      <button
                        onClick={() => setAnalyzeDoc({ id: doc.id, alunoNome: doc.alunoNome ?? "", tipo: doc.tipo, dataInicioPeriodo: doc.dataInicioPeriodo, dataFimPeriodo: doc.dataFimPeriodo, observacao: doc.observacao })}
                        className="px-3 py-1.5 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                      >
                        Analisar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">Registrar Documento</h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Aluno</label>
                <select
                  required
                  value={form.alunoId}
                  onChange={(e) => setForm({ ...form, alunoId: e.target.value })}
                  className="input-base w-full"
                >
                  <option value="">Selecione o aluno...</option>
                  {alunos?.map((a) => (
                    <option key={a.id} value={a.id}>{a.nomeCompleto} — {a.curso}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Tipo de Documento</label>
                <select
                  value={form.tipo}
                  onChange={(e) => setForm({ ...form, tipo: e.target.value })}
                  className="input-base w-full"
                >
                  {TIPOS.map((t) => <option key={t} value={t}>{formatTipo(t)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Data de Entrega</label>
                <input
                  type="date"
                  required
                  value={form.dataEntrega}
                  onChange={(e) => setForm({ ...form, dataEntrega: e.target.value })}
                  className="input-base w-full"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Início do Período</label>
                  <input
                    type="date"
                    required
                    value={form.dataInicioPeriodo}
                    onChange={(e) => setForm({ ...form, dataInicioPeriodo: e.target.value })}
                    className="input-base w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">Fim do Período</label>
                  <input
                    type="date"
                    required
                    value={form.dataFimPeriodo}
                    onChange={(e) => setForm({ ...form, dataFimPeriodo: e.target.value })}
                    className="input-base w-full"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Observação</label>
                <textarea
                  value={form.observacao}
                  onChange={(e) => setForm({ ...form, observacao: e.target.value })}
                  className="input-base w-full resize-none h-20"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModalOpen(false)} className="flex-1 border border-slate-200 text-slate-700 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors">
                  Cancelar
                </button>
                <button type="submit" disabled={createMutation.isPending} className="flex-1 bg-cyan-400 hover:bg-cyan-300 text-[#0A192F] font-semibold rounded-lg py-2.5 text-sm disabled:opacity-60 transition-colors">
                  {createMutation.isPending ? "Registrando..." : "Registrar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Analyze Modal */}
      {analyzeDoc && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-slate-900">Analisar Documento</h2>
              <button onClick={() => setAnalyzeDoc(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-3 mb-5">
              <InfoRow label="Aluno" value={analyzeDoc.alunoNome} />
              <InfoRow label="Tipo" value={formatTipo(analyzeDoc.tipo)} />
              <InfoRow label="Período" value={`${formatDate(analyzeDoc.dataInicioPeriodo)} a ${formatDate(analyzeDoc.dataFimPeriodo)}`} />
              {analyzeDoc.observacao && <InfoRow label="Observação" value={analyzeDoc.observacao} />}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Observação da Secretaria</label>
              <textarea
                value={rejectObs}
                onChange={(e) => setRejectObs(e.target.value)}
                placeholder="Observação ao rejeitar (opcional)..."
                className="input-base w-full resize-none h-20 mb-4"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleRejeitar(analyzeDoc.id)}
                disabled={statusMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-semibold rounded-lg py-2.5 text-sm disabled:opacity-60 transition-colors"
              >
                <XCircle className="w-4 h-4" /> Rejeitar
              </button>
              <button
                onClick={() => handleAprovar(analyzeDoc.id)}
                disabled={statusMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-lg py-2.5 text-sm disabled:opacity-60 transition-colors"
              >
                <CheckCircle className="w-4 h-4" /> Aprovar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start gap-4">
      <span className="text-xs text-slate-400 font-medium w-20 flex-shrink-0 pt-0.5">{label}</span>
      <span className="text-sm text-slate-800">{value}</span>
    </div>
  );
}
