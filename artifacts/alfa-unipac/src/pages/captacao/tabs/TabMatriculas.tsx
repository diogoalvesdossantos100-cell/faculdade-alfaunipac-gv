import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type { Aprovado } from "../types";

const STATUS_CFG: Record<string, { color: string; bg: string; border: string }> = {
  "Providenciando Docs": { color: "#E8620A", bg: "rgba(232,98,10,.15)",  border: "rgba(232,98,10,.3)"  },
  "Doc. Pendente":       { color: "#F47920", bg: "rgba(244,121,32,.15)", border: "rgba(244,121,32,.3)" },
  "Doc. Completa":       { color: "#185FA5", bg: "rgba(24,95,165,.15)",  border: "rgba(24,95,165,.3)"  },
  "Matriculado":         { color: "#1D9E75", bg: "rgba(29,158,117,.15)", border: "rgba(29,158,117,.3)" },
  "Desistente":          { color: "#EE5555", bg: "rgba(238,85,85,.15)",  border: "rgba(238,85,85,.3)"  },
};

const DOCS_ITEMS = [
  { key: "docRg",         label: "RG / CPF / CNH"    },
  { key: "docTitulo",     label: "Título de Eleitor"  },
  { key: "docNascimento", label: "Cert. Nascimento"   },
  { key: "docCasamento",  label: "Cert. Casamento"    },
  { key: "docEndereco",   label: "Comp. Endereço"     },
  { key: "docMedio",      label: "Ens. Médio"         },
  { key: "docSuperior",   label: "Ens. Superior"      },
] as const;

const CHECK_ITEMS = [
  { key: "checkGrupoAvisos",  label: "Incluído no grupo de avisos"           },
  { key: "checkGrupoTurma",   label: "Incluído no grupo da turma"            },
  { key: "checkFacial",       label: "Cadastramento facial concluído"        },
  { key: "checkDigitalizado", label: "Documentação digitalizada e arquivada" },
] as const;

type DocKey   = typeof DOCS_ITEMS[number]["key"];
type CheckKey = typeof CHECK_ITEMS[number]["key"];

type CardState = {
  statusMatricula: string;
  telefone: string;
  prazoDocs: string;
  docRg: boolean; docTitulo: boolean; docNascimento: boolean;
  docCasamento: boolean; docEndereco: boolean; docMedio: boolean; docSuperior: boolean;
  checkGrupoAvisos: boolean; checkGrupoTurma: boolean; checkFacial: boolean; checkDigitalizado: boolean;
};

function buildState(a: Aprovado): CardState {
  return {
    statusMatricula: a.statusMatricula ?? "Providenciando Docs",
    telefone:        a.telefone        ?? "",
    prazoDocs:       a.prazoDocs       ?? "",
    docRg:           a.docRg           ?? false,
    docTitulo:       a.docTitulo       ?? false,
    docNascimento:   a.docNascimento   ?? false,
    docCasamento:    a.docCasamento    ?? false,
    docEndereco:     a.docEndereco     ?? false,
    docMedio:        a.docMedio        ?? false,
    docSuperior:     a.docSuperior     ?? false,
    checkGrupoAvisos:  a.checkGrupoAvisos  ?? false,
    checkGrupoTurma:   a.checkGrupoTurma   ?? false,
    checkFacial:       a.checkFacial       ?? false,
    checkDigitalizado: a.checkDigitalizado ?? false,
  };
}

