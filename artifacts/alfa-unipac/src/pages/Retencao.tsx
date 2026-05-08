import React, { useState } from "react";
import {
  useListRetencao,
  getListRetencaoQueryKey,
  useGetRetencaoDetalhe,
  getGetRetencaoDetalheQueryKey,
  useExecutarAcaoRetencao,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../contexts/auth";
import {
  AlertTriangle,
  Users,
  Clock,
  CheckCircle,
  X,
  ChevronRight,
  FileText,
  Phone,
  UserCheck,
  XCircle,
  Send,
  Bell,
  Archive,
  RefreshCw,
  Pen,
  ArrowRight,
  ClipboardList,
  FileDown,
} from "lucide-react";
import { toast } from "sonner";
import { exportFormularioCancelamentoPdf } from "../utils/export";

// ── constants ──────────────────────────────────────────────────────────────

const CURSOS = ["Administração", "Enfermagem", "Farmácia", "Fisioterapia", "Nutrição"];

type TabKey = "todos" | "secretaria" | "retencao" | "coordenacao" | "encerrados";

const TAB_STATUS: Record<TabKey, string[]> = {
  todos: [],
  secretaria: ["Identificado", "Retorno_Confirmado", "Cancelamento_Solicitado", "Assinado", "Enviado_CRM", "Removido_BAP", "HBS_Notificado"],
  retencao: ["Encaminhado", "Em_Contato", "Aguardando_Resposta", "Formulario_Preenchido", "Aguardando_Assinatura"],
  coordenacao: ["Aguardando_Assinatura"],
  encerrados: ["Encerrado", "Reintegrado"],
};

const STATUS_LABELS: Record<string, string> = {
  Identificado: "Identificado",
  Encaminhado: "Encaminhado",
  Em_Contato: "Em Contato",
  Aguardando_Resposta: "Ag. Resposta",
  Retorno_Confirmado: "Retorno Confirmado",
  Cancelamento_Solicitado: "Cancelamento Solicitado",
  Formulario_Preenchido: "Formulário Preenchido",
  Aguardando_Assinatura: "Ag. Assinatura",
  Assinado: "Assinado",
  Enviado_CRM: "Enviado ao CRM",
  Removido_BAP: "Removido da BAP",
  HBS_Notificado: "HBS Notificado",
  Encerrado: "Encerrado",
  Reintegrado: "Reintegrado",
};

// Ordered linear path for stepper (cancelamento branch shown after split)
const STEPPER_MAIN = [
  "Identificado",
  "Encaminhado",
  "Em_Contato",
  "Aguardando_Resposta",
  "Cancelamento_Solicitado",
  "Formulario_Preenchido",
  "Aguardando_Assinatura",
  "Assinado",
  "Enviado_CRM",
  "Removido_BAP",
  "HBS_Notificado",
  "Encerrado",
];

// Terminal statuses not in the main flow
const TERMINAL_STATUSES = ["Reintegrado", "Retorno_Confirmado"];

// ── helpers ────────────────────────────────────────────────────────────────

function formatDate(d: string | null | undefined): string {
  if (!d) return "—";
  const parts = d.split("T")[0].split("-");
  if (parts.length !== 3) return d;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function getStatusColor(status: string): string {
  const map: Record<string, string> = {
    Identificado: "bg-amber-100 text-amber-800 border-amber-300",
    Encaminhado: "bg-blue-100 text-blue-800 border-blue-300",
    Em_Contato: "bg-indigo-100 text-indigo-800 border-indigo-300",
    Aguardando_Resposta: "bg-purple-100 text-purple-800 border-purple-300",
    Retorno_Confirmado: "bg-green-100 text-green-800 border-green-300",
    Cancelamento_Solicitado: "bg-orange-100 text-orange-800 border-orange-300",
    Formulario_Preenchido: "bg-yellow-100 text-yellow-800 border-yellow-300",
    Aguardando_Assinatura: "bg-pink-100 text-pink-800 border-pink-300",
    Assinado: "bg-teal-100 text-teal-800 border-teal-300",
    Enviado_CRM: "bg-cyan-100 text-cyan-800 border-cyan-300",
    Removido_BAP: "bg-slate-100 text-slate-700 border-slate-300",
    HBS_Notificado: "bg-slate-100 text-slate-700 border-slate-300",
    Encerrado: "bg-gray-100 text-gray-600 border-gray-300",
    Reintegrado: "bg-emerald-100 text-emerald-800 border-emerald-300",
  };
  return map[status] ?? "bg-slate-100 text-slate-600 border-slate-300";
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${getStatusColor(status)}`}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ── Stepper ────────────────────────────────────────────────────────────────

function Stepper({ status }: { status: string }) {
  const isTerminal = TERMINAL_STATUSES.includes(status);
  const steps = STEPPER_MAIN;
  const currentIdx = steps.indexOf(status);

  if (isTerminal) {
    return (
      <div className="flex items-center gap-2 py-2">
        <div className="w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
          <CheckCircle className="w-4 h-4 text-white" />
        </div>
        <span className="text-sm font-semibold text-emerald-700">{STATUS_LABELS[status]}</span>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-1">
      <div className="flex items-center min-w-max gap-0">
        {steps.map((step, i) => {
          const isDone = currentIdx > i;
          const isCurrent = currentIdx === i;
          const isFuture = currentIdx < i;
          return (
            <React.Fragment key={step}>
              <div className="flex flex-col items-center gap-1">
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold border-2 transition-all
                    ${isDone ? "bg-cyan-500 border-cyan-500 text-white" : ""}
                    ${isCurrent ? "bg-white border-cyan-500 text-cyan-600 shadow-md shadow-cyan-200" : ""}
                    ${isFuture ? "bg-slate-100 border-slate-300 text-slate-400" : ""}
                  `}
                >
                  {isDone ? <CheckCircle className="w-4 h-4" /> : i + 1}
                </div>
                <span className={`text-[9px] leading-tight text-center max-w-[54px] ${isCurrent ? "text-cyan-700 font-semibold" : isFuture ? "text-slate-400" : "text-slate-600"}`}>
                  {STATUS_LABELS[step]}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-6 flex-shrink-0 mx-0.5 mt-[-14px] ${i < currentIdx ? "bg-cyan-500" : "bg-slate-200"}`} />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ── FaltasBar ──────────────────────────────────────────────────────────────

function FaltasBar({ pct }: { pct: number }) {
  const color = pct > 40 ? "bg-red-500" : "bg-amber-400";
  const textColor = pct > 40 ? "text-red-600 font-bold" : "text-amber-600 font-semibold";
  return (
    <div className="flex items-center gap-2">
      <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden">
        <div className={`h-1.5 rounded-full ${color}`} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
      <span className={`text-xs ${textColor}`}>{pct.toFixed(1)}%</span>
    </div>
  );
}

// ── ActionButton ───────────────────────────────────────────────────────────

function ActionButton({ onClick, icon: Icon, label, variant = "default", disabled = false }: {
  onClick: () => void;
  icon: React.FC<{ className?: string }>;
  label: string;
  variant?: "default" | "success" | "danger" | "warning" | "primary";
  disabled?: boolean;
}) {
  const variants = {
    default: "bg-slate-100 text-slate-700 hover:bg-slate-200",
    success: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200",
    danger: "bg-red-50 text-red-700 hover:bg-red-100 border border-red-200",
    warning: "bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200",
    primary: "bg-cyan-50 text-cyan-700 hover:bg-cyan-100 border border-cyan-200",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50 ${variants[variant]}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {label}
    </button>
  );
}

// ── DetailModal ────────────────────────────────────────────────────────────

function DetailModal({
  retencaoId,
  onClose,
  userRole,
  onActionSuccess,
}: {
  retencaoId: number;
  onClose: () => void;
  userRole: string;
  onActionSuccess: () => void;
}) {
  const qc = useQueryClient();
  const [obs, setObs] = useState("");
  const [motivoCancelamento, setMotivoCancelamento] = useState("");
  const [nomeCoord, setNomeCoord] = useState("");
  const [actionConfirm, setActionConfirm] = useState<string | null>(null);

  const { data: detalhe, isLoading } = useGetRetencaoDetalhe(retencaoId, {
    query: {
      queryKey: getGetRetencaoDetalheQueryKey(retencaoId),
      enabled: true,
    },
  });

  const acaoMutation = useExecutarAcaoRetencao({
    mutation: {
      onSuccess(data) {
        toast.success(`Ação executada: ${STATUS_LABELS[data.status] ?? data.status}`);
        qc.invalidateQueries({ queryKey: getListRetencaoQueryKey() });
        qc.invalidateQueries({ queryKey: getGetRetencaoDetalheQueryKey(retencaoId) });
        setActionConfirm(null);
        setObs("");
        setMotivoCancelamento("");
        setNomeCoord("");
        onActionSuccess();
      },
      onError(err: unknown) {
        const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Erro ao executar ação.";
        toast.error(msg);
      },
    },
  });

  type AcaoKey = "encaminhar" | "registrar_contato" | "aguardar_resposta" | "retorno_confirmado" | "cancelamento_solicitado" | "preencher_formulario" | "encaminhar_assinatura" | "assinar" | "retirar_crm" | "remover_bap" | "notificar_hbs" | "encerrar" | "reintegrar";

  const execAcao = (acao: AcaoKey, extra?: { observacao?: string; motivoCancelamento?: string; nomeCoordinadora?: string }) => {
    acaoMutation.mutate({
      id: retencaoId,
      data: { acao, ...extra },
    });
  };

  if (isLoading || !detalhe) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-8 w-full max-w-3xl mx-4">
          <div className="animate-pulse space-y-4">
            <div className="h-6 bg-slate-100 rounded w-1/3" />
            <div className="h-4 bg-slate-100 rounded w-2/3" />
            <div className="h-20 bg-slate-100 rounded" />
          </div>
        </div>
      </div>
    );
  }

  const status = detalhe.status;
  const isSecretaria = userRole === "Secretaria" || userRole === "Admin";
  const isRetencao = userRole === "Retencao" || userRole === "Admin";
  const isCoordenador = userRole === "Coordenador" || userRole === "Admin";

  // Determine available actions
  const actions: React.JSX.Element[] = [];

  if (isSecretaria) {
    if (status === "Identificado") {
      actions.push(
        <ActionButton key="encaminhar" onClick={() => setActionConfirm("encaminhar")}
          icon={Send} label="Encaminhar para Retenção" variant="primary" />
      );
    }
    if (status === "Retorno_Confirmado") {
      actions.push(
        <ActionButton key="reintegrar" onClick={() => setActionConfirm("reintegrar")}
          icon={UserCheck} label="Reintegrar Aluno" variant="success" />
      );
    }
    if (status === "Cancelamento_Solicitado") {
      actions.push(
        <ActionButton key="form" onClick={() => setActionConfirm("preencher_formulario")}
          icon={FileText} label="Preencher Formulário" variant="warning" />
      );
    }
    if (status === "Assinado") {
      actions.push(
        <ActionButton key="crm" onClick={() => execAcao("retirar_crm")}
          icon={Archive} label="Retirar do CRM" variant="warning" disabled={acaoMutation.isPending} />
      );
    }
    if (status === "Enviado_CRM") {
      actions.push(
        <ActionButton key="bap" onClick={() => setActionConfirm("remover_bap")}
          icon={XCircle} label="Remover da BAP" variant="danger" />
      );
    }
    if (status === "Removido_BAP") {
      actions.push(
        <ActionButton key="hbs" onClick={() => execAcao("notificar_hbs")}
          icon={Bell} label="Notificar HBS" variant="warning" disabled={acaoMutation.isPending} />
      );
    }
    if (status === "HBS_Notificado") {
      actions.push(
        <ActionButton key="encerrar" onClick={() => setActionConfirm("encerrar")}
          icon={CheckCircle} label="Encerrar Processo" variant="success" />
      );
    }
  }

  if (isRetencao) {
    if (status === "Encaminhado") {
      actions.push(
        <ActionButton key="contato" onClick={() => execAcao("registrar_contato")}
          icon={Phone} label="Registrar Contato" variant="primary" disabled={acaoMutation.isPending} />
      );
    }
    if (status === "Em_Contato") {
      actions.push(
        <ActionButton key="aguardar" onClick={() => execAcao("aguardar_resposta")}
          icon={Clock} label="Aguardar Resposta" variant="default" disabled={acaoMutation.isPending} />
      );
    }
    if (status === "Aguardando_Resposta") {
      actions.push(
        <ActionButton key="retorno" onClick={() => execAcao("retorno_confirmado")}
          icon={UserCheck} label="Retorno Confirmado" variant="success" disabled={acaoMutation.isPending} />
      );
      actions.push(
        <ActionButton key="cancel" onClick={() => setActionConfirm("cancelamento_solicitado")}
          icon={XCircle} label="Cancelamento Solicitado" variant="danger" />
      );
    }
    if (status === "Formulario_Preenchido") {
      actions.push(
        <ActionButton key="assinatura" onClick={() => execAcao("encaminhar_assinatura")}
          icon={ChevronRight} label="Encaminhar para Assinatura" variant="primary" disabled={acaoMutation.isPending} />
      );
    }
  }

  if (isCoordenador && status === "Aguardando_Assinatura") {
    actions.push(
      <ActionButton key="assinar" onClick={() => setActionConfirm("assinar")}
        icon={Pen} label="Assinar Documento" variant="primary" />
    );
  }

  // Confirm modals
  const ConfirmModal = () => {
    if (!actionConfirm) return null;

    const titles: Record<string, string> = {
      encaminhar: "Encaminhar para Retenção",
      preencher_formulario: "Preencher Formulário de Cancelamento",
      cancelamento_solicitado: "Registrar Cancelamento Solicitado",
      remover_bap: "Remover da BAP",
      encerrar: "Encerrar Processo",
      reintegrar: "Reintegrar Aluno",
      assinar: "Assinar Documento",
    };

    const handleConfirm = () => {
      if (actionConfirm === "preencher_formulario") {
        if (!motivoCancelamento.trim()) { toast.error("Informe o motivo do cancelamento."); return; }
        execAcao("preencher_formulario", { observacao: obs || undefined, motivoCancelamento });
      } else if (actionConfirm === "assinar") {
        if (!nomeCoord.trim()) { toast.error("Informe o nome da coordenadora."); return; }
        execAcao("assinar", { observacao: obs || undefined, nomeCoordinadora: nomeCoord });
      } else if (actionConfirm === "cancelamento_solicitado") {
        if (!motivoCancelamento.trim()) { toast.error("Informe o motivo declarado pelo aluno."); return; }
        execAcao("cancelamento_solicitado", { observacao: obs || undefined, motivoCancelamento });
      } else {
        execAcao(actionConfirm as AcaoKey, { observacao: obs || undefined });
      }
    };

    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4" onClick={() => setActionConfirm(null)}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-slate-900">{titles[actionConfirm] ?? actionConfirm}</h3>
            <button onClick={() => setActionConfirm(null)} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          </div>

          {actionConfirm === "preencher_formulario" && (
            <div className="mb-3">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Motivo do cancelamento *</label>
              <textarea
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                placeholder="Motivo declarado pelo aluno..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              />
            </div>
          )}

          {actionConfirm === "cancelamento_solicitado" && (
            <div className="mb-3">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Motivo declarado pelo aluno *</label>
              <textarea
                value={motivoCancelamento}
                onChange={(e) => setMotivoCancelamento(e.target.value)}
                placeholder="Ex: problemas financeiros, mudança de cidade..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              />
            </div>
          )}

          {actionConfirm === "assinar" && (
            <>
              <div className="bg-slate-50 rounded-lg p-3 mb-3 text-xs text-slate-600 space-y-1">
                <p><span className="font-medium">Aluno:</span> {detalhe.alunoNome}</p>
                <p><span className="font-medium">Matrícula:</span> {detalhe.alunoMatricula}</p>
                <p><span className="font-medium">Curso:</span> {detalhe.alunoCurso}</p>
                <p><span className="font-medium">Motivo:</span> {detalhe.motivoCancelamento ?? "—"}</p>
              </div>
              <div className="mb-3">
                <label className="text-xs font-medium text-slate-600 mb-1 block">Nome da Coordenadora *</label>
                <input
                  type="text"
                  value={nomeCoord}
                  onChange={(e) => setNomeCoord(e.target.value)}
                  placeholder="Nome completo da coordenadora pedagógica"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
                />
              </div>
            </>
          )}

          {actionConfirm === "remover_bap" && (
            <p className="text-sm text-slate-500 mb-4">
              O aluno <strong>{detalhe.alunoNome}</strong> será removido da BAP do mês corrente automaticamente.
              Um alerta será gerado para a Secretaria notificar o Hospital Bom Samaritano.
            </p>
          )}

          {actionConfirm === "reintegrar" && (
            <p className="text-sm text-slate-500 mb-4">
              O aluno <strong>{detalhe.alunoNome}</strong> decidiu continuar. Seu status voltará para <strong>Ativo</strong>.
            </p>
          )}

          {actionConfirm === "encerrar" && (
            <p className="text-sm text-slate-500 mb-4">
              O processo de cancelamento de <strong>{detalhe.alunoNome}</strong> será encerrado.
            </p>
          )}

          {!["remover_bap", "reintegrar", "encerrar"].includes(actionConfirm) && (
            <div className="mb-4">
              <label className="text-xs font-medium text-slate-600 mb-1 block">Observação (opcional)</label>
              <textarea
                value={obs}
                onChange={(e) => setObs(e.target.value)}
                placeholder="Observações adicionais..."
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm resize-none h-16 focus:outline-none focus:ring-2 focus:ring-cyan-300"
              />
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setActionConfirm(null)} className="flex-1 border border-slate-200 text-slate-700 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-50">
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={acaoMutation.isPending}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg py-2.5 text-sm disabled:opacity-60"
            >
              {acaoMutation.isPending ? "Processando..." : "Confirmar"}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 p-4 overflow-y-auto" onClick={onClose}>
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl my-6" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-100">
            <div>
              <h2 className="text-lg font-bold text-slate-900">{detalhe.alunoNome}</h2>
              <p className="text-sm text-slate-500">{detalhe.alunoCurso} — Matrícula {detalhe.alunoMatricula}</p>
            </div>
            <button onClick={onClose} aria-label="Fechar" className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Stepper */}
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Etapas do processo</p>
              <Stepper status={status} />
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Etapa atual", value: <StatusBadge status={status} /> },
                { label: "% Faltas", value: <FaltasBar pct={detalhe.percentualFaltas} /> },
                { label: "Responsável", value: <span className="text-sm text-slate-700 font-medium">{detalhe.responsavel === "Retencao" ? "Retenção" : detalhe.responsavel === "Coordenacao" ? "Coordenação" : detalhe.responsavel}</span> },
                { label: "Mensalidade", value: <span className="text-sm font-semibold text-slate-800">R$ {detalhe.alunoValorMensalidade.toFixed(2).replace(".", ",")}</span> },
              ].map(({ label, value }) => (
                <div key={label} className="bg-slate-50 rounded-xl p-3">
                  <p className="text-xs text-slate-400 mb-1">{label}</p>
                  {value}
                </div>
              ))}
            </div>

            {/* Turma */}
            {detalhe.periodo && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Período</p>
                <div className="bg-slate-50 rounded-lg px-4 py-2.5 text-sm font-medium text-slate-700">
                  {detalhe.periodo}
                </div>
              </div>
            )}

            {/* Motivo cancelamento + botão PDF formulário */}
            {detalhe.motivoCancelamento && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-1">Motivo do Cancelamento</p>
                    <p className="text-sm text-orange-800">{detalhe.motivoCancelamento}</p>
                  </div>
                  {["Formulario_Preenchido","Aguardando_Assinatura","Assinado","Enviado_CRM","Removido_BAP","HBS_Notificado","Encerrado"].includes(detalhe.status) && (
                    <button
                      onClick={() => {
                        exportFormularioCancelamentoPdf({
                          alunoNome: detalhe.alunoNome,
                          alunoMatricula: detalhe.alunoMatricula,
                          alunoCurso: detalhe.alunoCurso,
                          motivoCancelamento: detalhe.motivoCancelamento,
                          dataDecisaoAluno: detalhe.dataDecisaoAluno,
                          nomeCoordinadora: detalhe.nomeCoordinadora,
                          dataAssinatura: detalhe.dataAssinatura,
                        });
                        toast.success("Formulário gerado.");
                      }}
                      className="flex items-center gap-1.5 flex-shrink-0 bg-white border border-orange-200 text-orange-700 hover:bg-orange-100 text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                      title="Baixar formulário de cancelamento em PDF"
                    >
                      <FileDown className="w-3.5 h-3.5" />
                      PDF
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Coordenadora */}
            {detalhe.nomeCoordinadora && (
              <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-center gap-3">
                <Pen className="w-4 h-4 text-teal-600 flex-shrink-0" />
                <div>
                  <p className="text-xs font-semibold text-teal-600 uppercase tracking-wide">Assinado por</p>
                  <p className="text-sm text-teal-800 font-medium">{detalhe.nomeCoordinadora}</p>
                  {detalhe.dataAssinatura && <p className="text-xs text-teal-600">{formatDate(detalhe.dataAssinatura)}</p>}
                </div>
              </div>
            )}

            {/* Actions */}
            {actions.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">Ações disponíveis</p>
                <div className="flex flex-wrap gap-2">{actions}</div>
              </div>
            )}

            {/* Timeline */}
            {detalhe.timeline.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-3">Linha do tempo</p>
                <div className="space-y-3">
                  {[...detalhe.timeline].reverse().map((log) => (
                    <div key={log.id} className="flex items-start gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-cyan-400 mt-1.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className="font-medium text-slate-700">{log.acao}</p>
                          <p className="text-xs text-slate-400 whitespace-nowrap">{formatDate(log.createdAt?.toString().split("T")[0])}</p>
                        </div>
                        {log.observacao && <p className="text-xs text-slate-500 mt-0.5">{log.observacao}</p>}
                        {log.realizadoPor && <p className="text-xs text-slate-400 mt-0.5 italic">{log.realizadoPor}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      <ConfirmModal />
    </>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────

export default function Retencao() {
  const { user } = useAuth();
  const userRole = user?.role ?? "Secretaria";

  const [activeTab, setActiveTab] = useState<TabKey>("todos");
  const [cursoFilter, setCursoFilter] = useState("");
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const { data: retencao, isLoading } = useListRetencao(
    cursoFilter ? { curso: cursoFilter } : {},
    { query: { queryKey: getListRetencaoQueryKey(cursoFilter ? { curso: cursoFilter } : {}) } }
  );

  // Filtered by tab
  const filtered = (retencao ?? []).filter((r) => {
    if (activeTab === "todos") return true;
    const allowed = TAB_STATUS[activeTab];
    return allowed.includes(r.status);
  });

  // Card counts
  const emAcompanhamento = (retencao ?? []).filter((r) => ["Encaminhado", "Em_Contato", "Aguardando_Resposta"].includes(r.status)).length;
  const criticos = (retencao ?? []).filter((r) => r.percentualFaltas > 40).length;
  const aguardandoAssinatura = (retencao ?? []).filter((r) => r.status === "Aguardando_Assinatura").length;
  const encerradosMes = (retencao ?? []).filter((r) => ["Encerrado", "Reintegrado"].includes(r.status)).length;

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: "todos", label: "Todos", count: (retencao ?? []).length },
    { key: "secretaria", label: "Secretaria", count: (retencao ?? []).filter((r) => TAB_STATUS.secretaria.includes(r.status)).length },
    { key: "retencao", label: "Retenção", count: (retencao ?? []).filter((r) => TAB_STATUS.retencao.includes(r.status)).length },
    { key: "coordenacao", label: "Coordenação", count: aguardandoAssinatura },
    { key: "encerrados", label: "Encerrados", count: encerradosMes },
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Retenção</h1>
        <p className="text-slate-500 text-sm mt-0.5">Gestão de alunos com excesso de faltas — fluxo completo de acompanhamento</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Em acompanhamento", value: emAcompanhamento, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Críticos (>40% faltas)", value: criticos, icon: AlertTriangle, color: "text-red-600", bg: "bg-red-50" },
          { label: "Ag. assinatura coord.", value: aguardandoAssinatura, icon: Pen, color: "text-pink-600", bg: "bg-pink-50" },
          { label: "Encerrados", value: encerradosMes, icon: CheckCircle, color: "text-emerald-600", bg: "bg-emerald-50" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-200 p-4 flex items-center gap-4 shadow-sm">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
              <Icon className={`w-5 h-5 ${color}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
              <p className="text-xs text-slate-500 leading-tight">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters + Tabs */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-1">
        {/* Tabs */}
        <div className="flex items-center border-b border-slate-100 px-4 gap-1 overflow-x-auto">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors -mb-px ${
                activeTab === key
                  ? "border-cyan-500 text-cyan-600"
                  : "border-transparent text-slate-500 hover:text-slate-700"
              }`}
            >
              {label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === key ? "bg-cyan-100 text-cyan-700" : "bg-slate-100 text-slate-500"}`}>
                {count}
              </span>
            </button>
          ))}

          <div className="ml-auto py-2">
            <select
              value={cursoFilter}
              onChange={(e) => setCursoFilter(e.target.value)}
              className="border border-slate-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              <option value="">Todos os cursos</option>
              {CURSOS.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {/* Table */}
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-slate-50 rounded animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">Nenhum aluno nesta aba.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">
                <th className="px-5 py-3">Aluno</th>
                <th className="px-5 py-3">Curso</th>
                <th className="px-5 py-3">% Faltas</th>
                <th className="px-5 py-3">Etapa</th>
                <th className="px-5 py-3">Responsável</th>
                <th className="px-5 py-3">Data flagrado</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map((r) => (
                <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-800">{r.alunoNome}</td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{r.alunoCurso}</td>
                  <td className="px-5 py-3"><FaltasBar pct={r.percentualFaltas} /></td>
                  <td className="px-5 py-3"><StatusBadge status={r.status} /></td>
                  <td className="px-5 py-3 text-xs text-slate-500">
                    {r.responsavel === "Retencao" ? "Retenção" : r.responsavel === "Coordenacao" ? "Coordenação" : r.responsavel}
                  </td>
                  <td className="px-5 py-3 text-xs text-slate-400">{formatDate(r.createdAt?.toString().split("T")[0])}</td>
                  <td className="px-5 py-3">
                    <button
                      onClick={() => setSelectedId(r.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium bg-cyan-50 text-cyan-700 hover:bg-cyan-100 transition-colors"
                    >
                      Ver <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Detail modal */}
      {selectedId !== null && (
        <DetailModal
          retencaoId={selectedId}
          onClose={() => setSelectedId(null)}
          userRole={userRole}
          onActionSuccess={() => {}}
        />
      )}
    </div>
  );
}
