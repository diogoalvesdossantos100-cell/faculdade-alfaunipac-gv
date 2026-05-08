export function VarianteA() {
  const nav = ["Dashboard", "Alunos", "Frequência", "Retenção", "Documentos", "BAP", "Relatórios"];
  const active = "Dashboard";

  return (
    <div className="flex h-screen font-sans" style={{ background: "#F0F4F8" }}>
      {/* Sidebar */}
      <aside className="w-56 flex flex-col" style={{ background: "#0A2747" }}>
        <div className="flex flex-col items-center gap-2 py-6 px-4 border-b" style={{ borderColor: "#1a3a6a" }}>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "#F97316" }}>
            <span style={{ fontSize: 20 }}>🎓</span>
          </div>
          <div className="text-center">
            <p className="text-white font-bold text-sm leading-tight">AlfaUnipac GV</p>
            <p className="text-xs" style={{ color: "#93b4d0" }}>Gestão Acadêmica</p>
          </div>
        </div>
        <nav className="flex-1 py-4 px-2 space-y-1">
          {nav.map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm cursor-pointer transition-all"
              style={
                item === active
                  ? { background: "#F97316", color: "#fff", fontWeight: 600 }
                  : { color: "#93b4d0" }
              }
            >
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: item === active ? "#fff" : "#3a6a9a" }} />
              {item}
            </div>
          ))}
        </nav>
        <div className="px-4 py-4 border-t" style={{ borderColor: "#1a3a6a" }}>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#F97316" }}>A</div>
            <div>
              <p className="text-xs font-medium text-white">Admin</p>
              <p className="text-xs" style={{ color: "#93b4d0" }}>Secretaria</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-white border-b border-slate-200 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold" style={{ color: "#0A2747" }}>Dashboard</h1>
            <p className="text-xs text-slate-400">Visão geral do sistema</p>
          </div>
          <div className="text-xs px-3 py-1 rounded-full font-medium" style={{ background: "#FFF3E0", color: "#F97316" }}>
            Ano Letivo 2026
          </div>
        </div>

        {/* KPI cards */}
        <div className="p-6 grid grid-cols-4 gap-4">
          {[
            { label: "Total de Alunos", value: "1.248", icon: "👥", color: "#0A2747" },
            { label: "Turmas Ativas", value: "42", icon: "🏫", color: "#F97316" },
            { label: "Retenção em Aberto", value: "37", icon: "⚠️", color: "#DC2626" },
            { label: "Docs Pendentes", value: "15", icon: "📄", color: "#0A2747" },
          ].map((kpi) => (
            <div key={kpi.label} className="bg-white rounded-xl p-4 shadow-sm border border-slate-100">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xl">{kpi.icon}</span>
                <div className="w-2 h-2 rounded-full" style={{ background: kpi.color }} />
              </div>
              <p className="text-2xl font-bold" style={{ color: kpi.color }}>{kpi.value}</p>
              <p className="text-xs text-slate-500 mt-1">{kpi.label}</p>
            </div>
          ))}
        </div>

        {/* Accent bar */}
        <div className="mx-6 rounded-xl p-4 flex items-center justify-between" style={{ background: "#0A2747" }}>
          <div>
            <p className="text-white font-semibold text-sm">Frequência de hoje</p>
            <p className="text-xs" style={{ color: "#93b4d0" }}>8 turmas aguardando registro</p>
          </div>
          <button className="text-sm font-semibold px-4 py-2 rounded-lg" style={{ background: "#F97316", color: "#fff" }}>
            Registrar →
          </button>
        </div>

        {/* Table preview */}
        <div className="mx-6 mt-4 bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: "#0A2747" }}>Retenções Recentes</p>
            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#FFF3E0", color: "#F97316" }}>Ver todos</span>
          </div>
          {["Ana Souza", "Carlos Lima", "Maria Ferreira"].map((nome, i) => (
            <div key={nome} className="px-4 py-3 flex items-center justify-between border-b border-slate-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ background: "#0A2747" }}>
                  {nome[0]}
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-700">{nome}</p>
                  <p className="text-xs text-slate-400">Enfermagem · {30 + i * 5}% faltas</p>
                </div>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: "#FFF3E0", color: "#F97316" }}>
                {["Identificado", "Em Contato", "Aguardando"][i]}
              </span>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
