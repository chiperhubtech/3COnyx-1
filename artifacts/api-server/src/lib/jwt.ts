/**
 * 3C Onyx — JWT Utilities
 * Uses `jose` (pure ESM, no native deps) for signing and verification.
 * Every issued token carries a `jti` (JWT ID) for blacklist revocation.
 * Secret loaded from JWT_SECRET env var — must be ≥32 chars in production.
 */
import { SignJWT, jwtVerify, type JWTPayload } from "jose";
import { randomUUID } from "crypto";

const RAW_SECRET = process.env.JWT_SECRET ?? "3c-onyx-dev-secret-change-in-production-min32ch";
const SECRET     = new TextEncoder().encode(RAW_SECRET);
const ALGORITHM  = "HS256";
const EXPIRY     = "7d";

export interface TokenPayload extends JWTPayload {
  sub:   string;   // userId as string
  email: string;
  role:  string;
  name:  string;
  jti:   string;   // unique token ID — used for blacklisting on logout
}

export async function signToken(payload: Omit<TokenPayload, "iat" | "exp" | "jti">): Promise<string> {
  const jti = randomUUID();
  return new SignJWT({ ...payload, jti })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
    .setJti(jti)
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<TokenPayload> {
  const { payload } = await jwtVerify(token, SECRET, { algorithms: [ALGORITHM] });
  return payload as TokenPayload;
}

export function extractBearerToken(authHeader: string | undefined): string | null {
  if (!authHeader?.startsWith("Bearer ")) return null;
  return authHeader.slice(7).trim() || null;
}
