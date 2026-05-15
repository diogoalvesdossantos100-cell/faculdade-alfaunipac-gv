import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { exportRelatorioXlsx } from "@/utils/export";
import type { Pesquisa } from "../types";

const inp = "bg-[#0F172A] border border-white/10 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400";
const sel = "bg-[#0F172A] border border-white/10 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400";

export default function TabPesquisa() {
  const [search,    setSearch]    = useState("");
  const [filtCurso, setFiltCurso] = useState("");

  const { data: pesquisa = [], isLoading } = useQuery<Pesquisa[]>({
    queryKey: ["vc-pesquisa"],
    queryFn: () => apiFetch("/api/vestibular/pesquisa"),
  });

  // Todos os cursos únicos (1ª + 2ª opção) para o dropdown
  const allCursos = [...new Set([
    ...pesquisa.map(p => p.curso).filter((c): c is string => Boolean(c)),
    ...pesquisa.map(p => p.cursoAlternativo).filter((c): c is string => Boolean(c)),
  ])].sort();

  const filtered = pesquisa.filter(p => {
    const matchSearch = !search ||
      (p.nome ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.cpf ?? "").includes(search) ||
      (p.curso ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (p.cursoAlternativo ?? "").toLowerCase().includes(search.toLowerCase());
    const matchCurso = !filtCurso || p.curso === filtCurso || p.cursoAlternativo === filtCurso;
    return matchSearch && matchCurso;
  });

  // Ranking somando 1ª + 2ª opção
  const porcurso = pesquisa.reduce<Record<string, number>>((acc, p) => {
    if (p.curso)             acc[p.curso]             = (acc[p.curso]             ?? 0) + 1;
    if (p.cursoAlternativo)  acc[p.cursoAlternativo]  = (acc[p.cursoAlternativo]  ?? 0) + 1;
    return acc;
  }, {});

  const maxCount = Math.max(...Object.values(porcurso), 1);

  function exportar() {
    exportRelatorioXlsx("Pesquisa de Demanda — AlfaUnipac GV",
      ["Nome", "CPF", "Email", "Curso de Interesse", "Alternativa", "Turno", "Data"],
      filtered.map(p => [
        p.nome ?? "—", p.cpf ?? "—", p.email ?? "—",
        p.curso ?? "—", p.cursoAlternativo ?? "—",
        p.turno ?? "—", p.createdAt?.slice(0, 10) ?? "—",
      ]),
      "Pesquisa_Demanda.xlsx"
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Ranking */}
      {Object.keys(porcurso).length > 0 && (
        <div className="bg-[#1A2540] border border-white/[0.06] rounded-xl p-5">
          <p className="text-sm font-semibold text-slate-200 mb-4">Cursos mais procurados <span className="text-xs font-normal text-slate-500">(1ª + 2ª opção)</span></p>
          <div className="space-y-2">
            {Object.entries(porcurso).sort((a, b) => b[1] - a[1]).map(([curso, count]) => (
              <div key={curso} className="flex items-center gap-3">
                <span className="text-sm text-slate-300 w-52 truncate">{curso}</span>
                <div className="flex-1 bg-white/5 rounded-full h-2">
                  <div className="bg-cyan-400 h-2 rounded-full" style={{ width: `${(count / maxCount) * 100}%` }} />
                </div>
                <span className="text-sm font-bold text-white w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Buscar nome, CPF ou curso…"
            className={`${inp} pl-9 w-full`}
          />
        </div>
        <select value={filtCurso} onChange={e => setFiltCurso(e.target.value)} className={sel} aria-label="Filtrar por curso">
          <option value="">Todos os cursos</option>
          {allCursos.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-sm text-slate-400">{filtered.length} de {pesquisa.length}</span>
        <button onClick={exportar} className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10 transition-colors">
          <Download className="w-4 h-4" /> Exportar
        </button>
      </div>

      <div className="bg-[#1A2540] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Carregando…</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Nenhuma resposta encontrada.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Nome", "CPF", "Email", "Curso de Interesse", "Alternativa", "Turno", "Data"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white/[0.02]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{p.nome ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.cpf ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-300 max-w-[160px] truncate">{p.email ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-300">{p.curso ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{p.cursoAlternativo ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-300">{p.turno ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">{p.createdAt?.slice(0, 10) ?? "—"}</td>
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
