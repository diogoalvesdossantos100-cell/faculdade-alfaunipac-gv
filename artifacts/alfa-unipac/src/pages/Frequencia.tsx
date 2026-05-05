import { useState, useEffect } from "react";
import {
  useListTurmas,
  useGetTurmaAlunos,
  useListChamadas,
  useSaveChamada,
  getListChamadasQueryKey,
  getGetTurmaAlunosQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { ClipboardCheck, Save, CheckCircle, XCircle, Clock } from "lucide-react";
import { toast } from "sonner";

type PresencaStatus = "Presente" | "Ausente" | "Justificado";

interface RegistroLine {
  alunoId: number;
  status: PresencaStatus;
  tipoJustificativa?: string;
}

const JUSTIFICATIVAS = ["Atestado", "Declaracao_Trabalho", "Licenca_Maternidade", "Outro"];

function formatLabel(j: string) {
  return j.replace(/_/g, " ");
}

export default function Frequencia() {
  const qc = useQueryClient();
  const [turmaId, setTurmaId] = useState<number | null>(null);
  const [data, setData] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });
  const [registros, setRegistros] = useState<Record<number, RegistroLine>>({});
  const [saved, setSaved] = useState(false);

  const { data: turmas } = useListTurmas();
  const { data: alunosDaTurma } = useGetTurmaAlunos(turmaId ?? 0, {
    query: { enabled: !!turmaId, queryKey: getGetTurmaAlunosQueryKey(turmaId ?? 0) },
  });
  const chamadasParams = { turmaId: turmaId ?? undefined, data: data || undefined };
  const { data: chamadasExistentes } = useListChamadas(
    chamadasParams,
    { query: { enabled: !!turmaId && !!data, queryKey: getListChamadasQueryKey(chamadasParams) } }
  );

  const saveMutation = useSaveChamada({
    mutation: {
      onSuccess(result) {
        toast.success(`Chamada salva! ${result.saved} registros salvos.`);
        qc.invalidateQueries({ queryKey: getListChamadasQueryKey() });
        setSaved(true);
      },
      onError() { toast.error("Erro ao salvar chamada."); },
    },
  });

  // Pre-fill from existing chamadas
  useEffect(() => {
    if (chamadasExistentes?.length && alunosDaTurma?.length) {
      const map: Record<number, RegistroLine> = {};
      for (const aluno of alunosDaTurma) {
        const chamada = chamadasExistentes.find((c: { alunoId: number }) => c.alunoId === aluno.id);
        if (chamada) {
          const status: PresencaStatus = chamada.presente
            ? "Presente"
            : chamada.justificada
            ? "Justificado"
            : "Ausente";
          map[aluno.id] = {
            alunoId: aluno.id,
            status,
            tipoJustificativa: chamada.tipoJustificativa ?? undefined,
          };
        } else {
          map[aluno.id] = { alunoId: aluno.id, status: "Presente" };
        }
      }
      setRegistros(map);
      setSaved(false);
    } else if (alunosDaTurma?.length) {
      const map: Record<number, RegistroLine> = {};
      for (const aluno of alunosDaTurma) {
        map[aluno.id] = { alunoId: aluno.id, status: "Presente" };
      }
      setRegistros(map);
      setSaved(false);
    }
  }, [chamadasExistentes, alunosDaTurma]);

  const setStatus = (alunoId: number, status: PresencaStatus) => {
    setRegistros((prev) => ({ ...prev, [alunoId]: { ...prev[alunoId], alunoId, status } }));
    setSaved(false);
  };

  const setJustificativa = (alunoId: number, tipo: string) => {
    setRegistros((prev) => ({ ...prev, [alunoId]: { ...prev[alunoId], tipoJustificativa: tipo } }));
    setSaved(false);
  };

  const handleSave = () => {
    if (!turmaId || !data) return;
    const regs = Object.values(registros).map((r) => ({
      alunoId: r.alunoId,
      presente: r.status === "Presente",
      justificada: r.status === "Justificado",
      tipoJustificativa: r.status === "Justificado" ? (r.tipoJustificativa ?? "Outro") : undefined,
    }));
    saveMutation.mutate({ data: { turmaId, data, registros: regs } });
  };

  const presentes = Object.values(registros).filter((r) => r.status === "Presente").length;
  const ausentes = Object.values(registros).filter((r) => r.status === "Ausente").length;
  const justificados = Object.values(registros).filter((r) => r.status === "Justificado").length;

  const dateDisplay = data
    ? `${data.split("-")[2]}/${data.split("-")[1]}/${data.split("-")[0]}`
    : "";

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Frequência</h1>
        <p className="text-slate-500 text-sm mt-0.5">Registro de chamada por turma e data</p>
      </div>

      {/* Step 1+2: Select turma and date */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm mb-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Turma / Disciplina</label>
            <select
              value={turmaId ?? ""}
              onChange={(e) => setTurmaId(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
            >
              <option value="">Selecione uma turma...</option>
              {turmas?.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.disciplinaNome} — {t.curso} ({t.periodo})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Data da Aula</label>
            <input
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
            />
          </div>
        </div>
      </div>

      {/* Roster */}
      {turmaId && alunosDaTurma && alunosDaTurma.length > 0 ? (
        <>
          {/* Summary */}
          <div className="flex gap-3 mb-4">
            <div className="flex items-center gap-2 bg-green-50 px-3 py-1.5 rounded-lg text-sm text-green-700 font-medium">
              <CheckCircle className="w-4 h-4" /> {presentes} presentes
            </div>
            <div className="flex items-center gap-2 bg-red-50 px-3 py-1.5 rounded-lg text-sm text-red-600 font-medium">
              <XCircle className="w-4 h-4" /> {ausentes} ausentes
            </div>
            <div className="flex items-center gap-2 bg-amber-50 px-3 py-1.5 rounded-lg text-sm text-amber-700 font-medium">
              <Clock className="w-4 h-4" /> {justificados} justificados
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden mb-5">
            <div className="px-5 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-700">
                {alunosDaTurma.length} alunos — {dateDisplay}
              </span>
              {chamadasExistentes && chamadasExistentes.length > 0 && (
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded font-medium">
                  Chamada já registrada para esta data
                </span>
              )}
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide border-b border-slate-200">
                  <th className="px-5 py-3">Aluno</th>
                  <th className="px-5 py-3">Matrícula</th>
                  <th className="px-5 py-3">Presença</th>
                  <th className="px-5 py-3">Justificativa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {alunosDaTurma.map((aluno) => {
                  const reg = registros[aluno.id] ?? { alunoId: aluno.id, status: "Presente" as PresencaStatus };
                  return (
                    <tr key={aluno.id} className={reg.status === "Ausente" ? "bg-red-50/40" : reg.status === "Justificado" ? "bg-amber-50/30" : ""}>
                      <td className="px-5 py-3 font-medium text-slate-800">{aluno.nomeCompleto}</td>
                      <td className="px-5 py-3 font-mono text-xs text-slate-500">{aluno.matricula}</td>
                      <td className="px-5 py-3">
                        <div className="flex gap-1">
                          {(["Presente", "Ausente", "Justificado"] as PresencaStatus[]).map((s) => (
                            <button
                              key={s}
                              onClick={() => setStatus(aluno.id, s)}
                              className={`px-2.5 py-1 rounded text-xs font-medium transition-colors ${
                                reg.status === s
                                  ? s === "Presente"
                                    ? "bg-green-500 text-white"
                                    : s === "Ausente"
                                    ? "bg-red-500 text-white"
                                    : "bg-amber-500 text-white"
                                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                              }`}
                            >
                              {s}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        {reg.status === "Justificado" && (
                          <select
                            value={reg.tipoJustificativa ?? ""}
                            onChange={(e) => setJustificativa(aluno.id, e.target.value)}
                            className="border border-slate-200 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-amber-300"
                          >
                            <option value="">Selecionar tipo...</option>
                            {JUSTIFICATIVAS.map((j) => (
                              <option key={j} value={j}>{formatLabel(j)}</option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleSave}
              disabled={saveMutation.isPending || !data}
              className="flex items-center gap-2 bg-[#0A192F] hover:bg-slate-800 text-white font-semibold px-6 py-2.5 rounded-lg text-sm disabled:opacity-60 transition-colors"
            >
              <Save className="w-4 h-4" />
              {saveMutation.isPending ? "Salvando..." : saved ? "Salvo!" : "Salvar Chamada"}
            </button>
          </div>
        </>
      ) : turmaId ? (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
          <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Nenhum aluno matriculado nesta turma.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 p-8 text-center text-slate-400">
          <ClipboardCheck className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>Selecione uma turma para carregar a lista de alunos.</p>
        </div>
      )}
    </div>
  );
}
