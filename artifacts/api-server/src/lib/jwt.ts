/**
 * 3C Onyx — JWT Utilities
 * Uses `jose` (pure ESM, no native deps) for signing and verification.
 * Secret loaded from JWT_SECRET env var — must be ≥32 chars in production.
 */
import { SignJWT, jwtVerify, type JWTPayload } from "jose";

const RAW_SECRET = process.env.JWT_SECRET ?? "3c-onyx-dev-secret-change-in-production-min32ch";
const SECRET     = new TextEncoder().encode(RAW_SECRET);
const ALGORITHM  = "HS256";
const EXPIRY     = "7d";

export interface TokenPayload extends JWTPayload {
  sub:   string;   // userId as string
  email: string;
  role:  string;
  name:  string;
}

export async function signToken(payload: Omit<TokenPayload, "iat" | "exp">): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime(EXPIRY)
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
