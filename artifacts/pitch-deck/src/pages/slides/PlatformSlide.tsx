export default function PlatformSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg" style={{ padding: "4vh 4vw" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 20%, rgba(201,162,39,0.05) 0%, transparent 50%)" }} />
      <div className="relative" style={{ zIndex: 1 }}>
        <p className="font-body font-semibold tracking-widest text-primary" style={{ fontSize: "1.1vw", letterSpacing: "0.3em" }}>THE PROTOCOL</p>
        <p className="font-display font-black tracking-tight text-text" style={{ fontSize: "2.8vw", lineHeight: 1.1, marginTop: "0.5vh" }}>
          One OS. Every Transaction. <span className="text-primary">Globally.</span>
        </p>
        <p className="font-body text-muted" style={{ fontSize: "1.1vw", marginTop: "0.8vh", maxWidth: "55vw" }}>
          Scan → Diagnose → Execute. One input from the member. Seven agents coordinate autonomously. Under two minutes.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1vw", marginTop: "2vh" }}>
          <div className="bg-surface" style={{ padding: "1.5vh 1.2vw", borderLeft: "3px solid #C9A227", borderRadius: "0 0.4vw 0.4vw 0" }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.1vw" }}>7-Agent Mesh</p>
            <p className="font-body text-text" style={{ fontSize: "0.85vw", marginTop: "0.4vh", opacity: 0.75 }}>Sales, Finance, Service, Parts, Delivery, Support, Referral — one autonomous event bus</p>
          </div>
          <div className="bg-surface" style={{ padding: "1.5vh 1.2vw", borderLeft: "3px solid #C9A227", borderRadius: "0 0.4vw 0.4vw 0" }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.1vw" }}>Proof Engine</p>
            <p className="font-body text-text" style={{ fontSize: "0.85vw", marginTop: "0.4vh", opacity: 0.75 }}>SHA-256 hash chain. HMAC-signed. Digital Birth Certificate for every VIN.</p>
          </div>
          <div className="bg-surface" style={{ padding: "1.5vh 1.2vw", borderLeft: "3px solid #C9A227", borderRadius: "0 0.4vw 0.4vw 0" }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.1vw" }}>ONYX Wallet</p>
            <p className="font-body text-text" style={{ fontSize: "0.85vw", marginTop: "0.4vh", opacity: 0.75 }}>Cash App for cars. Send, receive, split, settle — instant multi-party payments.</p>
          </div>
          <div className="bg-surface" style={{ padding: "1.5vh 1.2vw", borderLeft: "3px solid #E8B830", borderRadius: "0 0.4vw 0.4vw 0" }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.1vw" }}>Global Remittance</p>
            <p className="font-body text-text" style={{ fontSize: "0.85vw", marginTop: "0.4vh", opacity: 0.75 }}>28 currencies. 14 corridors. Haiti→FL in seconds. 1.5% fee.</p>
          </div>
          <div className="bg-surface" style={{ padding: "1.5vh 1.2vw", borderLeft: "3px solid #E8B830", borderRadius: "0 0.4vw 0.4vw 0" }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.1vw" }}>Developer Platform</p>
            <p className="font-body text-text" style={{ fontSize: "0.85vw", marginTop: "0.4vh", opacity: 0.75 }}>API keys, rate limits, webhooks, sandbox — others build on ONYX protocol.</p>
          </div>
          <div className="bg-surface" style={{ padding: "1.5vh 1.2vw", borderLeft: "3px solid #E8B830", borderRadius: "0 0.4vw 0.4vw 0" }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.1vw" }}>Federation Protocol</p>
            <p className="font-body text-text" style={{ fontSize: "0.85vw", marginTop: "0.4vh", opacity: 0.75 }}>Dealerships, mechanics, service nodes — interconnected worldwide.</p>
          </div>
          <div className="bg-surface" style={{ padding: "1.5vh 1.2vw", borderLeft: "3px solid #10B981", borderRadius: "0 0.4vw 0.4vw 0" }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.1vw" }}>Theme Engine</p>
            <p className="font-body text-text" style={{ fontSize: "0.85vw", marginTop: "0.4vh", opacity: 0.75 }}>20 culture-driven themes. Motorsport, GTA, Military, Luxury, Emergency.</p>
          </div>
          <div className="bg-surface" style={{ padding: "1.5vh 1.2vw", borderLeft: "3px solid #10B981", borderRadius: "0 0.4vw 0.4vw 0" }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.1vw" }}>Ask ONYX NLP</p>
            <p className="font-body text-text" style={{ fontSize: "0.85vw", marginTop: "0.4vh", opacity: 0.75 }}>Natural language → 7-agent mesh router. Intent classification + orchestration.</p>
          </div>
          <div className="bg-surface" style={{ padding: "1.5vh 1.2vw", borderLeft: "3px solid #10B981", borderRadius: "0 0.4vw 0.4vw 0" }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.1vw" }}>IoT + Robotics-Ready</p>
            <p className="font-body text-text" style={{ fontSize: "0.85vw", marginTop: "0.4vh", opacity: 0.75 }}>Connected vehicles, AR overlays, autonomous service fulfillment.</p>
          </div>
        </div>

        <div className="flex items-center" style={{ gap: "2vw", marginTop: "1.5vh" }}>
          <p className="font-body text-muted" style={{ fontSize: "1vw", fontStyle: "italic" }}>"CarFax tells you. ONYX proves it."</p>
          <div style={{ flex: 1, height: "1px" }} className="bg-primary opacity-20" />
          <p className="font-body text-muted" style={{ fontSize: "1vw" }}>"ONYX acts; member confirms."</p>
        </div>
      </div>
    </div>
  );
}
