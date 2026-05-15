import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { exportRelatorioXlsx } from "@/utils/export";
import type { Pesquisa } from "../types";

const inp = "bg-[#0F172A] border border-white/10 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400";

export default function TabPesquisa() {
  const [search, setSearch] = useState("");

  const { data: pesquisa = [], isLoading } = useQuery<Pesquisa[]>({
    queryKey: ["vc-pesquisa"],
    queryFn: () => apiFetch("/api/vestibular/pesquisa"),
  });

  const filtered = pesquisa.filter(p =>
    !search ||
    (p.nome ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.cpf ?? "").includes(search) ||
    (p.curso ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const porcurso = pesquisa.reduce<Record<string, number>>((acc, p) => {
    const c = p.curso ?? "Não informado";
    acc[c] = (acc[c] ?? 0) + 1;
    return acc;
  }, {});

  function exportar() {
    exportRelatorioXlsx("Pesquisa de Demanda — AlfaUnipac GV",
      ["Nome", "CPF", "Email", "Curso", "Turno"],
      filtered.map(p => [p.nome ?? "—", p.cpf ?? "—", p.email ?? "—", p.curso ?? "—", p.turno ?? "—"]),
      "Pesquisa_Demanda.xlsx"
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      {/* Mini chart */}
      {Object.keys(porcurso).length > 0 && (
        <div className="bg-[#1A2540] border border-white/[0.06] rounded-xl p-5">
          <p className="text-sm font-semibold text-slate-200 mb-4">Cursos mais procurados</p>
          <div className="space-y-2">
            {Object.entries(porcurso).sort((a,b) => b[1]-a[1]).map(([curso, count]) => (
              <div key={curso} className="flex items-center gap-3">
                <span className="text-sm text-slate-300 w-52 truncate">{curso}</span>
                <div className="flex-1 bg-white/5 rounded-full h-2">
                  <div className="bg-cyan-400 h-2 rounded-full" style={{ width: `${(count / pesquisa.length) * 100}%` }} />
                </div>
                <span className="text-sm font-bold text-white w-6 text-right">{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nome, CPF ou curso…" className={`${inp} pl-9 w-full`} />
        </div>
        <span className="text-sm text-slate-400">{filtered.length} de {pesquisa.length}</span>
        <button onClick={exportar} className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10 transition-colors">
          <Download className="w-4 h-4" /> Exportar
        </button>
      </div>

      <div className="bg-[#1A2540] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Nenhuma resposta encontrada.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Nome", "CPF", "Email", "Curso de Interesse", "Turno"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white/[0.02]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{p.nome ?? "—"}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{p.cpf ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-300">{p.email ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-300">{p.curso ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-300">{p.turno ?? "—"}</td>
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
