import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiFetch } from "@/lib/api";
import type { Curso } from "../PainelCaptacao";
import { NAVY, ORANGE, GREEN } from "../PainelCaptacao";

const PURPLE = "#534AB7";
const TEAL   = "#0F6E56";

// Formulários idênticos ao GerenciarCursos.jsx original
const FORMS = [
  { chave: "vestibular",  label: "Vestibular 2026/2",               desc: "Formulário de pré-inscrição no vestibular",                 cor: NAVY   },
  { chave: "pesquisa",    label: "Pesquisa de Interesse",            desc: "Formulário de pesquisa de demanda — novos cursos",          cor: ORANGE },
  { chave: "mba",         label: "MBA em Cuidados Paliativos",       desc: "Formulário de pré-inscrição no MBA executivo",              cor: PURPLE },
  { chave: "manchester",  label: "Protocolo de Manchester",          desc: "Formulário de inscrição na certificação Manchester",        cor: TEAL   },
  { chave: "portacath",   label: "Curso de Capacitação — Port-a-Cath", desc: "Formulário de inscrição no curso Port-a-Cath",           cor: "#0092B3" },
  { chave: "workshop",    label: "Workshop de Soluções Hospitalares", desc: "Formulário de inscrição no Workshop — gestores HBS",      cor: "#00A6C4" },
];

