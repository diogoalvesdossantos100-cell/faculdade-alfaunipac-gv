import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, ToggleLeft, ToggleRight, X } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";

type Curso = { id: number; nome: string; periodo: string; ativo: boolean; createdAt: string };

const inp = "bg-[#0F172A] border border-white/10 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30";

export default function TabGerenciarCursos() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [nome, setNome]         = useState("");
  const [periodo, setPeriodo]   = useState("2026/2");

  const { data: cursos = [], isLoading } = useQuery<Curso[]>({
    queryKey: ["vc-cursos"],
    queryFn: () => apiFetch("/api/vestibular/cursos"),
  });

  const criar = useMutation({
    mutationFn: () => apiFetch("/api/vestibular/cursos", { method: "POST", body: JSON.stringify({ nome, periodo, ativo: true }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vc-cursos"] }); toast.success("Curso criado"); setShowForm(false); setNome(""); },
    onError: () => toast.error("Erro ao criar curso"),
  });

  const toggle = useMutation({
    mutationFn: ({ id, ativo }: { id: number; ativo: boolean }) =>
      apiFetch(`/api/vestibular/cursos/${id}`, { method: "PATCH", body: JSON.stringify({ ativo }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vc-cursos"] }); toast.success("Atualizado"); },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const excluir = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/vestibular/cursos/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vc-cursos"] }); toast.success("Removido"); },
    onError: () => toast.error("Erro ao remover"),
  });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{cursos.length} curso(s) cadastrado(s)</p>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-cyan-400 hover:bg-cyan-300 text-[#0A192F] rounded-xl transition-colors"
        >
          <Plus className="w-4 h-4" /> Novo Curso
        </button>
      </div>

      <div className="bg-[#1A2540] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Carregando...</div>
          ) : cursos.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Nenhum curso cadastrado. Clique em "Novo Curso" para adicionar.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Curso", "Período", "Status", "Ações"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white/[0.02]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {cursos.map(c => (
                  <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{c.nome}</td>
                    <td className="px-4 py-3 text-slate-300">{c.periodo}</td>
                    <td className="px-4 py-3">
                      <button onClick={() => toggle.mutate({ id: c.id, ativo: !c.ativo })} className="flex items-center gap-1.5 transition-colors">
                        {c.ativo
                          ? <><ToggleRight className="w-5 h-5 text-cyan-400" /><span className="text-xs text-cyan-400">Ativo</span></>
                          : <><ToggleLeft  className="w-5 h-5 text-slate-500" /><span className="text-xs text-slate-500">Inativo</span></>
                        }
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => { if (confirm(`Remover "${c.nome}"?`)) excluir.mutate(c.id); }}
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

      {/* Modal criar curso */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#1A2540] border border-white/10 rounded-2xl p-6 w-96 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-white">Novo Curso</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Nome do Curso</label>
                <input value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Administração" className={`${inp} w-full`} />
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Período</label>
                <input value={periodo} onChange={e => setPeriodo(e.target.value)} placeholder="Ex: 2026/2" className={`${inp} w-full`} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 text-sm text-slate-400 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => criar.mutate()}
                disabled={!nome || criar.isPending}
                className="flex-1 py-2.5 text-sm font-semibold bg-cyan-400 hover:bg-cyan-300 text-[#0A192F] rounded-xl transition-colors disabled:opacity-50"
              >
                Criar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
