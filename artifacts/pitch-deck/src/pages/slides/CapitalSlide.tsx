const base = import.meta.env.BASE_URL;

export default function CapitalSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <img
        src={`${base}tech-bg.png`}
        crossOrigin="anonymous"
        alt="Technology background"
        className="absolute inset-0 w-full h-full object-cover opacity-15"
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.85) 100%)" }} />
      <div className="relative" style={{ padding: "6vh 6vw", zIndex: 1 }}>
        <p className="font-body font-semibold tracking-widest text-primary" style={{ fontSize: "1.2vw", letterSpacing: "0.3em" }}>CAPITAL STRATEGY & GROWTH</p>
        <p className="font-display font-black tracking-tight text-text" style={{ fontSize: "3.5vw", lineHeight: 1.1, marginTop: "1.5vh" }}>
          SBA 7(a) Capital Deployment
        </p>

        <div style={{ display: "flex", gap: "4vw", marginTop: "4vh" }}>
          <div style={{ flex: "0 0 38vw" }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "5vw", lineHeight: 1 }}>$250K–$1M</p>
            <p className="font-body font-semibold text-text" style={{ fontSize: "1.6vw", marginTop: "1vh" }}>Capital Request</p>

            <div style={{ marginTop: "3vh", display: "flex", flexDirection: "column", gap: "1.5vh" }}>
              {[
                { pct: "40%", label: "Sales Engineering", desc: "Tier-1 Dealership Group onboarding", width: "100%" },
                { pct: "30%", label: "Viral Acquisition", desc: "Bird-Dog Referral Ledger — zero CAC growth", width: "75%" },
                { pct: "20%", label: "Infrastructure", desc: "Server capacity + NIST-grade security", width: "50%" },
                { pct: "10%", label: "Reserves", desc: "Operational runway + customer success", width: "25%" },
              ].map((item, i) => (
                <div key={i}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <p className="font-body font-bold text-text" style={{ fontSize: "1.3vw" }}>
                      <span className="text-primary">{item.pct}</span> {item.label}
                    </p>
                    <p className="font-body text-muted" style={{ fontSize: "1vw" }}>{item.desc}</p>
                  </div>
                  <div style={{ height: "0.5vh", borderRadius: "0.25vh", marginTop: "0.5vh", background: "#1a1a1a", overflow: "hidden" }}>
                    <div style={{ width: item.width, height: "100%", background: "linear-gradient(90deg, #C9A227, #E8B830)", borderRadius: "0.25vh" }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2vh" }}>
            <div style={{ padding: "3vh 2.5vw", borderRadius: "0.8vw", border: "1px solid rgba(201,162,39,0.2)" }} className="bg-surface">
              <p className="font-body font-semibold tracking-widest text-primary" style={{ fontSize: "1vw", letterSpacing: "0.2em" }}>PHASE I — ENTRY</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw", marginTop: "1.5vh" }}>
                <p className="font-display font-bold text-text" style={{ fontSize: "3vw", lineHeight: 1 }}>$6,250</p>
                <p className="font-body text-muted" style={{ fontSize: "1.2vw" }}>/month</p>
              </div>
              <p className="font-body text-muted" style={{ fontSize: "1.1vw", marginTop: "1vh" }}>25 deals/mo @ $250 avg revenue</p>
              <p className="font-body font-semibold text-primary" style={{ fontSize: "1.3vw", marginTop: "0.5vh" }}>1.2x Debt Coverage Ratio</p>
            </div>

            <div style={{ padding: "3vh 2.5vw", borderRadius: "0.8vw", border: "1px solid rgba(201,162,39,0.4)" }} className="bg-surface">
              <p className="font-body font-semibold tracking-widest text-primary" style={{ fontSize: "1vw", letterSpacing: "0.2em" }}>PHASE II — GROWTH</p>
              <div style={{ display: "flex", alignItems: "baseline", gap: "1.5vw", marginTop: "1.5vh" }}>
                <p className="font-display font-bold text-text" style={{ fontSize: "3vw", lineHeight: 1 }}>$37,500</p>
                <p className="font-body text-muted" style={{ fontSize: "1.2vw" }}>/month</p>
              </div>
              <p className="font-body text-muted" style={{ fontSize: "1.1vw", marginTop: "1vh" }}>150 deals/mo @ $250 avg revenue</p>
              <p className="font-body font-semibold text-primary" style={{ fontSize: "1.3vw", marginTop: "0.5vh" }}>7.5x Debt Coverage Ratio</p>
            </div>

            <div style={{ padding: "1.5vh 2.5vw", borderRadius: "0.8vw" }} className="bg-surface">
              <p className="font-body text-muted" style={{ fontSize: "1.1vw" }}>Repayments auto-serviced via dedicated escrow funded directly by transaction fees</p>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute" style={{ bottom: "4vh", left: "6vw", right: "6vw", display: "flex", justifyContent: "space-between" }}>
        <p className="font-body text-muted" style={{ fontSize: "1vw", opacity: 0.5 }}>Confidential</p>
        <p className="font-body text-muted" style={{ fontSize: "1vw", opacity: 0.5 }}>3C ONYX — CUXTOMCANDYCLUB LLC — 2026</p>
      </div>
    </div>
  );
}
