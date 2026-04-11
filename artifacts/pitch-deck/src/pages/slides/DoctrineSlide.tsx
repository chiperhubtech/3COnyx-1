export default function DoctrineSlide() {
  const doctrines = [
    { book: "Blitzscaling", principle: "Prioritize speed over efficiency in conditions of uncertainty", color: "#FF6B00" },
    { book: "The Lean Startup", principle: "Validated learning through Build-Measure-Learn at every node", color: "#2196F3" },
    { book: "The Greatest Salesman", principle: "Persistence as protocol — the scrolls encode daily discipline", color: "#FFD700" },
    { book: "Trillion Dollar Coach", principle: "Coaching culture embedded in agent behavior, not org charts", color: "#9C27B0" },
    { book: "The 12 Week Year", principle: "Quarterly urgency compressed into 12-week execution sprints", color: "#00BCD4" },
    { book: "Katamari Strategy", principle: "Roll small wins into compounding scale — every node adds mass", color: "#E91E63" },
    { book: "The Intelligent Investor", principle: "Margin of safety in every financial model and risk threshold", color: "#1B5E20" },
    { book: "Blue Ocean Strategy", principle: "Create uncontested market space — don't compete, redefine", color: "#0277BD" },
    { book: "The Art of War", principle: "Win without fighting — position so competitors cannot engage", color: "#B71C1C" },
    { book: "Rich Dad Poor Dad", principle: "Build assets that generate income — the network is the asset", color: "#6A1B9A" },
    { book: "Think and Grow Rich", principle: "Definiteness of purpose backed by burning desire and faith", color: "#FF8F00" },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg" style={{ padding: "3.5vh 4.5vw" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 70%, rgba(201,162,39,0.05) 0%, transparent 50%)" }} />
      <div className="relative" style={{ zIndex: 1 }}>
        <p className="font-body font-semibold tracking-widest text-primary" style={{ fontSize: "1vw", letterSpacing: "0.3em" }}>INTELLECTUAL ARCHITECTURE</p>
        <p className="font-display font-black tracking-tight text-text" style={{ fontSize: "2.6vw", lineHeight: 1.1, marginTop: "0.5vh" }}>
          11 Doctrines. 69 Directives. <span className="text-primary">One Engine.</span>
        </p>
        <p className="font-body text-muted" style={{ fontSize: "1vw", marginTop: "0.5vh", maxWidth: "55vw" }}>
          Every autonomous agent is governed by principles distilled from the most consequential business literature ever written — encoded as machine-executable directives that fire continuously.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.7vw", marginTop: "1.8vh" }}>
          {doctrines.map((d) => (
            <div key={d.book} className="bg-surface" style={{ padding: "1vh 1.2vw", borderRadius: "0.4vw", display: "flex", alignItems: "center", gap: "0.8vw", borderLeft: `3px solid ${d.color}` }}>
              <div style={{ flexShrink: 0, width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: d.color }} />
              <div>
                <p className="font-display font-bold text-text" style={{ fontSize: "0.85vw", lineHeight: 1.2 }}>{d.book}</p>
                <p className="font-body text-muted" style={{ fontSize: "0.7vw", marginTop: "0.2vh" }}>{d.principle}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "1.5vh", display: "flex", gap: "1.5vw" }}>
          <div className="bg-surface" style={{ flex: 1, padding: "1.5vh 1.5vw", borderRadius: "0.6vw", borderTop: "2px solid #C9A227" }}>
            <p className="font-body font-semibold text-primary" style={{ fontSize: "0.9vw" }}>Why This Matters</p>
            <p className="font-body text-text" style={{ fontSize: "0.8vw", marginTop: "0.5vh", opacity: 0.8, lineHeight: 1.5 }}>
              Bezos built Amazon on a handful of principles. Jobs ran Apple on design intuition. Hoffman scaled LinkedIn on network theory. This platform synthesizes <span style={{ color: "#C9A227" }}>all of them</span> — not as philosophy, but as code. Eleven doctrines running as autonomous agents, making real-time decisions across every transaction.
            </p>
          </div>
          <div className="bg-surface" style={{ flex: 1, padding: "1.5vh 1.5vw", borderRadius: "0.6vw", borderTop: "2px solid #E8B830" }}>
            <p className="font-body font-semibold text-primary" style={{ fontSize: "0.9vw" }}>The Competitive Difference</p>
            <p className="font-body text-text" style={{ fontSize: "0.8vw", marginTop: "0.5vh", opacity: 0.8, lineHeight: 1.5 }}>
              Carvana digitized the showroom. TrueCar digitized the price sheet. AutoTrader digitized the listing. None of them built the <span style={{ color: "#C9A227" }}>operating system</span>. ONYX is the protocol layer underneath — the bridge that connects every participant, every transaction, every vehicle. You don't compete with bridges. You cross them.
            </p>
          </div>
        </div>

        <div style={{ marginTop: "1.2vh", textAlign: "center" }}>
          <p className="font-body text-muted" style={{ fontSize: "0.9vw", fontStyle: "italic", opacity: 0.7 }}>
            "I created the George Washington Bridge for the entire auto industry — I just have to cut the ribbon and start receiving traffic."
          </p>
        </div>
      </div>
    </div>
  );
}
