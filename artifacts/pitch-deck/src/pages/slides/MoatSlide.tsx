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
      <div className="relative" style={{ padding: "5vh 6vw", zIndex: 1 }}>
        <p className="font-body font-semibold tracking-widest text-primary" style={{ fontSize: "1.2vw", letterSpacing: "0.3em" }}>DEFENSIBILITY</p>
        <p className="font-display font-black tracking-tight text-text" style={{ fontSize: "3.2vw", lineHeight: 1.1, marginTop: "1vh" }}>
          The Moat — Four Walls Deep
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2vw", marginTop: "4vh" }}>
          <div style={{ padding: "3.5vh 2.5vw", borderRadius: "0.8vw", borderTop: "3px solid #C9A227", display: "flex", flexDirection: "column" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "2vw", lineHeight: 1.2 }}>Asset-Light</p>
            <p className="font-display font-semibold text-text" style={{ fontSize: "1.3vw", marginTop: "0.8vh" }}>100% Built & Deployable</p>
            <div style={{ width: "3vw", height: "2px", margin: "1.5vh 0" }} className="bg-primary opacity-50" />
            <p className="font-body text-muted" style={{ fontSize: "1.1vw", lineHeight: 1.6 }}>
              The platform is fully operational. Capital is for scaling and market capture — not research. 7 agents, proof engine, state machine, and payment infrastructure already live.
            </p>
          </div>

          <div style={{ padding: "3.5vh 2.5vw", borderRadius: "0.8vw", borderTop: "3px solid #E8B830", display: "flex", flexDirection: "column" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "2vw", lineHeight: 1.2 }}>Forensic IP</p>
            <p className="font-display font-semibold text-text" style={{ fontSize: "1.3vw", marginTop: "0.8vh" }}>Sovereign State Machine</p>
            <div style={{ width: "3vw", height: "2px", margin: "1.5vh 0" }} className="bg-primary opacity-50" />
            <p className="font-body text-muted" style={{ fontSize: "1.1vw", lineHeight: 1.6 }}>
              All systems forensically branded — sole property of Ronald Antonio Cadet. No outside resource can claim credit for any part of this platform. Every commit, every agent, every protocol traceable to origin.
            </p>
          </div>

          <div style={{ padding: "3.5vh 2.5vw", borderRadius: "0.8vw", borderTop: "3px solid #C9A227", display: "flex", flexDirection: "column" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "2vw", lineHeight: 1.2 }}>Distribution Moat</p>
            <p className="font-display font-semibold text-text" style={{ fontSize: "1.3vw", marginTop: "0.8vh" }}>10K QR Codes in the Wild</p>
            <div style={{ width: "3vw", height: "2px", margin: "1.5vh 0" }} className="bg-primary opacity-50" />
            <p className="font-body text-muted" style={{ fontSize: "1.1vw", lineHeight: 1.6 }}>
              Once 10,000 QR codes are at gas stations, repair shops, and dealerships, ONYX owns the top-of-funnel. No competitor can outspend that level of organic, real-world reach.
            </p>
          </div>

          <div style={{ padding: "3.5vh 2.5vw", borderRadius: "0.8vw", borderTop: "3px solid #E8B830", display: "flex", flexDirection: "column" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "2vw", lineHeight: 1.2 }}>Institutional Value</p>
            <p className="font-display font-semibold text-text" style={{ fontSize: "1.3vw", marginTop: "0.8vh" }}>Solves CIT for Banks</p>
            <div style={{ width: "3vw", height: "2px", margin: "1.5vh 0" }} className="bg-primary opacity-50" />
            <p className="font-body text-muted" style={{ fontSize: "1.1vw", lineHeight: 1.6 }}>
              By solving "Contracts in Transit" — the #1 pain point for auto lenders — ONYX adds value to the very banks providing the loan. The platform reduces their risk while generating revenue.
            </p>
          </div>
        </div>

        <div style={{ marginTop: "3vh", padding: "2vh 3vw", borderRadius: "0.8vw", textAlign: "center" }} className="bg-surface">
          <p className="font-display font-bold text-text" style={{ fontSize: "1.8vw" }}>
            "Not a car app. A <span className="text-primary">Protocol for Automotive Value Exchange</span> — designed, built, and owned exclusively by Ronald Antonio Cadet."
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
