export default function PlatformSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg" style={{ padding: "5vh 6vw" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 20%, rgba(201,162,39,0.05) 0%, transparent 50%)" }} />
      <div className="relative" style={{ zIndex: 1 }}>
        <p className="font-body font-semibold tracking-widest text-primary" style={{ fontSize: "1.2vw", letterSpacing: "0.3em" }}>THE PLATFORM</p>
        <p className="font-display font-black tracking-tight text-text" style={{ fontSize: "3.5vw", lineHeight: 1.1, marginTop: "1vh" }}>
          One OS. Every Transaction.
        </p>
        <p className="font-body text-muted" style={{ fontSize: "1.5vw", marginTop: "1vh", maxWidth: "50vw" }}>
          12 autonomous agents. 15 API integrations. Cryptographic trust. One tap.
        </p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "2vw", marginTop: "4vh" }}>
          <div style={{ padding: "2.5vh 1.8vw", borderLeft: "3px solid #C9A227", borderRadius: "0 0.5vw 0.5vw 0" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.6vw" }}>Agent Mesh</p>
            <p className="font-body text-text" style={{ fontSize: "1.3vw", marginTop: "1vh", opacity: 0.75 }}>12 AI agents auto-execute: Sales, Finance, Service, Parts, Delivery, Insurance, Compliance, Payout</p>
          </div>
          <div style={{ padding: "2.5vh 1.8vw", borderLeft: "3px solid #C9A227", borderRadius: "0 0.5vw 0.5vw 0" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.6vw" }}>Proof Engine</p>
            <p className="font-body text-text" style={{ fontSize: "1.3vw", marginTop: "1vh", opacity: 0.75 }}>SHA-256 hash chain. HMAC-signed. Ethereum-anchorable. Digital Birth Certificate for every VIN.</p>
          </div>
          <div style={{ padding: "2.5vh 1.8vw", borderLeft: "3px solid #C9A227", borderRadius: "0 0.5vw 0.5vw 0" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.6vw" }}>Sovereign Wallet</p>
            <p className="font-body text-text" style={{ fontSize: "1.3vw", marginTop: "1vh", opacity: 0.75 }}>Stripe Connect. Tokenized vault. Auto split-fee: tech fee, dealer net, referral commission instantly.</p>
          </div>
          <div style={{ padding: "2.5vh 1.8vw", borderLeft: "3px solid #C9A227", borderRadius: "0 0.5vw 0.5vw 0" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.6vw" }}>State Machine</p>
            <p className="font-body text-text" style={{ fontSize: "1.3vw", marginTop: "1vh", opacity: 0.75 }}>PostgreSQL-backed. 10 deal states. 8 task states. SLA tracking. Dependency-aware auto-unlock.</p>
          </div>
          <div style={{ padding: "2.5vh 1.8vw", borderLeft: "3px solid #C9A227", borderRadius: "0 0.5vw 0.5vw 0" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.6vw" }}>Operator OS</p>
            <p className="font-body text-text" style={{ fontSize: "1.3vw", marginTop: "1vh", opacity: 0.75 }}>DealerFlow, Worker, Bay, and Specialist dashboards. AI-routed next-action queue. Zero phone calls.</p>
          </div>
          <div style={{ padding: "2.5vh 1.8vw", borderLeft: "3px solid #C9A227", borderRadius: "0 0.5vw 0.5vw 0" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.6vw" }}>Growth Engine</p>
            <p className="font-body text-text" style={{ fontSize: "1.3vw", marginTop: "1vh", opacity: 0.75 }}>Altruistic viral loop. 8-tier gamification. Deep-links, QR, SMS, WhatsApp, Instagram sharing.</p>
          </div>
        </div>
        <div className="flex items-center" style={{ gap: "2vw", marginTop: "3.5vh" }}>
          <p className="font-body text-muted" style={{ fontSize: "1.3vw", fontStyle: "italic" }}>"CarFax tells you. ONYX proves it."</p>
          <div style={{ flex: 1, height: "1px" }} className="bg-primary opacity-20" />
          <p className="font-body text-muted" style={{ fontSize: "1.3vw" }}>"ONYX acts; member confirms."</p>
        </div>
      </div>
    </div>
  );
}
