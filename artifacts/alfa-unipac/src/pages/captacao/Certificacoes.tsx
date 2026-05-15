import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Award, Download, Search } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { exportRelatorioXlsx } from "@/utils/export";

type Inscricao = {
  id: number; nome: string; cpf: string; email: string; telefone: string;
  concluiuGraduacao: string; cursoGraduacao: string | null; createdAt: string;
};

type EventoKey = "mba" | "manchester" | "portacath" | "workshop";

const EVENTOS: { key: EventoKey; label: string }[] = [
  { key: "mba",        label: "MBA Cuidados Paliativos" },
  { key: "manchester", label: "Protocolo Manchester" },
  { key: "portacath",  label: "Port-a-Cath" },
  { key: "workshop",   label: "Workshop" },
];

function EventoTab({ evento }: { evento: EventoKey }) {
  const [search, setSearch] = useState("");

  const { data: inscricoes = [], isLoading } = useQuery<Inscricao[]>({
    queryKey: ["vestibular-inscricoes", evento],
    queryFn: () => apiFetch(`/api/vestibular/inscricoes/${evento}`),
  });

  const filtered = inscricoes.filter(i =>
    !search || i.nome.toLowerCase().includes(search.toLowerCase()) || i.cpf.includes(search)
  );

  function exportar() {
    exportRelatorioXlsx(
      `Inscrições — ${EVENTOS.find(e => e.key === evento)?.label}`,
      ["Nome", "CPF", "Email", "Telefone", "Concluiu Graduação", "Curso Graduação"],
      inscricoes.map(i => [i.nome, i.cpf, i.email, i.telefone, i.concluiuGraduacao, i.cursoGraduacao ?? "—"]),
      `Inscricoes_${evento}.xlsx`
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100">
        <span className="text-sm text-slate-500">{inscricoes.length} inscrição(ões)</span>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar..."
              className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 w-48"
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
          <div className="p-8 text-center text-slate-400">Nenhuma inscrição encontrada.</div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                {["Nome", "CPF", "Email", "Telefone", "Graduação"].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(i => (
                <tr key={i.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-slate-900">{i.nome}</td>
                  <td className="px-4 py-3 text-slate-500 font-mono text-xs">{i.cpf}</td>
                  <td className="px-4 py-3 text-slate-600">{i.email}</td>
                  <td className="px-4 py-3 text-slate-600">{i.telefone}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      i.concluiuGraduacao === "Sim" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                    }`}>
                      {i.concluiuGraduacao}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default function Certificacoes() {
  const [tab, setTab] = useState<EventoKey>("mba");

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Certificações</h1>
        <p className="text-slate-500 text-sm mt-0.5">Inscrições nos cursos e eventos de capacitação</p>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-1 px-5 py-4 border-b border-slate-100 overflow-x-auto">
          <Award className="w-5 h-5 text-slate-400 mr-2 flex-shrink-0" />
          {EVENTOS.map(e => (
            <button
              key={e.key}
              onClick={() => setTab(e.key)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex-shrink-0 ${
                tab === e.key ? "bg-cyan-400/15 text-cyan-700" : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              {e.label}
            </button>
          ))}
        </div>

        <EventoTab key={tab} evento={tab} />
      </div>
    </div>
  );
}
