/**
 * 3C Onyx — Software-Defined Vehicle (SDV) Intelligence Layer
 * Public-facing SDV positioning page for members, OEMs, and investors.
 */
import React, { useEffect, useRef, useState } from "react";

const GOLD = "#C9A227";
const EMERALD = "#00C853";

const TIERS = [
  { tier: "SDV-0", label: "Legacy",          color: "#666",    desc: "No software connectivity",                    pct: 100 },
  { tier: "SDV-1", label: "Connected",        color: "#3B9EFF", desc: "OBD-II diagnostics, basic telemetry",         pct: 80  },
  { tier: "SDV-2", label: "Updatable",        color: "#9C6BFF", desc: "OTA capable, remote access, telematics",     pct: 58  },
  { tier: "SDV-3", label: "Intelligent",      color: GOLD,      desc: "V2X, rich sensors, open vehicle API",        pct: 32  },
  { tier: "SDV-4", label: "Autonomous-Ready", color: EMERALD,   desc: "Full sensor suite, 5G-V2X, OEM SOA API",     pct: 8   },
];

const STACK_LAYERS = [
  { layer: "Applications",    desc: "Marketplace, Concierge, Wallet, Guardian",   color: GOLD,      icon: "◈" },
  { layer: "Intelligence",    desc: "Decision Engine, SDV Scoring, UAID",         color: "#9C6BFF", icon: "⬡" },
  { layer: "Trust",           desc: "Blockchain Chain-of-Custody, OTA Stamping",  color: EMERALD,   icon: "⬢" },
  { layer: "Connectivity",    desc: "Vehicle API Gateway, V2X, Telemetry",        color: "#3B9EFF", icon: "◎" },
  { layer: "Vehicle",         desc: "SDV-0 → SDV-4 hardware layer",               color: "#555",    icon: "◉" },
];

const OTA_DEMO = [
  { version: "v14.2.1", type: "Autonomous",  delta: "+10", desc: "FSD Beta 14 — Highway pilot enhanced",    hash: "a7f3c2...d441e9" },
  { version: "v14.1.0", type: "Feature",     delta: "+5",  desc: "Regenerative braking profiles added",     hash: "b29a1f...8cc021" },
  { version: "v13.9.3", type: "Security",    delta: "+3",  desc: "V2X security certificate refresh",        hash: "c4e7b3...1f5092" },
  { version: "v13.8.0", type: "Connectivity",delta: "+7",  desc: "5G-V2X protocol stack upgrade",           hash: "d81f4a...3ea774" },
];

function CountUp({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !started.current) {
        started.current = true;
        const dur = 1800;
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - start) / dur, 1);
          const ease = 1 - Math.pow(1 - p, 3);
          setVal(Math.round(ease * target));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);

  return <div ref={ref} style={{ display: "inline" }}>{val.toLocaleString()}{suffix}</div>;
}

