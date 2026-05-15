import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type { Candidato, Curso } from "../PainelCaptacao";
import { ORANGE, GREEN, NAVY, CURSOS_OFICIAIS } from "../PainelCaptacao";

const S = {
  filterInp: { padding: "9px 14px", border: "1px solid rgba(255,255,255,.08)", borderRadius: 9, fontSize: 13, outline: "none", background: "rgba(255,255,255,.04)", color: "#fff", flex: 2, minWidth: 200 } as React.CSSProperties,
  filterSel: { padding: "9px 14px", border: "1px solid rgba(255,255,255,.08)", borderRadius: 9, fontSize: 13, outline: "none", background: "#0D1530", color: "#fff", flex: 1, minWidth: 140 } as React.CSSProperties,
  tableWrap: { background: "#0D1530", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", overflow: "auto", marginBottom: 16 } as React.CSSProperties,
  table:     { width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 860 } as React.CSSProperties,
  th:        { textAlign: "left", padding: "11px 14px", fontWeight: 700, fontSize: 10, color: "rgba(255,255,255,.35)", borderBottom: "1px solid rgba(255,255,255,.06)", background: "rgba(255,255,255,.02)", textTransform: "uppercase", letterSpacing: ".07em", whiteSpace: "nowrap" } as React.CSSProperties,
  td:        { padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,.04)", color: "rgba(255,255,255,.85)" } as React.CSSProperties,
  aprvBtn:   { background: GREEN, border: "none", color: "#fff", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" } as React.CSSProperties,
  editBtn:   { background: "none", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.6)", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
  delBtn:    { background: "none", border: "1px solid rgba(226,75,74,.3)", color: "#F09595", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
  exportBtn: (bg: string) => ({ padding: "9px 18px", background: bg, color: "#fff", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer" }) as React.CSSProperties,
  overlay:   { position: "fixed", inset: 0, background: "rgba(0,0,0,.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 200, padding: 16 } as React.CSSProperties,
  modal:     { background: "#0D1530", borderRadius: 16, width: "100%", maxWidth: 520, maxHeight: "90vh", overflowY: "auto", border: "1px solid rgba(255,255,255,.1)" } as React.CSSProperties,
  inp:       { padding: "10px 14px", border: "1px solid rgba(255,255,255,.1)", borderRadius: 9, fontSize: 13, color: "#fff", outline: "none", background: "rgba(255,255,255,.04)", width: "100%", boxSizing: "border-box" } as React.CSSProperties,
};

// ConvBadge idêntico ao original
function ConvBadge({ v }: { v: string }) {
  const map: Record<string, [string, string, string]> = {
    colaborador:  ["rgba(30,45,107,.4)",    "#7DC5FF",              "Colaborador"],
    beneficiario: ["rgba(244,121,32,.2)",   "#FFAD6B",              "Beneficiário"],
    pagante:      ["rgba(255,255,255,.06)", "rgba(255,255,255,.5)", "Pagante"],
  };
  const [bg, color, label] = map[v] || ["rgba(255,255,255,.06)", "rgba(255,255,255,.5)", v];
  return <span style={{ display: "inline-block", fontSize: 10, padding: "2px 9px", borderRadius: 20, fontWeight: 700, background: bg, color }}>{label}</span>;
}

export default function TabInscritos({ inscritos, todosInscritos, cursos }: {
  inscritos: Candidato[];
  todosInscritos: Candidato[];
  cursos: Curso[];
}) {
  const qc = useQueryClient();
  const [busca,        setBusca]        = useState("");
  const [filtroCurso,  setFiltroCurso]  = useState("");
  const [filtroConv,   setFiltroConv]   = useState("");
  const [modalAprovar, setModalAprovar] = useState<Candidato | null>(null);
  const [cursoAprovar, setCursoAprovar] = useState("");
  const [migrando,     setMigrando]     = useState(false);
  const [migResult,    setMigResult]    = useState<{ ok: number; skip: number } | null>(null);

  const candidatosFora = todosInscritos.filter(c => !CURSOS_OFICIAIS.includes(c.curso1));

  const fl = inscritos.filter(c => {
    const b = busca.toLowerCase();
    return (!filtroCurso || c.curso1 === filtroCurso || c.curso2 === filtroCurso)
      && (!filtroConv || c.convenio === filtroConv)
      && (!b || c.nome?.toLowerCase().includes(b) || c.email?.toLowerCase().includes(b) || c.cpf?.includes(b));
  });

  const aprovarMutation = useMutation({
    mutationFn: async (c: Candidato) => {
      await apiFetch(`/api/vestibular/candidatos/${c.id}`, { method: "PATCH", body: JSON.stringify({ status: "Aprovado" }) });
      await apiFetch("/api/vestibular/aprovados", { method: "POST", body: JSON.stringify({ nome: c.nome, curso: cursoAprovar, turno: c.turno }) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["vc-candidatos"] });
      qc.invalidateQueries({ queryKey: ["vc-aprovados"] });
      toast.success("Candidato aprovado");
      setModalAprovar(null); setCursoAprovar("");
    },
    onError: () => toast.error("Erro ao aprovar"),
  });

  const excluirMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/vestibular/candidatos/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vc-candidatos"] }); toast.success("Removido"); },
    onError: () => toast.error("Erro ao remover"),
  });

  const moverParaPesquisa = async () => {
    setMigrando(true); setMigResult(null);
    let ok = 0, skip = 0;
    for (const c of candidatosFora) {
      try {
        await apiFetch("/api/vestibular/pesquisa", {
          method: "POST",
          body: JSON.stringify({ nome: c.nome, cpf: c.cpf, rg: c.rg, nascimento: c.nascimento, email: c.email, telefone: c.telefone, convenio: c.convenio, colaborador: c.colaborador, curso: c.curso1, cursoAlternativo: c.curso2, turno: c.turno }),
        });
        ok++;
      } catch { skip++; }
    }
    setMigResult({ ok, skip });
    setMigrando(false);
    qc.invalidateQueries({ queryKey: ["vc-pesquisa"] });
  };

  const exportCSV = () => {
    const rows = [
      ["Nome","CPF","RG","Nascimento","Email","Telefone","Convênio","Colaborador","1ª Opção","2ª Opção","Turno","Data"],
      ...fl.map(c => [c.nome,c.cpf,c.rg,c.nascimento,c.email,c.telefone,c.convenio,c.colaborador,c.curso1,c.curso2,c.turno,c.createdAt?.slice(0,10)]),
    ];
    const csv = rows.map(r => r.map(v => `"${String(v||"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿"+csv], { type: "text/csv;charset=utf-8" }));
    a.download = "inscritos.csv"; a.click();
  };

  const listaCursos = cursos.length > 0 ? cursos : CURSOS_OFICIAIS.map(n => ({ id: 0, nome: n, periodo: "", ativo: true, createdAt: "" }));

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#fff" }}>

      {/* Seção header */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 800, color: "rgba(255,255,255,.3)", textTransform: "uppercase", letterSpacing: ".14em", whiteSpace: "nowrap" }}>
          Candidatos inscritos · {inscritos.length} registro{inscritos.length !== 1 ? "s" : ""}
        </div>
        <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,.06)" }} />
      </div>

      {/* Banner mover para pesquisa */}
      {candidatosFora.length > 0 && (
        <div style={{ background: "rgba(244,121,32,.08)", border: "1px solid rgba(244,121,32,.25)", borderRadius: 12, padding: "14px 20px", marginBottom: 16, display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap" }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: ORANGE, marginBottom: 3 }}>
              ⚠ {candidatosFora.length} candidatos com cursos fora do vestibular oficial
            </div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,.45)" }}>
              Fonoaudiologia, Pedagogia, Serviço Social etc. devem estar na aba Pesquisa.
            </div>
            {migResult && <div style={{ fontSize: 11, color: "#4DD4A0", marginTop: 4 }}>✓ Migrados: {migResult.ok} · Já existiam: {migResult.skip}</div>}
          </div>
          <button onClick={moverParaPesquisa} disabled={migrando} style={{ padding: "8px 18px", background: ORANGE, color: "#fff", border: "none", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", opacity: migrando ? .6 : 1 }}>
            {migrando ? "Migrando..." : "↗ Mover para Pesquisa"}
          </button>
        </div>
      )}

      {/* Filtros */}
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <input style={S.filterInp} placeholder="Buscar nome, CPF ou e-mail..." value={busca} onChange={e => setBusca(e.target.value)} />
        <select style={S.filterSel} value={filtroCurso} onChange={e => setFiltroCurso(e.target.value)}>
          <option value="">Todos os cursos</option>
          {listaCursos.map(c => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
        </select>
        <select style={S.filterSel} value={filtroConv} onChange={e => setFiltroConv(e.target.value)}>
          <option value="">Todos os vínculos</option>
          <option value="colaborador">Colaborador</option>
          <option value="beneficiario">Beneficiário</option>
          <option value="pagante">Pagante</option>
        </select>
        <button style={S.exportBtn(NAVY)} onClick={exportCSV}>Exportar CSV</button>
      </div>

      <div style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginBottom: 10 }}>
        {fl.length} candidato{fl.length !== 1 ? "s" : ""}{(busca || filtroCurso || filtroConv) ? " · filtrado" : ""}
      </div>

      {/* Tabela */}
      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>
              {["#","Nome","CPF","E-mail","Telefone","1ª Opção","2ª Opção","Vínculo","Data",""].map(h => (
                <th key={h} style={S.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fl.length === 0 ? (
              <tr><td colSpan={10} style={{ ...S.td, textAlign: "center", color: "rgba(255,255,255,.3)", padding: 40 }}>Nenhum resultado encontrado</td></tr>
            ) : fl.map((c, i) => (
              <tr key={c.id} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.02)" }}>
                <td style={{ ...S.td, color: "rgba(255,255,255,.2)", fontSize: 10 }}>{c.id}</td>
                <td style={{ ...S.td, fontWeight: 600, whiteSpace: "nowrap" }}>{c.nome}</td>
                <td style={S.td}>{c.cpf}</td>
                <td style={{ ...S.td, maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.email}</td>
                <td style={S.td}>{c.telefone}</td>
                <td style={S.td}>{c.curso1}</td>
                <td style={{ ...S.td, color: "rgba(255,255,255,.4)" }}>{c.curso2}</td>
                <td style={S.td}><ConvBadge v={c.convenio} /></td>
                <td style={{ ...S.td, color: "rgba(255,255,255,.3)", whiteSpace: "nowrap" }}>{c.createdAt?.slice(0,10) || "—"}</td>
                <td style={{ ...S.td, whiteSpace: "nowrap" }}>
                  <div style={{ display: "flex", gap: 5 }}>
                    <button style={S.aprvBtn} onClick={() => { setModalAprovar(c); setCursoAprovar(c.curso1 || ""); }}>✓ Aprovar</button>
                    <button style={S.editBtn}>Editar</button>
                    <button style={S.delBtn} onClick={() => { if (window.confirm(`Excluir ${c.nome}?`)) excluirMutation.mutate(c.id); }}>Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal Aprovar — idêntico ao original */}
      {modalAprovar && (
        <div style={S.overlay}>
          <div style={{ background: "#0D1530", borderRadius: 14, padding: 28, maxWidth: 440, width: "100%", border: "1px solid rgba(255,255,255,.1)" }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "#fff", marginBottom: 4 }}>Aprovar candidato</div>
            <div style={{ fontSize: 12, color: "rgba(255,255,255,.4)", marginBottom: 18 }}>{modalAprovar.nome}</div>
            <label style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,.6)", display: "block", marginBottom: 8 }}>Curso aprovado *</label>
            <select
              value={cursoAprovar}
              onChange={e => setCursoAprovar(e.target.value)}
              style={{ width: "100%", padding: "10px 14px", border: "1px solid rgba(255,255,255,.1)", borderRadius: 9, fontSize: 13, outline: "none", background: "#0A1128", color: "#fff", marginBottom: 18 }}
            >
              <option value="">Selecione...</option>
              {listaCursos.map(c => <option key={c.nome} value={c.nome}>{c.nome}</option>)}
            </select>
            <div style={{ display: "flex", gap: 10 }}>
              <button
                onClick={() => { setModalAprovar(null); setCursoAprovar(""); }}
                style={{ flex: 1, padding: "10px", background: "rgba(255,255,255,.05)", color: "rgba(255,255,255,.5)", border: "1px solid rgba(255,255,255,.1)", borderRadius: 9, fontSize: 13, fontWeight: 600, cursor: "pointer" }}
              >Cancelar</button>
              <button
                onClick={() => modalAprovar && aprovarMutation.mutate(modalAprovar)}
                disabled={!cursoAprovar || aprovarMutation.isPending}
                style={{ flex: 2, padding: "10px", background: cursoAprovar ? GREEN : "#333", color: "#fff", border: "none", borderRadius: 9, fontSize: 13, fontWeight: 700, cursor: cursoAprovar ? "pointer" : "not-allowed" }}
              >{aprovarMutation.isPending ? "Aprovando..." : "✓ Confirmar aprovação"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
