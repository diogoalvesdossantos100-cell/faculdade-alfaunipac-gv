import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Search, Download, CheckCircle, Trash2, Pencil, X, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { exportRelatorioXlsx } from "@/utils/export";
import type { Candidato } from "../PainelCaptacao";

const CURSOS_OFICIAIS = ["Administração", "Nutrição", "Fisioterapia", "Farmácia", "Enfermagem"];
const STATUS_LIST = ["Inscrito", "Aprovado", "Matriculado", "Desistente"];

const STATUS_BADGE: Record<string, string> = {
  Inscrito:    "bg-blue-500/20 text-blue-400 border-blue-500/30",
  Aprovado:    "bg-green-500/20 text-green-400 border-green-500/30",
  Matriculado: "bg-cyan-400/20 text-cyan-400 border-cyan-400/30",
  Desistente:  "bg-red-500/20 text-red-400 border-red-500/30",
};

const inp = "bg-[#0F172A] border border-white/10 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400/30";
const sel = "bg-[#0F172A] border border-white/10 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400";

export default function TabInscritos() {
  const qc = useQueryClient();
  const [search,    setSearch]    = useState("");
  const [filtCurso, setFiltCurso] = useState("");
  const [filtTurno, setFiltTurno] = useState("");
  const [filtConv,  setFiltConv]  = useState("");
  const [filtStatus,setFiltStatus]= useState("");
  const [editando,  setEditando]  = useState<Candidato | null>(null);
  const [novoStatus,setNovoStatus]= useState("");

  const { data: candidatos = [], isLoading } = useQuery<Candidato[]>({
    queryKey: ["vc-candidatos"],
    queryFn: () => apiFetch("/api/vestibular/candidatos"),
  });

  const patchStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      apiFetch(`/api/vestibular/candidatos/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vc-candidatos"] }); toast.success("Status atualizado"); setEditando(null); },
    onError: () => toast.error("Erro ao atualizar"),
  });

  const aprovar = useMutation({
    mutationFn: async (c: Candidato) => {
      await apiFetch(`/api/vestibular/candidatos/${c.id}`, { method: "PATCH", body: JSON.stringify({ status: "Aprovado" }) });
      await apiFetch("/api/vestibular/aprovados", { method: "POST", body: JSON.stringify({ nome: c.nome, curso: c.curso1, turno: c.turno }) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vc-candidatos"] });
      qc.invalidateQueries({ queryKey: ["vc-aprovados"] });
      toast.success("Candidato aprovado e adicionado à lista de aprovados");
    },
    onError: () => toast.error("Erro ao aprovar"),
  });

  const excluir = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/vestibular/candidatos/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vc-candidatos"] }); toast.success("Removido"); },
    onError: () => toast.error("Erro ao remover"),
  });

  const cursos  = [...new Set(candidatos.map(c => c.curso1))].sort();
  const turnos  = [...new Set(candidatos.map(c => c.turno))].sort();
  const convenios = [...new Set(candidatos.map(c => c.convenio))].sort();

  const filtered = candidatos.filter(c =>
    (!search    || c.nome.toLowerCase().includes(search.toLowerCase()) || c.cpf.includes(search) || c.email.toLowerCase().includes(search.toLowerCase())) &&
    (!filtCurso || c.curso1 === filtCurso) &&
    (!filtTurno || c.turno === filtTurno) &&
    (!filtConv  || c.convenio === filtConv) &&
    (!filtStatus|| c.status === filtStatus)
  );

  const foraDosOficiais = filtered.filter(c => !CURSOS_OFICIAIS.includes(c.curso1));

  function exportar() {
    exportRelatorioXlsx("Inscritos Vestibular 2026/2",
      ["Nome", "CPF", "Email", "Telefone", "Convênio", "Curso 1", "Curso 2", "Turno", "Status"],
      filtered.map(c => [c.nome, c.cpf, c.email, c.telefone, c.convenio, c.curso1, c.curso2, c.turno, c.status]),
      "Vestibular_Inscritos.xlsx"
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Filtros */}
      <div className="bg-[#1A2540] border border-white/[0.06] rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nome, CPF ou email..." className={`${inp} pl-9 w-full`} />
          </div>
          <select value={filtCurso}  onChange={e => setFiltCurso(e.target.value)}  className={sel}>
            <option value="">Todos os cursos</option>
            {cursos.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={filtTurno}  onChange={e => setFiltTurno(e.target.value)}  className={sel}>
            <option value="">Todos os turnos</option>
            {turnos.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={filtConv}   onChange={e => setFiltConv(e.target.value)}   className={sel}>
            <option value="">Todos os convênios</option>
            {convenios.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
          <select value={filtStatus} onChange={e => setFiltStatus(e.target.value)} className={sel}>
            <option value="">Todos os status</option>
            {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          {(search || filtCurso || filtTurno || filtConv || filtStatus) && (
            <button onClick={() => { setSearch(""); setFiltCurso(""); setFiltTurno(""); setFiltConv(""); setFiltStatus(""); }}
              className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded border border-white/10">
              Limpar
            </button>
          )}
          <button onClick={exportar} className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10 transition-colors">
            <Download className="w-4 h-4" /> Exportar
          </button>
        </div>
      </div>

      {/* Alerta fora dos cursos oficiais */}
      {foraDosOficiais.length > 0 && (
        <div className="flex items-center gap-3 px-4 py-3 bg-amber-500/10 border border-amber-500/30 rounded-xl">
          <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-300">
            <span className="font-semibold">{foraDosOficiais.length}</span> candidato(s) inscrito(s) em cursos fora da grade oficial do vestibular (na seleção atual)
          </p>
        </div>
      )}

      {/* Tabela */}
      <div className="bg-[#1A2540] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <p className="text-sm text-slate-400">{filtered.length} de {candidatos.length} candidato(s)</p>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Nenhum candidato encontrado.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Nome", "CPF", "Convênio", "1ª Opção", "2ª Opção", "Turno", "Status", "Ações"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider whitespace-nowrap bg-white/[0.02]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white">
                      {c.nome}
                      {!CURSOS_OFICIAIS.includes(c.curso1) && (
                        <span className="ml-1.5 text-[10px] text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">fora</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{c.cpf}</td>
                    <td className="px-4 py-3 text-slate-300 capitalize">{c.convenio}</td>
                    <td className="px-4 py-3 text-slate-300">{c.curso1}</td>
                    <td className="px-4 py-3 text-slate-400">{c.curso2}</td>
                    <td className="px-4 py-3 text-slate-300">{c.turno}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_BADGE[c.status] ?? "border-white/10 text-slate-400"}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {c.status === "Inscrito" && (
                          <button
                            onClick={() => aprovar.mutate(c)}
                            disabled={aprovar.isPending}
                            title="Aprovar"
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs bg-green-500/20 hover:bg-green-500/30 text-green-400 rounded-lg border border-green-500/30 transition-colors disabled:opacity-50"
                          >
                            <CheckCircle className="w-3.5 h-3.5" /> Aprovar
                          </button>
                        )}
                        <button
                          onClick={() => { setEditando(c); setNovoStatus(c.status); }}
                          title="Editar status"
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => { if (confirm(`Remover ${c.nome}?`)) excluir.mutate(c.id); }}
                          title="Excluir"
                          className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal editar status */}
      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
          <div className="bg-[#1A2540] border border-white/10 rounded-2xl p-6 w-96 shadow-2xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-white">Alterar Status</h3>
              <button onClick={() => setEditando(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <p className="text-sm text-slate-400 mb-4 truncate">{editando.nome}</p>
            <div className="mb-5">
              <label className="block text-xs text-slate-400 mb-2">Novo Status</label>
              <select value={novoStatus} onChange={e => setNovoStatus(e.target.value)} className={`${sel} w-full`}>
                {STATUS_LIST.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setEditando(null)} className="flex-1 py-2.5 text-sm text-slate-400 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors">
                Cancelar
              </button>
              <button
                onClick={() => patchStatus.mutate({ id: editando.id, status: novoStatus })}
                disabled={patchStatus.isPending}
                className="flex-1 py-2.5 text-sm font-semibold bg-cyan-400 hover:bg-cyan-300 text-[#0A192F] rounded-xl transition-colors disabled:opacity-50"
              >
                Salvar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
