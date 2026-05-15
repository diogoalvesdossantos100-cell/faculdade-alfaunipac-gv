import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, RequireAuth } from "@/contexts/auth";
import Layout from "@/components/Layout";
import Login from "@/pages/Login";
import Dashboard from "@/pages/Dashboard";
import Alunos from "@/pages/Alunos";
import AlunoDetalhe from "@/pages/AlunoDetalhe";
import Frequencia from "@/pages/Frequencia";
import Retencao from "@/pages/Retencao";
import Documentos from "@/pages/Documentos";
import BAP from "@/pages/BAP";
import Relatorios from "@/pages/Relatorios";
import NotFound from "@/pages/not-found";
import PainelCaptacao from "@/pages/captacao/PainelCaptacao";
import Vestibular from "@/pages/captacao/Vestibular";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
});

function ProtectedLayout({ children }: { children: React.ReactNode }) {
  return (
    <RequireAuth>
      <Layout>{children}</Layout>
    </RequireAuth>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/inscricao" component={Vestibular} />
      <Route path="/login" component={Login} />
      <Route path="/dashboard">
        <ProtectedLayout><Dashboard /></ProtectedLayout>
      </Route>
      <Route path="/alunos/:id">
        {(params) => (
          <ProtectedLayout><AlunoDetalhe /></ProtectedLayout>
        )}
      </Route>
      <Route path="/alunos">
        <ProtectedLayout><Alunos /></ProtectedLayout>
      </Route>
      <Route path="/frequencia">
        <ProtectedLayout><Frequencia /></ProtectedLayout>
      </Route>
      <Route path="/retencao">
        <ProtectedLayout><Retencao /></ProtectedLayout>
      </Route>
      <Route path="/documentos">
        <ProtectedLayout><Documentos /></ProtectedLayout>
      </Route>
      <Route path="/bap">
        <ProtectedLayout><BAP /></ProtectedLayout>
      </Route>
      <Route path="/relatorios">
        <ProtectedLayout><Relatorios /></ProtectedLayout>
      </Route>
      <Route path="/captacao">
        <ProtectedLayout><PainelCaptacao /></ProtectedLayout>
      </Route>
      <Route path="/">
        <Redirect to="/dashboard" />
      </Route>
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
