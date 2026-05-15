import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, ToggleLeft, ToggleRight, Download } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { exportRelatorioXlsx } from "@/utils/export";
import type { Aprovado } from "../PainelCaptacao";

export default function TabAprovados() {
  const qc = useQueryClient();

  const { data: aprovados = [], isLoading } = useQuery<Aprovado[]>({
    queryKey: ["vc-aprovados"],
    queryFn: () => apiFetch("/api/vestibular/aprovados"),
  });

  const toggle = useMutation({
    mutationFn: ({ id, matriculado }: { id: number; matriculado: boolean }) =>
      apiFetch(`/api/vestibular/aprovados/${id}`, { method: "PATCH", body: JSON.stringify({ matriculado }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vc-aprovados"] }); toast.success("Atualizado"); },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const excluir = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/vestibular/aprovados/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vc-aprovados"] }); toast.success("Removido"); },
    onError: () => toast.error("Erro ao remover"),
  });

  const matriculados = aprovados.filter(a => a.matriculado).length;

  function exportar() {
    exportRelatorioXlsx("Aprovados Vestibular 2026/2",
      ["Nome", "Curso", "Turno", "Matriculado"],
      aprovados.map(a => [a.nome, a.curso, a.turno ?? "—", a.matriculado ? "Sim" : "Não"]),
      "Vestibular_Aprovados.xlsx"
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex gap-4 text-sm text-slate-400">
          <span>Total: <span className="text-white font-semibold">{aprovados.length}</span></span>
          <span>Matriculados: <span className="text-cyan-400 font-semibold">{matriculados}</span></span>
          <span>Pendentes: <span className="text-amber-400 font-semibold">{aprovados.length - matriculados}</span></span>
        </div>
        <button onClick={exportar} className="flex items-center gap-1.5 px-3 py-2 text-sm bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10 transition-colors">
          <Download className="w-4 h-4" /> Exportar
        </button>
      </div>

      <div className="bg-[#1A2540] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Carregando...</div>
          ) : aprovados.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Nenhum aprovado cadastrado.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Nome", "Curso", "Turno", "Matriculado", "Ações"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white/[0.02]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {aprovados.map(a => (
                  <tr key={a.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{a.nome}</td>
                    <td className="px-4 py-3 text-slate-300">{a.curso}</td>
                    <td className="px-4 py-3 text-slate-300">{a.turno ?? "—"}</td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggle.mutate({ id: a.id, matriculado: !a.matriculado })}
                        disabled={toggle.isPending}
                        className="flex items-center gap-1.5 transition-colors"
                      >
                        {a.matriculado
                          ? <><ToggleRight className="w-5 h-5 text-cyan-400" /><span className="text-xs text-cyan-400">Sim</span></>
                          : <><ToggleLeft  className="w-5 h-5 text-slate-500" /><span className="text-xs text-slate-500">Não</span></>
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { if (confirm(`Remover ${a.nome}?`)) excluir.mutate(a.id); }}
                        className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
