import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Printer } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Aprovado } from "../PainelCaptacao";

const sel = "bg-[#0F172A] border border-white/10 text-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400";

export default function TabListaChamada() {
  const [filtCurso, setFiltCurso] = useState("");
  const [filtTurno, setFiltTurno] = useState("");

  const { data: aprovados = [], isLoading } = useQuery<Aprovado[]>({
    queryKey: ["vc-aprovados"],
    queryFn: () => apiFetch("/api/vestibular/aprovados"),
  });

  const matriculados = aprovados.filter(a => a.matriculado);
  const cursos = [...new Set(matriculados.map(a => a.curso))].sort();
  const turnos = [...new Set(matriculados.map(a => a.turno ?? "—"))].sort();

  const filtered = matriculados
    .filter(a => (!filtCurso || a.curso === filtCurso) && (!filtTurno || (a.turno ?? "—") === filtTurno))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <div className="flex items-center gap-3">
        <select value={filtCurso} onChange={e => setFiltCurso(e.target.value)} className={sel}>
          <option value="">Todos os cursos</option>
          {cursos.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <select value={filtTurno} onChange={e => setFiltTurno(e.target.value)} className={sel}>
          <option value="">Todos os turnos</option>
          {turnos.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <button onClick={() => window.print()} className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10 transition-colors">
          <Printer className="w-4 h-4" /> Imprimir
        </button>
      </div>

      <div className="bg-[#1A2540] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-white/[0.06]">
          <h3 className="text-sm font-semibold text-white">Lista de Chamada — Vestibular 2026/2</h3>
          <p className="text-xs text-slate-400 mt-0.5">{filtered.length} aluno(s) convocado(s)</p>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Nenhum aluno encontrado.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white/[0.02] w-12">#</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white/[0.02]">Nome</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white/[0.02]">Curso</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white/[0.02]">Turno</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white/[0.02] w-28">Presente</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((a, i) => (
                  <tr key={a.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 text-slate-500 text-xs">{i + 1}</td>
                    <td className="px-4 py-3 font-medium text-white">{a.nome}</td>
                    <td className="px-4 py-3 text-slate-300">{a.curso}</td>
                    <td className="px-4 py-3 text-slate-300">{a.turno ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="w-16 h-6 border border-white/10 rounded" />
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
