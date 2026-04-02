export default function ProblemSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg" style={{ padding: "5vh 6vw" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 20% 80%, rgba(239,68,68,0.06) 0%, transparent 60%)" }} />
      <div className="relative" style={{ zIndex: 1 }}>
        <p className="font-body font-semibold tracking-widest" style={{ fontSize: "1.2vw", letterSpacing: "0.3em", color: "#EF4444" }}>$2.7 TRILLION PROBLEM</p>
        <p className="font-display font-black tracking-tight text-text" style={{ fontSize: "3.8vw", lineHeight: 1.1, marginTop: "1vh" }}>
          A 1950s Model in a Smartphone World
        </p>
        <p className="font-body text-muted" style={{ fontSize: "1.4vw", marginTop: "1.5vh", maxWidth: "55vw" }}>
          The automotive industry was never digitized — it was just given email. Seven disconnected systems. Fax machines. 12+ handoffs per deal. No one built the protocol layer. Until now.
        </p>
        <div style={{ display: "flex", gap: "2vw", marginTop: "4vh" }}>
          <div style={{ flex: 1, padding: "3vh 2vw", borderRadius: "1vw", borderTop: "3px solid #EF4444" }} className="bg-surface">
            <p className="font-display font-bold" style={{ fontSize: "2vw", color: "#EF4444" }}>Dealership</p>
            <div style={{ width: "3vw", height: "0.3vh", marginTop: "1.2vh" }} className="bg-primary opacity-40" />
            <p className="font-body text-text" style={{ fontSize: "1.2vw", marginTop: "1.5vh", opacity: 0.8 }}>VinSolutions, Dealertrack, RouteOne, Simoniz, Sonsio — five vendors that don't talk to each other for one sale</p>
            <p className="font-body font-semibold" style={{ fontSize: "2vw", marginTop: "2vh", color: "#EF4444" }}>14 days avg.</p>
            <p className="font-body text-muted" style={{ fontSize: "1.1vw" }}>to close a single deal</p>
          </div>
          <div style={{ flex: 1, padding: "3vh 2vw", borderRadius: "1vw", borderTop: "3px solid #EF4444" }} className="bg-surface">
            <p className="font-display font-bold" style={{ fontSize: "2vw", color: "#EF4444" }}>Consumer</p>
            <div style={{ width: "3vw", height: "0.3vh", marginTop: "1.2vh" }} className="bg-primary opacity-40" />
            <p className="font-body text-text" style={{ fontSize: "1.2vw", marginTop: "1.5vh", opacity: 0.8 }}>4+ hours at the dealership. Credit pulled multiple times. No transparency on price, history, or vehicle integrity.</p>
            <p className="font-body font-semibold" style={{ fontSize: "2vw", marginTop: "2vh", color: "#EF4444" }}>4.2 hours</p>
            <p className="font-body text-muted" style={{ fontSize: "1.1vw" }}>wasted per transaction</p>
          </div>
          <div style={{ flex: 1, padding: "3vh 2vw", borderRadius: "1vw", borderTop: "3px solid #EF4444" }} className="bg-surface">
            <p className="font-display font-bold" style={{ fontSize: "2vw", color: "#EF4444" }}>Trust Gap</p>
            <div style={{ width: "3vw", height: "0.3vh", marginTop: "1.2vh" }} className="bg-primary opacity-40" />
            <p className="font-body text-text" style={{ fontSize: "1.2vw", marginTop: "1.5vh", opacity: 0.8 }}>CarFax reports can be gamed. No cryptographic proof. No verifiable chain-of-custody. Vehicle history is trust-on-faith.</p>
            <p className="font-body font-semibold" style={{ fontSize: "2vw", marginTop: "2vh", color: "#EF4444" }}>Zero proof</p>
            <p className="font-body text-muted" style={{ fontSize: "1.1vw" }}>of vehicle integrity</p>
          </div>
        </div>
        <div style={{ marginTop: "3vh", textAlign: "center" }}>
          <p className="font-body text-muted" style={{ fontSize: "1.2vw", fontStyle: "italic" }}>"No one built the operating system. Everyone built point solutions."</p>
        </div>
      </div>
    </div>
  );
}
