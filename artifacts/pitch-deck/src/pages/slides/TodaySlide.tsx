export default function TodaySlide() {
  const systems = [
    { name: "7-Agent Mesh", status: "LIVE", desc: "Sales, Finance, Service, Parts, Delivery, Support, Referral — one autonomous event bus" },
    { name: "Proof Engine", status: "LIVE", desc: "SHA-256 hash chain. HMAC-signed. Tamper-evident vehicle lifecycle" },
    { name: "Street Network", status: "LIVE", desc: "QR capture flow. HMAC attribution. Every surface = point-of-sale" },
    { name: "ONYX Wallet", status: "LIVE", desc: "Cash App for cars. Send, receive, split, settle — one tap" },
    { name: "VIN Passport", status: "LIVE", desc: "NHTSA decode + AI summary. Digital birth certificate for every vehicle" },
    { name: "Split Payments", status: "LIVE", desc: "Instant multi-party split. Broker, mechanic, referrer — all paid automatically" },
    { name: "Ask ONYX NLP", status: "LIVE", desc: "Natural language → 7-agent mesh router. Intent classification + orchestration" },
    { name: "Bank Payoff", status: "LIVE", desc: "1-tap bank payoff integration. 18 lenders. Instant lien release" },
    { name: "Global Remittance", status: "LIVE", desc: "28 currencies. 14 corridors. Haiti→FL in seconds. 1.5% fee" },
    { name: "Location Nodes", status: "LIVE", desc: "Every gas station and shop = revenue-generating network node" },
    { name: "Theme Engine", status: "LIVE", desc: "20 culture-driven themes. Motorsport, GTA, Military, Luxury, Emergency" },
    { name: "Developer Platform", status: "LIVE", desc: "API keys, rate limits, webhooks, sandbox — others build on ONYX" },
    { name: "Federation Protocol", status: "LIVE", desc: "Dealerships, mechanics, service nodes — interconnected worldwide" },
    { name: "Settlement Layer", status: "LIVE", desc: "Instant multi-party settlement with cryptographic proof" },
    { name: "Social Proof", status: "LIVE", desc: "Dopamine loop. Leaderboards. Real-time activity feed" },
    { name: "Invite Network", status: "LIVE", desc: "Referral chain tracking. Attribution. Commission splitting" },
    { name: "IoT Gateway", status: "LIVE", desc: "Connected vehicles, telematics, OBD data pipeline" },
    { name: "Data Intelligence", status: "LIVE", desc: "Analytics, ML pipelines, market intelligence" },
    { name: "Anti-Abuse Engine", status: "LIVE", desc: "Velocity detection, clustering, risk scoring. Quarantine at 70+" },
    { name: "Governance", status: "LIVE", desc: "Voting, proposals, protocol upgrade governance" },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg" style={{ padding: "3vh 4vw" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(16,185,129,0.06) 0%, transparent 50%)" }} />
      <div className="relative" style={{ zIndex: 1 }}>
        <p className="font-body font-semibold tracking-widest" style={{ fontSize: "1.1vw", letterSpacing: "0.3em", color: "#10B981" }}>WHAT WE BUILT</p>
        <p className="font-display font-black tracking-tight text-text" style={{ fontSize: "2.8vw", lineHeight: 1.1, marginTop: "0.5vh" }}>
          Not a Pitch. A <span className="text-primary">Protocol.</span>
        </p>
        <p className="font-body text-muted" style={{ fontSize: "1.1vw", marginTop: "0.5vh", maxWidth: "55vw" }}>
          20+ systems built, tested, and operational today. Capital is for scaling and market capture — not research.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.6vw", marginTop: "1.5vh" }}>
          {systems.map((sys) => (
            <div key={sys.name} style={{ padding: "0.8vh 0.8vw", borderRadius: "0.4vw", display: "flex", alignItems: "flex-start", gap: "0.6vw" }} className="bg-surface">
              <div style={{ flexShrink: 0, padding: "0.2vh 0.4vw", borderRadius: "0.2vw", background: "rgba(16,185,129,0.15)", color: "#10B981", fontWeight: 700, fontSize: "0.5vw", letterSpacing: "0.1em" }}>
                {sys.status}
              </div>
              <div>
                <p className="font-display font-bold text-primary" style={{ fontSize: "0.75vw", lineHeight: 1.2 }}>{sys.name}</p>
                <p className="font-body text-muted" style={{ fontSize: "0.55vw", marginTop: "0.2vh" }}>{sys.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "1.5vh", padding: "1vh 2vw", borderRadius: "0.5vw", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(201,162,39,0.3)" }} className="bg-surface">
          <p className="font-body text-text" style={{ fontSize: "1vw" }}>
            <span className="text-primary font-semibold">Future-ready:</span> AI agents, AR inspection, humanoid robotics, autonomous fulfillment.
          </p>
          <p className="font-body font-bold text-primary" style={{ fontSize: "1vw", whiteSpace: "nowrap", marginLeft: "2vw" }}>Ship Today → Scale Tomorrow</p>
        </div>
      </div>
    </div>
  );
}
