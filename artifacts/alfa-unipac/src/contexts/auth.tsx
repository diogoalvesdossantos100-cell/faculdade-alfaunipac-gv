import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { useLocation } from "wouter";

interface AuthUser {
  id: number;
  email: string;
  nome: string;
  role: string;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  login: (token: string, user: AuthUser) => void;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  token: null,
  login: () => {},
  logout: () => {},
  isAuthenticated: false,
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("alfa_token"));
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem("alfa_user");
    return raw ? JSON.parse(raw) : null;
  });

  const login = (newToken: string, newUser: AuthUser) => {
    localStorage.setItem("alfa_token", newToken);
    localStorage.setItem("alfa_user", JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem("alfa_token");
    localStorage.removeItem("alfa_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token && !!user }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;
  return <>{children}</>;
}
