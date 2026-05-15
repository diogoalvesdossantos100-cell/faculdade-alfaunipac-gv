import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { TrendingUp, Search, Download } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { exportRelatorioXlsx } from "@/utils/export";

type PesquisaItem = {
  id: number; nome: string | null; cpf: string | null; email: string | null;
  telefone: string | null; convenio: string | null; curso: string | null;
  cursoAlternativo: string | null; turno: string | null; createdAt: string;
};

export default function PesquisaDemanda() {
  const [search, setSearch] = useState("");

  const { data: pesquisa = [], isLoading } = useQuery<PesquisaItem[]>({
    queryKey: ["vestibular-pesquisa"],
    queryFn: () => apiFetch("/api/vestibular/pesquisa"),
  });

  const filtered = pesquisa.filter(p =>
    !search ||
    (p.nome ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (p.cpf ?? "").includes(search) ||
    (p.curso ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const cursoCount = pesquisa.reduce<Record<string, number>>((acc, p) => {
    const c = p.curso ?? "Não informado";
    acc[c] = (acc[c] ?? 0) + 1;
    return acc;
  }, {});

  const topCursos = Object.entries(cursoCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  function exportar() {
    exportRelatorioXlsx(
      "Pesquisa de Demanda — AlfaUnipac GV",
      ["Nome", "CPF", "Email", "Telefone", "Convênio", "Curso", "Curso Alternativo", "Turno"],
      pesquisa.map(p => [
        p.nome ?? "—", p.cpf ?? "—", p.email ?? "—", p.telefone ?? "—",
        p.convenio ?? "—", p.curso ?? "—", p.cursoAlternativo ?? "—", p.turno ?? "—",
      ]),
      "Pesquisa_Demanda.xlsx"
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Pesquisa de Demanda</h1>
        <p className="text-slate-500 text-sm mt-0.5">Interesse em novos cursos — {pesquisa.length} respondente(s)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-1">
            <TrendingUp className="w-5 h-5 text-cyan-600" />
            <p className="text-sm font-medium text-slate-500">Total de Respostas</p>
          </div>
          <p className="text-3xl font-bold text-slate-900">{pesquisa.length}</p>
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm font-semibold text-slate-600 mb-3">Cursos mais procurados</p>
          {topCursos.length === 0 ? (
            <p className="text-sm text-slate-400">Sem dados.</p>
          ) : (
            <div className="space-y-2">
              {topCursos.map(([curso, count]) => (
                <div key={curso} className="flex items-center gap-3">
                  <span className="text-sm text-slate-700 w-48 truncate">{curso}</span>
                  <div className="flex-1 bg-slate-100 rounded-full h-2">
                    <div
                      className="bg-cyan-400 h-2 rounded-full"
                      style={{ width: `${(count / pesquisa.length) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-base font-semibold text-slate-700">Respostas</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar nome, CPF ou curso..."
                className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 w-56"
              />
            </div>
            <button
              onClick={exportar}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-slate-600"
            >
              <Download className="w-4 h-4" /> Exportar
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Nenhuma resposta encontrada.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Nome", "CPF", "Email", "Curso de Interesse", "Turno"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{p.nome ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{p.cpf ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{p.email ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{p.curso ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{p.turno ?? "—"}</td>
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
