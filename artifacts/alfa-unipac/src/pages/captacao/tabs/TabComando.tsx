import { useMemo } from "react";
import type { Candidato, Aprovado, Pesquisa, Curso } from "../types";

// ── Constantes idênticas ao HomeDashboard.jsx original ────────────────────
const CAP          = 55;
const META_DEMANDA = 40;
const GREEN  = "#1D9E75";
const RED    = "#E24B4A";
const YELLOW = "#F4C96A";
const ORANGE = "#F47920";
const NAVY   = "#1E2D6B";
const BLUE   = "#378ADD";
const PURPLE = "#534AB7";

const CURSO_CFG: Record<string, { icon: string; cor: string; area: string }> = {
  "Fisioterapia":  { icon: "🦴", cor: "#378ADD", area: "Ciências da Saúde" },
  "Farmácia":      { icon: "💊", cor: "#534AB7", area: "Ciências da Saúde" },
  "Administração": { icon: "📊", cor: "#F47920", area: "Ciências Sociais"  },
  "Nutrição":      { icon: "🥗", cor: "#1D9E75", area: "Ciências da Saúde" },
  "Enfermagem":    { icon: "🏥", cor: "#E24B4A", area: "Ciências da Saúde" },
  "Psicologia":    { icon: "🧠", cor: "#885EA5", area: "Ciências da Saúde" },
};

// Keyframes CSS idênticos ao original
const CSS = `
  @keyframes hd-pulse  { 0%,100%{opacity:1} 50%{opacity:.3} }
  @keyframes hd-glow-o { 0%,100%{box-shadow:0 0 28px rgba(244,121,32,.1)} 50%{box-shadow:0 0 56px rgba(244,121,32,.28)} }
  @keyframes hd-glow-g { 0%,100%{box-shadow:0 0 28px rgba(29,158,117,.08)} 50%{box-shadow:0 0 52px rgba(29,158,117,.24)} }
  @keyframes hd-fade   { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }

  .hd-dot-r { animation: hd-pulse 1.3s ease-in-out infinite; }
  .hd-dot-g { animation: hd-pulse 2.1s ease-in-out infinite; }
  .hd-dot-y { animation: hd-pulse 1.7s ease-in-out infinite; }
  .hd-dot-b { animation: hd-pulse 2.5s ease-in-out infinite; }
  .hd-glow-action { animation: hd-glow-o 2.8s ease-in-out infinite; }
  .hd-glow-top    { animation: hd-glow-g 2.8s ease-in-out infinite; }
  .hd-f1 { animation: hd-fade .3s .05s ease both; }
  .hd-f2 { animation: hd-fade .3s .12s ease both; }
  .hd-f3 { animation: hd-fade .3s .19s ease both; }
  .hd-f4 { animation: hd-fade .3s .26s ease both; }
  .hd-f5 { animation: hd-fade .3s .33s ease both; }

  .hd-rank:hover  { background: rgba(255,255,255,.04) !important; }
  .hd-alert:hover { background: rgba(255,255,255,.05) !important; }
  .hd-prog        { transition: width .9s cubic-bezier(.4,0,.2,1); }
  .hd-kpi:hover   { border-color: rgba(255,255,255,.16) !important; transform: translateY(-1px); transition: all .18s; }
  .hd-prog-card:hover { border-color: rgba(255,255,255,.14) !important; transition: border-color .18s; }
`;

function dot(cls: string, color: string) {
  return <span className={cls} style={{ display: "inline-block", width: 7, height: 7, borderRadius: "50%", background: color, flexShrink: 0 }} />;
}

function ScoreRing({ pct, color, size = 56 }: { pct: number; color: string; size?: number }) {
  const r    = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(pct, 100) / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,.06)" strokeWidth={6} />
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={6}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ transition: "stroke-dasharray .9s cubic-bezier(.4,0,.2,1)" }} />
      <text x={size/2} y={size/2} textAnchor="middle" dominantBaseline="central"
        style={{ fill: "#fff", fontSize: 11, fontWeight: 900, fontFamily: "Inter", transform: "rotate(90deg)", transformOrigin: `${size/2}px ${size/2}px` } as React.CSSProperties}>
        {pct}%
      </text>
    </svg>
  );
}

