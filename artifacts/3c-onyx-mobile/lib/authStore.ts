/**
 * 3C Onyx — Auth Store
 * Persists JWT + user profile in SecureStore.
 * All API calls auto-inject the Bearer token via lib/api.ts
 */
import * as SecureStore from "expo-secure-store";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { authEvents } from "./api";

const TOKEN_KEY  = "3c_auth_token";
const USER_KEY   = "3c_auth_user";

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

  useEffect(() => {
    (async () => {
      try {
        const [storedToken, storedUser] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(USER_KEY),
        ]);
        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as AuthUser);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const handle401 = () => { void logoutRef.current?.(); };
    authEvents.on("auth:401", handle401);
    return () => { authEvents.off("auth:401", handle401); };
  }, []);

  const login = useCallback(async (newToken: string, newUser: AuthUser) => {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, newToken),
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(newUser)),
    ]);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(USER_KEY),
    ]);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => { logoutRef.current = logout; }, [logout]);

  const updateUser = useCallback((patch: Partial<AuthUser>) => {
    setUser(prev => {
      if (!prev) return prev;
      const updated = { ...prev, ...patch };
      void SecureStore.setItemAsync(USER_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getToken = useCallback(async (): Promise<string | null> => {
    return token ?? SecureStore.getItemAsync(TOKEN_KEY);
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
