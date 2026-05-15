import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

// ── Paleta e constantes ────────────────────────────────────────────────────
const NAVY   = "#1E2D6B";
const ORANGE = "#F47920";
const PURPLE = "#534AB7";
const TEAL   = "#0F6E56";

const CURSOS_VEST = ["Administração", "Nutrição", "Fisioterapia", "Farmácia"];
const TURNOS      = ["Manhã", "Tarde", "Noturno"];
const CONVENIOS   = [
  { val: "pagante",      label: "Pagante"     },
  { val: "colaborador",  label: "Colaborador" },
  { val: "beneficiario", label: "Beneficiário"},
];

// ── Tipos dos formulários ─────────────────────────────────────────────────
type VestForm = {
  nome: string; cpf: string; rg: string; nascimento: string;
  email: string; telefone: string;
  convenio: string; colaborador: string;
  curso1: string; curso2: string; turno: string;
};
type PesqForm = {
  nome: string; cpf: string; email: string; telefone: string;
  convenio: string; colaborador: string;
  curso: string; cursoAlternativo: string; turno: string;
};
type EventoForm = {
  nome: string; cpf: string; rg: string; email: string; telefone: string;
  concluiuGraduacao: string; cursoGraduacao: string;
};

const VEST_INIT: VestForm   = { nome:"", cpf:"", rg:"", nascimento:"", email:"", telefone:"", convenio:"pagante", colaborador:"", curso1:"", curso2:"", turno:"Noturno" };
const PESQ_INIT: PesqForm   = { nome:"", cpf:"", email:"", telefone:"", convenio:"pagante", colaborador:"", curso:"", cursoAlternativo:"", turno:"Noturno" };
const EVENTO_INIT: EventoForm = { nome:"", cpf:"", rg:"", email:"", telefone:"", concluiuGraduacao:"", cursoGraduacao:"" };

// ── Helpers de estilo ─────────────────────────────────────────────────────
const fieldBase: React.CSSProperties = {
  display: "block", width: "100%", padding: "10px 14px",
  border: "1px solid rgba(255,255,255,.12)", borderRadius: 10,
  background: "rgba(255,255,255,.04)", color: "#fff", fontSize: 14,
  outline: "none", boxSizing: "border-box",
};
const labelBase: React.CSSProperties = {
  display: "block", fontSize: 11, fontWeight: 700,
  color: "rgba(255,255,255,.45)", textTransform: "uppercase", letterSpacing: ".07em", marginBottom: 6,
};
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={labelBase}>{label}</label>
      {children}
    </div>
  );
}
function Row({ children }: { children: React.ReactNode }) {
  return <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>{children}</div>;
}

// ── Cards de formulário ──────────────────────────────────────────────────
const CARDS = [
  {
    key: "vestibular" as const,
    color: NAVY,
    glow: "rgba(30,45,107,.6)",
    badge: "Inscrições abertas",
    icon: "🎓",
    title: "Vestibular 2026/2",
    desc: "Administração · Nutrição · Fisioterapia · Farmácia",
    sub: "Pré-inscrição no processo seletivo — resultados em até 72h",
    cta: "Fazer inscrição",
  },
  {
    key: "pesquisa" as const,
    color: ORANGE,
    glow: "rgba(244,121,32,.4)",
    badge: "Pesquisa ativa",
    icon: "📋",
    title: "Pesquisa de Interesse",
    desc: "Fonoaudiologia · Biomedicina · Pedagogia · Serviço Social",
    sub: "Manifeste interesse em novos cursos — sua opinião define a grade 2027",
    cta: "Responder pesquisa",
  },
  {
    key: "mba" as const,
    color: PURPLE,
    glow: "rgba(83,74,183,.5)",
    badge: "Vagas limitadas",
    icon: "🏥",
    title: "MBA Cuidados Paliativos",
    desc: "Pós-graduação executiva em saúde integrativa",
    sub: "Formação de excelência reconhecida — corpo docente especializado",
    cta: "Pré-inscrição",
  },
  {
    key: "manchester" as const,
    color: TEAL,
    glow: "rgba(15,110,86,.5)",
    badge: "Certificação",
    icon: "🩺",
    title: "Protocolo Manchester",
    desc: "Classificação de risco e acolhimento em saúde",
    sub: "Certificação profissional reconhecida pelo MEC e conselhos regionais",
    cta: "Inscrever-se",
  },
];