function printChecklist(a: Aprovado, s: CardState) {
  const docs   = DOCS_ITEMS.map(d => ({ label: d.label, ok: s[d.key] }));
  const checks = CHECK_ITEMS.map(c => ({ label: c.label, ok: s[c.key] }));
  const prazo  = s.prazoDocs ? `Prazo: ${s.prazoDocs}` : "";
  const win = window.open("", "_blank", "width=800,height=700");
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head><title>Checklist — ${a.nome}</title>
<style>
  body{font-family:Inter,Arial,sans-serif;max-width:680px;margin:40px auto;color:#111;font-size:14px}
  h2{margin:0 0 4px;font-size:20px}
  .sub{color:#666;margin-bottom:6px;font-size:13px}
  .prazo{color:#444;margin-bottom:28px;font-size:13px}
  .section{margin-bottom:22px}
  .section h3{font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#555;border-bottom:1px solid #ddd;padding-bottom:6px;margin-bottom:12px}
  .item{display:flex;align-items:center;gap:10px;margin-bottom:9px}
  .box{width:16px;height:16px;border:1.5px solid #444;border-radius:3px;flex-shrink:0;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700}
  .box.ok{background:#1a1a1a;color:#fff;border-color:#1a1a1a}
  .sigs{display:grid;grid-template-columns:1fr 1fr;gap:50px;margin-top:48px}
  .sig{border-top:1px solid #555;padding-top:8px;font-size:12px;color:#555}
  @media print{body{margin:20mm}}
</style>
</head><body>
<h2>Checklist de Matrícula</h2>
<div class="sub">${a.nome} &nbsp;·&nbsp; ${a.curso}${a.turno ? " · " + a.turno : ""}</div>
${prazo ? `<div class="prazo">${prazo}</div>` : ""}
<div class="section"><h3>Documentação recebida (${docs.filter(d => d.ok).length}/${docs.length})</h3>
${docs.map(d => `<div class="item"><div class="box ${d.ok ? "ok" : ""}">${d.ok ? "✓" : ""}</div>${d.label}</div>`).join("")}
</div>
<div class="section"><h3>Procedimentos da Secretaria (${checks.filter(c => c.ok).length}/${checks.length})</h3>
${checks.map(c => `<div class="item"><div class="box ${c.ok ? "ok" : ""}">${c.ok ? "✓" : ""}</div>${c.label}</div>`).join("")}
</div>
<div class="sigs">
  <div class="sig">Assinatura do Candidato</div>
  <div class="sig">Assinatura da Secretaria</div>
</div>
</body></html>`);
  win.document.close();
  win.print();
}

function MatriculaCard({ a, defaultExpanded }: { a: Aprovado; defaultExpanded?: boolean }) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(defaultExpanded ?? false);
  const [s, setS] = useState<CardState>(() => buildState(a));

  function patch<K extends keyof CardState>(k: K, v: CardState[K]) {
    setS(prev => ({ ...prev, [k]: v }));
  }

  const saveMutation = useMutation({
    mutationFn: () => apiFetch(`/api/vestibular/aprovados/${a.id}`, { method: "PATCH", body: JSON.stringify(s) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vc-aprovados"] }); toast.success(`${a.nome} salvo`); },
    onError: () => toast.error("Erro ao salvar"),
  });

  const st = STATUS_CFG[s.statusMatricula] ?? STATUS_CFG["Providenciando Docs"];
  const docsOk = DOCS_ITEMS.filter(d => s[d.key]).length;
  const waLink = s.telefone
    ? `https://wa.me/55${s.telefone.replace(/\D/g, "")}?text=${encodeURIComponent(`Olá ${a.nome}! Segue o contato da secretaria AlfaUnipac GV sobre sua matrícula em ${a.curso}.`)}`
    : "";

  const fieldStyle: React.CSSProperties = {
    padding: "8px 12px", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8,
    fontSize: 12, outline: "none", background: "#0A1128", color: "#fff", width: "100%", boxSizing: "border-box",
  };

  return (
    <div style={{ background: "#0D1530", border: `1px solid ${open ? "rgba(255,255,255,.14)" : "rgba(255,255,255,.06)"}`, borderRadius: 12, marginBottom: 8, overflow: "hidden" }}>
      {/* Header */}
      <div
        style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px", cursor: "pointer", userSelect: "none" }}
        onClick={() => setOpen(o => !o)}
      >
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: "#fff", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{a.nome}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,.35)", marginTop: 2 }}>{a.curso}{a.turno ? ` · ${a.turno}` : ""}</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,.3)", fontWeight: 600 }}>{docsOk}/{DOCS_ITEMS.length} docs</span>
          <span style={{ fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: 20, background: st.bg, color: st.color, border: `1px solid ${st.border}` }}>{s.statusMatricula}</span>
          <span style={{ fontSize: 14, color: "rgba(255,255,255,.3)", transition: "transform .2s", display: "inline-block", transform: open ? "rotate(180deg)" : "none" }}>▾</span>
        </div>
      </div>

      {/* Expanded */}
      {open && (
        <div style={{ borderTop: "1px solid rgba(255,255,255,.07)", padding: "18px 18px 16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20 }}>

            {/* Col 1 — Situação */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Situação</div>
              <select
                className="admin-focus"
                style={{ ...fieldStyle, color: st.color, fontWeight: 700, background: st.bg, border: `1px solid ${st.border}`, marginBottom: 14 }}
                value={s.statusMatricula}
                onChange={e => patch("statusMatricula", e.target.value)}
              >
                {Object.keys(STATUS_CFG).map(k => <option key={k} value={k} style={{ background: "#0A1128", color: "#fff" }}>{k}</option>)}
              </select>

              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Telefone</div>
              <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                <input
                  className="admin-focus"
                  style={{ ...fieldStyle, flex: 1, width: "auto" }}
                  placeholder="(xx) xxxxx-xxxx"
                  value={s.telefone}
                  onChange={e => patch("telefone", e.target.value)}
                />
                {waLink && (
                  <a href={waLink} target="_blank" rel="noreferrer"
                    style={{ padding: "8px 10px", background: "#128C3E", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", textDecoration: "none", fontSize: 14, flexShrink: 0 }}
                    title="Abrir WhatsApp"
                  >💬</a>
                )}
              </div>

              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 6 }}>Prazo para docs</div>
              <input
                className="admin-focus"
                type="date"
                style={{ ...fieldStyle, colorScheme: "dark" }}
                value={s.prazoDocs}
                onChange={e => patch("prazoDocs", e.target.value)}
              />
            </div>

            {/* Col 2 — Documentação */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>
                Documentação recebida ({docsOk}/{DOCS_ITEMS.length})
              </div>
              {DOCS_ITEMS.map(d => (
                <label key={d.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={s[d.key as DocKey]}
                    onChange={e => patch(d.key as DocKey, e.target.checked)}
                    style={{ accentColor: "#1D9E75", width: 15, height: 15, flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 12, color: s[d.key as DocKey] ? "rgba(255,255,255,.85)" : "rgba(255,255,255,.38)" }}>{d.label}</span>
                </label>
              ))}
            </div>

            {/* Col 3 — Secretaria + ações */}
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 8 }}>Secretaria</div>
              {CHECK_ITEMS.map(c => (
                <label key={c.key} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={s[c.key as CheckKey]}
                    onChange={e => patch(c.key as CheckKey, e.target.checked)}
                    style={{ accentColor: "#185FA5", width: 15, height: 15, flexShrink: 0 }}
                  />
                  <span style={{ fontSize: 12, color: s[c.key as CheckKey] ? "rgba(255,255,255,.85)" : "rgba(255,255,255,.38)" }}>{c.label}</span>
                </label>
              ))}

              <div style={{ display: "flex", gap: 8, marginTop: 18 }}>
                <button
                  onClick={() => saveMutation.mutate()}
                  disabled={saveMutation.isPending}
                  style={{ flex: 1, padding: "10px", background: "#1D9E75", color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: saveMutation.isPending ? .6 : 1 }}
                >
                  {saveMutation.isPending ? "Salvando…" : "💾 Salvar"}
                </button>
                <button
                  onClick={() => printChecklist(a, s)}
                  style={{ padding: "10px 12px", background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.55)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 13, cursor: "pointer" }}
                  title="Imprimir checklist"
                >🖨</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TabMatriculas() {
  const [filtCurso,  setFiltCurso]  = useState("");
  const [filtStatus, setFiltStatus] = useState("");

  const { data: aprovados = [], isLoading } = useQuery<Aprovado[]>({
    queryKey: ["vc-aprovados"],
    queryFn: () => apiFetch("/api/vestibular/aprovados"),
  });

  const cursos = [...new Set(aprovados.map(a => a.curso))].sort();

  const filtered = aprovados.filter(a => {
    const st = a.statusMatricula ?? "Providenciando Docs";
    return (!filtCurso || a.curso === filtCurso) && (!filtStatus || st === filtStatus);
  });

  const byCurso = cursos.reduce<Record<string, number>>((acc, c) => {
    acc[c] = aprovados.filter(a => a.curso === c).length;
    return acc;
  }, {});

  const sel: React.CSSProperties = { padding: "8px 12px", border: "1px solid rgba(255,255,255,.1)", borderRadius: 8, fontSize: 12, outline: "none", background: "#0A1128", color: "#fff" };

  return (
    <div style={{ fontFamily: "'Inter',system-ui,sans-serif", color: "#fff" }}>
      {/* Resumo por status */}
      {aprovados.length > 0 && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, flexWrap: "wrap" }}>
          {Object.entries(STATUS_CFG).map(([k, cfg]) => {
            const n = aprovados.filter(a => (a.statusMatricula ?? "Providenciando Docs") === k).length;
            return (
              <div key={k}
                onClick={() => setFiltStatus(prev => prev === k ? "" : k)}
                style={{ padding: "6px 14px", borderRadius: 20, background: filtStatus === k ? cfg.bg : "rgba(255,255,255,.04)", border: `1px solid ${filtStatus === k ? cfg.border : "rgba(255,255,255,.07)"}`, cursor: "pointer", fontSize: 11, fontWeight: 700, color: filtStatus === k ? cfg.color : "rgba(255,255,255,.4)" }}
              >
                {k} <span style={{ fontWeight: 900 }}>{n}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, marginBottom: 16, flexWrap: "wrap", alignItems: "center" }}>
        <select className="admin-focus" style={sel} value={filtCurso} onChange={e => setFiltCurso(e.target.value)} aria-label="Filtrar por curso">
          <option value="">Todos os cursos</option>
          {cursos.map(c => <option key={c} value={c}>{c} ({byCurso[c]})</option>)}
        </select>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,.3)" }}>
          {filtered.length} aluno{filtered.length !== 1 ? "s" : ""}
          {(filtCurso || filtStatus) ? " · filtrado" : ""}
        </span>
        {(filtCurso || filtStatus) && (
          <button
            onClick={() => { setFiltCurso(""); setFiltStatus(""); }}
            style={{ fontSize: 11, color: "rgba(255,255,255,.4)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
          >limpar filtros</button>
        )}
      </div>

      {/* Cards */}
      {isLoading ? (
        <div style={{ textAlign: "center", padding: 48, color: "rgba(255,255,255,.3)" }}>Carregando…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: 48, color: "rgba(255,255,255,.3)" }}>Nenhum aprovado encontrado.</div>
      ) : (
        filtered.map(a => <MatriculaCard key={a.id} a={a} />)
      )}
    </div>
  );
}
