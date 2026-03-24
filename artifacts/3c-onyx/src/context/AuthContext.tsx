/**
 * 3C Onyx — Auth Context
 * Manages JWT token, current user, login/logout/register lifecycle.
 * Token stored in localStorage and sent as Authorization: Bearer header.
 */
import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  role: "Member" | "Dealer" | "Runner" | "Specialist" | "Admin";
  phone?: string | null;
  avatarUrl?: string | null;
  isActive: boolean;
  isVerified: boolean;
  stripeCustomerId?: string | null;
  createdAt: string;
}

interface AuthState {
  user:     AuthUser | null;
  token:    string | null;
  loading:  boolean;
  error:    string | null;
}

interface AuthContextValue extends AuthState {
  login:    (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout:   () => void;
  clearError: () => void;
}

export interface RegisterData {
  name:     string;
  email:    string;
  password: string;
  role:     string;
  phone?:   string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const TOKEN_KEY = "3c_auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user:    null,
    token:   null,
    loading: true,
    error:   null,
  });

  const setPartial = (partial: Partial<AuthState>) =>
    setState((s) => ({ ...s, ...partial }));

  const apiFetch = useCallback(async (path: string, opts?: RequestInit) => {
    const token = localStorage.getItem(TOKEN_KEY);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts?.headers as Record<string, string> ?? {}),
    };
    const res = await fetch(`${BASE}/api${path}`, { ...opts, headers });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error ?? "Request failed");
    return data;
  }, []);

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) { setPartial({ loading: false }); return; }
    apiFetch("/auth/me")
      .then((d) => setState({ user: d.user, token, loading: false, error: null }))
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        setState({ user: null, token: null, loading: false, error: null });
      });
  }, [apiFetch]);

  const login = useCallback(async (email: string, password: string) => {
    setPartial({ loading: true, error: null });
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      localStorage.setItem(TOKEN_KEY, data.token);
      setState({ user: data.user, token: data.token, loading: false, error: null });
    } catch (err) {
      setPartial({ loading: false, error: (err as Error).message });
      throw err;
    }
  }, [apiFetch]);

  const register = useCallback(async (data: RegisterData) => {
    setPartial({ loading: true, error: null });
    try {
      const res = await apiFetch("/auth/register", {
        method: "POST",
        body: JSON.stringify(data),
      });
      localStorage.setItem(TOKEN_KEY, res.token);
      setState({ user: res.user, token: res.token, loading: false, error: null });
    } catch (err) {
      setPartial({ loading: false, error: (err as Error).message });
      throw err;
    }
  }, [apiFetch]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setState({ user: null, token: null, loading: false, error: null });
  }, []);

  const clearError = useCallback(() => setPartial({ error: null }), []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, clearError }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export function useRequireAuth(role?: AuthUser["role"]) {
  const { user, loading } = useAuth();
  const isAuthenticated = !!user;
  const hasRole = !role || user?.role === role || user?.role === "Admin";
  return { user, loading, isAuthenticated, hasRole };
}
