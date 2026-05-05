import React, { useState } from "react";
import {
  useListRetencao,
  getListRetencaoQueryKey,
  useUpdateRetencao,
  useNotificarAluno,
  useGetRetencaoTimeline,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bell, CheckCircle, XCircle, ChevronDown, ChevronUp, X } from "lucide-react";
import { toast } from "sonner";

const CURSOS = ["Administração", "Enfermagem", "Farmácia", "Fisioterapia", "Nutrição"];
const STATUS_OPTS = ["Em_Acompanhamento", "Regularizado", "Reprovado_Faltas"];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Em_Acompanhamento: "bg-amber-50 text-amber-700 border border-amber-200",
    Regularizado: "bg-green-50 text-green-700 border border-green-200",
    Reprovado_Faltas: "bg-red-50 text-red-700 border border-red-200",
  };
  const labels: Record<string, string> = {
    Em_Acompanhamento: "Em Acompanhamento",
    Regularizado: "Regularizado",
    Reprovado_Faltas: "Reprovado por Faltas",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${map[status] ?? "bg-slate-100 text-slate-600"}`}>
      {labels[status] ?? status}
    </span>
  );
}

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  const [y, m, day] = d.split("-");
  return `${day}/${m}/${y}`;
}

function Timeline({ retencaoId }: { retencaoId: number }) {
  const { data: logs, isLoading } = useGetRetencaoTimeline(retencaoId);
  if (isLoading) return <div className="animate-pulse h-12 bg-slate-100 rounded" />;
  if (!logs?.length) return <p className="text-slate-400 text-xs">Sem eventos registrados.</p>;
  return (
    <div className="space-y-2">
      {logs.map((log) => (
        <div key={log.id} className="flex items-start gap-3 text-xs">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-slate-700">{log.acao}</p>
            {log.observacao && <p className="text-slate-500">{log.observacao}</p>}
            <p className="text-slate-400 mt-0.5">{formatDate(log.createdAt?.toString().split("T")[0])}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function Retencao() {
  const qc = useQueryClient();
  const [cursoFilter, setCursoFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [confirmReprov, setConfirmReprov] = useState<number | null>(null);
  const [notifModal, setNotifModal] = useState<number | null>(null);
  const [notifObs, setNotifObs] = useState("");

  const params = {
    ...(cursoFilter ? { curso: cursoFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const { data: retencao, isLoading } = useListRetencao(params);

  const updateMutation = useUpdateRetencao({
    mutation: {
      onSuccess() {
        toast.success("Retenção atualizada.");
        qc.invalidateQueries({ queryKey: getListRetencaoQueryKey() });
        setConfirmReprov(null);
      },
      onError() { toast.error("Erro ao atualizar retenção."); },
    },
  });

  const notifMutation = useNotificarAluno({
    mutation: {
      onSuccess() {
        toast.success("Aluno notificado e evento registrado.");
        qc.invalidateQueries({ queryKey: getListRetencaoQueryKey() });
        setNotifModal(null);
        setNotifObs("");
      },
      onError() { toast.error("Erro ao notificar aluno."); },
    },
  });

  const handleRegularizar = (id: number) => {
    updateMutation.mutate({ id, data: { status: "Regularizado" } });
  };

  const handleReprov = (id: number) => {
    updateMutation.mutate({ id, data: { status: "Reprovado_Faltas" } });
  };

  const handleNotif = () => {
    if (!notifModal) return;
    notifMutation.mutate({ id: notifModal, data: { observacao: notifObs } });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Retenção</h1>
        <p className="text-slate-500 text-sm mt-0.5">Alunos com percentual de faltas acima de 25%</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <select
          value={cursoFilter}
          onChange={(e) => setCursoFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
        >
          <option value="">Todos os cursos</option>
          {CURSOS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
        >
          <option value="">Todos os status</option>
          {STATUS_OPTS.map((s) => (
            <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-14 bg-slate-50 rounded animate-pulse" />
            ))}
          </div>
        ) : !retencao?.length ? (
          <div className="text-center py-16 text-slate-400">
            <AlertTriangle className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Nenhum aluno em situação de retenção.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="px-5 py-3">Aluno</th>
                <th className="px-5 py-3">Curso</th>
                <th className="px-5 py-3">Disciplina</th>
                <th className="px-5 py-3">% Faltas</th>
                <th className="px-5 py-3">1ª Notif.</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
                <th className="px-2 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {retencao.map((r) => (
                <React.Fragment key={r.id}>
                  <tr className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-3 font-medium text-slate-800">{r.alunoNome}</td>
                    <td className="px-5 py-3 text-slate-500">{r.alunoCurso}</td>
                    <td className="px-5 py-3 text-slate-600">{r.disciplinaNome}</td>
                    <td className="px-5 py-3">
                      <span className={`font-bold ${r.percentualFaltas > 40 ? "text-red-600" : "text-amber-600"}`}>
                        {r.percentualFaltas?.toFixed(1)}%
                      </span>
                    </td>
                    <td className="px-5 py-3 text-slate-500">{formatDate(r.dataNotificacao)}</td>
                    <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                    <td className="px-5 py-3 text-right">
                      {r.status === "Em_Acompanhamento" && (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => { setNotifModal(r.id); setNotifObs(""); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            <Bell className="w-3.5 h-3.5" /> Notificar
                          </button>
                          <button
                            onClick={() => handleRegularizar(r.id)}
                            disabled={updateMutation.isPending}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium bg-green-50 text-green-700 hover:bg-green-100 transition-colors disabled:opacity-60"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Regularizar
                          </button>
                          <button
                            onClick={() => setConfirmReprov(r.id)}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded text-xs font-medium bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
                          >
                            <XCircle className="w-3.5 h-3.5" /> Reprovar
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="px-2 py-3">
                      <button
                        onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                        className="p-1 rounded hover:bg-slate-100 text-slate-400"
                      >
                        {expandedId === r.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </td>
                  </tr>
                  {expandedId === r.id && (
                    <tr key={`tl-${r.id}`} className="bg-slate-50">
                      <td colSpan={8} className="px-8 py-4">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Histórico</p>
                        <Timeline retencaoId={r.id} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Confirm Reprovar */}
      {confirmReprov !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Reprovar por Faltas</h2>
            <p className="text-slate-500 text-sm mb-6">
              O aluno será reprovado por faltas excessivas e seu status será alterado para "Retido". Esta ação é irreversível.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmReprov(null)} className="flex-1 border border-slate-200 text-slate-700 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => handleReprov(confirmReprov)}
                disabled={updateMutation.isPending}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg py-2.5 text-sm disabled:opacity-60 transition-colors"
              >
                {updateMutation.isPending ? "Reprovando..." : "Confirmar Reprovação"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Notify modal */}
      {notifModal !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-slate-900">Notificar Aluno</h2>
              <button onClick={() => setNotifModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <textarea
              value={notifObs}
              onChange={(e) => setNotifObs(e.target.value)}
              placeholder="Observação (opcional)..."
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-cyan-300 mb-4"
            />
            <div className="flex gap-3">
              <button onClick={() => setNotifModal(null)} className="flex-1 border border-slate-200 text-slate-700 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors">
                Cancelar
              </button>
              <button
                onClick={handleNotif}
                disabled={notifMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg py-2.5 text-sm disabled:opacity-60 transition-colors"
              >
                {notifMutation.isPending ? "Notificando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
