import { describe, it, expect, vi, afterEach } from "vitest";
import { createConnect, externalId, normalizeSignals, ownedConnections, verifyConnectState } from "../lib/smartcar";

afterEach(() => vi.unstubAllEnvs());
function config() {
  vi.stubEnv("ENCRYPTION_KEY", "unit-test-key-not-a-real-credential");
  vi.stubEnv("SMARTCAR_CLIENT_ID", "test-client");
  vi.stubEnv("SMARTCAR_CLIENT_SECRET", "test-secret");
  vi.stubEnv("SMARTCAR_APPLICATION_ID", "test-application");
  vi.stubEnv("SMARTCAR_REDIRECT_URI", "https://example.com/api/garage/callback");
}
describe("Smartcar owner authorization", () => {
  it("binds state to a browser nonce and owner, using the application ID", async () => {
    config();
    const flow = await createConnect("123");
    const url = new URL(flow.connectUrl);
    expect(url.searchParams.get("application_id")).toBe("test-application");
    expect(url.searchParams.get("response_type")).toBe("none");
    expect(url.searchParams.get("external_id")).toBe(externalId("123"));
    expect(url.searchParams.has("client_secret")).toBe(false);
    expect(url.searchParams.get("scope")).not.toMatch(/control|location|unlock/);
    const state = url.searchParams.get("state")!;
    expect(await verifyConnectState(state, flow.nonce)).toBe("123");
    await expect(verifyConnectState(state, "incorrect")).rejects.toThrow();
    await expect(verifyConnectState(state + "tampered", flow.nonce)).rejects.toThrow();
  });
  it("does not share owner identifiers or expose another owner's connections", () => {
    config();
    const owner = externalId("123");
    expect(owner).not.toBe(externalId("456"));
    const connection = {
      id: "connection", attributes: { user: { id: "sc-user", externalId: owner },
        vehicle: { make: "Example", model: "Car", year: 2025 } },
      relationships: { vehicle: { data: { id: "vehicle" } } },
    };
    expect(ownedConnections([connection], owner)).toHaveLength(1);
    expect(ownedConnections([connection], externalId("456"))).toHaveLength(0);
    expect(ownedConnections([null, {}, { attributes: {} }], owner)).toHaveLength(0);
  });
});
describe("Smartcar v3 telemetry", () => {
  const signal = (code: string, value: unknown, unit: string, status = "SUCCESS") => ({
    attributes: { code, status: { value: status }, body: { value, unit } },
    meta: { retrievedAt: "2026-10-06T12:00:00Z" },
  });
  it("converts kilometers to miles and preserves zero percentages", () => {
    expect(normalizeSignals([
      signal("odometer-traveleddistance", 10000, "km"),
      signal("internalcombustionengine-fuellevel", 0, "percent"),
      signal("tractionbattery-stateofcharge", 78, "percent"),
    ])).toMatchObject({ odometer: 6214, fuelPercent: 0, batteryPercent: 78, status: "available",
      lastSync: "2026-10-06T12:00:00Z", serviceRequired: false });
  });
  it("keeps missing, denied, invalid and unsupported data unavailable", () => {
    expect(normalizeSignals([
      signal("odometer-traveleddistance", 500, "unknown"),
      signal("internalcombustionengine-fuellevel", 150, "percent"),
      signal("tractionbattery-stateofcharge", 50, "percent", "ERROR"),
    ])).toMatchObject({ odometer: null, fuelPercent: null, batteryPercent: null,
      status: "unavailable", lastSync: null });
    expect(() => normalizeSignals({})).toThrow();
  });
});
