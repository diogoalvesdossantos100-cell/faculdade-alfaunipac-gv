import { useQuery } from "@tanstack/react-query";
import { Users, CheckCircle, GraduationCap, TrendingUp, AlertTriangle, BookOpen } from "lucide-react";
import { apiFetch } from "@/lib/api";
import type { Candidato, Aprovado, Pesquisa } from "../PainelCaptacao";

const CURSOS_OFICIAIS = ["Administração", "Nutrição", "Fisioterapia", "Farmácia", "Enfermagem"];

type Inscricao = { id: number; nome: string };
type Curso    = { id: number; nome: string; ativo: boolean };

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: number; icon: React.ElementType; accent: string }) {
  return (
    <div className="bg-[#1A2540] border border-white/[0.06] rounded-xl p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">{label}</p>
          <p className="text-4xl font-bold text-white mt-1">{value}</p>
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${accent}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function TabComando({ candidatos, aprovados, pesquisa }: { candidatos: Candidato[]; aprovados: Aprovado[]; pesquisa: Pesquisa[] }) {
  const { data: mba        = [] } = useQuery<Inscricao[]>({ queryKey: ["vc-mba"],        queryFn: () => apiFetch("/api/vestibular/inscricoes/mba")        });
  const { data: manchester = [] } = useQuery<Inscricao[]>({ queryKey: ["vc-manchester"], queryFn: () => apiFetch("/api/vestibular/inscricoes/manchester")  });
  const { data: portacath  = [] } = useQuery<Inscricao[]>({ queryKey: ["vc-portacath"],  queryFn: () => apiFetch("/api/vestibular/inscricoes/portacath")   });
  const { data: workshop   = [] } = useQuery<Inscricao[]>({ queryKey: ["vc-workshop"],   queryFn: () => apiFetch("/api/vestibular/inscricoes/workshop")    });
  const { data: cursos     = [] } = useQuery<Curso[]>({ queryKey: ["vc-cursos"],         queryFn: () => apiFetch("/api/vestibular/cursos")                  });

  const totalEventos   = mba.length + manchester.length + portacath.length + workshop.length;
  const matriculados   = aprovados.filter(a => a.matriculado).length;
  const fora           = candidatos.filter(c => !CURSOS_OFICIAIS.includes(c.curso1));
  const cursosOficiais = cursos.length > 0 ? cursos : [];

  const porcurso = candidatos.reduce<Record<string, number>>((acc, c) => {
    acc[c.curso1] = (acc[c.curso1] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Inscritos Vestibular"  value={candidatos.length} icon={Users}        accent="bg-blue-500/20 text-blue-400" />
        <StatCard label="Aprovados"             value={aprovados.length}  icon={CheckCircle}  accent="bg-green-500/20 text-green-400" />
        <StatCard label="Matriculados"          value={matriculados}      icon={GraduationCap} accent="bg-cyan-400/20 text-cyan-400" />
        <StatCard label="Pesquisa de Demanda"   value={pesquisa.length}   icon={TrendingUp}   accent="bg-purple-500/20 text-purple-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Alerta fora do vestibular */}
        {fora.length > 0 && (
          <div className="lg:col-span-1 bg-amber-500/10 border border-amber-500/30 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="w-5 h-5 text-amber-400" />
              <h3 className="text-sm font-semibold text-amber-400">Fora dos Cursos Oficiais</h3>
            </div>
            <p className="text-2xl font-bold text-amber-300 mb-1">{fora.length}</p>
            <p className="text-xs text-amber-400/70 mb-3">candidato(s) inscritos em cursos não listados</p>
            <div className="space-y-1.5">
              {fora.slice(0, 5).map(c => (
                <div key={c.id} className="text-xs text-amber-300/80 truncate">• {c.nome} — {c.curso1}</div>
              ))}
              {fora.length > 5 && <p className="text-xs text-amber-400/50">+{fora.length - 5} mais...</p>}
            </div>
          </div>
        )}

        {/* Distribuição por curso */}
        <div className={`${fora.length > 0 ? "lg:col-span-2" : "lg:col-span-3"} bg-[#1A2540] border border-white/[0.06] rounded-xl p-5`}>
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-slate-400" />
            <h3 className="text-sm font-semibold text-slate-200">Inscrições por Curso (1ª opção)</h3>
          </div>
          {Object.keys(porcurso).length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum inscrito.</p>
          ) : (
            <div className="space-y-2.5">
              {Object.entries(porcurso).sort((a,b) => b[1]-a[1]).map(([curso, count]) => (
                <div key={curso} className="flex items-center gap-3">
                  <span className="text-sm text-slate-300 w-44 truncate">{curso}</span>
                  <div className="flex-1 bg-white/5 rounded-full h-2">
                    <div className="bg-cyan-400 h-2 rounded-full transition-all" style={{ width: `${(count / candidatos.length) * 100}%` }} />
                  </div>
                  <span className="text-sm font-bold text-white w-8 text-right">{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Eventos */}
      <div className="bg-[#1A2540] border border-white/[0.06] rounded-xl p-5">
        <h3 className="text-sm font-semibold text-slate-200 mb-4">Inscrições nos Eventos</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "MBA Cuidados Paliativos", count: mba.length },
            { label: "Protocolo Manchester",    count: manchester.length },
            { label: "Port-a-Cath",             count: portacath.length },
            { label: "Workshop",                count: workshop.length },
          ].map(e => (
            <div key={e.label} className="bg-white/[0.03] rounded-lg p-4 border border-white/[0.04]">
              <p className="text-xs text-slate-400 mb-1">{e.label}</p>
              <p className="text-2xl font-bold text-white">{e.count}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">Total de inscrições em eventos: <span className="text-white font-semibold">{totalEventos}</span></p>
      </div>

      {/* Cursos cadastrados */}
      {cursosOficiais.length > 0 && (
        <div className="bg-[#1A2540] border border-white/[0.06] rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-200 mb-3">Cursos Cadastrados no Vestibular</h3>
          <div className="flex flex-wrap gap-2">
            {cursosOficiais.map(c => (
              <span key={c.id} className={`text-xs px-3 py-1 rounded-full border ${c.ativo ? "border-cyan-400/30 text-cyan-400 bg-cyan-400/5" : "border-white/10 text-slate-500 bg-white/[0.02]"}`}>
                {c.nome}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
