import { useState } from "react";
import { Link } from "wouter";
import {
  useListAlunos,
  getListAlunosQueryKey,
  useCreateAluno,
  useUpdateAluno,
  useDeleteAluno,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Eye, Pencil, UserX, X, Users } from "lucide-react";
import { toast } from "sonner";

const CURSOS = ["Administração", "Enfermagem", "Farmácia", "Fisioterapia", "Nutrição"];
const TURNOS = ["Matutino", "Vespertino", "Noturno"];
const STATUS_LIST = ["Ativo", "Retido", "Trancado", "Egresso"];

type AlunoForm = {
  nomeCompleto: string;
  cpf: string;
  matricula: string;
  curso: string;
  turno: string;
  status: string;
  valorMensalidade: number;
  financiador: string;
};

const emptyForm: AlunoForm = {
  nomeCompleto: "",
  cpf: "",
  matricula: "",
  curso: "Administração",
  turno: "Matutino",
  status: "Ativo",
  valorMensalidade: 979,
  financiador: "Hospital Bom Samaritano",
};

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Ativo: "bg-green-50 text-green-700",
    Retido: "bg-amber-50 text-amber-700",
    Trancado: "bg-slate-100 text-slate-600",
    Egresso: "bg-blue-50 text-blue-700",
  };
  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors[status] ?? "bg-slate-100 text-slate-600"}`}>
      {status}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

export default function Alunos() {
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [cursoFilter, setCursoFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<AlunoForm>(emptyForm);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const params = {
    ...(search ? { search } : {}),
    ...(cursoFilter ? { curso: cursoFilter } : {}),
    ...(statusFilter ? { status: statusFilter } : {}),
  };

  const { data: alunos, isLoading } = useListAlunos(params);
  const createMutation = useCreateAluno({
    mutation: {
      onSuccess() {
        toast.success("Aluno cadastrado com sucesso.");
        qc.invalidateQueries({ queryKey: getListAlunosQueryKey() });
        setModalOpen(false);
      },
      onError() { toast.error("Erro ao cadastrar aluno."); },
    },
  });
  const updateMutation = useUpdateAluno({
    mutation: {
      onSuccess() {
        toast.success("Aluno atualizado.");
        qc.invalidateQueries({ queryKey: getListAlunosQueryKey() });
        setModalOpen(false);
      },
      onError() { toast.error("Erro ao atualizar aluno."); },
    },
  });
  const deleteMutation = useDeleteAluno({
    mutation: {
      onSuccess() {
        toast.success("Aluno desativado.");
        qc.invalidateQueries({ queryKey: getListAlunosQueryKey() });
        setConfirmDeleteId(null);
      },
      onError() { toast.error("Erro ao desativar aluno."); },
    },
  });

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setModalOpen(true);
  };

  const openEdit = (aluno: AlunoForm & { id: number }) => {
    setEditId(aluno.id);
    setForm({
      nomeCompleto: aluno.nomeCompleto,
      cpf: aluno.cpf,
      matricula: aluno.matricula,
      curso: aluno.curso,
      turno: aluno.turno,
      status: aluno.status,
      valorMensalidade: aluno.valorMensalidade,
      financiador: aluno.financiador,
    });
    setModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      turno: form.turno as "Matutino" | "Vespertino" | "Noturno",
      status: form.status as "Ativo" | "Retido" | "Trancado" | "Egresso",
    };
    if (editId) {
      updateMutation.mutate({ id: editId, data: payload });
    } else {
      createMutation.mutate({ data: payload });
    }
  };

  const isBusy = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Alunos</h1>
          <p className="text-slate-500 text-sm mt-0.5">Gestão do corpo discente</p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-cyan-400 hover:bg-cyan-300 text-[#0A192F] font-semibold text-sm px-4 py-2.5 rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Aluno
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-52">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome, CPF ou matrícula..."
            className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-cyan-300"
          />
        </div>
        <select
          value={cursoFilter}
          onChange={(e) => setCursoFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-300"
        >
          <option value="">Todos os cursos</option>
          {CURSOS.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-300"
        >
          <option value="">Todos os status</option>
          {STATUS_LIST.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {isLoading ? (
          <div className="p-6 space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-50 rounded animate-pulse" />
            ))}
          </div>
        ) : !alunos?.length ? (
          <div className="text-center py-16 text-slate-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="font-medium">Nenhum aluno encontrado.</p>
            <button onClick={openCreate} className="mt-3 text-sm text-cyan-600 hover:underline">
              Cadastrar novo aluno
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                <th className="px-5 py-3">Nome</th>
                <th className="px-5 py-3">Matrícula</th>
                <th className="px-5 py-3">Curso</th>
                <th className="px-5 py-3">Turno</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {alunos.map((a) => (
                <tr key={a.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3 font-medium text-slate-800">{a.nomeCompleto}</td>
                  <td className="px-5 py-3 text-slate-500 font-mono text-xs">{a.matricula}</td>
                  <td className="px-5 py-3 text-slate-600">{a.curso}</td>
                  <td className="px-5 py-3 text-slate-500">{a.turno}</td>
                  <td className="px-5 py-3"><StatusBadge status={a.status} /></td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link href={`/alunos/${a.id}`}>
                        <button className="p-1.5 rounded hover:bg-blue-50 text-slate-400 hover:text-blue-600 transition-colors" title="Ver detalhes">
                          <Eye className="w-4 h-4" />
                        </button>
                      </Link>
                      <button
                        onClick={() => openEdit(a as AlunoForm & { id: number })}
                        className="p-1.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                        title="Editar"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      {a.status === "Ativo" && (
                        <button
                          onClick={() => setConfirmDeleteId(a.id)}
                          className="p-1.5 rounded hover:bg-red-50 text-slate-400 hover:text-red-600 transition-colors"
                          title="Desativar"
                        >
                          <UserX className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Create/Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-lg font-semibold text-slate-900">
                {editId ? "Editar Aluno" : "Novo Aluno"}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <Field label="Nome Completo">
                <input
                  required
                  value={form.nomeCompleto}
                  onChange={(e) => setForm({ ...form, nomeCompleto: e.target.value })}
                  className="input-base w-full"
                />
              </Field>
              <div className="grid grid-cols-2 gap-4">
                <Field label="CPF">
                  <input
                    required
                    value={form.cpf}
                    onChange={(e) => setForm({ ...form, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                    className="input-base w-full"
                  />
                </Field>
                <Field label="Matrícula">
                  <input
                    required
                    value={form.matricula}
                    onChange={(e) => setForm({ ...form, matricula: e.target.value })}
                    className="input-base w-full"
                  />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Curso">
                  <select
                    value={form.curso}
                    onChange={(e) => setForm({ ...form, curso: e.target.value })}
                    className="input-base w-full"
                  >
                    {CURSOS.map((c) => <option key={c}>{c}</option>)}
                  </select>
                </Field>
                <Field label="Turno">
                  <select
                    value={form.turno}
                    onChange={(e) => setForm({ ...form, turno: e.target.value })}
                    className="input-base w-full"
                  >
                    {TURNOS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Field label="Status">
                  <select
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="input-base w-full"
                  >
                    {STATUS_LIST.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Mensalidade (R$)">
                  <input
                    type="number"
                    step="0.01"
                    value={form.valorMensalidade}
                    onChange={(e) => setForm({ ...form, valorMensalidade: parseFloat(e.target.value) })}
                    className="input-base w-full"
                  />
                </Field>
              </div>
              <Field label="Financiador">
                <input
                  value={form.financiador}
                  onChange={(e) => setForm({ ...form, financiador: e.target.value })}
                  className="input-base w-full"
                />
              </Field>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="flex-1 border border-slate-200 text-slate-700 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isBusy}
                  className="flex-1 bg-cyan-400 hover:bg-cyan-300 text-[#0A192F] font-semibold rounded-lg py-2.5 text-sm disabled:opacity-60 transition-colors"
                >
                  {isBusy ? "Salvando..." : "Salvar"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {confirmDeleteId !== null && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">Desativar Aluno</h2>
            <p className="text-slate-500 text-sm mb-6">
              O aluno será marcado como "Trancado". Esta ação pode ser revertida editando o aluno.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 border border-slate-200 text-slate-700 rounded-lg py-2.5 text-sm font-medium hover:bg-slate-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => deleteMutation.mutate({ id: confirmDeleteId })}
                disabled={deleteMutation.isPending}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-lg py-2.5 text-sm disabled:opacity-60 transition-colors"
              >
                {deleteMutation.isPending ? "Desativando..." : "Desativar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
