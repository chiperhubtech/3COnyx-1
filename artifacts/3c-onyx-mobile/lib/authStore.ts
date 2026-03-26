/**
 * 3C Onyx — Auth Store
 * Persists JWT + user profile in SecureStore (hardware-backed on device).
 * All API calls auto-inject the Bearer token via lib/api.ts
 *
 * Security hardening:
 * - All SecureStore operations wrapped in try/catch (crash fix)
 * - Token expiry validated on restore (no stale sessions)
 * - Server-side logout: POST /api/auth/logout revokes the JTI blacklist entry
 * - 401 events auto-trigger full logout
 */
import * as SecureStore from "expo-secure-store";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { authEvents, apiFetch } from "./api";

const TOKEN_KEY  = "3c_auth_token";
const USER_KEY   = "3c_auth_user";

/** Parse JWT exp claim without a library (just read the payload JSON). */
function tokenIsExpired(token: string): boolean {
  try {
    const parts   = token.split(".");
    if (parts.length !== 3) return true;
    const payload = JSON.parse(atob(parts[1]!.replace(/-/g, "+").replace(/_/g, "/"))) as { exp?: number };
    if (!payload.exp) return false;
    return Date.now() >= payload.exp * 1000;
  } catch {
    return true;
  }
}

/** Safe SecureStore.getItemAsync — returns null on any error */
async function safeGet(key: string): Promise<string | null> {
  try {
    return await SecureStore.getItemAsync(key);
  } catch {
    return null;
  }
}

/** Safe SecureStore.setItemAsync — silently swallows errors */
async function safeSet(key: string, value: string): Promise<void> {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch {
    // Non-fatal: session still works in-memory
  }
}

/** Safe SecureStore.deleteItemAsync — silently swallows errors */
async function safeDelete(key: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch {
    // Key may not exist — not an error
  }
}

export interface AuthUser {
  id:                 number;
  name:               string;
  email:              string;
  role:               "Member" | "Dealer" | "Runner" | "Specialist" | "Admin";
  phone:              string | null;
  avatarUrl:          string | null;
  isVerified:         boolean;
  subscriptionTier:   string | null;
  subscriptionStatus: string | null;
  onboardingRole:     string | null;
  points:             number;
  referralCode:       string | null;
  createdAt:          string;
}

interface AuthState {
  token:           string | null;
  user:            AuthUser | null;
  isAuthenticated: boolean;
  isLoading:       boolean;
  login:           (token: string, user: AuthUser) => Promise<void>;
  logout:          () => Promise<void>;
  updateUser:      (patch: Partial<AuthUser>) => void;
  getToken:        () => Promise<string | null>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken]       = useState<string | null>(null);
  const [user, setUser]         = useState<AuthUser | null>(null);
  const [isLoading, setLoading] = useState(true);
  const logoutRef               = useRef<(() => Promise<void>) | undefined>(undefined);

  // ── Restore session from SecureStore on mount ────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          safeGet(TOKEN_KEY),
          safeGet(USER_KEY),
        ]);
        if (storedToken && storedUser && !tokenIsExpired(storedToken)) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as AuthUser);
        } else if (storedToken) {
          // Expired token — clean up silently
          await Promise.all([safeDelete(TOKEN_KEY), safeDelete(USER_KEY)]);
        }
      } catch {
        // Boot failure — start unauthenticated
      }
      setLoading(false);
    })();
  }, []);

  // ── Auto-logout on 401 from any API call ─────────────────────────────────
  useEffect(() => {
    const handle401 = () => { void logoutRef.current?.(); };
    authEvents.on("auth:401", handle401);
    return () => { authEvents.off("auth:401", handle401); };
  }, []);

  const login = useCallback(async (newToken: string, newUser: AuthUser) => {
    await Promise.all([
      safeSet(TOKEN_KEY, newToken),
      safeSet(USER_KEY, JSON.stringify(newUser)),
    ]);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    // 1. Tell the server to revoke the token (server-side blacklist)
    try {
      await apiFetch<{ success: boolean }>("/auth/logout", { method: "POST" });
    } catch {
      // Non-fatal: client cleanup still proceeds
    }
    // 2. Clear secure storage
    await Promise.all([safeDelete(TOKEN_KEY), safeDelete(USER_KEY)]);
    // 3. Clear in-memory state
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => { logoutRef.current = logout; }, [logout]);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      void safeSet(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    if (token) return token;
    const stored = await safeGet(TOKEN_KEY);
    return stored && !tokenIsExpired(stored) ? stored : null;
  }, [token]);

  return React.createElement(
    AuthContext.Provider,
    {
      value: {
        token,
        user,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        logout,
        updateUser,
        getToken,
      },
    },
    children,
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
