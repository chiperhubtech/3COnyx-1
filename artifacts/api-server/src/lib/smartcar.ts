import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";

const API = "https://vehicle.api.smartcar.com/v3";
const SCOPES = "read_vehicle_info read_odometer read_fuel read_battery";
export class SmartcarError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
function secret(): string {
  const value = process.env.ENCRYPTION_KEY;
  if (!value) throw new SmartcarError(503, "Smartcar secure configuration is unavailable.");
  return value;
}
export function externalId(userId: string): string {
  // Stable, opaque owner mapping persisted by Smartcar, not a shared browser session.
  return createHmac("sha256", secret()).update(`smartcar-owner:${userId}`).digest("hex");
}
export function configured() {
  return Boolean(process.env.SMARTCAR_CLIENT_ID && process.env.SMARTCAR_CLIENT_SECRET &&
    process.env.SMARTCAR_APPLICATION_ID && process.env.SMARTCAR_REDIRECT_URI && process.env.ENCRYPTION_KEY);
}
export function redirectUri() {
  const value = process.env.SMARTCAR_REDIRECT_URI;
  if (!value || new URL(value).protocol !== "https:") throw new SmartcarError(503, "Smartcar redirect URI is not configured.");
  return value;
}
export const mode = () => process.env.SMARTCAR_MODE === "simulated" ? "simulated" : "live";
let cachedToken: { value: string; expires: number } | undefined;
let pendingToken: Promise<string> | undefined;
async function obtainToken(): Promise<string> {
  const clientId = process.env.SMARTCAR_CLIENT_ID, clientSecret = process.env.SMARTCAR_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new SmartcarError(503, "Smartcar credentials are not configured.");
  const response = await fetch("https://iam.smartcar.com/oauth2/token", {
    method: "POST", signal: AbortSignal.timeout(8000),
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: clientId, client_secret: clientSecret }),
  });
  if (!response.ok) throw new SmartcarError(502, "Smartcar authentication failed. Please contact the platform administrator.");
  const data = await response.json() as { access_token?: unknown; expires_in?: unknown } | null;
  if (!data || typeof data.access_token !== "string" || typeof data.expires_in !== "number" || !Number.isFinite(data.expires_in)) {
    throw new SmartcarError(502, "Smartcar returned an invalid authentication response.");
  }
  cachedToken = { value: data.access_token, expires: Date.now() + Math.max(0, data.expires_in - 60) * 1000 };
  return cachedToken.value;
}
async function token() {
  if (cachedToken && cachedToken.expires > Date.now()) return cachedToken.value;
  if (!pendingToken) pendingToken = obtainToken().finally(() => { pendingToken = undefined; });
  return pendingToken;
}
export async function smartcarRequest(path: string, userId?: string, method = "GET"): Promise<any> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch(`${API}${path}`, {
      method, signal: AbortSignal.timeout(8000),
      headers: { Authorization: `Bearer ${await token()}`, ...(userId ? { "sc-user-id": userId } : {}) },
    });
    if (response.status === 401 && attempt === 0) { cachedToken = undefined; continue; }
    if (!response.ok) {
      const message = response.status === 429 ? "Smartcar rate limit reached. Please try again later."
        : response.status === 403 ? "Smartcar access is unavailable. Check vehicle permissions and your Smartcar plan."
        : "Smartcar is temporarily unavailable. You may need to reconnect your vehicle.";
      throw new SmartcarError(response.status === 429 ? 429 : 502, message);
    }
    return response.status === 204 ? null : response.json();
  }
  throw new SmartcarError(502, "Smartcar authentication failed.");
}
export interface Connection {
  id: string;
  attributes: { user: { id: string; externalId: string }; vehicle: {
    make: string; model: string; year: number; mode: string; powertrainType?: string;
  } };
  relationships: { vehicle: { data: { id: string } } };
}
export function ownedConnections(data: unknown, owner: string): Connection[] {
  if (!Array.isArray(data)) throw new SmartcarError(502, "Invalid Smartcar connection response.");
  return data.filter((c): c is Connection => Boolean(
    c?.attributes?.user?.externalId === owner && typeof c?.attributes?.user?.id === "string" &&
    typeof c?.id === "string" && typeof c?.relationships?.vehicle?.data?.id === "string" &&
    typeof c?.attributes?.vehicle?.make === "string" && typeof c?.attributes?.vehicle?.model === "string" &&
    Number.isInteger(c?.attributes?.vehicle?.year)
  ));
}
export async function connections(userId: string) {
  const owner = externalId(userId), result: Connection[] = [];
  for (let page = 1; page <= 20; page++) {
    const params = new URLSearchParams({
      "filter[user.externalId]": owner, "filter[vehicle.mode]": mode(),
      "page[number]": String(page), "page[size]": "50",
    });
    const response = await smartcarRequest(`/connections?${params}`);
    result.push(...ownedConnections(response.data, owner));
    if (!response.links?.next) return result;
  }
  throw new SmartcarError(502, "Too many Smartcar connections to load. Please contact support.");
}
export function vehicleSummary(connection: Connection) {
  const v = connection.attributes.vehicle;
  return {
    id: connection.relationships.vehicle.data.id, make: v.make, model: v.model, year: v.year,
    vin: "", color: "", mode: v.mode,
    fuelType: v.powertrainType === "BEV" ? "electric" : ["PHEV", "HEV"].includes(v.powertrainType ?? "") ? "hybrid" : "gasoline",
    odometer: null, fuelPercent: null, batteryPercent: null, lastSync: null,
  };
}
export function normalizeSignals(data: unknown) {
  if (!Array.isArray(data)) throw new SmartcarError(502, "Invalid Smartcar signal response.");
  const signals = data;
  const timestamps: string[] = [];
  function value(code: string, percentage = false): number | null {
    const signal = signals.find(s => s?.attributes?.code === code || s?.id === code);
    if (signal?.attributes?.status?.value !== "SUCCESS") return null;
    const body = signal.attributes.body;
    let n = body?.value;
    if (typeof n !== "number" || !Number.isFinite(n) || n < 0) return null;
    if (percentage) {
      if (body.unit !== "percent" || n > 100) return null;
    } else {
      if (body.unit === "km") n *= 0.621371;
      else if (body.unit !== "mi" && body.unit !== "miles") return null;
    }
    const time = signal.meta?.oemUpdatedAt ?? signal.meta?.retrievedAt;
    if (typeof time === "string" && Number.isFinite(Date.parse(time))) timestamps.push(time);
    return Math.round(n);
  }
  const odometer = value("odometer-traveleddistance");
  const fuelPercent = value("internalcombustionengine-fuellevel", true);
  const batteryPercent = value("tractionbattery-stateofcharge", true);
  return {
    odometer, fuelPercent, batteryPercent,
    // Oldest relevant sample, not the time we happened to query it.
    lastSync: timestamps.sort((a, b) => Date.parse(a) - Date.parse(b))[0] ?? null,
    serviceRequired: false,
    status: [odometer, fuelPercent, batteryPercent].some(v => v !== null) ? "available" : "unavailable",
  };
}
export async function createConnect(userId: string) {
  if (!configured()) throw new SmartcarError(503, "Smartcar is not fully configured.");
  const nonce = randomBytes(32).toString("hex");
  const state = await new SignJWT({ nonce }).setProtectedHeader({ alg: "HS256" }).setSubject(userId)
    .setAudience("smartcar-connect").setIssuedAt().setExpirationTime("10m")
    .sign(new TextEncoder().encode(secret()));
  const params = new URLSearchParams({
    application_id: process.env.SMARTCAR_APPLICATION_ID!, external_id: externalId(userId),
    response_type: "none", redirect_uri: redirectUri(), scope: SCOPES, state, mode: mode(),
  });
  return { nonce, connectUrl: `https://connect.smartcar.com/oauth/authorize?${params}` };
}
export async function verifyConnectState(state: string, nonce: string) {
  const { payload } = await jwtVerify(state, new TextEncoder().encode(secret()), {
    algorithms: ["HS256"], audience: "smartcar-connect", maxTokenAge: "10m",
  });
  if (typeof payload.nonce !== "string" || !payload.sub ||
    nonce.length !== payload.nonce.length || !timingSafeEqual(Buffer.from(nonce), Buffer.from(payload.nonce))) {
    throw new SmartcarError(400, "Invalid Smartcar connection state.");
  }
  return payload.sub;
}
