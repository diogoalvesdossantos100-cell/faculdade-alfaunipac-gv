import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import { NAVY, ORANGE } from "../PainelCaptacao";

type InscricaoEvento = Record<string, string | number | null | undefined>;

const S = {
  filterInp: { padding: "9px 14px", border: "1px solid rgba(255,255,255,.08)", borderRadius: 9, fontSize: 13, outline: "none", background: "rgba(255,255,255,.04)", color: "#fff", flex: 2, minWidth: 200 } as React.CSSProperties,
  tableWrap: { background: "#0D1530", borderRadius: 14, border: "1px solid rgba(255,255,255,.07)", overflow: "auto", marginBottom: 16 } as React.CSSProperties,
  table:     { width: "100%", borderCollapse: "collapse", fontSize: 12, minWidth: 700 } as React.CSSProperties,
  th:        { textAlign: "left", padding: "11px 14px", fontWeight: 700, fontSize: 10, color: "rgba(255,255,255,.35)", borderBottom: "1px solid rgba(255,255,255,.06)", background: "rgba(255,255,255,.02)", textTransform: "uppercase", letterSpacing: ".07em", whiteSpace: "nowrap" } as React.CSSProperties,
  td:        { padding: "11px 14px", borderBottom: "1px solid rgba(255,255,255,.04)", color: "rgba(255,255,255,.85)", whiteSpace: "nowrap" } as React.CSSProperties,
  delBtn:    { background: "none", border: "1px solid rgba(226,75,74,.3)", color: "#F09595", borderRadius: 6, padding: "3px 10px", fontSize: 11, fontWeight: 600, cursor: "pointer" } as React.CSSProperties,
};

// Colunas idênticas ao AbaSimples original por tipo de evento
const COLUNAS: Record<string, { key: string; label: string }[]> = {
  mba: [
    { key: "nome",               label: "Nome"        },
    { key: "cpf",                label: "CPF"         },
    { key: "concluiuGraduacao",  label: "Formação"    },
    { key: "rg",                 label: "Registro"    },
    { key: "telefone",           label: "Telefone"    },
    { key: "email",              label: "E-mail"      },
    { key: "createdAt",          label: "Data"        },
  ],
  manchester: [
    { key: "nome",               label: "Nome"        },
    { key: "cpf",                label: "CPF"         },
    { key: "concluiuGraduacao",  label: "Formação"    },
    { key: "rg",                 label: "CRM/COREN"   },
    { key: "telefone",           label: "Telefone"    },
    { key: "email",              label: "E-mail"      },
    { key: "createdAt",          label: "Data"        },
  ],
  portacath: [
    { key: "nome",               label: "Nome"        },
    { key: "cpf",                label: "CPF"         },
    { key: "email",              label: "E-mail"      },
    { key: "telefone",           label: "Telefone"    },
    { key: "rg",                 label: "Registro"    },
    { key: "createdAt",          label: "Data"        },
  ],
  workshop: [
    { key: "nome",               label: "Nome"        },
    { key: "cpf",                label: "CPF"         },
    { key: "email",              label: "E-mail"      },
    { key: "telefone",           label: "Telefone"    },
    { key: "cursoGraduacao",     label: "Área"        },
    { key: "createdAt",          label: "Data"        },
  ],
};

function formatCell(key: string, val: unknown): string {
  if (val === null || val === undefined) return "—";
  if (key === "createdAt" && typeof val === "string") return val.slice(0, 10);
  return String(val);
}

export default function TabEvento({ evento, tipo }: { evento: string; tipo: keyof typeof COLUNAS }) {
  const qc = useQueryClient();
  const [busca, setBusca] = useState("");

  const { data: dados = [], isLoading } = useQuery<InscricaoEvento[]>({
    queryKey: ["vc-inscricoes", evento],
    queryFn: () => apiFetch(`/api/vestibular/inscricoes/${evento}`),
  });

  const excluirMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/vestibular/inscricoes/${evento}/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vc-inscricoes", evento] }); toast.success("Removido"); },
    onError: () => toast.error("Erro ao remover"),
  });

  const colunas = COLUNAS[tipo] || COLUNAS.mba;

  const fl = dados.filter(c => {
    const b = busca.toLowerCase();
    return !b || String(c.nome||"").toLowerCase().includes(b) || String(c.cpf||"").includes(b) || String(c.email||"").toLowerCase().includes(b);
  });

  const exportCSV = () => {
    const keys    = colunas.map(c => c.key);
    const headers = colunas.map(c => c.label);
    const rows    = [headers, ...fl.map(c => keys.map(k => formatCell(k, c[k])))];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g,'""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob(["﻿"+csv], { type: "text/csv;charset=utf-8" }));
    a.download = `${evento}.csv`; a.click();
  };

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif", color: "#fff" }}>
      <div style={{ display: "flex", gap: 10, marginBottom: 14, flexWrap: "wrap" }}>
        <input style={S.filterInp} placeholder="Buscar..." value={busca} onChange={e => setBusca(e.target.value)} />
        <button style={{ padding: "9px 18px", background: NAVY, color: "#fff", border: "none", borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: "pointer" }} onClick={exportCSV}>Exportar CSV</button>
      </div>
      <div style={{ fontSize: 12, color: "rgba(255,255,255,.3)", marginBottom: 10 }}>{fl.length} inscrito{fl.length !== 1 ? "s" : ""}</div>

      <div style={S.tableWrap}>
        <table style={S.table}>
          <thead>
            <tr>
              <th style={S.th}>#</th>
              {colunas.map(c => <th key={c.key} style={S.th}>{c.label}</th>)}
              <th style={S.th}></th>
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? <tr><td colSpan={colunas.length + 2} style={{ ...S.td, textAlign: "center", color: "rgba(255,255,255,.3)", padding: 40 }}>Carregando...</td></tr>
              : fl.length === 0
              ? <tr><td colSpan={colunas.length + 2} style={{ ...S.td, textAlign: "center", color: "rgba(255,255,255,.3)", padding: 28 }}>Nenhum resultado</td></tr>
              : fl.map((c, i) => (
                <tr key={String(c.id)} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,.02)" }}>
                  <td style={{ ...S.td, color: "rgba(255,255,255,.2)", fontSize: 10 }}>{String(c.id)}</td>
                  {colunas.map(col => <td key={col.key} style={S.td}>{formatCell(col.key, c[col.key])}</td>)}
                  <td style={S.td}>
                    <button style={S.delBtn} onClick={() => { if (window.confirm(`Excluir inscrição de ${c.nome}?`)) excluirMutation.mutate(Number(c.id)); }}>Excluir</button>
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
