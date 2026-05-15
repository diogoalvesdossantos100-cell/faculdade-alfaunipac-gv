import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { UserPlus, Users, CheckCircle, GraduationCap, Search, Download } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { exportRelatorioXlsx } from "@/utils/export";

type Candidato = {
  id: number; nome: string; cpf: string; email: string; telefone: string;
  convenio: string; curso1: string; curso2: string; turno: string;
  status: string; createdAt: string;
};
type Aprovado = {
  id: number; nome: string; curso: string; turno: string | null;
  matriculado: boolean; createdAt: string;
};

const STATUS_COLORS: Record<string, string> = {
  Inscrito:   "bg-blue-50 text-blue-700",
  Aprovado:   "bg-green-50 text-green-700",
  Matriculado:"bg-purple-50 text-purple-700",
  Desistente: "bg-red-50 text-red-700",
};

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function Vestibular() {
  const [tab, setTab] = useState<"inscritos" | "aprovados">("inscritos");
  const [search, setSearch] = useState("");

  const { data: candidatos = [], isLoading: loadingC } = useQuery<Candidato[]>({
    queryKey: ["vestibular-candidatos"],
    queryFn: () => apiFetch("/api/vestibular/candidatos"),
  });
  const { data: aprovados = [], isLoading: loadingA } = useQuery<Aprovado[]>({
    queryKey: ["vestibular-aprovados"],
    queryFn: () => apiFetch("/api/vestibular/aprovados"),
  });

  const filtered = tab === "inscritos"
    ? candidatos.filter(c =>
        !search || c.nome.toLowerCase().includes(search.toLowerCase()) || c.cpf.includes(search))
    : aprovados.filter(a =>
        !search || a.nome.toLowerCase().includes(search.toLowerCase()));

  const matriculados = aprovados.filter(a => a.matriculado).length;

  function exportarXlsx() {
    if (tab === "inscritos") {
      exportRelatorioXlsx(
        "Candidatos Inscritos — Vestibular AlfaUnipac GV",
        ["Nome", "CPF", "Email", "Convênio", "Curso 1", "Curso 2", "Turno", "Status"],
        candidatos.map(c => [c.nome, c.cpf, c.email, c.convenio, c.curso1, c.curso2, c.turno, c.status]),
        "Vestibular_Inscritos.xlsx"
      );
    } else {
      exportRelatorioXlsx(
        "Candidatos Aprovados — Vestibular AlfaUnipac GV",
        ["Nome", "Curso", "Turno", "Matriculado"],
        aprovados.map(a => [a.nome, a.curso, a.turno ?? "—", a.matriculado ? "Sim" : "Não"]),
        "Vestibular_Aprovados.xlsx"
      );
    }
  }

  const isLoading = tab === "inscritos" ? loadingC : loadingA;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Vestibular</h1>
        <p className="text-slate-500 text-sm mt-0.5">Candidatos inscritos e aprovados no processo seletivo</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Inscritos"   value={candidatos.length}  icon={UserPlus}      color="bg-blue-50 text-blue-600" />
        <StatCard label="Aprovados"         value={aprovados.length}   icon={CheckCircle}   color="bg-green-50 text-green-600" />
        <StatCard label="Matriculados"      value={matriculados}        icon={GraduationCap} color="bg-purple-50 text-purple-600" />
        <StatCard label="Aguardando"        value={aprovados.length - matriculados} icon={Users} color="bg-amber-50 text-amber-600" />
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex gap-1">
            {(["inscritos", "aprovados"] as const).map(t => (
              <button
                key={t}
                onClick={() => { setTab(t); setSearch(""); }}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tab === t ? "bg-cyan-400/15 text-cyan-700" : "text-slate-500 hover:bg-slate-50"
                }`}
              >
                {t === "inscritos" ? `Inscritos (${candidatos.length})` : `Aprovados (${aprovados.length})`}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Buscar nome ou CPF..."
                className="pl-9 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-cyan-400 w-52"
              />
            </div>
            <button
              onClick={exportarXlsx}
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
            <div className="p-8 text-center text-slate-400">Nenhum registro encontrado.</div>
          ) : tab === "inscritos" ? (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Nome", "CPF", "Convênio", "Curso 1", "Turno", "Status"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(filtered as Candidato[]).map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.nome}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">{c.cpf}</td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{c.convenio}</td>
                    <td className="px-4 py-3 text-slate-600">{c.curso1}</td>
                    <td className="px-4 py-3 text-slate-600">{c.turno}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[c.status] ?? "bg-slate-100 text-slate-600"}`}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Nome", "Curso", "Turno", "Matriculado"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(filtered as Aprovado[]).map(a => (
                  <tr key={a.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{a.nome}</td>
                    <td className="px-4 py-3 text-slate-600">{a.curso}</td>
                    <td className="px-4 py-3 text-slate-600">{a.turno ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${a.matriculado ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {a.matriculado ? "Sim" : "Não"}
                      </span>
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