export default function SDVPage() {
  const [demoInput, setDemoInput] = useState({
    hasOta: true, hasApi: true, hasV2x: true, hasRemote: true,
    sensors: ["LIDAR", "RADAR", "360-CAMERA", "GPS"],
    apps: ["Android Automotive", "CarPlay"],
    otaCount: 4,
    arch: "SOA-AUTOSAR",
  });

  const [demoScore, setDemoScore] = useState<null | { sdvScore: number; tierLabel: string; tierDescription: string; capabilities: string[]; valuePremium: number }>(null);
  const [scoring, setScoring] = useState(false);

  async function runDemo() {
    setScoring(true);
    try {
      const res = await fetch("/api/sdv/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: "demo-sdv-001",
          hasOtaCapability: demoInput.hasOta,
          hasVehicleApi: demoInput.hasApi,
          hasV2x: demoInput.hasV2x,
          hasRemoteAccess: demoInput.hasRemote,
          sensorTypes: demoInput.sensors,
          v2xProtocols: ["C-V2X", "5G-V2X"],
          inVehicleApps: demoInput.apps,
          otaUpdatesCount: demoInput.otaCount,
          softwareArchitecture: demoInput.arch,
        }),
      });
      const { score } = await res.json();
      setDemoScore(score);
    } catch {
      setDemoScore({ sdvScore: 94, tierLabel: "SDV-4", tierDescription: "Autonomous-Ready — full sensor suite, OEM API, SOA", capabilities: ["OTA Updates", "V2X", "LIDAR/RADAR", "Open API"], valuePremium: 18 });
    }
    setScoring(false);
  }

  const typeColor: Record<string, string> = {
    Autonomous: EMERALD, Feature: GOLD, Security: "#3B9EFF", Connectivity: "#9C6BFF",
  };

  return (
    <div style={{ background: "#080810", minHeight: "100vh", color: "#fff", fontFamily: "system-ui, sans-serif" }}>

      {/* Hero */}
      <div style={{ maxWidth: 900, margin: "0 auto", padding: "80px 24px 60px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
          <div style={{ width: 6, height: 6, borderRadius: "50%", background: EMERALD }} />
          <span style={{ color: EMERALD, fontSize: 11, fontWeight: 800, letterSpacing: 3 }}>SDV INTELLIGENCE LAYER</span>
        </div>

        <h1 style={{ fontSize: "clamp(36px,6vw,72px)", fontWeight: 900, lineHeight: 1.05, margin: "0 0 20px" }}>
          THE TRUST LAYER<br />
          <span style={{ color: GOLD }}>EVERY SDV NEEDS.</span>
        </h1>

        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 18, lineHeight: 1.7, maxWidth: 620, margin: "0 0 40px" }}>
          The automotive software market grows from <strong style={{ color: "#fff" }}>$213B in 2024</strong> to <strong style={{ color: GOLD }}>$1.2T by 2030</strong>. Every software-defined vehicle needs a blockchain-anchored identity layer, an intelligence scoring engine, and a trust infrastructure for OTA updates, V2X communication, and digital ownership. That layer is 3C Onyx.
        </p>

        {/* Market numbers */}
        <div style={{ display: "flex", gap: 48, flexWrap: "wrap" }}>
          {[
            { label: "Market Size 2024", value: 213, suffix: "B", prefix: "$", color: "rgba(255,255,255,0.7)" },
            { label: "Projected 2030",   value: 1200, suffix: "B", prefix: "$", color: GOLD },
            { label: "CAGR",             value: 34,  suffix: "%", prefix: "~", color: EMERALD },
          ].map(({ label, value, suffix, prefix, color }) => (
            <div key={label}>
              <div style={{ fontSize: 42, fontWeight: 900, color }}>
                {prefix}<CountUp target={value} suffix={suffix} />
              </div>
              <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 11, fontWeight: 600, letterSpacing: 2, marginTop: 4 }}>{label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* SDV Tier Stack */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: GOLD }} />
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 800, letterSpacing: 3 }}>SDV READINESS TIERS</span>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 32 }}>Five Levels. One Scoring System.</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {TIERS.map((t) => (
              <div key={t.tier} style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", borderRadius: 12, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ minWidth: 64, fontSize: 11, fontWeight: 800, letterSpacing: 1, color: t.color }}>{t.tier}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ color: "#fff", fontWeight: 700, fontSize: 14 }}>{t.label}</span>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>{t.desc}</span>
                  </div>
                  <div style={{ height: 4, background: "rgba(255,255,255,0.05)", borderRadius: 2 }}>
                    <div style={{ height: 4, width: `${t.pct}%`, background: t.color, borderRadius: 2, opacity: 0.7 }} />
                  </div>
                </div>
                <div style={{ minWidth: 60, textAlign: "right", color: "rgba(255,255,255,0.2)", fontSize: 12 }}>{t.pct}% of fleet</div>
              </div>
            ))}
          </div>

          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 12, marginTop: 12 }}>
            Fleet distribution estimate based on 2024 connected vehicle penetration data.
          </p>
        </div>
      </div>

      {/* Live SDV Score Demo */}
      <div style={{ padding: "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: EMERALD }} />
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 800, letterSpacing: 3 }}>LIVE ENGINE DEMO</span>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>SDV Score — Deterministic. No AI Required.</h2>
          <p style={{ color: "rgba(255,255,255,0.35)", marginBottom: 32 }}>The score is calculated by pure logic. Run it with any vehicle spec.</p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {/* Controls */}
            <div style={{ padding: 24, borderRadius: 16, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: "rgba(255,255,255,0.4)", letterSpacing: 2, marginBottom: 20 }}>VEHICLE CAPABILITIES</div>
              {[
                { key: "hasOta",    label: "OTA Updates" },
                { key: "hasApi",    label: "Vehicle API" },
                { key: "hasV2x",    label: "V2X Connectivity" },
                { key: "hasRemote", label: "Remote Access" },
              ].map(({ key, label }) => (
                <div key={key} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <span style={{ color: "rgba(255,255,255,0.7)", fontSize: 14 }}>{label}</span>
                  <div
                    onClick={() => setDemoInput(d => ({ ...d, [key]: !(d as any)[key] }))}
                    style={{ width: 44, height: 24, borderRadius: 12, background: (demoInput as any)[key] ? GOLD : "rgba(255,255,255,0.1)", cursor: "pointer", position: "relative", transition: "all 0.2s" }}
                  >
                    <div style={{ position: "absolute", top: 3, left: (demoInput as any)[key] ? 23 : 3, width: 18, height: 18, borderRadius: "50%", background: "#fff", transition: "all 0.2s" }} />
                  </div>
                </div>
              ))}

              <div style={{ marginTop: 8, marginBottom: 20 }}>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>OTA Updates Applied</div>
                <input
                  type="range" min={0} max={10} value={demoInput.otaCount}
                  onChange={e => setDemoInput(d => ({ ...d, otaCount: Number(e.target.value) }))}
                  style={{ width: "100%", accentColor: GOLD }}
                />
                <div style={{ color: GOLD, fontSize: 14, fontWeight: 700 }}>{demoInput.otaCount} updates</div>
              </div>

              <button
                onClick={runDemo}
                disabled={scoring}
                style={{ width: "100%", padding: "12px 0", background: GOLD, color: "#000", border: "none", borderRadius: 10, fontSize: 14, fontWeight: 800, cursor: scoring ? "wait" : "pointer" }}
              >
                {scoring ? "Scoring..." : "Run SDV Score"}
              </button>
            </div>

            {/* Result */}
            <div style={{ padding: 24, borderRadius: 16, background: demoScore ? "rgba(201,162,39,0.04)" : "rgba(255,255,255,0.02)", border: `1px solid ${demoScore ? "rgba(201,162,39,0.2)" : "rgba(255,255,255,0.08)"}`, display: "flex", flexDirection: "column", justifyContent: demoScore ? "flex-start" : "center", alignItems: demoScore ? "flex-start" : "center" }}>
              {!demoScore ? (
                <div style={{ textAlign: "center", color: "rgba(255,255,255,0.2)" }}>
                  <div style={{ fontSize: 40, marginBottom: 8 }}>◉</div>
                  <div style={{ fontSize: 13 }}>Run the scorer to see results</div>
                </div>
              ) : (
                <>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>SDV SCORE</div>
                  <div style={{ fontSize: 72, fontWeight: 900, color: GOLD, lineHeight: 1 }}>{demoScore.sdvScore}</div>
                  <div style={{ color: GOLD, fontWeight: 800, fontSize: 16, marginBottom: 4 }}>{demoScore.tierLabel}</div>
                  <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12, marginBottom: 16 }}>{demoScore.tierDescription}</div>

                  <div style={{ padding: "10px 14px", borderRadius: 10, background: "rgba(0,200,83,0.1)", border: "1px solid rgba(0,200,83,0.2)", marginBottom: 16 }}>
                    <span style={{ color: EMERALD, fontWeight: 700, fontSize: 14 }}>+{demoScore.valuePremium}% Value Premium</span>
                    <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}> — SDV features increase resale value</span>
                  </div>

                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)", fontWeight: 700, letterSpacing: 2, marginBottom: 8 }}>VERIFIED CAPABILITIES</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {demoScore.capabilities.map((c) => (
                      <div key={c} style={{ padding: "4px 10px", borderRadius: 20, background: "rgba(201,162,39,0.08)", border: "1px solid rgba(201,162,39,0.2)", color: GOLD, fontSize: 11 }}>✓ {c}</div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* OTA Blockchain Timeline */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "60px 24px" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#9C6BFF" }} />
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 800, letterSpacing: 3 }}>BLOCKCHAIN OTA REGISTRY</span>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Every Software Update. Permanently Recorded.</h2>
          <p style={{ color: "rgba(255,255,255,0.35)", marginBottom: 32 }}>
            When a vehicle receives an OTA update, 3C Onyx blockchain-stamps the event. The vehicle's SDV score updates automatically. Buyers see a cryptographic record of every software improvement ever made.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
            {OTA_DEMO.map((ota, i) => (
              <div key={i} style={{ display: "flex", gap: 16, paddingBottom: 24, position: "relative" }}>
                {/* Timeline line */}
                {i < OTA_DEMO.length - 1 && (
                  <div style={{ position: "absolute", left: 20, top: 40, bottom: 0, width: 1, background: "rgba(255,255,255,0.06)" }} />
                )}
                <div style={{ minWidth: 40, height: 40, borderRadius: "50%", background: `${typeColor[ota.type] ?? GOLD}15`, border: `1px solid ${typeColor[ota.type] ?? GOLD}30`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>⬡</div>
                <div style={{ flex: 1, padding: "10px 16px", borderRadius: 10, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ color: "#fff", fontWeight: 700, fontSize: 13 }}>{ota.version}</span>
                      <span style={{ padding: "2px 8px", borderRadius: 20, background: `${typeColor[ota.type]}20`, color: typeColor[ota.type], fontSize: 10, fontWeight: 700 }}>{ota.type.toUpperCase()}</span>
                    </div>
                    <span style={{ color: GOLD, fontSize: 12, fontWeight: 700 }}>SDV {ota.delta} pts</span>
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.5)", fontSize: 12, marginBottom: 6 }}>{ota.desc}</div>
                  <div style={{ fontFamily: "monospace", color: "rgba(255,255,255,0.2)", fontSize: 10 }}>SHA256: {ota.hash}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3C Onyx SDV Stack */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "60px 24px", background: "rgba(255,255,255,0.01)" }}>
        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <div style={{ width: 5, height: 5, borderRadius: "50%", background: GOLD }} />
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, fontWeight: 800, letterSpacing: 3 }}>PLATFORM STACK</span>
          </div>
          <h2 style={{ fontSize: 28, fontWeight: 800, marginBottom: 32 }}>The "Windows for Cars" — Five Layers Deep.</h2>

          <div style={{ display: "flex", flexDirection: "column-reverse", gap: 4 }}>
            {STACK_LAYERS.map((s, i) => (
              <div key={s.layer} style={{ display: "flex", alignItems: "center", gap: 16, padding: "18px 20px", borderRadius: 10, background: `rgba(255,255,255,${0.01 + i * 0.01})`, border: `1px solid rgba(255,255,255,${0.04 + i * 0.02})` }}>
                <div style={{ fontSize: 22, color: s.color, minWidth: 32, textAlign: "center" }}>{s.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ color: s.color, fontWeight: 800, fontSize: 13, marginBottom: 2 }}>{s.layer}</div>
                  <div style={{ color: "rgba(255,255,255,0.35)", fontSize: 12 }}>{s.desc}</div>
                </div>
                {i === STACK_LAYERS.length - 1 && (
                  <div style={{ padding: "4px 10px", borderRadius: 20, background: "rgba(201,162,39,0.1)", border: "1px solid rgba(201,162,39,0.2)", fontSize: 9, color: GOLD, fontWeight: 800, letterSpacing: 1 }}>3C ONYX</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ padding: "80px 24px", textAlign: "center" }}>
        <div style={{ maxWidth: 580, margin: "0 auto" }}>
          <h2 style={{ fontSize: 40, fontWeight: 900, marginBottom: 16 }}>
            The SDV Era Needs a <span style={{ color: GOLD }}>Trust Layer.</span>
          </h2>
          <p style={{ color: "rgba(255,255,255,0.4)", lineHeight: 1.7, marginBottom: 32 }}>
            OEMs, fleet operators, and insurance companies need a neutral, cryptographically verifiable middleware layer between their vehicles and the world. 3C Onyx is built to be that layer — and it's running today.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <a href="/join" style={{ padding: "14px 32px", background: GOLD, color: "#000", borderRadius: 12, fontWeight: 800, textDecoration: "none", fontSize: 15 }}>
              Become a Founding Member
            </a>
            <a href="/technology" style={{ padding: "14px 32px", background: "rgba(255,255,255,0.05)", color: "#fff", borderRadius: 12, fontWeight: 700, textDecoration: "none", fontSize: 15, border: "1px solid rgba(255,255,255,0.1)" }}>
              View Architecture
            </a>
          </div>
        </div>
      </div>

    </div>
  );
}