// ── Formulário Vestibular ─────────────────────────────────────────────────
function FormVestibular({ onSuccess }: { onSuccess: () => void }) {
  const [f, setF] = useState<VestForm>(VEST_INIT);
  const p = (k: keyof VestForm, v: string) => setF(prev => ({ ...prev, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => apiFetch("/api/vestibular/candidatos", { method: "POST", body: JSON.stringify(f) }),
    onSuccess,
    onError: () => alert("Erro ao enviar inscrição. Verifique os dados e tente novamente."),
  });

  const ok = f.nome && f.cpf && f.email && f.telefone && f.convenio && f.curso1 && f.turno;

  return (
    <form onSubmit={e => { e.preventDefault(); if (ok) mutation.mutate(); }}>
      <Row>
        <Field label="Nome completo *"><input style={fieldBase} required placeholder="Seu nome" value={f.nome} onChange={e => p("nome", e.target.value)} /></Field>
        <Field label="CPF *"><input style={fieldBase} required placeholder="000.000.000-00" value={f.cpf} onChange={e => p("cpf", e.target.value)} /></Field>
      </Row>
      <Row>
        <Field label="RG"><input style={fieldBase} placeholder="Opcional" value={f.rg} onChange={e => p("rg", e.target.value)} /></Field>
        <Field label="Data de nascimento"><input type="date" style={{ ...fieldBase, colorScheme: "dark" }} value={f.nascimento} onChange={e => p("nascimento", e.target.value)} /></Field>
      </Row>
      <Row>
        <Field label="E-mail *"><input type="email" style={fieldBase} required placeholder="seu@email.com" value={f.email} onChange={e => p("email", e.target.value)} /></Field>
        <Field label="Telefone *"><input style={fieldBase} required placeholder="(xx) xxxxx-xxxx" value={f.telefone} onChange={e => p("telefone", e.target.value)} /></Field>
      </Row>
      <Row>
        <Field label="Convênio *">
          <select style={fieldBase} required value={f.convenio} onChange={e => p("convenio", e.target.value)}>
            {CONVENIOS.map(c => <option key={c.val} value={c.val} style={{ background: "#0D1530" }}>{c.label}</option>)}
          </select>
        </Field>
        {f.convenio === "colaborador" && (
          <Field label="Nome do colaborador"><input style={fieldBase} placeholder="Nome do funcionário" value={f.colaborador} onChange={e => p("colaborador", e.target.value)} /></Field>
        )}
      </Row>
      <Row>
        <Field label="1ª Opção de curso *">
          <select style={fieldBase} required value={f.curso1} onChange={e => p("curso1", e.target.value)}>
            <option value="" style={{ background: "#0D1530" }}>Selecione…</option>
            {CURSOS_VEST.map(c => <option key={c} value={c} style={{ background: "#0D1530" }}>{c}</option>)}
          </select>
        </Field>
        <Field label="2ª Opção de curso *">
          <select style={fieldBase} required value={f.curso2} onChange={e => p("curso2", e.target.value)}>
            <option value="" style={{ background: "#0D1530" }}>Selecione…</option>
            {CURSOS_VEST.map(c => <option key={c} value={c} style={{ background: "#0D1530" }}>{c}</option>)}
          </select>
        </Field>
      </Row>
      <Field label="Turno *">
        <select style={fieldBase} required value={f.turno} onChange={e => p("turno", e.target.value)}>
          {TURNOS.map(t => <option key={t} value={t} style={{ background: "#0D1530" }}>{t}</option>)}
        </select>
      </Field>
      <SubmitBtn label="Enviar inscrição" pending={mutation.isPending} disabled={!ok} color={NAVY} />
    </form>
  );
}

// ── Formulário Pesquisa ───────────────────────────────────────────────────
function FormPesquisa({ onSuccess }: { onSuccess: () => void }) {
  const [f, setF] = useState<PesqForm>(PESQ_INIT);
  const p = (k: keyof PesqForm, v: string) => setF(prev => ({ ...prev, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => apiFetch("/api/vestibular/pesquisa", { method: "POST", body: JSON.stringify(f) }),
    onSuccess,
    onError: () => alert("Erro ao enviar. Tente novamente."),
  });

  return (
    <form onSubmit={e => { e.preventDefault(); mutation.mutate(); }}>
      <Row>
        <Field label="Nome"><input style={fieldBase} placeholder="Seu nome (opcional)" value={f.nome} onChange={e => p("nome", e.target.value)} /></Field>
        <Field label="CPF"><input style={fieldBase} placeholder="000.000.000-00 (opcional)" value={f.cpf} onChange={e => p("cpf", e.target.value)} /></Field>
      </Row>
      <Row>
        <Field label="E-mail"><input type="email" style={fieldBase} placeholder="seu@email.com" value={f.email} onChange={e => p("email", e.target.value)} /></Field>
        <Field label="Telefone"><input style={fieldBase} placeholder="(xx) xxxxx-xxxx" value={f.telefone} onChange={e => p("telefone", e.target.value)} /></Field>
      </Row>
      <Row>
        <Field label="Curso de interesse *">
          <input style={fieldBase} required placeholder="Ex: Fonoaudiologia, Biomedicina…" value={f.curso} onChange={e => p("curso", e.target.value)} />
        </Field>
        <Field label="2ª opção">
          <input style={fieldBase} placeholder="Curso alternativo (opcional)" value={f.cursoAlternativo} onChange={e => p("cursoAlternativo", e.target.value)} />
        </Field>
      </Row>
      <Row>
        <Field label="Turno preferido">
          <select style={fieldBase} value={f.turno} onChange={e => p("turno", e.target.value)}>
            {TURNOS.map(t => <option key={t} value={t} style={{ background: "#0D1530" }}>{t}</option>)}
          </select>
        </Field>
        <Field label="Convênio">
          <select style={fieldBase} value={f.convenio} onChange={e => p("convenio", e.target.value)}>
            {CONVENIOS.map(c => <option key={c.val} value={c.val} style={{ background: "#0D1530" }}>{c.label}</option>)}
          </select>
        </Field>
      </Row>
      <SubmitBtn label="Enviar pesquisa" pending={mutation.isPending} disabled={!f.curso} color={ORANGE} />
    </form>
  );
}

// ── Formulário Evento (MBA / Manchester) ──────────────────────────────────
function FormEvento({ endpoint, color, rgLabel = "RG", cursoLabel = "Área de formação", onSuccess }: {
  endpoint: string; color: string; rgLabel?: string; cursoLabel?: string; onSuccess: () => void;
}) {
  const [f, setF] = useState<EventoForm>(EVENTO_INIT);
  const p = (k: keyof EventoForm, v: string) => setF(prev => ({ ...prev, [k]: v }));

  const mutation = useMutation({
    mutationFn: () => apiFetch(endpoint, { method: "POST", body: JSON.stringify(f) }),
    onSuccess,
    onError: () => alert("Erro ao enviar. Tente novamente."),
  });

  const ok = f.nome && f.cpf && f.email && f.telefone && f.concluiuGraduacao;

  return (
    <form onSubmit={e => { e.preventDefault(); if (ok) mutation.mutate(); }}>
      <Row>
        <Field label="Nome completo *"><input style={fieldBase} required value={f.nome} onChange={e => p("nome", e.target.value)} placeholder="Seu nome" /></Field>
        <Field label="CPF *"><input style={fieldBase} required value={f.cpf} onChange={e => p("cpf", e.target.value)} placeholder="000.000.000-00" /></Field>
      </Row>
      <Row>
        <Field label={rgLabel}><input style={fieldBase} value={f.rg} onChange={e => p("rg", e.target.value)} placeholder="Opcional" /></Field>
        <Field label="Telefone *"><input style={fieldBase} required value={f.telefone} onChange={e => p("telefone", e.target.value)} placeholder="(xx) xxxxx-xxxx" /></Field>
      </Row>
      <Field label="E-mail *"><input type="email" style={fieldBase} required value={f.email} onChange={e => p("email", e.target.value)} placeholder="seu@email.com" /></Field>
      <Row>
        <Field label="Concluiu graduação? *">
          <select style={fieldBase} required value={f.concluiuGraduacao} onChange={e => p("concluiuGraduacao", e.target.value)}>
            <option value="" style={{ background: "#0D1530" }}>Selecione…</option>
            <option value="Sim" style={{ background: "#0D1530" }}>Sim</option>
            <option value="Não" style={{ background: "#0D1530" }}>Não</option>
          </select>
        </Field>
        <Field label={cursoLabel}><input style={fieldBase} value={f.cursoGraduacao} onChange={e => p("cursoGraduacao", e.target.value)} placeholder="Opcional" /></Field>
      </Row>
      <SubmitBtn label="Confirmar pré-inscrição" pending={mutation.isPending} disabled={!ok} color={color} />
    </form>
  );
}

// ── Botão de submit ───────────────────────────────────────────────────────
function SubmitBtn({ label, pending, disabled, color }: { label: string; pending: boolean; disabled: boolean; color: string }) {
  return (
    <button
      type="submit"
      disabled={pending || disabled}
      style={{
        marginTop: 8, width: "100%", padding: "13px",
        background: disabled ? "rgba(255,255,255,.06)" : color,
        color: disabled ? "rgba(255,255,255,.3)" : "#fff",
        border: "none", borderRadius: 12, fontSize: 14, fontWeight: 700,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "background .15s",
      }}
    >
      {pending ? "Enviando…" : label}
    </button>
  );
}

// ── Tela de sucesso ───────────────────────────────────────────────────────
function SuccessScreen({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div style={{ textAlign: "center", padding: "32px 16px" }}>
      <div style={{ fontSize: 52, marginBottom: 16 }}>✅</div>
      <div style={{ fontSize: 20, fontWeight: 800, color: "#1D9E75", marginBottom: 10 }}>Inscrição enviada!</div>
      <div style={{ fontSize: 14, color: "rgba(255,255,255,.5)", marginBottom: 28, lineHeight: 1.6 }}>
        Recebemos sua inscrição para <strong style={{ color: "#fff" }}>{title}</strong>.<br />
        Entraremos em contato em breve.
      </div>
      <button onClick={onClose}
        style={{ padding: "10px 28px", background: "rgba(255,255,255,.08)", color: "#fff", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, fontSize: 13, cursor: "pointer", fontWeight: 600 }}>
        Fechar
      </button>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────
function Modal({ card, onClose }: { card: typeof CARDS[number]; onClose: () => void }) {
  const [done, setDone] = useState(false);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.72)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div style={{
        background: "#0A1128", borderRadius: 20, width: "100%", maxWidth: 560,
        maxHeight: "92vh", overflowY: "auto",
        border: "1px solid rgba(255,255,255,.1)",
        boxShadow: `0 0 80px ${card.glow}`,
      }}>
        {/* Modal header */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,.07)" }}>
          <span style={{ fontSize: 22 }}>{card.icon}</span>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff" }}>{card.title}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.4)", marginTop: 2 }}>{card.desc}</div>
          </div>
          <button onClick={onClose}
            style={{ marginLeft: "auto", background: "none", border: "none", color: "rgba(255,255,255,.4)", cursor: "pointer", fontSize: 22, lineHeight: 1, padding: "0 4px" }}>
            ×
          </button>
        </div>

        <div style={{ padding: "24px" }}>
          {done ? (
            <SuccessScreen title={card.title} onClose={onClose} />
          ) : card.key === "vestibular" ? (
            <FormVestibular onSuccess={() => setDone(true)} />
          ) : card.key === "pesquisa" ? (
            <FormPesquisa onSuccess={() => setDone(true)} />
          ) : card.key === "mba" ? (
            <FormEvento endpoint="/api/vestibular/inscricoes/mba" color={PURPLE} onSuccess={() => setDone(true)} />
          ) : (
            <FormEvento endpoint="/api/vestibular/inscricoes/manchester" color={TEAL} rgLabel="CRM / COREN" cursoLabel="Especialidade" onSuccess={() => setDone(true)} />
          )}
        </div>
      </div>
    </div>
  );
}

