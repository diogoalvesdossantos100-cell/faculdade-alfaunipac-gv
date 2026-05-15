import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { GraduationCap } from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { apiFetch } from "@/lib/api";
import TabComando from "./tabs/TabComando";
import TabInscritos from "./tabs/TabInscritos";
import TabAprovados from "./tabs/TabAprovados";
import TabMatriculas from "./tabs/TabMatriculas";
import TabListaChamada from "./tabs/TabListaChamada";
import TabPesquisa from "./tabs/TabPesquisa";
import TabEvento from "./tabs/TabEvento";
import TabGerenciarCursos from "./tabs/TabGerenciarCursos";

type Tab = {
  id: string;
  label: string;
  countKey?: string;
};

const TABS: Tab[] = [
  { id: "comando",    label: "Comando" },
  { id: "inscritos",  label: "Inscritos",        countKey: "candidatos" },
  { id: "aprovados",  label: "Aprovados",         countKey: "aprovados" },
  { id: "matriculas", label: "Matrículas" },
  { id: "chamada",    label: "Lista de Chamada" },
  { id: "pesquisa",   label: "Pesquisa",          countKey: "pesquisa" },
  { id: "mba",        label: "MBA" },
  { id: "manchester", label: "Manchester" },
  { id: "portacath",  label: "Port-a-Cath" },
  { id: "workshop",   label: "Workshop" },
  { id: "cursos",     label: "Gerenciar Cursos" },
];

type Candidato = { id: number; nome: string; cpf: string; email: string; telefone: string; convenio: string; curso1: string; curso2: string; turno: string; status: string; createdAt: string };
type Aprovado  = { id: number; nome: string; curso: string; turno: string | null; matriculado: boolean; createdAt: string };
type Pesquisa  = { id: number; nome: string | null; cpf: string | null; email: string | null; curso: string | null; turno: string | null; createdAt: string };

export type { Candidato, Aprovado, Pesquisa };

export default function PainelCaptacao() {
  const [tab, setTab] = useState("comando");
  const { user } = useAuth();

  const { data: candidatos = [] } = useQuery<Candidato[]>({ queryKey: ["vc-candidatos"], queryFn: () => apiFetch("/api/vestibular/candidatos") });
  const { data: aprovados  = [] } = useQuery<Aprovado[]>({ queryKey: ["vc-aprovados"],  queryFn: () => apiFetch("/api/vestibular/aprovados")  });
  const { data: pesquisa   = [] } = useQuery<Pesquisa[]>({ queryKey: ["vc-pesquisa"],   queryFn: () => apiFetch("/api/vestibular/pesquisa")   });

  const counts: Record<string, number> = {
    candidatos: candidatos.length,
    aprovados:  aprovados.length,
    pesquisa:   pesquisa.length,
  };

  return (
    <div className="flex flex-col h-full bg-[#0A0F1C] text-white overflow-hidden">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-white/[0.06] bg-[#0D1629]">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-cyan-400 flex items-center justify-center">
            <GraduationCap className="w-4 h-4 text-[#0A192F]" />
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">Painel Administrativo 2026/2</p>
            <p className="text-xs text-slate-400 leading-tight">AlfaUnipac GV — Captação</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-cyan-400/20 flex items-center justify-center">
            <span className="text-xs font-bold text-cyan-400">{user?.nome?.[0]?.toUpperCase() ?? "U"}</span>
          </div>
          <span className="text-sm text-slate-300">{user?.nome}</span>
        </div>
      </header>

      {/* Tab Bar */}
      <div className="flex-shrink-0 flex items-end gap-0.5 px-4 pt-3 border-b border-white/[0.06] bg-[#0D1629] overflow-x-auto">
        {TABS.map(t => {
          const count = t.countKey ? counts[t.countKey] : undefined;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 whitespace-nowrap transition-all flex-shrink-0 ${
                active
                  ? "border-cyan-400 text-cyan-400"
                  : "border-transparent text-slate-400 hover:text-slate-200 hover:border-white/20"
              }`}
            >
              {t.label}
              {count != null && count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[1.2rem] text-center ${
                  active ? "bg-cyan-400/20 text-cyan-400" : "bg-white/10 text-slate-400"
                }`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {tab === "comando"    && <TabComando    candidatos={candidatos} aprovados={aprovados} pesquisa={pesquisa} />}
        {tab === "inscritos"  && <TabInscritos  />}
        {tab === "aprovados"  && <TabAprovados  />}
        {tab === "matriculas" && <TabMatriculas />}
        {tab === "chamada"    && <TabListaChamada />}
        {tab === "pesquisa"   && <TabPesquisa   />}
        {tab === "mba"        && <TabEvento evento="mba"        titulo="MBA — Cuidados Paliativos" />}
        {tab === "manchester" && <TabEvento evento="manchester"  titulo="Protocolo Manchester" />}
        {tab === "portacath"  && <TabEvento evento="portacath"   titulo="Port-a-Cath" />}
        {tab === "workshop"   && <TabEvento evento="workshop"    titulo="Workshop" />}
        {tab === "cursos"     && <TabGerenciarCursos />}
      </div>
    </div>
  );
}
