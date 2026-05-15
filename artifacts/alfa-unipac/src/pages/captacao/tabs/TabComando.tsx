import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { Candidato, Aprovado, Pesquisa } from "../PainelCaptacao";

// ── Constantes de negócio ────────────────────────────────────────────────────
const META        = 55;   // inscritos mínimos para viabilizar uma turma
const META_IDEAL  = 70;   // inscritos para turma confortável

// ── Tipos ────────────────────────────────────────────────────────────────────
type Inscricao = { id: number; nome: string };

type CursoStat = {
  curso: string;
  inscritos: number;
  aprovados: number;
  matriculados: number;
  score: number;
  turmasViaveis: number;
  excedente: number;
  risco: "BAIXO" | "MÉDIO" | "ALTO";
};

// ── Helpers ──────────────────────────────────────────────────────────────────
function calcScore(n: number) { return Math.min(100, Math.round((n / META) * 100)); }

function buildCursoStats(
  candidatos: Candidato[],
  aprovados: Aprovado[],
): CursoStat[] {
  const ins:  Record<string, number> = {};
  const apro: Record<string, number> = {};
  const mat:  Record<string, number> = {};

  for (const c of candidatos) ins[c.curso1] = (ins[c.curso1] ?? 0) + 1;
  for (const a of aprovados)  apro[a.curso] = (apro[a.curso] ?? 0) + 1;
  for (const a of aprovados.filter(a => a.matriculado)) mat[a.curso] = (mat[a.curso] ?? 0) + 1;

  return Object.entries(ins)
    .map(([curso, count]) => {
      const score          = calcScore(count);
      const turmasViaveis  = Math.floor(count / META);
      const excedente      = count - META;
      const risco: CursoStat["risco"] = score >= 100 ? "BAIXO" : score >= 70 ? "MÉDIO" : "ALTO";
      return { curso, inscritos: count, aprovados: apro[curso] ?? 0, matriculados: mat[curso] ?? 0, score, turmasViaveis, excedente, risco };
    })
    .sort((a, b) => b.inscritos - a.inscritos);
}

// ── Micro-componentes visuais ────────────────────────────────────────────────

function ScoreRing({ score, size = 64 }: { score: number; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;
  const color = score >= 100 ? "#00E5FF" : score >= 70 ? "#FFB800" : "#FF4040";
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={4} />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={4}
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }} />
      <text x="50%" y="52%" textAnchor="middle" dominantBaseline="middle"
        fill={color} fontSize={size < 60 ? 9 : 11} fontWeight={700}
        style={{ transform: "rotate(90deg)", transformOrigin: "center", fontFamily: "ui-monospace, monospace" }}>
        {score}%
      </text>
    </svg>
  );
}

function FunnelBar({ label, value, pct, color }: { label: string; value: number; pct: number; color: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: "ui-monospace, monospace" }}>
        {value}
      </div>
      <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}60` }} />
      </div>
      <div className="text-[10px] font-semibold tracking-widest uppercase" style={{ color }}>
        {label}
      </div>
    </div>
  );
}

function RiscoBadge({ risco }: { risco: CursoStat["risco"] }) {
  const cfg = {
    BAIXO: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", text: "text-emerald-400", glow: "0 0 12px rgba(0,217,126,0.3)" },
    MÉDIO: { bg: "bg-amber-500/10",   border: "border-amber-500/30",   text: "text-amber-400",   glow: "0 0 12px rgba(255,184,0,0.3)" },
    ALTO:  { bg: "bg-red-500/10",     border: "border-red-500/30",     text: "text-red-400",      glow: "0 0 12px rgba(255,64,64,0.3)" },
  }[risco];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold tracking-widest rounded border ${cfg.bg} ${cfg.border} ${cfg.text}`}
      style={{ boxShadow: cfg.glow }}>
      ● {risco}
    </span>
  );
}

