export default function PlatformSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg" style={{ padding: "5vh 5vw" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 20%, rgba(201,162,39,0.05) 0%, transparent 50%)" }} />
      <div className="relative" style={{ zIndex: 1 }}>
        <p className="font-body font-semibold tracking-widest text-primary" style={{ fontSize: "1.2vw", letterSpacing: "0.3em" }}>THE PROTOCOL</p>
        <p className="font-display font-black tracking-tight text-text" style={{ fontSize: "3vw", lineHeight: 1.1, marginTop: "0.8vh" }}>
          One OS. Every Transaction. Every Location.
        </p>
        <p className="font-body text-muted" style={{ fontSize: "1.2vw", marginTop: "1vh", maxWidth: "55vw" }}>
          Scan → Diagnose → Execute. One input from the member. Seven agents coordinate autonomously. Under two minutes.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "1.2vw", marginTop: "3vh" }}>
          <div style={{ padding: "2vh 1.5vw", borderLeft: "3px solid #C9A227", borderRadius: "0 0.5vw 0.5vw 0" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.3vw" }}>7-Agent Mesh</p>
            <p className="font-body text-text" style={{ fontSize: "1vw", marginTop: "0.6vh", opacity: 0.75 }}>Sales, Finance, Service, Parts, Delivery, Support, Referral — one autonomous event bus</p>
          </div>
          <div style={{ padding: "2vh 1.5vw", borderLeft: "3px solid #C9A227", borderRadius: "0 0.5vw 0.5vw 0" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.3vw" }}>Proof Engine</p>
            <p className="font-body text-text" style={{ fontSize: "1vw", marginTop: "0.6vh", opacity: 0.75 }}>SHA-256 hash chain. HMAC-signed. Digital Birth Certificate for every VIN.</p>
          </div>
          <div style={{ padding: "2vh 1.5vw", borderLeft: "3px solid #C9A227", borderRadius: "0 0.5vw 0.5vw 0" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.3vw" }}>Street Network</p>
            <p className="font-body text-text" style={{ fontSize: "1vw", marginTop: "0.6vh", opacity: 0.75 }}>QR capture flow with HMAC attribution. Every gas station, shop, smartphone = point-of-sale.</p>
          </div>
          <div style={{ padding: "2vh 1.5vw", borderLeft: "3px solid #C9A227", borderRadius: "0 0.5vw 0.5vw 0" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.3vw" }}>Sovereign Wallet</p>
            <p className="font-body text-text" style={{ fontSize: "1vw", marginTop: "0.6vh", opacity: 0.75 }}>Stripe Connect. Auto split-fee. Instant payout the second a deal hits COMPLETED.</p>
          </div>
          <div style={{ padding: "2vh 1.5vw", borderLeft: "3px solid #E8B830", borderRadius: "0 0.5vw 0.5vw 0" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.3vw" }}>Anti-Abuse Engine</p>
            <p className="font-body text-text" style={{ fontSize: "1vw", marginTop: "0.6vh", opacity: 0.75 }}>Velocity detection, clustering, conversion analysis. Quarantine at risk score 70+.</p>
          </div>
          <div style={{ padding: "2vh 1.5vw", borderLeft: "3px solid #E8B830", borderRadius: "0 0.5vw 0.5vw 0" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.3vw" }}>Attribution Chain</p>
            <p className="font-body text-text" style={{ fontSize: "1vw", marginTop: "0.6vh", opacity: 0.75 }}>Multi-level referral. Proof-gated payouts. Every dollar mathematically traceable.</p>
          </div>
          <div style={{ padding: "2vh 1.5vw", borderLeft: "3px solid #E8B830", borderRadius: "0 0.5vw 0.5vw 0" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.3vw" }}>SDV Intelligence</p>
            <p className="font-body text-text" style={{ fontSize: "1vw", marginTop: "0.6vh", opacity: 0.75 }}>Software-Defined Vehicle scoring. OTA update tracking. Connected car data pipeline.</p>
          </div>
          <div style={{ padding: "2vh 1.5vw", borderLeft: "3px solid #E8B830", borderRadius: "0 0.5vw 0.5vw 0" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.3vw" }}>Robotics-Ready</p>
            <p className="font-body text-text" style={{ fontSize: "1vw", marginTop: "0.6vh", opacity: 0.75 }}>Modular architecture for humanoid robotics, AR overlays, and autonomous service fulfillment.</p>
          </div>
        </div>
        <div className="flex items-center" style={{ gap: "2vw", marginTop: "2vh" }}>
          <p className="font-body text-muted" style={{ fontSize: "1.1vw", fontStyle: "italic" }}>"CarFax tells you. ONYX proves it."</p>
          <div style={{ flex: 1, height: "1px" }} className="bg-primary opacity-20" />
          <p className="font-body text-muted" style={{ fontSize: "1.1vw" }}>"ONYX acts; member confirms."</p>
        </div>
      </div>
    </div>
  );
}
