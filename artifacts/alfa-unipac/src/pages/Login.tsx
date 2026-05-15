import { useState } from "react";
import { useLocation } from "wouter";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth";
import { GraduationCap } from "lucide-react";
import { toast } from "sonner";

export default function Login() {
  const [email, setEmail] = useState("admin@alfaunipac.com");
  const [password, setPassword] = useState("admin123");
  const { login } = useAuth();
  const [, navigate] = useLocation();

  const loginMutation = useLogin({
    mutation: {
      onSuccess(data) {
        login(data.token, data.user);
        navigate("/dashboard");
      },
      onError() {
        toast.error("Email ou senha inválidos. Tente novamente.");
      },
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate({ data: { email, password } });
  };

  return (
    <div className="min-h-screen bg-[#0A192F] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-400 mb-4">
            <GraduationCap aria-hidden="true" className="w-9 h-9 text-[#0A192F]" />
          </div>
          <h1 className="text-2xl font-bold text-white">AlfaUnipac GV</h1>
          <p className="text-slate-400 text-sm mt-1">Sistema de Gestão Acadêmica</p>
        </div>

        {/* Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
          <h2 className="text-lg font-semibold text-white mb-6">Acesso ao Sistema</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Email</label>
              <input
                type="email"
                name="email"
                autoComplete="email"
                spellCheck={false}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-white placeholder-slate-500 focus-visible:outline-none focus-visible:border-cyan-400 focus-visible:ring-1 focus-visible:ring-cyan-400 transition-colors"
                placeholder="seu@email.com"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-300 mb-1.5">Senha</label>
              <input
                type="password"
                name="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-white placeholder-slate-500 focus-visible:outline-none focus-visible:border-cyan-400 focus-visible:ring-1 focus-visible:ring-cyan-400 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="w-full mt-2 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-60 disabled:cursor-not-allowed text-[#0A192F] font-semibold rounded-lg py-2.5 transition-colors"
            >
              {loginMutation.isPending ? "Entrando…" : "Entrar"}
            </button>
          </form>
        </div>

        <p className="text-center text-slate-600 text-xs mt-6">
          Faculdade AlfaUnipac — Governador Valadares/MG
        </p>
      </div>
    </div>
  );
}
