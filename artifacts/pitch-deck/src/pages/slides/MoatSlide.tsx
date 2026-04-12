const base = import.meta.env.BASE_URL;

export default function MoatSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <img
        src={`${base}tech-bg.png`}
        crossOrigin="anonymous"
        alt="Technology background"
        className="absolute inset-0 w-full h-full object-cover opacity-15"
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(160deg, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.88) 50%, rgba(10,10,10,0.95) 100%)" }} />
      <div className="relative" style={{ padding: "4.5vh 5vw", zIndex: 1 }}>
        <p className="font-body font-semibold tracking-widest text-primary" style={{ fontSize: "1.2vw", letterSpacing: "0.3em" }}>DEFENSIBILITY</p>
        <p className="font-display font-black tracking-tight text-text" style={{ fontSize: "3vw", lineHeight: 1.1, marginTop: "0.8vh" }}>
          The Moat — Five Walls Deep
        </p>
        <p className="font-body text-muted" style={{ fontSize: "1.2vw", marginTop: "1vh" }}>
          Not a feature advantage. A structural one.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.5vw", marginTop: "3vh" }}>
          <div style={{ padding: "2.5vh 2vw", borderRadius: "0.8vw", borderTop: "3px solid #C9A227" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.6vw", lineHeight: 1.2 }}>Asset-Light</p>
            <p className="font-display font-semibold text-text" style={{ fontSize: "1.1vw", marginTop: "0.5vh" }}>100% Built & Deployable</p>
            <div style={{ width: "3vw", height: "2px", margin: "1vh 0" }} className="bg-primary opacity-50" />
            <p className="font-body text-muted" style={{ fontSize: "1vw", lineHeight: 1.5 }}>
              The platform is fully operational. 7 agents, proof engine, payment infrastructure already live. Capital is for scaling, not building.
            </p>
          </div>

          <div style={{ padding: "2.5vh 2vw", borderRadius: "0.8vw", borderTop: "3px solid #E8B830" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.6vw", lineHeight: 1.2 }}>Forensic IP</p>
            <p className="font-display font-semibold text-text" style={{ fontSize: "1.1vw", marginTop: "0.5vh" }}>Sovereign State Machine</p>
            <div style={{ width: "3vw", height: "2px", margin: "1vh 0" }} className="bg-primary opacity-50" />
            <p className="font-body text-muted" style={{ fontSize: "1vw", lineHeight: 1.5 }}>
              All systems forensically branded — sole property of RAC3C / CUXTOMCANDYCLUB LLC. Every commit, agent, and protocol traceable to origin.
            </p>
          </div>

          <div style={{ padding: "2.5vh 2vw", borderRadius: "0.8vw", borderTop: "3px solid #C9A227" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.6vw", lineHeight: 1.2 }}>Distribution Moat</p>
            <p className="font-display font-semibold text-text" style={{ fontSize: "1.1vw", marginTop: "0.5vh" }}>10K QR Codes in the Wild</p>
            <div style={{ width: "3vw", height: "2px", margin: "1vh 0" }} className="bg-primary opacity-50" />
            <p className="font-body text-muted" style={{ fontSize: "1vw", lineHeight: 1.5 }}>
              Once 10,000 QR codes are at gas stations and repair shops, ONYX owns the top-of-funnel. No one can outspend organic reach.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5vw", marginTop: "1.5vh" }}>
          <div style={{ padding: "2.5vh 2vw", borderRadius: "0.8vw", borderTop: "3px solid #E8B830" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.6vw", lineHeight: 1.2 }}>Institutional Value</p>
            <p className="font-display font-semibold text-text" style={{ fontSize: "1.1vw", marginTop: "0.5vh" }}>Solves CIT for Banks</p>
            <div style={{ width: "3vw", height: "2px", margin: "1vh 0" }} className="bg-primary opacity-50" />
            <p className="font-body text-muted" style={{ fontSize: "1vw", lineHeight: 1.5 }}>
              By solving "Contracts in Transit" — the #1 pain for auto lenders — ONYX adds value to the banks providing the loan. Revenue from reducing their risk.
            </p>
          </div>

          <div style={{ padding: "2.5vh 2vw", borderRadius: "0.8vw", borderTop: "3px solid #C9A227" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.6vw", lineHeight: 1.2 }}>Network Effects + Future Stack</p>
            <p className="font-display font-semibold text-text" style={{ fontSize: "1.1vw", marginTop: "0.5vh" }}>Every User Adds Value for All</p>
            <div style={{ width: "3vw", height: "2px", margin: "1vh 0" }} className="bg-primary opacity-50" />
            <p className="font-body text-muted" style={{ fontSize: "1vw", lineHeight: 1.5 }}>
              Classic platform economics: each new user makes the network more valuable. Architecture designed for AI agents, AR inspection, humanoid robotics, and autonomous fulfillment.
            </p>
          </div>
        </div>

        <div style={{ marginTop: "2vh", padding: "1.8vh 3vw", borderRadius: "0.8vw", textAlign: "center" }} className="bg-surface">
          <p className="font-display font-bold text-text" style={{ fontSize: "1.5vw" }}>
            "Not a car app. A <span className="text-primary">Protocol for Automotive Value Exchange</span> — designed, built, and owned exclusively by RAC3C."
          </p>
        </div>
      </div>

      <div className="absolute" style={{ bottom: "3vh", left: "6vw", right: "6vw", display: "flex", justifyContent: "space-between" }}>
        <p className="font-body text-muted" style={{ fontSize: "1vw", opacity: 0.5 }}>Confidential</p>
        <p className="font-body text-muted" style={{ fontSize: "1vw", opacity: 0.5 }}>3C ONYX — CUXTOMCANDYCLUB LLC — 2026</p>
      </div>
    </div>
  );
}
