import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { exportRelatorioXlsx } from "@/utils/export";
import type { Aprovado } from "../types";

const sel = "bg-[#0F172A] border border-white/10 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400";

export default function TabMatriculas() {
  const [filtCurso, setFiltCurso] = useState("");

  const { data: aprovados = [], isLoading } = useQuery<Aprovado[]>({
    queryKey: ["vc-aprovados"],
    queryFn: () => apiFetch("/api/vestibular/aprovados"),
  });

  const matriculados = aprovados.filter(a => a.matriculado);
  const cursos = [...new Set(matriculados.map(a => a.curso))].sort();
  const filtered = filtCurso ? matriculados.filter(a => a.curso === filtCurso) : matriculados;

  function exportar() {
    exportRelatorioXlsx("Matrículas Vestibular 2026/2",
      ["Nome", "Curso", "Turno"],
      filtered.map(a => [a.nome, a.curso, a.turno ?? "—"]),
      "Vestibular_Matriculas.xlsx"
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <select value={filtCurso} onChange={e => setFiltCurso(e.target.value)} className={sel}>
          <option value="">Todos os cursos</option>
          {cursos.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <span className="text-sm text-slate-400 ml-2">
          {filtered.length} matriculado(s) {filtCurso ? `em ${filtCurso}` : "no total"}
        </span>
        <button onClick={exportar} className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10 transition-colors">
          <Download className="w-4 h-4" /> Exportar
        </button>
      </div>

      <div className="bg-[#1A2540] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Nenhuma matrícula confirmada.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white/[0.02]">#</th>
                  {["Nome", "Curso", "Turno"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white/[0.02]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={a.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-slate-500 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-white">{a.nome}</td>
                    <td className="px-4 py-3 text-slate-300">{a.curso}</td>
                    <td className="px-4 py-3 text-slate-300">{a.turno ?? "—"}</td>
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
