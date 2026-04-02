export default function TodaySlide() {
  const systems = [
    { name: "7-Agent Mesh", status: "LIVE", desc: "Sales, Finance, Service, Parts, Delivery, Support, Referral — one event bus" },
    { name: "Proof Engine", status: "LIVE", desc: "SHA-256 hash chain. HMAC-signed. Tamper-evident vehicle lifecycle" },
    { name: "Street Network", status: "LIVE", desc: "QR capture flow. HMAC attribution. Every surface = point-of-sale" },
    { name: "Sovereign Wallet", status: "LIVE", desc: "Stripe Connect. Auto split-fee. Instant payout on deal completion" },
    { name: "VIN Passport", status: "LIVE", desc: "NHTSA decode + AI summary. Digital birth certificate for every vehicle" },
    { name: "Anti-Abuse Engine", status: "LIVE", desc: "Velocity detection, clustering, conversion analysis. Quarantine at 70+" },
    { name: "Attribution Chain", status: "LIVE", desc: "Multi-level referral. Proof-gated payouts. Every dollar traceable" },
    { name: "Identity Roles", status: "LIVE", desc: "Connector → Closer → Operator → Enterprise. Gamified progression" },
    { name: "Leaderboard", status: "LIVE", desc: "Ranked by People Helped. Real-time activity feed. Social proof loop" },
    { name: "SDV Intelligence", status: "LIVE", desc: "Software-Defined Vehicle scoring. OTA tracking. Future-proofed architecture" },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg" style={{ padding: "4.5vh 5vw" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.06) 0%, transparent 50%)" }} />
      <div className="relative" style={{ zIndex: 1 }}>
        <p className="font-body font-semibold tracking-widest" style={{ fontSize: "1.2vw", letterSpacing: "0.3em", color: "#10B981" }}>WHAT WE BUILT</p>
        <p className="font-display font-black tracking-tight text-text" style={{ fontSize: "3.2vw", lineHeight: 1.1, marginTop: "0.8vh" }}>
          Not a Pitch. A <span className="text-primary">Platform.</span>
        </p>
        <p className="font-body text-muted" style={{ fontSize: "1.3vw", marginTop: "1vh", maxWidth: "55vw" }}>
          Every system below is built, tested, and operational today. Capital is for scaling and market capture — not research.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.2vw", marginTop: "3vh" }}>
          {systems.map((sys) => (
            <div key={sys.name} style={{ padding: "1.8vh 1.8vw", borderRadius: "0.5vw", display: "flex", alignItems: "flex-start", gap: "1.2vw" }} className="bg-surface">
              <div style={{ flexShrink: 0, padding: "0.4vh 0.8vw", borderRadius: "0.3vw", background: "rgba(16,185,129,0.15)", color: "#10B981", fontWeight: 700, fontSize: "0.8vw", letterSpacing: "0.1em" }}>
                {sys.status}
              </div>
              <div>
                <p className="font-display font-bold text-primary" style={{ fontSize: "1.2vw", lineHeight: 1.2 }}>{sys.name}</p>
                <p className="font-body text-muted" style={{ fontSize: "0.95vw", marginTop: "0.3vh" }}>{sys.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "2.5vh", padding: "1.5vh 2.5vw", borderRadius: "0.5vw", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(201,162,39,0.3)" }} className="bg-surface">
          <p className="font-body text-text" style={{ fontSize: "1.2vw" }}>
            <span className="text-primary font-semibold">Future-ready architecture:</span> Modular plug-in system designed for AI agents, AR inspection overlays, humanoid robotics, and autonomous service fulfillment.
          </p>
          <p className="font-body font-bold text-primary" style={{ fontSize: "1.2vw", whiteSpace: "nowrap", marginLeft: "2vw" }}>Ship Today → Scale Tomorrow</p>
        </div>
      </div>
    </div>
  );
}