function AlertRow({ label, value, type }: { label: string; value: number; type: "danger" | "warn" | "ok" }) {
  const color = type === "danger" ? "#FF4040" : type === "warn" ? "#FFB800" : "#00D97E";
  const bg    = type === "danger" ? "bg-red-500/5 border-red-500/20" : type === "warn" ? "bg-amber-500/5 border-amber-500/20" : "bg-emerald-500/5 border-emerald-500/20";
  return (
    <div className={`flex items-center justify-between px-3 py-2 rounded border ${bg}`}>
      <span className="text-xs text-slate-300 truncate flex-1 mr-2">{label}</span>
      <span className="text-sm font-black tabular-nums" style={{ color, fontFamily: "ui-monospace, monospace" }}>
        {value}
      </span>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function TabComando({ candidatos, aprovados, pesquisa }: {
  candidatos: Candidato[]; aprovados: Aprovado[]; pesquisa: Pesquisa[];
}) {
  const { data: mba        = [] } = useQuery<Inscricao[]>({ queryKey: ["vc-mba"],        queryFn: () => apiFetch("/api/vestibular/inscricoes/mba")       });
  const { data: manchester = [] } = useQuery<Inscricao[]>({ queryKey: ["vc-manchester"], queryFn: () => apiFetch("/api/vestibular/inscricoes/manchester") });
  const { data: portacath  = [] } = useQuery<Inscricao[]>({ queryKey: ["vc-portacath"],  queryFn: () => apiFetch("/api/vestibular/inscricoes/portacath")  });
  const { data: workshop   = [] } = useQuery<Inscricao[]>({ queryKey: ["vc-workshop"],   queryFn: () => apiFetch("/api/vestibular/inscricoes/workshop")   });

  const stats    = buildCursoStats(candidatos, aprovados);
  const hero     = stats.find(c => c.score >= 100) ?? stats[0];
  const totalMat = aprovados.filter(a => a.matriculado).length;

  const taxaAprova = candidatos.length > 0 ? Math.round((aprovados.length / candidatos.length) * 100) : 0;
  const taxaMat    = aprovados.length   > 0 ? Math.round((totalMat       / aprovados.length)   * 100) : 0;

  const criticos  = stats.filter(c => c.score < 70);
  const acimaMeta = stats.filter(c => c.inscritos >= META_IDEAL);
  const abaixo    = stats.filter(c => c.score >= 70 && c.inscritos < META_IDEAL);

  const now = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

  // dot-grid bg
  const gridBg: React.CSSProperties = {
    backgroundImage: "radial-gradient(rgba(0,229,255,0.04) 1px, transparent 1px)",
    backgroundSize: "28px 28px",
  };

  return (
    <div className="relative min-h-full p-5 space-y-4" style={{ background: "#020B18", ...gridBg }}>

      {/* ── Status bar ──────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-4 py-2 rounded-lg border border-white/[0.04] bg-white/[0.02]">
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" style={{ boxShadow: "0 0 6px #00D97E" }} />
          <span className="text-[10px] font-semibold text-emerald-400 tracking-widest uppercase">Sistema Ativo</span>
        </div>
        <div className="w-px h-3 bg-white/10" />
        <span className="text-[10px] text-slate-500 font-mono">VESTIBULAR 2026/2</span>
        <div className="flex-1" />
        <span className="text-[10px] text-slate-500 font-mono">{candidatos.length} registros carregados</span>
        <div className="w-px h-3 bg-white/10" />
        <span className="text-[10px] text-slate-500 font-mono">{now}</span>
      </div>

      {/* ── Hero + Lateral ────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Hero */}
        {hero && (
          <div className="lg:col-span-2 relative overflow-hidden rounded-xl border border-cyan-400/20 bg-[#040F1E]"
            style={{ boxShadow: "0 0 60px rgba(0,229,255,0.06), inset 0 1px 0 rgba(0,229,255,0.08)" }}>
            {/* corner glow */}
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: "radial-gradient(circle, rgba(0,229,255,0.05) 0%, transparent 70%)", transform: "translate(30%, -30%)" }} />

            <div className="relative p-5 space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[9px] font-black tracking-[0.2em] text-cyan-400/70 uppercase">◈ Recomendação Operacional</span>
                    <span className="text-[9px] font-black tracking-widest px-2 py-0.5 rounded bg-cyan-400/10 border border-cyan-400/30 text-cyan-400"
                      style={{ boxShadow: "0 0 8px rgba(0,229,255,0.2)" }}>
                      URGENTE
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-white leading-tight">
                    Abrir turma de{" "}
                    <span className="text-cyan-400" style={{ textShadow: "0 0 20px rgba(0,229,255,0.4)" }}>
                      {hero.curso}
                    </span>
                    {" "}imediatamente
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {hero.turmasViaveis > 1
                      ? `Demanda suficiente para ${hero.turmasViaveis} turmas simultâneas`
                      : "Demanda suficiente para abertura imediata"}
                  </p>
                </div>
                <ScoreRing score={hero.score} size={72} />
              </div>

              {/* Métricas do hero */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Score de Viabilidade", value: `${hero.score}%`, color: "#00E5FF" },
                  { label: "Excedente da Meta",    value: hero.excedente > 0 ? `+${hero.excedente}` : String(hero.excedente), color: hero.excedente > 0 ? "#00D97E" : "#FF4040" },
                  { label: "Turmas Viáveis",       value: String(hero.turmasViaveis), color: "#00E5FF" },
                ].map(m => (
                  <div key={m.label} className="bg-white/[0.03] border border-white/[0.05] rounded-lg p-3">
                    <p className="text-[9px] font-semibold tracking-widest text-slate-500 uppercase mb-1">{m.label}</p>
                    <p className="text-2xl font-black tabular-nums" style={{ color: m.color, fontFamily: "ui-monospace, monospace", textShadow: `0 0 16px ${m.color}50` }}>
                      {m.value}
                    </p>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-500 uppercase tracking-wider">Risco Operacional</span>
                  <RiscoBadge risco={hero.risco} />
                </div>
                <span className="text-[10px] text-slate-600 font-mono">{hero.inscritos} inscritos detectados</span>
              </div>
            </div>
          </div>
        )}

        {/* Painel lateral */}
        <div className="space-y-3">
          {/* Funil compacto */}
          <div className="rounded-xl border border-white/[0.06] bg-[#040F1E] p-4">
            <p className="text-[9px] font-black tracking-[0.15em] text-slate-500 uppercase mb-4">◈ Funil de Captação</p>
            <div className="space-y-3">
              <FunnelBar label="Pré-inscritos"   value={candidatos.length} pct={100}         color="#00E5FF" />
              <div className="flex items-center gap-2 text-[10px] text-slate-600 pl-1">
                <span className="flex-1 h-px bg-white/5" />
                <span>{taxaAprova}% conversão</span>
                <span className="flex-1 h-px bg-white/5" />
              </div>
              <FunnelBar label="Aprovados"        value={aprovados.length}  pct={taxaAprova}  color="#00D97E" />
              <div className="flex items-center gap-2 text-[10px] text-slate-600 pl-1">
                <span className="flex-1 h-px bg-white/5" />
                <span>{taxaMat}% conversão</span>
                <span className="flex-1 h-px bg-white/5" />
              </div>
              <FunnelBar label="Matriculados"     value={totalMat}          pct={taxaMat}     color="#A78BFA" />
            </div>
          </div>

          {/* KPIs compactos */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Pesquisa Demanda", value: pesquisa.length, color: "#FFB800" },
              { label: "Cursos Viáveis",   value: stats.filter(c => c.score >= 100).length, color: "#00E5FF" },
            ].map(k => (
              <div key={k.label} className="rounded-xl border border-white/[0.06] bg-[#040F1E] p-3">
                <p className="text-[9px] font-semibold tracking-wider text-slate-500 uppercase">{k.label}</p>
                <p className="text-2xl font-black mt-1" style={{ color: k.color, fontFamily: "ui-monospace", textShadow: `0 0 16px ${k.color}40` }}>
                  {k.value}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grid de cursos + Alertas ────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Grid de cursos */}
        <div className="lg:col-span-2 rounded-xl border border-white/[0.06] bg-[#040F1E]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
            <span className="text-[9px] font-black tracking-[0.15em] text-slate-500 uppercase">◈ Análise por Curso — Viabilidade de Abertura</span>
            <span className="text-[9px] text-slate-600 font-mono">META: {META} inscritos</span>
          </div>
          <div className="p-3 space-y-1.5">
            {stats.map((c, i) => {
              const barW = Math.min(100, c.score);
              const barColor = c.score >= 100 ? "#00E5FF" : c.score >= 70 ? "#FFB800" : "#FF4040";
              return (
                <div key={c.curso} className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-white/[0.03] hover:bg-white/[0.02] transition-colors group">
                  <span className="text-[10px] text-slate-600 font-mono w-4">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-sm font-semibold text-slate-200 w-32 truncate">{c.curso}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${barW}%`, background: barColor, boxShadow: `0 0 6px ${barColor}50` }} />
                  </div>
                  <span className="text-sm font-black tabular-nums w-8 text-right" style={{ color: barColor, fontFamily: "ui-monospace" }}>
                    {c.inscritos}
                  </span>
                  <div className="flex items-center gap-1.5 w-28 justify-end">
                    <span className="text-[10px] text-slate-600">apro. {c.aprovados}</span>
                    <span className="text-white/10">·</span>
                    <span className="text-[10px] text-purple-400">mat. {c.matriculados}</span>
                  </div>
                  <RiscoBadge risco={c.risco} />
                </div>
              );
            })}
            {stats.length === 0 && (
              <div className="py-8 text-center text-slate-600 text-sm">Sem dados de inscrições</div>
            )}
          </div>
        </div>

        {/* Central de alertas */}
        <div className="space-y-3">
          <div className="rounded-xl border border-white/[0.06] bg-[#040F1E] p-4">
            <p className="text-[9px] font-black tracking-[0.15em] text-slate-500 uppercase mb-3">◈ Central de Alertas</p>
            <div className="space-y-3">
              {/* Críticos */}
              <div>
                <p className="text-[9px] font-semibold text-red-400/70 tracking-widest uppercase mb-1.5">
                  ⚠ Críticos — abaixo de {Math.round(META * 0.7)} inscritos
                </p>
                {criticos.length === 0
                  ? <p className="text-[11px] text-slate-600 pl-2">Nenhum curso crítico</p>
                  : <div className="space-y-1">
                      {criticos.map(c => <AlertRow key={c.curso} label={c.curso} value={c.inscritos} type="danger" />)}
                    </div>
                }
              </div>

              <div className="h-px bg-white/[0.04]" />

              {/* Acima da meta */}
              <div>
                <p className="text-[9px] font-semibold text-cyan-400/70 tracking-widest uppercase mb-1.5">
                  ✓ Acima da meta — {META_IDEAL}+ inscritos
                </p>
                {acimaMeta.length === 0
                  ? <p className="text-[11px] text-slate-600 pl-2">Nenhum</p>
                  : <div className="space-y-1">
                      {acimaMeta.map(c => <AlertRow key={c.curso} label={c.curso} value={c.inscritos} type="ok" />)}
                    </div>
                }
              </div>

              <div className="h-px bg-white/[0.04]" />

              {/* Abaixo da meta */}
              <div>
                <p className="text-[9px] font-semibold text-amber-400/70 tracking-widest uppercase mb-1.5">
                  △ Na zona — {META}–{META_IDEAL - 1} inscritos
                </p>
                {abaixo.length === 0
                  ? <p className="text-[11px] text-slate-600 pl-2">Nenhum</p>
                  : <div className="space-y-1">
                      {abaixo.map(c => <AlertRow key={c.curso} label={c.curso} value={c.inscritos} type="warn" />)}
                    </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Programas executivos + Pesquisa ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Programas */}
        <div className="rounded-xl border border-white/[0.06] bg-[#040F1E]">
          <div className="px-5 py-3 border-b border-white/[0.04]">
            <span className="text-[9px] font-black tracking-[0.15em] text-slate-500 uppercase">◈ Programas Executivos</span>
          </div>
          <div className="p-4 grid grid-cols-2 gap-3">
            {([
              { label: "MBA Cuidados Paliativos", count: mba.length,        color: "#A78BFA" },
              { label: "Protocolo Manchester",    count: manchester.length,  color: "#00E5FF" },
              { label: "Port-a-Cath",             count: portacath.length,   color: "#00D97E" },
              { label: "Workshop",                count: workshop.length,    color: "#FFB800" },
            ] as const).map(p => (
              <div key={p.label} className="relative overflow-hidden rounded-lg border border-white/[0.05] bg-white/[0.02] p-4">
                <div className="absolute top-0 right-0 w-20 h-20 rounded-full pointer-events-none opacity-20"
                  style={{ background: `radial-gradient(circle, ${p.color} 0%, transparent 70%)`, transform: "translate(40%, -40%)" }} />
                <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest mb-2 leading-tight">{p.label}</p>
                <p className="text-3xl font-black tabular-nums" style={{ color: p.color, fontFamily: "ui-monospace", textShadow: `0 0 20px ${p.color}40` }}>
                  {p.count}
                </p>
                <p className="text-[10px] text-slate-600 mt-0.5">inscrição(ões)</p>
              </div>
            ))}
          </div>
        </div>

        {/* Pesquisa de demanda */}
        <div className="rounded-xl border border-white/[0.06] bg-[#040F1E]">
          <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
            <span className="text-[9px] font-black tracking-[0.15em] text-slate-500 uppercase">◈ Pesquisa de Demanda — Top Cursos</span>
            <span className="text-[9px] text-slate-600 font-mono">{pesquisa.length} respondentes</span>
          </div>
          <div className="p-4 space-y-2">
            {(() => {
              const por: Record<string, number> = {};
              for (const p of pesquisa) { const c = p.curso ?? "Não informado"; por[c] = (por[c] ?? 0) + 1; }
              const top = Object.entries(por).sort((a, b) => b[1] - a[1]).slice(0, 6);
              const max = top[0]?.[1] ?? 1;
              return top.map(([curso, count]) => (
                <div key={curso} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-36 truncate">{curso}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/[0.05] overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${(count / max) * 100}%`, background: "#FFB800", boxShadow: "0 0 6px rgba(255,184,0,0.4)" }} />
                  </div>
                  <span className="text-xs font-black text-amber-400 w-6 text-right tabular-nums" style={{ fontFamily: "ui-monospace" }}>
                    {count}
                  </span>
                </div>
              ));
            })()}
            {pesquisa.length === 0 && <p className="text-sm text-slate-600 text-center py-4">Sem respostas</p>}
          </div>
        </div>
      </div>

    </div>
  );
}
