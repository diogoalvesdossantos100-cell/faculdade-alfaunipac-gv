import { Link } from "wouter";
import {
  useGetDashboardStats,
  useGetProximasChamadas,
} from "@workspace/api-client-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Users, AlertTriangle, FileText, TrendingUp, ClipboardCheck, Receipt } from "lucide-react";

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  sub,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
  sub?: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 font-medium">{label}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
          {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
        </div>
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useGetDashboardStats();
  const { data: proximas, isLoading: proximasLoading } = useGetProximasChamadas();

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-0.5">Visão geral do sistema acadêmico</p>
      </div>

      {/* Stats */}
      {statsLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200 p-5 h-28 animate-pulse">
              <div className="h-4 bg-slate-100 rounded w-24 mb-3" />
              <div className="h-8 bg-slate-100 rounded w-16" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <StatCard
            label="Alunos Ativos"
            value={stats?.totalAlunosAtivos ?? 0}
            icon={Users}
            color="bg-blue-50 text-blue-600"
          />
          <StatCard
            label="Em Retenção"
            value={stats?.alunosEmRetencao ?? 0}
            icon={AlertTriangle}
            color="bg-amber-50 text-amber-600"
            sub="acima de 25% de faltas"
          />
          <StatCard
            label="Docs Pendentes"
            value={stats?.documentosPendentes ?? 0}
            icon={FileText}
            color="bg-red-50 text-red-600"
            sub="aguardando análise"
          />
          <StatCard
            label="Frequência Média"
            value={`${stats?.frequenciaMediaMes ?? 0}%`}
            icon={TrendingUp}
            color="bg-green-50 text-green-600"
            sub="mês atual"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Alunos por Curso</h2>
          {statsLoading ? (
            <div className="h-52 animate-pulse bg-slate-50 rounded-lg" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats?.alunosPorCurso ?? []} margin={{ top: 4, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  dataKey="curso"
                  tick={{ fontSize: 11, fill: "#64748b" }}
                  tickLine={false}
                  axisLine={false}
                  interval={0}
                  angle={-20}
                  textAnchor="end"
                  height={50}
                />
                <YAxis tick={{ fontSize: 11, fill: "#64748b" }} tickLine={false} axisLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{ border: "1px solid #e2e8f0", borderRadius: "8px", fontSize: 12 }}
                  labelStyle={{ fontWeight: 600 }}
                  formatter={(v: number) => [v, "Alunos"]}
                />
                <Bar dataKey="count" fill="#00D4FF" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 mb-4">Acesso Rápido</h2>
          <div className="space-y-3">
            <Link href="/frequencia">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50 transition-all cursor-pointer group">
                <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-cyan-100 group-hover:text-cyan-700 transition-colors">
                  <ClipboardCheck className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Registrar Chamada</p>
                  <p className="text-xs text-slate-400">Marcar frequência de alunos</p>
                </div>
              </div>
            </Link>
            <Link href="/bap">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-cyan-300 hover:bg-cyan-50 transition-all cursor-pointer group">
                <div className="w-9 h-9 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-cyan-100 group-hover:text-cyan-700 transition-colors">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Gerar BAP</p>
                  <p className="text-xs text-slate-400">Lista mensal de cobranças</p>
                </div>
              </div>
            </Link>
            <Link href="/retencao">
              <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 hover:border-amber-300 hover:bg-amber-50 transition-all cursor-pointer group">
                <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center transition-colors">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-800">Ver Retenção</p>
                  <p className="text-xs text-slate-400">Alunos com excesso de faltas</p>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Recent chamadas */}
      <div className="mt-6 bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900 mb-4">Chamadas Recentes</h2>
        {proximasLoading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-10 bg-slate-50 rounded animate-pulse" />
            ))}
          </div>
        ) : !proximas?.length ? (
          <p className="text-slate-400 text-sm text-center py-8">Nenhuma chamada registrada ainda.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-slate-400 font-medium border-b border-slate-100">
                  <th className="pb-3 pr-4">Disciplina</th>
                  <th className="pb-3 pr-4">Curso</th>
                  <th className="pb-3 pr-4">Data</th>
                  <th className="pb-3 pr-4 text-center">Presentes</th>
                  <th className="pb-3 text-center">Ausentes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {proximas.map((row, i) => (
                  <tr key={i} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 pr-4 font-medium text-slate-800">{row.disciplinaNome}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{row.curso}</td>
                    <td className="py-2.5 pr-4 text-slate-500">{formatDate(row.data)}</td>
                    <td className="py-2.5 pr-4 text-center">
                      <span className="inline-block bg-green-50 text-green-700 px-2 py-0.5 rounded text-xs font-medium">
                        {row.presentes}
                      </span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className="inline-block bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs font-medium">
                        {row.ausentes}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function formatDate(dateStr: string): string {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}