// ── Landing Page principal ─────────────────────────────────────────────────
export default function Vestibular() {
  const [active, setActive] = useState<typeof CARDS[number]["key"] | null>(null);
  const activeCard = CARDS.find(c => c.key === active) ?? null;

  const CSS_ANIM = `
    @keyframes vl-fade { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
    @keyframes vl-pulse { 0%,100%{opacity:1} 50%{opacity:.35} }
    .vl-card { transition: transform .2s, box-shadow .2s; }
    .vl-card:hover { transform: translateY(-3px); }
    .vl-badge { animation: vl-pulse 2.4s ease-in-out infinite; }
  `;

  return (
    <div style={{ minHeight: "100vh", background: "#080E22", fontFamily: "'Inter',system-ui,sans-serif", color: "#fff" }}>
      <style>{CSS_ANIM}</style>

      {/* Grade tecnológica de fundo */}
      <div style={{ position: "fixed", inset: 0, opacity: .02, backgroundImage: "linear-gradient(rgba(255,255,255,.7) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,.7) 1px,transparent 1px)", backgroundSize: "36px 36px", pointerEvents: "none" }} />

      {/* Blob de luz */}
      <div style={{ position: "fixed", top: -120, left: "20%", width: 600, height: 400, borderRadius: "50%", background: "rgba(30,45,107,.08)", filter: "blur(80px)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", padding: "0 24px" }}>

        {/* Hero */}
        <div style={{ paddingTop: 64, paddingBottom: 56, textAlign: "center", animation: "vl-fade .5s ease both" }}>
          {/* Logo / Branding */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 16, background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)", borderRadius: 40, padding: "10px 22px", marginBottom: 28 }}>
            <div style={{ width: 36, height: 36, borderRadius: 9, background: ORANGE, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎓</div>
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: "#fff", letterSpacing: "-.01em" }}>Centro Universitário AlfaUnipac</div>
              <div style={{ fontSize: 10, color: "rgba(255,255,255,.4)", letterSpacing: ".06em" }}>POLO GOVERNADOR VALADARES</div>
            </div>
          </div>

          {/* Badges */}
          <div style={{ display: "flex", justifyContent: "center", gap: 10, marginBottom: 28, flexWrap: "wrap" }}>
            {[
              { label: "● Sistema ativo · 2026",    color: "#1D9E75" },
              { label: "Inscrições abertas",         color: ORANGE   },
              { label: "Vestibular 2026/2",          color: "#7DC5FF" },
            ].map(b => (
              <span key={b.label} className="vl-badge" style={{ fontSize: 10, fontWeight: 700, padding: "5px 14px", borderRadius: 20, background: `${b.color}18`, border: `1px solid ${b.color}40`, color: b.color, letterSpacing: ".04em" }}>
                {b.label}
              </span>
            ))}
          </div>

          {/* Título */}
          <h1 style={{ fontSize: "clamp(26px,4vw,42px)", fontWeight: 900, color: "#fff", margin: "0 0 14px", letterSpacing: "-.03em", lineHeight: 1.15 }}>
            Plataforma de Captação<br />
            <span style={{ color: ORANGE }}>&amp; Formação Institucional</span>
          </h1>
          <p style={{ fontSize: 15, color: "rgba(255,255,255,.4)", margin: 0, maxWidth: 480, marginInline: "auto", lineHeight: 1.6 }}>
            Escolha o programa e preencha o formulário — resposta em até 72 horas úteis.
          </p>
        </div>

        {/* Cards 2×2 */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 16, marginBottom: 64 }}>
          {CARDS.map((card, i) => (
            <div
              key={card.key}
              className="vl-card"
              onClick={() => setActive(card.key)}
              style={{
                background: "linear-gradient(140deg,rgba(255,255,255,.04) 0%,rgba(255,255,255,.01) 100%)",
                border: `1px solid rgba(255,255,255,.08)`,
                borderRadius: 18,
                padding: "28px 28px 24px",
                cursor: "pointer",
                animation: `vl-fade .4s ${.08 * i}s ease both`,
                position: "relative",
                overflow: "hidden",
              }}
            >
              {/* Glow de fundo do card */}
              <div style={{ position: "absolute", bottom: -30, right: -30, width: 160, height: 160, borderRadius: "50%", background: `${card.color}10`, filter: "blur(30px)", pointerEvents: "none" }} />

              <div style={{ position: "relative" }}>
                {/* Badge topo */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: `${card.color}20`, border: `1px solid ${card.color}40`, color: card.color, letterSpacing: ".05em" }}>
                    {card.badge}
                  </span>
                  <span style={{ fontSize: 28 }}>{card.icon}</span>
                </div>

                {/* Título */}
                <div style={{ fontSize: 18, fontWeight: 800, color: "#fff", marginBottom: 6, letterSpacing: "-.02em" }}>{card.title}</div>
                <div style={{ fontSize: 12, color: card.color, fontWeight: 600, marginBottom: 10 }}>{card.desc}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,.38)", lineHeight: 1.55, marginBottom: 20 }}>{card.sub}</div>

                {/* CTA */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: card.color }}>{card.cta} →</span>
                  <div style={{ width: 32, height: 32, borderRadius: "50%", background: `${card.color}20`, border: `1px solid ${card.color}40`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
                    ↗
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div style={{ borderTop: "1px solid rgba(255,255,255,.05)", padding: "20px 0 32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,.2)" }}>
            Sistema de Captação · AlfaUnipac GV
          </span>
          <span style={{ fontSize: 11, color: "rgba(255,255,255,.2)" }}>
            Powered by <span style={{ color: "#00D4FF", fontWeight: 700 }}>ARGO SYSTEMS</span>
          </span>
        </div>
      </div>

      {/* Modal */}
      {activeCard && <Modal card={activeCard} onClose={() => setActive(null)} />}
    </div>
  );
}
