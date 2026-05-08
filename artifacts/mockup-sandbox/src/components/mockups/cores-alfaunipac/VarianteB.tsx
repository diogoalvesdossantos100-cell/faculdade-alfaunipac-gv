export function VarianteB() {
  const nav = ["Dashboard", "Alunos", "Frequência", "Retenção", "Documentos", "BAP", "Relatórios"];
  const active = "Dashboard";

  return (
    <div className="flex h-screen font-sans" style={{ background: "#EFF6FF" }}>
      {/* Sidebar */}
      <aside className="w-56 flex flex-col" style={{ background: "#1E3A8A" }}>
        <div className="flex flex-col items-center gap-2 py-6 px-4 border-b" style={{ borderColor: "#2d4fa8" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#EA580C" }}>
            <span style={{ fontSize: 20 }}>🎓</span>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-sm leading-tight">AlfaUnipac GV</p>
            <p className="text-xs" style={{ color: "#93c5fd" }}>Gestão Acadêmica</p>
          </div>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1">
          {nav.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer"
              style={
                item === active
                  ? { background: "#EA580C", color: "#fff", fontWeight: 600 }
                  : { color: "#bfdbfe" }
              }
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: item === active ? "#fff" : "#3b5fc0" }} />
              {item}
            </div>
          ))}
        </nav>
        <div className="px-4 py-4 border-t" style={{ borderColor: "#2d4fa8" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#EA580C" }}>A</div>
            <div>
              <p className="text-xs font-medium text-white">Admin</p>
              <p className="text-xs" style={{ color: "#93c5fd" }}>Secretaria</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-blue-100 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#1E3A8A" }}>Dashboard</h1>
            <p className="text-xs text-slate-400">Visão geral do sistema</p>
          </div>
          <div className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: "#FFF7ED", color: "#EA580C" }}>
            Ano Letivo 2026
          </div>
        </div>

        {/* KPI cards */}
        <div className="p-6 grid grid-cols-4 gap-4">
          {[
            { label: "Total de Alunos", value: "1.248", icon: "👥", color: "#1E3A8A" },
            { label: "Turmas Ativas", value: "42", icon: "🏫", color: "#EA580C" },
            { label: "Retenção em Aberto", value: "37", icon: "⚠️", color: "#DC2626" },
            { label: "Docs Pendentes", value: "15", icon: "📄", color: "#1E3A8A" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl p-4 shadow-sm border border-blue-100">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xl">{kpi.icon}</span>
                <div className="w-2 h-2 rounded-full" style={{ background: kpi.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
              <p className="text-xs text-slate-500 mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Gradient accent bar */}
        <div className="mx-6 rounded-xl p-4 flex items-center justify-between" style={{ background: "linear-gradient(135deg, #1E3A8A 0%, #2563EB 100%)" }}>
          <div>
            <p className="text-white font-semibold text-sm">Frequência de hoje</p>
            <p className="text-xs" style={{ color: "#93c5fd" }}>8 turmas aguardando registro</p>
          </div>
          <button className="text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: "#EA580C", color: "#fff" }}>
            Registrar →
          </button>
        </div>

        {/* Table preview */}
        <div className="mx-6 mt-4 bg-white rounded-xl border border-blue-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-blue-50 flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: "#1E3A8A" }}>Retenções Recentes</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#FFF7ED", color: "#EA580C" }}>Ver todos</span>
          </div>
          {["Ana Souza", "Carlos Lima", "Maria Ferreira"].map((nome, i) => (
            <div key={nome} className="px-4 py-3 flex items-center justify-between border-b border-blue-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#1E3A8A" }}>
                  {nome[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{nome}</p>
                  <p className="text-xs text-slate-400">Enfermagem · {30 + i * 5}% faltas</p>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#FFF7ED", color: "#EA580C" }}>
                {["Identificado", "Em Contato", "Aguardando"][i]}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
