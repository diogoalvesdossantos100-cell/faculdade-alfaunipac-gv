import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Download } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { exportRelatorioXlsx } from "@/utils/export";

type Inscricao = {
  id: number; nome: string; cpf: string; email: string; telefone: string;
  concluiuGraduacao: string; cursoGraduacao: string | null; createdAt: string;
};

const inp = "bg-[#0F172A] border border-white/10 text-white placeholder-slate-500 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-cyan-400";

export default function TabEvento({ evento, titulo }: { evento: string; titulo: string }) {
  const [search, setSearch] = useState("");

  const { data: inscricoes = [], isLoading } = useQuery<Inscricao[]>({
    queryKey: ["vc-inscricoes", evento],
    queryFn: () => apiFetch(`/api/vestibular/inscricoes/${evento}`),
  });

  const filtered = inscricoes.filter(i =>
    !search || i.nome.toLowerCase().includes(search.toLowerCase()) || i.cpf.includes(search)
  );

  function exportar() {
    exportRelatorioXlsx(titulo,
      ["Nome", "CPF", "Email", "Telefone", "Concluiu Graduação", "Curso Graduação"],
      filtered.map(i => [i.nome, i.cpf, i.email, i.telefone, i.concluiuGraduacao, i.cursoGraduacao ?? "—"]),
      `${evento}.xlsx`
    );
  }

  const comGrad = inscricoes.filter(i => i.concluiuGraduacao === "Sim").length;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-4">
      <div className="flex gap-4 mb-2 text-sm text-slate-400">
        <span>Total: <span className="text-white font-semibold">{inscricoes.length}</span></span>
        <span>Com graduação: <span className="text-cyan-400 font-semibold">{comGrad}</span></span>
        <span>Sem graduação: <span className="text-amber-400 font-semibold">{inscricoes.length - comGrad}</span></span>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar nome ou CPF..." className={`${inp} pl-9 w-full`} />
        </div>
        <span className="text-sm text-slate-400">{filtered.length} de {inscricoes.length}</span>
        <button onClick={exportar} className="ml-auto flex items-center gap-1.5 px-3 py-2 text-sm bg-white/5 hover:bg-white/10 text-slate-300 rounded-lg border border-white/10 transition-colors">
          <Download className="w-4 h-4" /> Exportar
        </button>
      </div>

      <div className="bg-[#1A2540] border border-white/[0.06] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">Carregando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-slate-500">Nenhuma inscrição encontrada.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {["Nome", "CPF", "Email", "Telefone", "Graduação", "Curso"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white/[0.02]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(i => (
                  <tr key={i.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3 font-medium text-white">{i.nome}</td>
                    <td className="px-4 py-3 font-mono text-xs text-slate-400">{i.cpf}</td>
                    <td className="px-4 py-3 text-slate-300">{i.email}</td>
                    <td className="px-4 py-3 text-slate-300">{i.telefone}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                        i.concluiuGraduacao === "Sim"
                          ? "border-green-500/30 text-green-400 bg-green-500/10"
                          : "border-amber-500/30 text-amber-400 bg-amber-500/10"
                      }`}>
                        {i.concluiuGraduacao}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400">{i.cursoGraduacao ?? "—"}</td>
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