type CoordStat = {
  nome: string; op1: number; op2: number; ponderada: number; pct: number;
  turmas: number; excedente: number; faltam: number;
  viab: "viavel" | "proxima" | "atencao";
  cfg: { icon: string; cor: string; area: string };
  intel: { label: string; color: string };
};

export default function TabComando({ candidatos, aprovados, pesquisa, mba, manchester, portacath, workshop, cursos }: {
  candidatos: Candidato[]; aprovados: Aprovado[]; pesquisa: Pesquisa[];
  mba: {id:number}[]; manchester: {id:number}[]; portacath: {id:number}[]; workshop: {id:number}[];
  cursos: Curso[];
}) {
  const cursosNomes = cursos.length > 0 ? cursos.map(c => c.nome) : Object.keys(CURSO_CFG);

  type DemandaStat = { nome: string; ponderada: number; op1: number; op2: number; pct: number };

  const demandaStats = useMemo<DemandaStat[]>(() => {
    const acc: Record<string, { ponderada: number; op1: number; op2: number }> = {};
    for (const p of pesquisa) {
      if (p.curso) {
        if (!acc[p.curso]) acc[p.curso] = { ponderada: 0, op1: 0, op2: 0 };
        acc[p.curso].op1       += 1;
        acc[p.curso].ponderada += 1;
      }
      if (p.cursoAlternativo) {
        if (!acc[p.cursoAlternativo]) acc[p.cursoAlternativo] = { ponderada: 0, op1: 0, op2: 0 };
        acc[p.cursoAlternativo].op2       += 1;
        acc[p.cursoAlternativo].ponderada += 0.5;
      }
    }
    return Object.entries(acc)
      .map(([nome, v]) => ({
        nome,
        ponderada: Math.round(v.ponderada),
        op1: v.op1,
        op2: v.op2,
        pct: Math.round((Math.round(v.ponderada) / META_DEMANDA) * 100),
      }))
      .sort((a, b) => b.ponderada - a.ponderada);
  }, [pesquisa]);

  const stats = useMemo<CoordStat[]>(() => cursosNomes.map(nome => {
    const op1       = candidatos.filter(c => c.curso1 === nome).length;
    const op2       = candidatos.filter(c => c.curso2 === nome).length;
    const ponderada = Math.round(op1 + op2 * 0.5);
    const pct       = Math.round((ponderada / CAP) * 100);
    const turmas    = Math.floor(ponderada / CAP);
    const excedente = ponderada % CAP;
    const faltam    = excedente > 0 ? CAP - excedente : 0;
    const viab: CoordStat["viab"] = pct >= 100 ? "viavel" : pct >= 70 ? "proxima" : "atencao";
    const cfg  = CURSO_CFG[nome] || { icon: "📚", cor: "#8892B0", area: "Outros" };
    const intel = pct >= 90 ? { label: "ABRE AGORA", color: GREEN  }
                : pct >= 70 ? { label: "PRÓXIMO",    color: YELLOW }
                : pct >= 40 ? { label: "ATENÇÃO",    color: ORANGE }
                :             { label: "RISCO",       color: RED    };
    return { nome, op1, op2, ponderada, pct, turmas, excedente, faltam, viab, cfg, intel };
  }).sort((a, b) => b.ponderada - a.ponderada), [candidatos, cursos]);

  const top           = stats[0];
  const maxPond       = Math.max(...stats.map(c => c.ponderada), 1);
  const viaveis       = stats.filter(c => c.viab === "viavel");
  const proximos      = stats.filter(c => c.viab === "proxima");
  const criticos      = stats.filter(c => c.viab === "atencao");
  const matriculados  = aprovados.filter(a => a.matriculado).length;
  const emAprovacao   = aprovados.filter(a => !a.matriculado).length;
  const convAprov     = candidatos.length > 0 ? Math.round(aprovados.length / candidatos.length * 100) : 0;
  const convMatr      = aprovados.length  > 0 ? Math.round(matriculados / aprovados.length * 100) : 0;
  const totalPrograms = mba.length + manchester.length + portacath.length + workshop.length;
  const totalAlertas  = criticos.length + proximos.length;

  const programs = [
    { label: "MBA Cuidados Paliativos",   icon: "🏥", count: mba.length,        cor: "#534AB7", key: "mba"       },
    { label: "Protocolo Manchester",       icon: "🩺", count: manchester.length,  cor: "#1D9E75", key: "manchester" },
    { label: "Capacitação Port-a-Cath",   icon: "💉", count: portacath.length,   cor: "#0092B3", key: "portacath"  },
    { label: "Workshop Hospitalar",        icon: "🏛️", count: workshop.length,    cor: "#C07E00", key: "workshop"   },
  ];

  const rec = top
    ? top.viab === "viavel"
      ? `Abrir turma de ${top.nome} imediatamente — ${top.ponderada} alunos ponderados`
      : top.viab === "proxima"
      ? `Intensificar captação de ${top.nome} — faltam ${top.faltam} para a meta`
      : `Ação urgente em ${top.nome} — demanda abaixo do mínimo`
    : "Aguardando dados de inscrições";

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#fff" }}>
      <style>{CSS}</style>

      {/* ═══ HERO EXECUTIVO ═══════════════════════════════════════════════ */}
      <div style={{ background: "linear-gradient(135deg,#050A15 0%,#080E22 45%,#0A1230 100%)", borderRadius: 20, border: "1px solid rgba(255,255,255,.07)", overflow: "hidden", marginBottom: 20, position: "relative" }}>
        {/* Grade decorativa */}
        <div style={{ position: "absolute", inset: 0, opacity: .025, backgroundImage: "linear-gradient(rgba(255,255,255,.8) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.8) 1px,transparent 1px)", backgroundSize: "36px 36px", pointerEvents: "none" }} />
        {/* Glow blob */}
        <div style={{ position: "absolute", top: -80, left: "30%", width: 500, height: 300, borderRadius: "50%", background: "rgba(56,138,221,.05)", filter: "blur(60px)", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 1, display: "grid", gridTemplateColumns: "1fr auto", gap: 0 }}>
          {/* Lado esquerdo */}
          <div style={{ padding: "36px 40px", borderRight: "1px solid rgba(255,255,255,.06)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
              {dot("hd-dot-g", GREEN)}
              <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".15em" }}>
                Cockpit Acadêmico · Polo GV · 2026/2
              </span>
            </div>
            <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.25)", textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 10 }}>⚡ Ação recomendada</div>
            <div className="hd-glow-action hd-f1" style={{ background: "rgba(244,121,32,.08)", border: "1px solid rgba(244,121,32,.2)", borderRadius: 16, padding: "20px 24px", marginBottom: 24, display: "inline-block", maxWidth: 580 }}>
              <div style={{ fontSize: "clamp(18px,2.4vw,28px)", fontWeight: 900, color: "#fff", letterSpacing: "-.03em", lineHeight: 1.15, marginBottom: 10 }}>
                {rec}
              </div>
              {top && (
                <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 11, color: ORANGE, fontWeight: 700 }}>🎯 {top.pct}% da meta</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)", fontWeight: 600 }}>·</span>
                  <span style={{ fontSize: 11, color: GREEN, fontWeight: 700 }}>✓ {top.turmas} turma{top.turmas !== 1 ? "s" : ""} viável{top.turmas !== 1 ? "is" : ""}</span>
                  {top.excedente > 0 && <>
                    <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)" }}>·</span>
                    <span style={{ fontSize: 11, color: YELLOW, fontWeight: 700 }}>⚡ {top.excedente} excedentes</span>
                  </>}
                </div>
              )}
            </div>
            {top && (
              <div className="hd-f2" style={{ display: "flex", alignItems: "center", gap: 20 }}>
                <div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>Probabilidade de abertura</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <ScoreRing pct={Math.min(top.pct, 100)} color={top.intel.color} size={64} />
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 900, color: top.intel.color }}>{top.intel.label}</div>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 3 }}>Score: {Math.min(top.pct, 100)}/100</div>
                    </div>
                  </div>
                </div>
                <div style={{ width: 1, height: 60, background: "rgba(255,255,255,.08)" }} />
                <div>
                  <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", fontWeight: 700, textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 6 }}>Risco operacional</div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {dot(criticos.length > 0 ? "hd-dot-r" : "hd-dot-g", criticos.length > 0 ? RED : GREEN)}
                    <span style={{ fontSize: 16, fontWeight: 800, color: criticos.length > 0 ? RED : GREEN }}>
                      {criticos.length > 0 ? `${criticos.length} curso${criticos.length > 1 ? "s" : ""} em risco` : "Operação estável"}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 3 }}>
                    {proximos.length} próximos da meta · {viaveis.length} viáveis
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* KPIs coluna direita */}
          <div style={{ display: "grid", gridTemplateRows: "repeat(3,1fr)", width: 220 }}>
            {[
              { label: "Pré-inscritos", val: candidatos.length, sub: "total geral",          color: "#7DC5FF", accent: BLUE   },
              { label: "Em aprovação",  val: emAprovacao,        sub: "aguardando matrícula", color: YELLOW,    accent: YELLOW },
              { label: "Matriculados",  val: matriculados,       sub: "confirmados",          color: GREEN,     accent: GREEN  },
            ].map(({ label, val, sub, color, accent }) => (
              <div key={label} style={{ padding: "20px 22px", borderBottom: "1px solid rgba(255,255,255,.05)", borderLeft: "none" }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,.28)", textTransform: "uppercase", letterSpacing: ".1em", marginBottom: 8 }}>{label}</div>
                <div style={{ fontSize: 30, fontWeight: 900, color, lineHeight: 1, letterSpacing: "-.03em" }}>{val}</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.25)", marginTop: 5 }}>{sub}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ CENTRAL DE ALERTAS + FUNIL + PROGRAMAS ══════════════════════ */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 240px 1fr", gap: 14, marginBottom: 20 }}>

        {/* Central de alertas */}
        <div className="hd-f3" style={{ background: "#0A1128", borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 10 }}>
            {dot("hd-dot-r", RED)}
            <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".12em" }}>Central de alertas</span>
            {totalAlertas > 0 && <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 800, color: RED, background: "rgba(226,75,74,.12)", border: "1px solid rgba(226,75,74,.25)", borderRadius: 20, padding: "2px 8px" }}>{totalAlertas}</span>}
          </div>
          <div style={{ padding: "12px 8px" }}>
            {criticos.length === 0 && proximos.length === 0 && viaveis.length === 0 && (
              <div style={{ padding: "20px", textAlign: "center" }}>
                <div style={{ fontSize: 22, marginBottom: 8 }}>✅</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: GREEN }}>Operação estável</div>
                <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", marginTop: 4 }}>Nenhum curso em risco</div>
              </div>
            )}
            {[
              ...criticos.map(c => ({ ...c, dotCls: "hd-dot-r", dotColor: RED,    msg: `${c.faltam} alunos para viabilizar` })),
              ...proximos.map(c => ({ ...c, dotCls: "hd-dot-y", dotColor: YELLOW,  msg: `${c.faltam} alunos para completar` })),
              ...viaveis.map(c  => ({ ...c, dotCls: "hd-dot-g", dotColor: GREEN,   msg: `${c.turmas} turma${c.turmas !== 1 ? "s" : ""} confirmada${c.turmas !== 1 ? "s" : ""}` })),
            ].map(item => (
              <div key={item.nome} className="hd-alert" style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 10, marginBottom: 2 }}>
                {dot(item.dotCls, item.dotColor)}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{item.nome}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,.35)", marginTop: 1 }}>{item.msg}</div>
                </div>
                <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 800, color: item.dotColor, flexShrink: 0 }}>{item.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Funil */}
        <div className="hd-f4" style={{ background: "#0A1128", borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", padding: "16px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".12em", marginBottom: 16, display: "flex", alignItems: "center", gap: 8 }}>
            {dot("hd-dot-b", BLUE)}Funil
          </div>
          {[
            { label: "Inscritos",    val: candidatos.length, color: BLUE,   pct: 100,      width: "100%"          },
            { label: "Aprovados",    val: aprovados.length,  color: YELLOW, pct: convAprov, width: `${convAprov}%` },
            { label: "Matriculados", val: matriculados,       color: GREEN,  pct: convMatr,  width: `${convMatr}%`  },
          ].map(({ label, val, color, pct, width }, i) => (
            <div key={label} style={{ marginBottom: i < 2 ? 14 : 0 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 5 }}>
                <span style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.5)" }}>{label}</span>
                <span style={{ fontSize: 14, fontWeight: 900, color }}>{val}</span>
              </div>
              <div style={{ height: 5, background: "rgba(255,255,255,.06)", borderRadius: 3, overflow: "hidden" }}>
                <div className="hd-prog" style={{ height: "100%", width, background: color, borderRadius: 3 }} />
              </div>
              {i < 2 && <div style={{ fontSize: 9, color: "rgba(255,255,255,.25)", marginTop: 3, textAlign: "right" }}>
                {i === 0 ? `${convAprov}% aprovados` : `${convMatr}% matriculados`}
              </div>}
            </div>
          ))}
          {candidatos.length > 0 && (
            <div style={{ marginTop: "auto", paddingTop: 14, borderTop: "1px solid rgba(255,255,255,.05)" }}>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.28)", textTransform: "uppercase", letterSpacing: ".09em", marginBottom: 4 }}>Conversão geral</div>
              <div style={{ fontSize: 22, fontWeight: 900, color: ORANGE }}>{Math.round(matriculados / candidatos.length * 100)}%</div>
              <div style={{ fontSize: 9, color: "rgba(255,255,255,.25)" }}>inscrito → matriculado</div>
            </div>
          )}
        </div>

        {/* Programas executivos */}
        <div className="hd-f5" style={{ background: "#0A1128", borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 10 }}>
            {dot("hd-dot-b", PURPLE)}
            <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".12em" }}>Programas executivos</span>
            <span style={{ marginLeft: "auto", fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,.4)" }}>{totalPrograms} total</span>
          </div>
          <div style={{ padding: "12px 8px" }}>
            {programs.map(p => (
              <div key={p.key} className="hd-prog-card" style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 12px", borderRadius: 10, border: "1px solid transparent", marginBottom: 4 }}>
                <div style={{ width: 36, height: 36, borderRadius: 9, background: `${p.cor}18`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{p.icon}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.75)", lineHeight: 1.3 }}>{p.label}</div>
                  <div style={{ height: 3, background: "rgba(255,255,255,.06)", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
                    <div className="hd-prog" style={{ height: "100%", width: p.count > 0 ? `${Math.min((p.count / 30) * 100, 100)}%` : "0%", background: p.cor, borderRadius: 2 }} />
                  </div>
                </div>
                <div style={{ textAlign: "right", flexShrink: 0 }}>
                  <div style={{ fontSize: 18, fontWeight: 900, color: p.count > 0 ? p.cor : "rgba(255,255,255,.2)", lineHeight: 1 }}>{p.count}</div>
                  <div style={{ fontSize: 8, color: p.count > 0 ? "rgba(255,255,255,.35)" : "rgba(255,255,255,.18)", marginTop: 2, fontWeight: 600, textTransform: "uppercase" }}>
                    {p.count > 0 ? "inscritos" : "aguard."}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ RANKING EXECUTIVO DE CURSOS ══════════════════════════════════ */}
      <div style={{ background: "#0A1128", borderRadius: 16, border: "1px solid rgba(255,255,255,.07)", overflow: "hidden", marginBottom: 20 }}>
        <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".14em" }}>Ranking executivo · viabilidade por curso</span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.06)" }} />
          <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>Meta: {CAP} alunos/turma</span>
        </div>
        {stats.length === 0 ? (
          <div style={{ padding: "48px 24px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>📊</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,.4)" }}>Captação ativa</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.25)", marginTop: 6 }}>Aguardando inscrições para análise de viabilidade</div>
          </div>
        ) : stats.map((c, i) => {
          const metaW = `${Math.min(c.pct, 100)}%`;
          return (
            <div key={c.nome} className="hd-rank" style={{ display: "grid", gridTemplateColumns: "44px 40px 200px 1fr 180px 140px", alignItems: "center", gap: 16, padding: "16px 24px", borderBottom: "1px solid rgba(255,255,255,.04)", background: "transparent" }}>
              <div style={{ fontSize: 11, fontWeight: 900, color: "rgba(255,255,255,.18)", textAlign: "center" }}>#{i + 1}</div>
              <ScoreRing pct={Math.min(c.pct, 100)} color={c.intel.color} size={40} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 16 }}>{c.cfg.icon}</span>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: "#fff" }}>{c.nome}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", marginTop: 1 }}>{c.cfg.area}</div>
                  </div>
                </div>
              </div>
              <div>
                <div style={{ display: "flex", gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,.35)", fontWeight: 600 }}>op1: {c.op1}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,.2)" }}>·</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,.35)", fontWeight: 600 }}>op2: {c.op2}</span>
                  <span style={{ fontSize: 10, color: "rgba(255,255,255,.2)" }}>·</span>
                  <span style={{ fontSize: 10, color: ORANGE, fontWeight: 700 }}>pond: {c.ponderada}</span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,.06)", borderRadius: 3, overflow: "hidden" }}>
                  <div className="hd-prog" style={{ height: "100%", width: metaW, background: `linear-gradient(90deg, ${c.cfg.cor}, ${c.intel.color})`, borderRadius: 3 }} />
                </div>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {[
                  { val: c.turmas,    label: "turmas",  color: c.turmas > 0    ? GREEN  : "rgba(255,255,255,.2)" },
                  { val: c.excedente, label: "excess.", color: c.excedente > 0  ? YELLOW : "rgba(255,255,255,.2)" },
                  { val: c.faltam,    label: "faltam",  color: c.faltam > 0    ? RED    : GREEN                   },
                ].map(({ val, label, color }) => (
                  <div key={label} style={{ textAlign: "center", flex: 1, background: "rgba(255,255,255,.03)", borderRadius: 8, padding: "6px 4px" }}>
                    <div style={{ fontSize: 15, fontWeight: 900, color, lineHeight: 1 }}>{val}</div>
                    <div style={{ fontSize: 8, color: "rgba(255,255,255,.28)", marginTop: 2, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: 9, fontWeight: 800, padding: "5px 12px", borderRadius: 20, textTransform: "uppercase", letterSpacing: ".08em", color: c.intel.color, background: `${c.intel.color}14`, border: `1px solid ${c.intel.color}30` }}>
                  {c.intel.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ═══ ANÁLISE DE DEMANDA — NOVOS CURSOS ═══════════════════════════ */}
      {demandaStats.length > 0 && (
        <div style={{ background: "#0A1128", borderRadius: 16, border: "1px solid rgba(244,121,32,.15)", overflow: "hidden", marginBottom: 20 }}>
          <div style={{ padding: "18px 24px", borderBottom: "1px solid rgba(244,121,32,.1)", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(244,121,32,.6)", textTransform: "uppercase", letterSpacing: ".14em" }}>
              Análise de Demanda · Pesquisa de Interesse
            </span>
            <div style={{ flex: 1, height: 1, background: "rgba(244,121,32,.1)" }} />
            <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)" }}>Meta de viabilidade: {META_DEMANDA} alunos</span>
          </div>
          <div style={{ padding: "12px 24px 8px" }}>
            {demandaStats.map((d, i) => {
              const barW   = `${Math.min(d.pct, 100)}%`;
              const rec    = d.pct >= 100 ? { label: "Viável para implantação", color: "#1D9E75" }
                           : d.pct >= 50  ? { label: "Em análise",              color: "#F4C96A" }
                           :                { label: "Demanda insuficiente",     color: "#F47920" };
              return (
                <div key={d.nome} className="hd-rank"
                  style={{ display: "grid", gridTemplateColumns: "28px 200px 1fr 160px 150px", alignItems: "center", gap: 16, padding: "12px 0", borderBottom: i < demandaStats.length - 1 ? "1px solid rgba(255,255,255,.04)" : "none" }}>
                  <div style={{ fontSize: 10, fontWeight: 900, color: "rgba(255,255,255,.18)", textAlign: "center" }}>#{i + 1}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: "#fff" }}>{d.nome}</div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,.3)", marginTop: 2 }}>op1: {d.op1} · op2: {d.op2} · pond: {d.ponderada}</div>
                  </div>
                  <div>
                    <div style={{ height: 6, background: "rgba(255,255,255,.06)", borderRadius: 3, overflow: "hidden" }}>
                      <div className="hd-prog" style={{ height: "100%", width: barW, background: `linear-gradient(90deg,${ORANGE},${rec.color})`, borderRadius: 3 }} />
                    </div>
                    <div style={{ fontSize: 9, color: "rgba(255,255,255,.25)", marginTop: 3 }}>{Math.min(d.pct, 100)}% · faltam {Math.max(META_DEMANDA - d.ponderada, 0)}</div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    {[
                      { val: d.ponderada, label: "pond.", color: ORANGE },
                      { val: META_DEMANDA - d.ponderada > 0 ? META_DEMANDA - d.ponderada : 0, label: "faltam", color: d.ponderada >= META_DEMANDA ? "#1D9E75" : "#F4C96A" },
                    ].map(({ val, label, color }) => (
                      <div key={label} style={{ textAlign: "center", flex: 1, background: "rgba(255,255,255,.03)", borderRadius: 8, padding: "5px 4px" }}>
                        <div style={{ fontSize: 14, fontWeight: 900, color, lineHeight: 1 }}>{val}</div>
                        <div style={{ fontSize: 8, color: "rgba(255,255,255,.28)", marginTop: 2, textTransform: "uppercase", letterSpacing: ".06em" }}>{label}</div>
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: 9, fontWeight: 800, padding: "5px 12px", borderRadius: 20, textTransform: "uppercase", letterSpacing: ".08em", color: rec.color, background: `${rec.color}18`, border: `1px solid ${rec.color}30` }}>
                      {rec.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ CENTRAL DE INTELIGÊNCIA ACADÊMICA ════════════════════════════ */}
      <div className="hd-glow-top" style={{ background: "linear-gradient(135deg,#060C18 0%,#091020 50%,#0B1428 100%)", borderRadius: 20, border: "1px solid rgba(29,158,117,.15)", overflow: "hidden", position: "relative" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 300, height: 300, borderRadius: "50%", background: "rgba(29,158,117,.04)", filter: "blur(40px)", pointerEvents: "none" }} />
        <div style={{ padding: "20px 28px", borderBottom: "1px solid rgba(29,158,117,.12)", display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
          {dot("hd-dot-g", GREEN)}
          <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(29,158,117,.6)", textTransform: "uppercase", letterSpacing: ".15em" }}>Central de inteligência acadêmica</span>
          <div style={{ flex: 1, height: 1, background: "rgba(29,158,117,.12)" }} />
          <span style={{ fontSize: 10, color: "rgba(29,158,117,.5)", fontWeight: 600 }}>IA decisória · tempo real</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 0, position: "relative" }}>
          {[
            {
              icon: "🎯", title: "Curso Líder de Demanda",
              value: top?.nome || "—",
              sub: top ? `${top.ponderada} alunos ponderados · ${Math.min(top.pct, 100)}% da meta` : "Sem dados",
              color: ORANGE, accent: "rgba(244,121,32,.08)",
              insight: top?.viab === "viavel" ? "✓ Viabilidade confirmada para abertura imediata"
                     : top?.viab === "proxima" ? "⚡ Pequena campanha garante a turma"
                     : "⚠ Requer intensificação urgente de captação"
            },
            {
              icon: "📈", title: "Saúde do Funil",
              value: `${convAprov}%`,
              sub: "Taxa inscritos → aprovados",
              color: convAprov >= 60 ? GREEN : convAprov >= 30 ? YELLOW : RED,
              accent: `rgba(${convAprov >= 60 ? "29,158,117" : convAprov >= 30 ? "244,201,106" : "226,75,74"},.08)`,
              insight: convAprov >= 60 ? "✓ Funil operando com excelência"
                     : convAprov >= 30 ? "⚡ Aprovação pode ser acelerada"
                     : "⚠ Taxa de aprovação abaixo do esperado"
            },
            {
              icon: "🏆", title: "Score de Abertura",
              value: top ? `${Math.min(top.pct, 100)}` : "—",
              sub: top ? `${top.nome} · nota de viabilidade` : "Sem dados",
              color: top?.intel?.color || GREEN,
              accent: "rgba(29,158,117,.08)",
              insight: top
                ? top.pct >= 100 ? `✓ ${top.turmas} turma${top.turmas !== 1 ? "s" : ""} já podem ser abertas agora`
                : top.pct >= 70  ? `⚡ Faltam ${top.faltam} alunos para completar a turma`
                :                  `⚠ Campanha necessária — captação atual insuficiente`
                : "Aguardando inscrições"
            },
            {
              icon: "🌐", title: "Pesquisa de Demanda",
              value: pesquisa.length,
              sub: `${pesquisa.length} manifestações registradas`,
              color: BLUE, accent: "rgba(56,138,221,.08)",
              insight: pesquisa.length >= CAP ? "✓ Demanda suficiente para análise de novos cursos"
                     : pesquisa.length > 0    ? `⚡ ${CAP - pesquisa.length} manifestações para análise qualificada`
                     :                          "⚠ Iniciar captação de pesquisa de demanda"
            },
            {
              icon: "⚠", title: "Cursos em Risco",
              value: criticos.length,
              sub: criticos.length > 0 ? criticos.map(c => c.nome).join(" · ") : "Nenhum curso crítico",
              color: criticos.length > 0 ? RED : GREEN,
              accent: criticos.length > 0 ? "rgba(226,75,74,.08)" : "rgba(29,158,117,.08)",
              insight: criticos.length > 0
                ? `⚠ Ação imediata: intensificar captação em ${criticos.length} curso${criticos.length > 1 ? "s" : ""}`
                : "✓ Nenhum curso abaixo do limite crítico"
            },
            {
              icon: "🎓", title: "Programas Executivos",
              value: totalPrograms,
              sub: `${programs.filter(p => p.count > 0).length} de ${programs.length} com inscrições`,
              color: PURPLE, accent: "rgba(83,74,183,.08)",
              insight: totalPrograms > 0
                ? `✓ ${programs.filter(p => p.count > 0).map(p => p.label.split(" ")[0]).join(", ")} captando ativamente`
                : "⚡ Nenhum programa executivo com inscrições ainda"
            },
          ].map(({ icon, title, value, sub, color, accent, insight }, i) => (
            <div key={title} style={{ padding: "22px 24px", borderRight: i % 3 < 2 ? "1px solid rgba(29,158,117,.08)" : "none", borderBottom: i < 3 ? "1px solid rgba(29,158,117,.08)" : "none", background: accent }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{ fontSize: 20 }}>{icon}</span>
                <span style={{ fontSize: 9, fontWeight: 800, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".1em" }}>{title}</span>
              </div>
              <div style={{ fontSize: 28, fontWeight: 900, color, letterSpacing: "-.03em", lineHeight: 1, marginBottom: 4 }}>{value}</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.3)", marginBottom: 14 }}>{sub}</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,.5)", lineHeight: 1.55, borderTop: "1px solid rgba(255,255,255,.05)", paddingTop: 12 }}>{insight}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
