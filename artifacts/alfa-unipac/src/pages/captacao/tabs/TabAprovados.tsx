import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type { Aprovado } from "../types";
import { NAVY, GREEN } from "../types";

const S = {
  filterInp: { padding: "9px 14px", border: "1px solid rgba(255,255,255,.08)", borderRadius: 9, fontSize: 13, outline: "none", background: "rgba(255,255,255,.04)", color: "#fff", flex: 2, minWidth: 200 } as React.CSSProperties,
  filterSel: { padding: "9px 14px", border: "1px solid rgba(255,255,255,.08)", borderRadius: 9, fontSize: 13, outline: "none", background: "#0D1530", color: "#fff", flex: 1, minWidth: 140 } as React.CSSProperties,
  tableWrap: { background: "#0D1530", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", overflow: "auto", marginBottom: 16 } as React.CSSProperties,
  table:     { width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 900 } as React.CSSProperties,
  th:        { textAlign: "left", padding: "11px 14px", fontWeight: 700, fontSize: 10, color: "rgba(255,255,255,.35)", borderBottom: "1px solid rgba(255,255,255,.06)", background: "rgba(255,255,255,.02)", textTransform: "uppercase", letterSpacing: ".07em", whiteSpace: "nowrap" } as React.CSSProperties,
  td:        { padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,.04)", color: "rgba(255,255,255,.85)" } as React.CSSProperties,
  editBtn:   { background: "none", border: "1px solid rgba(255,255,255,.1)", color: "rgba(255,255,255,.6)", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
};

export default function TabAprovados({ aprovados }: { aprovados: Aprovado[] }) {
  const qc = useQueryClient();
  const [busca,        setBusca]        = useState("");
  const [filtroCurso,  setFiltroCurso]  = useState("");

  const cursosAprovados = [...new Set(aprovados.map(c => c.curso))].sort();
  const fl = aprovados.filter(c => {
    const b = busca.toLowerCase();
    return (!filtroCurso || c.curso === filtroCurso)
      && (!b || c.nome?.toLowerCase().includes(b));
  });

  const matricularMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/vestibular/aprovados/${id}`, { method: "PATCH", body: JSON.stringify({ matriculado: true }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vc-aprovados"] }); toast.success("Matrícula confirmada"); },
    onError: () => toast.error("Erro ao confirmar matrícula"),
  });

  const excluirMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/vestibular/aprovados/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vc-aprovados"] }); toast.success("Removido"); },
    onError: () => toast.error("Erro ao remover"),
  });

  const handleMatriculado = (c: Aprovado) => {
    if (!window.confirm(`Confirmar matrícula de ${c.nome}?`)) return;
    matricularMutation.mutate(c.id);
  };

  const handleNaoInteressado = (c: Aprovado) => {
    if (!window.confirm(`Marcar ${c.nome} como NÃO INTERESSADO?\n\nO candidato será removido da lista de aprovados.`)) return;
    excluirMutation.mutate(c.id);
  };

  const exportCSV = () => {
    const rows = [["#","Nome","CPF","1ª Opção","Data"], ...fl.map(c => [c.id, c.nome, "", c.curso, c.createdAt?.slice(0,10)||""])];
    const csv = rows.map(r => r.map(v => `"${String(v||"").replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿"+csv], { type: "text/csv;charset=utf-8" }));
    a.download = "aprovados.csv"; a.click();
  };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#fff" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap", alignItems: "center" }}>
        <input style={S.filterInp} placeholder="Buscar por nome ou CPF..." value={busca} onChange={e => setBusca(e.target.value)} />
        <select style={S.filterSel} value={filtroCurso} onChange={e => setFiltroCurso(e.target.value)}>
          <option value="">Todos os cursos</option>
          {cursosAprovados.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <button style={{ padding: "9px 18px", background: NAVY, color: "#fff", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer" }} onClick={exportCSV}>
          Exportar CSV
        </button>
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginBottom: 10 }}>{fl.length} aprovado{fl.length !== 1 ? "s" : ""}</div>

      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>{["#","Nome","CPF","1ª Opção","2ª Opção","Data",""].map(h => <th key={h} style={S.th}>{h}</th>)}</tr>
          </thead>
          <tbody>
            {fl.length === 0
              ? <tr><td colSpan={7} style={{ ...S.td, textAlign: "center", color: "rgba(255,255,255,.3)", padding: 28 }}>Nenhum resultado</td></tr>
              : fl.map((c, i) => (
                <tr key={c.id} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.02)" }}>
                  <td style={{ ...S.td, color: "rgba(255,255,255,.2)", fontSize: 10 }}>{c.id}</td>
                  <td style={{ ...S.td, fontWeight: 600, whiteSpace: "nowrap" }}>{c.nome}</td>
                  <td style={{ ...S.td, color: "rgba(255,255,255,.5)" }}>—</td>
                  <td style={S.td}>
                    <span style={{ display: "inline-block", fontSize: 10, padding: "2px 8px", borderRadius: 20, fontWeight: 700, background: "rgba(29,158,117,.2)", color: "#4DD4A0" }}>{c.curso}</span>
                  </td>
                  <td style={{ ...S.td, color: "rgba(255,255,255,.4)" }}>{c.turno || "—"}</td>
                  <td style={{ ...S.td, color: "rgba(255,255,255,.3)", whiteSpace: "nowrap" }}>{c.createdAt?.slice(0,10) || "—"}</td>
                  <td style={{ ...S.td, whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", gap: 5 }}>
                      <button
                        onClick={() => handleMatriculado(c)}
                        style={{ background: GREEN, border: "none", color: "#fff", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}
                      >✓ Matriculado</button>
                      <button style={S.editBtn}>Editar</button>
                      <button
                        onClick={() => handleNaoInteressado(c)}
                        style={{ background: "none", border: "1px solid rgba(226,75,74,.3)", color: "#F09595", borderRadius: 6, padding: "4px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                      >Não interessado</button>
                    </div>
                  </td>
                </tr>
              ))
            }
          </tbody>
        </table>
      </div>
    </div>
  );
}
