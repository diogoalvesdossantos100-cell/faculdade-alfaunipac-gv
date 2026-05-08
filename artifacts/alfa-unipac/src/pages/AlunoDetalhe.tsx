import { useParams, useLocation } from "wouter";
import { useGetAluno, useGetFrequenciaAluno, useListDocumentos } from "@workspace/api-client-react";
import { ArrowLeft, AlertTriangle, CheckCircle } from "lucide-react";

function formatDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function formatCurrency(val: number): string {
  return val.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function AlunoDetalhe() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const alunoId = parseInt(id ?? "0");

  const { data: aluno, isLoading } = useGetAluno(alunoId);
  const { data: frequencias } = useGetFrequenciaAluno(alunoId);
  const { data: documentos } = useListDocumentos({ alunoId: alunoId });

  if (isLoading) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <div className="h-8 bg-slate-100 rounded w-48 mb-6 animate-pulse" />
        <div className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse h-48" />
      </div>
    );
  }

  if (!aluno) {
    return (
      <div className="p-6">
        <p className="text-slate-500">Aluno não encontrado.</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={() => navigate("/alunos")}
        className="flex items-center gap-2 text-slate-500 hover:text-slate-800 text-sm mb-5 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Voltar para Alunos
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{aluno.nomeCompleto}</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Matrícula: <span className="font-mono">{aluno.matricula}</span> — {aluno.curso}
          </p>
        </div>
        {aluno.emRetencao && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium px-4 py-2 rounded-lg">
            <AlertTriangle className="w-4 h-4" />
            Em Retenção
          </div>
        )}
      </div>

      {/* Info card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Dados Pessoais</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <InfoItem label="CPF" value={aluno.cpf} />
          <InfoItem label="Turno" value={aluno.turno} />
          <InfoItem label="Status" value={aluno.status} />
          <InfoItem label="Mensalidade" value={formatCurrency(aluno.valorMensalidade)} />
          <InfoItem label="Financiador" value={aluno.financiador} />
          <InfoItem label="Cadastrado em" value={formatDate(aluno.createdAt)} />
        </div>
      </div>

      {/* Frequência */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Frequência por Turma</h2>
        {!frequencias?.length ? (
          <p className="text-slate-400 text-sm">Sem registros de frequência.</p>
        ) : (
          <div className="space-y-3">
            {frequencias.map((f) => {
              const pct = f.percentualFaltas ?? 0;
              const emRetencao = pct > 25;
              return (
                <div key={f.turmaId} className="flex items-center gap-4 p-3 rounded-lg bg-slate-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate">{f.turmaNome}</p>
                    <p className="text-xs text-slate-400">{f.periodo}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-slate-500">
                      {f.presencas}/{f.totalAulas} presenças — {f.faltas} faltas
                    </p>
                    <div className="flex items-center gap-1.5 justify-end mt-0.5">
                      <div className={`text-xs font-semibold ${emRetencao ? "text-red-600" : "text-green-700"}`}>
                        {pct.toFixed(1)}% faltas
                      </div>
                      {emRetencao ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                      ) : (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
        <h2 className="text-base font-semibold text-slate-800 mb-4">Documentos</h2>
        {!documentos?.length ? (
          <p className="text-slate-400 text-sm">Nenhum documento registrado.</p>
        ) : (
          <div className="space-y-2">
            {documentos.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {doc.tipo.replace(/_/g, " ")}
                  </p>
                  <p className="text-xs text-slate-400">
                    Entregue em {formatDate(doc.dataEntrega)} · Período: {formatDate(doc.dataInicioPeriodo)} a {formatDate(doc.dataFimPeriodo)}
                  </p>
                </div>
                <DocStatusBadge status={doc.status} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
      <p className="text-sm text-slate-800 font-medium mt-0.5">{value}</p>
    </div>
  );
}

function DocStatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Pendente: "bg-amber-50 text-amber-700",
    Aprovado: "bg-green-50 text-green-700",
    Rejeitado: "bg-red-50 text-red-600",
  };
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${map[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}