export default function TabGerenciarCursos({ cursos }: { cursos: Curso[] }) {
  const qc = useQueryClient();
  const [novo,   setNovo]   = useState("");
  const [adding, setAdding] = useState(false);

  // Estado dos formulários ativos (via API)
  const { data: configData = [] } = useQuery<{ formulario: string; ativo: boolean }[]>({
    queryKey: ["vc-config"],
    queryFn: () => apiFetch("/api/vestibular/config"),
  });

  const formsAtivos: Record<string, boolean> = {};
  for (const f of FORMS) {
    const cfg = configData.find(c => c.formulario === f.chave);
    formsAtivos[f.chave] = cfg ? cfg.ativo : true;
  }

  const toggleFormMutation = useMutation({
    mutationFn: ({ chave, ativo }: { chave: string; ativo: boolean }) =>
      apiFetch(`/api/vestibular/config/${chave}`, { method: "PATCH", body: JSON.stringify({ ativo }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vc-config"] }),
    onError: () => toast.error("Erro ao atualizar formulário"),
  });

  const toggleAtivoMutation = useMutation({
    mutationFn: ({ id, ativo }: { id: number; ativo: boolean }) =>
      apiFetch(`/api/vestibular/cursos/${id}`, { method: "PATCH", body: JSON.stringify({ ativo }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["vc-cursos"] }),
    onError: () => toast.error("Erro ao atualizar"),
  });

  const excluirMutation = useMutation({
    mutationFn: (id: number) => apiFetch(`/api/vestibular/cursos/${id}`, { method: "DELETE" }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vc-cursos"] }); toast.success("Removido"); },
    onError: () => toast.error("Erro ao remover"),
  });

  const adicionarMutation = useMutation({
    mutationFn: () => apiFetch("/api/vestibular/cursos", { method: "POST", body: JSON.stringify({ nome: novo.trim(), periodo: "2026/2", ativo: true }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["vc-cursos"] }); setNovo(""); toast.success("Curso adicionado"); },
    onError: () => toast.error("Erro ao adicionar"),
  });

  const ativos   = cursos.filter(c => c.ativo).length;
  const inativos = cursos.filter(c => !c.ativo).length;

  return (
    <div style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Seção Formulários — FUNDO BRANCO idêntico ao original ───────── */}
      <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Gerenciar Formulários da Home</div>
      <div style={{ fontSize: 12, color: "#8892B0", marginBottom: 16 }}>Ative ou desative quais formulários aparecem na página inicial para o público.</div>

      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 32 }}>
        {FORMS.map(f => {
          const ativo = formsAtivos[f.chave] ?? true;
          return (
            <div key={f.chave} style={{ background: "#fff", borderRadius: 10, border: `1px solid ${ativo ? f.cor + "44" : "#E2E6F0"}`, padding: "14px 18px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, transition: "all .2s" }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                  <span style={{ width: 8, height: 8, borderRadius: "50%", background: ativo ? f.cor : "#CBD2E8", flexShrink: 0 }} />
                  <div style={{ fontSize: 13, fontWeight: 700, color: ativo ? NAVY : "#8892B0" }}>{f.label}</div>
                </div>
                <div style={{ fontSize: 12, color: "#8892B0", marginLeft: 16 }}>{f.desc}</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: ativo ? f.cor : "#8892B0" }}>
                  {ativo ? "● Ativo" : "○ Inativo"}
                </span>
                <button
                  onClick={() => toggleFormMutation.mutate({ chave: f.chave, ativo: !ativo })}
                  style={{ padding: "5px 16px", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: "pointer", background: ativo ? "#FEF0E6" : "#E1F5EE", color: ativo ? ORANGE : GREEN }}>
                  {ativo ? "Desativar" : "Ativar"}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ height: 1, background: "#E2E6F0", marginBottom: 24 }} />

      {/* ── Seção Cursos — FUNDO BRANCO idêntico ao original ─────────────── */}
      <div style={{ fontSize: 13, fontWeight: 700, color: NAVY, marginBottom: 4 }}>Gerenciar Cursos do Vestibular</div>
      <div style={{ fontSize: 12, color: "#8892B0", marginBottom: 20 }}>Cursos ativos aparecem no formulário público. Cursos inativos ficam ocultos mas os dados já cadastrados são preservados.</div>

      {/* Resumo */}
      <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
        <div style={{ background: "#E1F5EE", borderRadius: 8, padding: "10px 16px", border: "1px solid rgba(29,158,117,.13)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: GREEN, textTransform: "uppercase", letterSpacing: ".06em" }}>Ativos</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: GREEN }}>{ativos}</div>
        </div>
        <div style={{ background: "#FEF0E6", borderRadius: 8, padding: "10px 16px", border: "1px solid rgba(244,121,32,.13)" }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: ORANGE, textTransform: "uppercase", letterSpacing: ".06em" }}>Inativos</div>
          <div style={{ fontSize: 22, fontWeight: 800, color: ORANGE }}>{inativos}</div>
        </div>
      </div>

      {/* Adicionar novo */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E2E6F0", padding: 16, marginBottom: 16 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#8892B0", textTransform: "uppercase", letterSpacing: ".08em", marginBottom: 10 }}>Adicionar novo curso</div>
        <div style={{ display: "flex", gap: 10 }}>
          <input
            style={{ flex: 1, padding: "8px 12px", border: "1px solid #E2E6F0", borderRadius: 8, fontSize: 13, outline: "none" }}
            placeholder="Nome do curso (ex: Medicina Veterinária)"
            value={novo}
            onChange={e => setNovo(e.target.value)}
            onKeyDown={e => e.key === "Enter" && !adding && novo.trim() && adicionarMutation.mutate()}
          />
          <button
            onClick={() => adicionarMutation.mutate()}
            disabled={adding || !novo.trim() || adicionarMutation.isPending}
            style={{ padding: "8px 20px", background: NAVY, color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer", opacity: adicionarMutation.isPending || !novo.trim() ? .6 : 1 }}>
            {adicionarMutation.isPending ? "Adicionando..." : "+ Adicionar"}
          </button>
        </div>
      </div>

      {/* Lista de cursos — fundo branco */}
      <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #E2E6F0", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr>
              {["Curso","Status","Ações"].map(h => (
                <th key={h} style={{ textAlign: h === "Curso" ? "left" : "center", padding: "10px 16px", fontWeight: 700, fontSize: 11, color: "#8892B0", borderBottom: "1px solid #F0F2F8", background: "#FAFBFD", textTransform: "uppercase", letterSpacing: ".06em" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cursos.map((c, i) => (
              <tr key={c.id} style={{ background: i % 2 === 0 ? "#fff" : "#FAFBFD" }}>
                <td style={{ padding: "12px 16px", fontWeight: 600, color: c.ativo ? "#1C1C2E" : "#8892B0" }}>
                  {c.nome}
                  {!c.ativo && <span style={{ marginLeft: 8, fontSize: 10, color: "#B0B8CC" }}>(inativo)</span>}
                </td>
                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                  <span style={{ display: "inline-block", fontSize: 11, padding: "3px 12px", borderRadius: 20, fontWeight: 700, background: c.ativo ? "#E1F5EE" : "#F4F6FB", color: c.ativo ? GREEN : "#8892B0" }}>
                    {c.ativo ? "● Ativo" : "○ Inativo"}
                  </span>
                </td>
                <td style={{ padding: "12px 16px", textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button
                      onClick={() => toggleAtivoMutation.mutate({ id: c.id, ativo: !c.ativo })}
                      style={{ padding: "4px 14px", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer", background: c.ativo ? "#FEF0E6" : "#E1F5EE", color: c.ativo ? ORANGE : GREEN }}>
                      {c.ativo ? "Desativar" : "Ativar"}
                    </button>
                    <button
                      onClick={() => { if (window.confirm(`Excluir o curso "${c.nome}"?\n\nOs candidatos já inscritos nesse curso não serão afetados.`)) excluirMutation.mutate(c.id); }}
                      style={{ padding: "4px 14px", background: "none", border: "1px solid #FFD0D0", color: "#E55", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}>
                      Excluir
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
