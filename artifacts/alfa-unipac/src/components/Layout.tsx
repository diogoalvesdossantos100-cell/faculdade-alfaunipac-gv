import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  Users,
  ClipboardCheck,
  AlertTriangle,
  FileText,
  Receipt,
  BarChart3,
  LogOut,
  GraduationCap,
  ChevronRight,
  UserPlus,
  BookOpen,
  Award,
  TrendingUp,
} from "lucide-react";
import { useAuth } from "@/contexts/auth";
import { useGetPendentesCount } from "@workspace/api-client-react";
import { useListRetencao } from "@workspace/api-client-react";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface NavItemProps {
  href: string;
  icon: ReactNode;
  label: string;
  badge?: number;
}

function NavItem({ href, icon, label, badge }: NavItemProps) {
  const [location] = useLocation();
  const active = location === href || (href !== "/" && location.startsWith(href));

  return (
    <Link href={href}>
      <div
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-150 group",
          active
            ? "bg-cyan-400/15 text-cyan-400 font-medium"
            : "text-slate-300 hover:bg-white/5 hover:text-white"
        )}
      >
        {active && (
          <span className="absolute left-0 w-1 h-8 bg-cyan-400 rounded-r-full" />
        )}
        <span className={cn("w-5 h-5 flex-shrink-0", active ? "text-cyan-400" : "text-slate-400 group-hover:text-white")}>
          {icon}
        </span>
        <span className="flex-1 text-sm">{label}</span>
        {badge != null && badge > 0 && (
          <span className="ml-auto bg-amber-500 text-white text-xs font-bold rounded-full px-1.5 py-0.5 min-w-[1.25rem] text-center">
            {badge > 99 ? "99+" : badge}
          </span>
        )}
      </div>
    </Link>
  );
}

export default function Layout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [, navigate] = useLocation();

  const { data: pendentesData } = useGetPendentesCount();
  const { data: retencaoData } = useListRetencao();

  const pendentesCount = pendentesData?.count ?? 0;
  const retencaoCount = Array.isArray(retencaoData)
    ? retencaoData.filter((r: { status: string }) => r.status === "Em_Acompanhamento").length
    : 0;

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50">
      {/* Sidebar */}
      <aside className="relative flex flex-col w-64 flex-shrink-0 bg-[#0A192F] text-white">
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-lg bg-cyan-400 flex items-center justify-center flex-shrink-0">
            <GraduationCap className="w-5 h-5 text-[#0A192F]" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-white leading-tight">AlfaUnipac GV</p>
            <p className="text-xs text-slate-400 leading-tight truncate">Gestão Acadêmica</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          <NavItem href="/dashboard" icon={<LayoutDashboard />} label="Dashboard" />
          <NavItem href="/alunos" icon={<Users />} label="Alunos" />
          <NavItem href="/frequencia" icon={<ClipboardCheck />} label="Frequência" />
          <NavItem href="/retencao" icon={<AlertTriangle />} label="Retenção" badge={retencaoCount} />
          <NavItem href="/documentos" icon={<FileText />} label="Documentos" badge={pendentesCount} />
          <NavItem href="/bap" icon={<Receipt />} label="BAP" />
          <NavItem href="/relatorios" icon={<BarChart3 />} label="Relatórios" />

          <div className="pt-4 pb-1">
            <p className="px-4 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Captação</p>
          </div>
          <NavItem href="/captacao" icon={<UserPlus />} label="Painel Vestibular" />
        </nav>

        {/* User */}
        <div className="border-t border-white/10 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-cyan-400/20 flex items-center justify-center flex-shrink-0">
              <span className="text-sm font-bold text-cyan-400">
                {user?.nome?.[0]?.toUpperCase() ?? "U"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.nome ?? "Usuário"}</p>
              <p className="text-xs text-slate-400 truncate">{user?.role ?? ""}</p>
            </div>
            <button
              onClick={handleLogout}
              className="text-slate-400 hover:text-red-400 transition-colors"
              title="Sair"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
