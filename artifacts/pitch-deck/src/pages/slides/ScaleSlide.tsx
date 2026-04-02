const base = import.meta.env.BASE_URL;

export default function ScaleSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <img
        src={`${base}tech-bg.png`}
        crossOrigin="anonymous"
        alt="Technology background"
        className="absolute inset-0 w-full h-full object-cover opacity-20"
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.97) 0%, rgba(10,10,10,0.85) 100%)" }} />
      <div className="relative" style={{ padding: "5vh 6vw", zIndex: 1 }}>
        <p className="font-body font-semibold tracking-widest text-primary" style={{ fontSize: "1.2vw", letterSpacing: "0.3em" }}>LEAN STARTUP → BLITZSCALING</p>
        <p className="font-display font-black tracking-tight text-text" style={{ fontSize: "3.2vw", lineHeight: 1.1, marginTop: "1vh" }}>
          The Trajectory: 10M → 100M Users
        </p>
        <p className="font-body text-muted" style={{ fontSize: "1.3vw", marginTop: "1vh", maxWidth: "55vw" }}>
          Validate unit economics first. Then move faster than the market can react.
        </p>

        <div style={{ display: "flex", gap: "2vw", marginTop: "3.5vh" }}>
          <div style={{ flex: 1, padding: "3vh 2.5vw", borderRadius: "0.8vw", border: "1px solid rgba(201,162,39,0.2)" }} className="bg-surface">
            <p className="font-body font-semibold tracking-widest text-muted" style={{ fontSize: "1vw", letterSpacing: "0.2em" }}>PHASE I — BOOTSTRAP</p>
            <p className="font-display font-bold text-primary" style={{ fontSize: "3.5vw", lineHeight: 1, marginTop: "1.5vh" }}>$6,250</p>
            <p className="font-body text-muted" style={{ fontSize: "1.1vw", marginTop: "0.5vh" }}>MRR • 25 deals/mo</p>
            <div style={{ width: "100%", height: "1px", margin: "1.5vh 0" }} className="bg-primary opacity-20" />
            <p className="font-body text-text" style={{ fontSize: "1.1vw", opacity: 0.8 }}>Validate the model. Prove unit economics. Build-Measure-Learn at dealership level. Every QR code = validated learning.</p>
            <p className="font-body font-semibold text-primary" style={{ fontSize: "1.2vw", marginTop: "1vh" }}>1.2x Debt Coverage</p>
          </div>

          <div style={{ flex: 1, padding: "3vh 2.5vw", borderRadius: "0.8vw", border: "2px solid rgba(201,162,39,0.4)" }} className="bg-surface">
            <p className="font-body font-semibold tracking-widest text-primary" style={{ fontSize: "1vw", letterSpacing: "0.2em" }}>PHASE II — 10M USERS</p>
            <p className="font-display font-bold text-primary" style={{ fontSize: "3.5vw", lineHeight: 1, marginTop: "1.5vh" }}>$37,500</p>
            <p className="font-body text-muted" style={{ fontSize: "1.1vw", marginTop: "0.5vh" }}>MRR • 150 deals/mo</p>
            <div style={{ width: "100%", height: "1px", margin: "1.5vh 0" }} className="bg-primary opacity-30" />
            <p className="font-body text-text" style={{ fontSize: "1.1vw", opacity: 0.8 }}>Network effects compound. K&gt;1 viral coefficient. Every new QR code increases the value for every existing user. Zero CAC growth engine.</p>
            <p className="font-body font-semibold text-primary" style={{ fontSize: "1.2vw", marginTop: "1vh" }}>7.5x Debt Coverage</p>
          </div>

          <div style={{ flex: 1, padding: "3vh 2.5vw", borderRadius: "0.8vw", border: "2px solid #C9A227", boxShadow: "0 0 30px rgba(201,162,39,0.1)" }} className="bg-surface">
            <p className="font-body font-bold tracking-widest text-primary" style={{ fontSize: "1vw", letterSpacing: "0.2em" }}>PHASE III — 100M USERS</p>
            <p className="font-display font-bold text-primary" style={{ fontSize: "3.5vw", lineHeight: 1, marginTop: "1.5vh" }}>PROTOCOL</p>
            <p className="font-body text-muted" style={{ fontSize: "1.1vw", marginTop: "0.5vh" }}>The Standard</p>
            <div style={{ width: "100%", height: "1px", margin: "1.5vh 0" }} className="bg-primary opacity-40" />
            <p className="font-body text-text" style={{ fontSize: "1.1vw", opacity: 0.8 }}>ONYX becomes the infrastructure layer. AI agents handle 90% of transactions. AR overlays inspect vehicles. Humanoid robotics fulfill service. The full stack.</p>
            <p className="font-body font-semibold text-primary" style={{ fontSize: "1.2vw", marginTop: "1vh" }}>Industry Standard</p>
          </div>
        </div>

        <div style={{ marginTop: "3vh", display: "flex", gap: "3vw", justifyContent: "center", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "2vw" }}>AI Agents</p>
            <p className="font-body text-muted" style={{ fontSize: "0.9vw" }}>Autonomous execution</p>
          </div>
          <p className="font-body text-primary" style={{ fontSize: "2vw" }}>→</p>
          <div style={{ textAlign: "center" }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "2vw" }}>AR Overlays</p>
            <p className="font-body text-muted" style={{ fontSize: "0.9vw" }}>Visual inspection</p>
          </div>
          <p className="font-body text-primary" style={{ fontSize: "2vw" }}>→</p>
          <div style={{ textAlign: "center" }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "2vw" }}>Robotics</p>
            <p className="font-body text-muted" style={{ fontSize: "0.9vw" }}>Service fulfillment</p>
          </div>
          <p className="font-body text-primary" style={{ fontSize: "2vw" }}>→</p>
          <div style={{ textAlign: "center" }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "2vw" }}>Full Autonomy</p>
            <p className="font-body text-muted" style={{ fontSize: "0.9vw" }}>End-to-end protocol</p>
          </div>
        </div>
      </div>

      <div className="absolute" style={{ bottom: "3vh", left: "6vw", right: "6vw", display: "flex", justifyContent: "space-between" }}>
        <p className="font-body text-muted" style={{ fontSize: "1vw", opacity: 0.5 }}>Confidential</p>
        <p className="font-body text-muted" style={{ fontSize: "1vw", opacity: 0.5 }}>3C ONYX — CUXTOMCANDYCLUB LLC — 2026</p>
      </div>
    </div>
  );
}
