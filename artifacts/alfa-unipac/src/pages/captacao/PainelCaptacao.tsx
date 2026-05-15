import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useAuth } from "@/contexts/auth";
import { apiFetch } from "@/lib/api";
import { exportRelatorioXlsx } from "@/utils/export";
import TabComando         from "./tabs/TabComando";
import TabInscritos       from "./tabs/TabInscritos";
import TabAprovados       from "./tabs/TabAprovados";
import TabMatriculas      from "./tabs/TabMatriculas";
import TabListaChamada    from "./tabs/TabListaChamada";
import TabPesquisa        from "./tabs/TabPesquisa";
import TabEvento          from "./tabs/TabEvento";
import TabGerenciarCursos from "./tabs/TabGerenciarCursos";
import { NAVY, ORANGE, GREEN, CURSOS_OFICIAIS } from "./types";
import type { Candidato, Aprovado, Pesquisa, Curso } from "./types";

// ── Estilos do painel (portados do adminStyles.js original) ───────────────
const S = {
  wrap:     { minHeight: "100vh", background: "#080E22", fontFamily: "'Inter', system-ui, sans-serif" } as React.CSSProperties,
  header:   { background: "#0A1128", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", height: 58, borderBottom: "1px solid rgba(255,255,255,.06)" } as React.CSSProperties,
  hLabel:   { fontSize: 9, fontWeight: 600, letterSpacing: ".12em", color: "rgba(255,255,255,.35)", textTransform: "uppercase" } as React.CSSProperties,
  hTitle:   { fontSize: 15, fontWeight: 800, color: "#fff" } as React.CSSProperties,
  hRight:   { display: "flex", alignItems: "center", gap: 10 } as React.CSSProperties,
  polo:     { fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,.6)", background: "rgba(255,255,255,.06)", padding: "4px 12px", borderRadius: 20, border: "1px solid rgba(255,255,255,.08)" } as React.CSSProperties,
  logout:   { background: "rgba(255,255,255,.06)", border: "1px solid rgba(255,255,255,.12)", color: "rgba(255,255,255,.7)", borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
  reportBtn:{ background: ORANGE, border: "none", color: "#fff", borderRadius: 6, padding: "5px 14px", fontSize: 12, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, position: "relative" } as React.CSSProperties,
  nav:      { background: "#0A1128", borderBottom: "1px solid rgba(255,255,255,.06)", padding: "0 32px", display: "flex", overflowX: "auto" } as React.CSSProperties,
  body:     { maxWidth: "none", padding: "24px 32px" } as React.CSSProperties,
  footer:   { background: "#050B18", padding: "10px 28px", display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,.04)" } as React.CSSProperties,
};

function navBtn(active: boolean, isComando = false): React.CSSProperties {
  const activeColor = isComando ? ORANGE : "#fff";
  const inactiveColor = isComando ? `rgba(244,121,32,.5)` : "rgba(255,255,255,.35)";
  return {
    background: "none", border: "none",
    padding: "14px 16px", fontSize: 13, fontWeight: 600,
    color: active ? activeColor : inactiveColor,
    borderBottom: `2px solid ${active ? (isComando ? ORANGE : ORANGE) : "transparent"}`,
    cursor: "pointer", whiteSpace: "nowrap",
  };
}

// ── Botão Relatório com dropdown ──────────────────────────────────────────
function BotaoRelatorio({ inscritos, pesquisa, cursos }: { inscritos: Candidato[]; pesquisa: Pesquisa[]; cursos: Curso[] }) {
  const [open, setOpen] = useState(false);

  const handleExcel = () => {
    setOpen(false);
    exportRelatorioXlsx(
      "Relatório Vestibular 2026/2 — AlfaUnipac GV",
      ["Nome", "CPF", "E-mail", "Telefone", "Convênio", "1ª Opção", "2ª Opção", "Turno", "Data"],
      inscritos.map(c => [c.nome, c.cpf, c.email, c.telefone, c.convenio, c.curso1, c.curso2, c.turno, c.createdAt?.slice(0, 10)]),
      "Relatorio_Vestibular.xlsx"
    );
  };

  return (
    <div style={{ position: "relative" }}>
      <button style={S.reportBtn} onClick={() => setOpen(o => !o)}>
        📄 Relatório
      </button>
      {open && (
        <div style={{ position: "absolute", top: "110%", right: 0, background: "#0D1530", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, padding: 8, zIndex: 300, minWidth: 180 }}>
          <button onClick={handleExcel} style={{ display: "block", width: "100%", padding: "9px 14px", background: "none", border: "none", color: "#fff", textAlign: "left", fontSize: 13, cursor: "pointer", borderRadius: 7, fontWeight: 600 }}>
            📊 Exportar Excel
          </button>
        </div>
      )}
    </div>
  );
}

// ── Painel Principal ──────────────────────────────────────────────────────
export default function PainelCaptacao() {
  const [tab, setTab] = useState("comando");
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const { data: candidatos = [] } = useQuery<Candidato[]>({ queryKey: ["vc-candidatos"], queryFn: () => apiFetch("/api/vestibular/candidatos") });
  const { data: aprovados  = [] } = useQuery<Aprovado[]>({ queryKey: ["vc-aprovados"],  queryFn: () => apiFetch("/api/vestibular/aprovados")  });
  const { data: pesquisa   = [] } = useQuery<Pesquisa[]>({ queryKey: ["vc-pesquisa"],   queryFn: () => apiFetch("/api/vestibular/pesquisa")   });
  const { data: mba        = [] } = useQuery<{id:number}[]>({ queryKey: ["vc-mba"],        queryFn: () => apiFetch("/api/vestibular/inscricoes/mba")       });
  const { data: manchester = [] } = useQuery<{id:number}[]>({ queryKey: ["vc-manchester"], queryFn: () => apiFetch("/api/vestibular/inscricoes/manchester") });
  const { data: portacath  = [] } = useQuery<{id:number}[]>({ queryKey: ["vc-portacath"],  queryFn: () => apiFetch("/api/vestibular/inscricoes/portacath")  });
  const { data: workshop   = [] } = useQuery<{id:number}[]>({ queryKey: ["vc-workshop"],   queryFn: () => apiFetch("/api/vestibular/inscricoes/workshop")   });
  const { data: cursos     = [] } = useQuery<Curso[]>({ queryKey: ["vc-cursos"],          queryFn: () => apiFetch("/api/vestibular/cursos")                 });

  // Exatamente como no original
  const inscritosVestibular        = candidatos.filter(c => CURSOS_OFICIAIS.includes(c.curso1));
  const matriculadosCount          = aprovados.filter(a => a.matriculado).length;
  const aprovadosNaoMatriculados   = aprovados.filter(a => !a.matriculado);

  const tabs = [
    { key: "comando",    label: "⚡ Comando",                                isComando: true },
    { key: "inscritos",  label: `Inscritos (${inscritosVestibular.length})`,  isComando: false },
    { key: "aprovados",  label: `Aprovados (${aprovadosNaoMatriculados.length})`, isComando: false },
    { key: "matriculas", label: "Matrículas",                                isComando: false },
    { key: "chamada",    label: `Lista de Chamada (${matriculadosCount})`,    isComando: false },
    { key: "pesquisa",   label: `Pesquisa (${pesquisa.length})`,              isComando: false },
    { key: "mba",        label: `MBA (${mba.length})`,                        isComando: false },
    { key: "manchester", label: `Manchester (${manchester.length})`,           isComando: false },
    { key: "portacath",  label: `Port-a-Cath (${portacath.length})`,          isComando: false },
    { key: "workshop",   label: `Workshop (${workshop.length})`,              isComando: false },
    { key: "cursos",     label: "Gerenciar Cursos",                           isComando: false },
  ];

  return (
    <div style={S.wrap}>
      {/* Header */}
      <div style={S.header}>
        <div>
          <div style={S.hLabel}>Centro Universitário AlfaUnipac</div>
          <div style={S.hTitle}>
            Painel Administrativo{" "}
            <span style={{ color: ORANGE }}>2026/2</span>
          </div>
        </div>
        <div style={S.hRight}>
          <BotaoRelatorio inscritos={candidatos} pesquisa={pesquisa} cursos={cursos} />
          <div style={S.polo}>Polo Governador Valadares</div>
          <button style={S.logout} onClick={() => { logout(); navigate("/login"); }}>Sair</button>
        </div>
      </div>

      {/* Nav */}
      <div style={S.nav}>
        {tabs.map(t => (
          <button key={t.key} style={navBtn(tab === t.key, t.isComando)} onClick={() => setTab(t.key)}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Body */}
      <div style={S.body}>
        {tab === "comando"    && <TabComando    candidatos={candidatos} aprovados={aprovados} pesquisa={pesquisa} mba={mba as never[]} manchester={manchester as never[]} portacath={portacath as never[]} workshop={workshop as never[]} cursos={cursos} />}
        {tab === "inscritos"  && <TabInscritos  inscritos={inscritosVestibular} todosInscritos={candidatos} cursos={cursos} />}
        {tab === "aprovados"  && <TabAprovados  aprovados={aprovadosNaoMatriculados} />}
        {tab === "matriculas" && <TabMatriculas />}
        {tab === "chamada"    && <TabListaChamada />}
        {tab === "pesquisa"   && <TabPesquisa   />}
        {tab === "mba"        && <TabEvento evento="mba"        tipo="mba"        />}
        {tab === "manchester" && <TabEvento evento="manchester"  tipo="manchester"  />}
        {tab === "portacath"  && <TabEvento evento="portacath"   tipo="portacath"   />}
        {tab === "workshop"   && <TabEvento evento="workshop"    tipo="workshop"    />}
        {tab === "cursos"     && <TabGerenciarCursos cursos={cursos} />}
      </div>

      {/* Footer */}
      <div style={S.footer}>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,.2)" }}>
          Sistema de Captação · AlfaUnipac · {user?.nome}
        </span>
        <span style={{ fontSize: 10, color: "rgba(255,255,255,.2)" }}>
          Powered by{" "}
          <span style={{ color: "#00D4FF", fontWeight: 700 }}>ARGO SYSTEMS</span>
        </span>
      </div>
    </div>
  );
}
