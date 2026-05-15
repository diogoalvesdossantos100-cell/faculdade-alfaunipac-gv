import { useQuery } from "@tanstack/react-query";
import { BookOpen } from "lucide-react";
import { apiFetch } from "@/lib/api";

type Curso = {
  id: number; nome: string; periodo: string; ativo: boolean; createdAt: string;
};

export default function CursosVestibular() {
  const { data: cursos = [], isLoading } = useQuery<Curso[]>({
    queryKey: ["vestibular-cursos-admin"],
    queryFn: () => apiFetch("/api/vestibular/cursos"),
  });

  const ativos = cursos.filter(c => c.ativo).length;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Cursos</h1>
        <p className="text-slate-500 text-sm mt-0.5">Catálogo de cursos disponíveis no vestibular</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Total de Cursos</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{cursos.length}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Ativos</p>
          <p className="text-3xl font-bold text-green-600 mt-1">{ativos}</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-sm text-slate-500 font-medium">Inativos</p>
          <p className="text-3xl font-bold text-slate-400 mt-1">{cursos.length - ativos}</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100">
          <BookOpen className="w-5 h-5 text-slate-400" />
          <h2 className="text-base font-semibold text-slate-700">Cursos cadastrados</h2>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-400">Carregando...</div>
          ) : cursos.length === 0 ? (
            <div className="p-8 text-center text-slate-400">Nenhum curso cadastrado.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  {["Curso", "Período", "Status"].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {cursos.map(c => (
                  <tr key={c.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-900">{c.nome}</td>
                    <td className="px-4 py-3 text-slate-600">{c.periodo}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${c.ativo ? "bg-green-50 text-green-700" : "bg-slate-100 text-slate-500"}`}>
                        {c.ativo ? "Ativo" : "Inativo"}
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
