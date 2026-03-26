/**
 * 3C Onyx — API Client
 * - Auto-injects Bearer token from SecureStore on every request
 * - On 401 (expired/invalid token), emits "auth:401" so AuthStore auto-logs out
 */
import * as SecureStore from "expo-secure-store";
import { EventEmitter } from "eventemitter3";

const TOKEN_KEY = "3c_auth_token";
const BASE      = `https://${process.env.EXPO_PUBLIC_DOMAIN}/api`;

export const authEvents = new EventEmitter();

export async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  let token: string | null = null;
  try {
    token = await SecureStore.getItemAsync(TOKEN_KEY);
  } catch {}

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string> ?? {}),
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE}${path}`, { ...options, headers });

  if (res.status === 401) {
    authEvents.emit("auth:401");
    throw Object.assign(new Error("Session expired. Please sign in again."), { status: 401 });
  }

  if (!res.ok) {
    let body: Record<string, unknown> = {};
    try { body = await res.json() as Record<string, unknown>; } catch {}
    throw Object.assign(
      new Error(String(body["error"] ?? `API error ${res.status}`)),
      { status: res.status, body },
    );
  }
  return res.json() as Promise<T>;
}
