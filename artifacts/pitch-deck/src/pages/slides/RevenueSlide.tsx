const base = import.meta.env.BASE_URL;

export default function RevenueSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <img
        src={`${base}tech-bg.png`}
        crossOrigin="anonymous"
        alt="Technology background"
        className="absolute inset-0 w-full h-full object-cover opacity-20"
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.85) 50%, rgba(10,10,10,0.97) 100%)" }} />
      <div className="relative" style={{ padding: "6vh 6vw", zIndex: 1 }}>
        <p className="font-body font-semibold tracking-widest text-primary" style={{ fontSize: "1.2vw", letterSpacing: "0.3em" }}>REVENUE MODEL</p>
        <p className="font-display font-black tracking-tight text-text" style={{ fontSize: "3.5vw", lineHeight: 1.1, marginTop: "1.5vh" }}>
          The Tollbooth
        </p>
        <p className="font-body text-muted" style={{ fontSize: "1.3vw", marginTop: "1.5vh", maxWidth: "50vw" }}>
          Every transaction that flows through ONYX generates revenue. Three interlocking streams create a durable, recurring business.
        </p>

        <div style={{ display: "flex", gap: "3vw", marginTop: "5vh" }}>
          <div style={{ flex: 1, padding: "3vh 2.5vw", borderRadius: "0.8vw", borderLeft: "3px solid #C9A227" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "4vw", lineHeight: 1 }}>$150–$300</p>
            <p className="font-body font-semibold text-text" style={{ fontSize: "1.5vw", marginTop: "1.5vh" }}>Per Vehicle Deal</p>
            <p className="font-body text-muted" style={{ fontSize: "1.2vw", marginTop: "1vh" }}>Flat efficiency fee on every transaction routed through the platform. Replaces 14-day, 5-vendor chaos with instant execution.</p>
          </div>

          <div style={{ flex: 1, padding: "3vh 2.5vw", borderRadius: "0.8vw", borderLeft: "3px solid #E8B830" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "4vw", lineHeight: 1 }}>3–20%</p>
            <p className="font-body font-semibold text-text" style={{ fontSize: "1.5vw", marginTop: "1.5vh" }}>Logistic Commissions</p>
            <p className="font-body text-muted" style={{ fontSize: "1.2vw", marginTop: "1vh" }}>Embedded fees on parts, service, transport, and aftermarket — all routed through ONYX Agents automatically.</p>
          </div>

          <div style={{ flex: 1, padding: "3vh 2.5vw", borderRadius: "0.8vw", borderLeft: "3px solid #C9A227" }} className="bg-surface">
            <p className="font-display font-bold text-text" style={{ fontSize: "2.5vw", lineHeight: 1, marginTop: "1vh" }}>Recurring</p>
            <p className="font-body font-semibold text-text" style={{ fontSize: "1.5vw", marginTop: "1.5vh" }}>Service Spreads</p>
            <p className="font-body text-muted" style={{ fontSize: "1.2vw", marginTop: "1vh" }}>Recurring revenue from insurance binding, lender leads, and financing approvals flowing through the Sovereign Wallet.</p>
          </div>
        </div>

        <div style={{ marginTop: "4vh", padding: "2vh 3vw", borderRadius: "0.8vw", display: "flex", justifyContent: "space-between", alignItems: "center" }} className="bg-surface">
          <div>
            <p className="font-body font-semibold text-primary" style={{ fontSize: "1.3vw" }}>Auto-Split on Every Transaction</p>
            <p className="font-body text-muted" style={{ fontSize: "1.1vw", marginTop: "0.5vh" }}>3% Global Tech Fee + Dealer Net + Bird-Dog Commission — partitioned instantly via Stripe Connect</p>
          </div>
          <p className="font-body font-bold text-primary" style={{ fontSize: "1.3vw" }}>Zero Manual Reconciliation</p>
        </div>
      </div>

      <div className="absolute" style={{ bottom: "4vh", left: "6vw", right: "6vw", display: "flex", justifyContent: "space-between" }}>
        <p className="font-body text-muted" style={{ fontSize: "1vw", opacity: 0.5 }}>Confidential</p>
        <p className="font-body text-muted" style={{ fontSize: "1vw", opacity: 0.5 }}>3C ONYX — CUXTOMCANDYCLUB LLC — 2026</p>
      </div>
    </div>
  );
}
