export default function ProblemSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg" style={{ padding: "6vh 6vw" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 80%, rgba(201,162,39,0.06) 0%, transparent 60%)" }} />
      <div className="relative" style={{ zIndex: 1 }}>
        <p className="font-body font-semibold tracking-widest text-primary" style={{ fontSize: "1.2vw", letterSpacing: "0.3em" }}>THE PROBLEM</p>
        <p className="font-display font-black tracking-tight text-text" style={{ fontSize: "4vw", lineHeight: 1.1, marginTop: "1.5vh" }}>
          Legacy Auto Is Broken
        </p>
        <p className="font-body text-muted" style={{ fontSize: "1.6vw", marginTop: "1.5vh", maxWidth: "55vw" }}>
          Seven disconnected systems. Fax machines. Manual coordination. Every deal requires 12+ handoffs between departments that don't talk to each other.
        </p>
        <div style={{ display: "flex", gap: "2.5vw", marginTop: "6vh" }}>
          <div style={{ flex: 1, padding: "3vh 2vw", borderRadius: "1vw" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "2vw" }}>Dealership</p>
            <div style={{ width: "3vw", height: "0.3vh", marginTop: "1.5vh" }} className="bg-primary opacity-40" />
            <p className="font-body text-text" style={{ fontSize: "1.4vw", marginTop: "2vh", opacity: 0.8 }}>VinSolutions, Dealertrack, RouteOne, Simoniz, Sonsio -- five vendors for one sale</p>
            <p className="font-body font-semibold text-primary" style={{ fontSize: "1.8vw", marginTop: "2vh" }}>14 days avg.</p>
            <p className="font-body text-muted" style={{ fontSize: "1.2vw" }}>to close a single deal</p>
          </div>
          <div style={{ flex: 1, padding: "3vh 2vw", borderRadius: "1vw" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "2vw" }}>Consumer</p>
            <div style={{ width: "3vw", height: "0.3vh", marginTop: "1.5vh" }} className="bg-primary opacity-40" />
            <p className="font-body text-text" style={{ fontSize: "1.4vw", marginTop: "2vh", opacity: 0.8 }}>4+ hours at the dealership. Credit pulled multiple times. No transparency on price or history.</p>
            <p className="font-body font-semibold text-primary" style={{ fontSize: "1.8vw", marginTop: "2vh" }}>4.2 hours</p>
            <p className="font-body text-muted" style={{ fontSize: "1.2vw" }}>wasted per transaction</p>
          </div>
          <div style={{ flex: 1, padding: "3vh 2vw", borderRadius: "1vw" }} className="bg-surface">
            <p className="font-display font-bold text-primary" style={{ fontSize: "2vw" }}>Trust Gap</p>
            <div style={{ width: "3vw", height: "0.3vh", marginTop: "1.5vh" }} className="bg-primary opacity-40" />
            <p className="font-body text-text" style={{ fontSize: "1.4vw", marginTop: "2vh", opacity: 0.8 }}>CarFax reports. No cryptographic proof. No verifiable chain-of-custody. History can be fabricated.</p>
            <p className="font-body font-semibold text-primary" style={{ fontSize: "1.8vw", marginTop: "2vh" }}>Zero proof</p>
            <p className="font-body text-muted" style={{ fontSize: "1.2vw" }}>of vehicle integrity</p>
          </div>
        </div>
      </div>
    </div>
  );
}
