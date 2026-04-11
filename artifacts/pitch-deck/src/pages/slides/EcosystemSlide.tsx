export default function EcosystemSlide() {
  const verticals = [
    {
      name: "Automobiles",
      market: "$2.7T",
      nodes: "Dealerships, Brokers, Auctions, Fleet Managers",
      color: "#C9A227",
    },
    {
      name: "Motorcycles & Powersports",
      market: "$42B",
      nodes: "Harley Shops, Custom Builders, Rally Networks",
      color: "#E8B830",
    },
    {
      name: "Commercial & Fleet",
      market: "$380B",
      nodes: "Logistics, Last-Mile, Government Motor Pools",
      color: "#C9A227",
    },
    {
      name: "Marine & Watercraft",
      market: "$35B",
      nodes: "Marinas, Jet Ski Dealers, Boat Brokers",
      color: "#E8B830",
    },
    {
      name: "Recreational & Off-Road",
      market: "$28B",
      nodes: "ATV, UTV, Snowmobile, Side-by-Side Dealers",
      color: "#C9A227",
    },
    {
      name: "Parts & Aftermarket",
      market: "$530B",
      nodes: "Mechanics, Body Shops, Parts Distributors",
      color: "#E8B830",
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg" style={{ padding: "4.5vh 5vw" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 30%, rgba(201,162,39,0.06) 0%, transparent 55%)" }} />
      <div className="relative" style={{ zIndex: 1 }}>
        <p className="font-body font-semibold tracking-widest text-primary" style={{ fontSize: "1.1vw", letterSpacing: "0.3em" }}>TOTAL ADDRESSABLE MARKET</p>
        <p className="font-display font-black tracking-tight text-text" style={{ fontSize: "3vw", lineHeight: 1.1, marginTop: "0.8vh" }}>
          Not Just Cars. <span className="text-primary">Every Vehicle on Earth.</span>
        </p>
        <p className="font-body text-muted" style={{ fontSize: "1.2vw", marginTop: "1vh", maxWidth: "52vw" }}>
          One protocol. Six verticals. The entire motorized world flows through a single liquidity layer.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1.2vw", marginTop: "3vh" }}>
          {verticals.map((v) => (
            <div key={v.name} className="bg-surface" style={{ padding: "2.5vh 1.8vw", borderRadius: "0.6vw", borderTop: `3px solid ${v.color}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <p className="font-display font-bold text-text" style={{ fontSize: "1.3vw" }}>{v.name}</p>
                <p className="font-display font-bold text-primary" style={{ fontSize: "1.8vw", lineHeight: 1 }}>{v.market}</p>
              </div>
              <div style={{ width: "2.5vw", height: "2px", margin: "1.2vh 0" }} className="bg-primary opacity-40" />
              <p className="font-body text-muted" style={{ fontSize: "0.95vw" }}>{v.nodes}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "2.5vh", padding: "2vh 3vw", borderRadius: "0.6vw", display: "flex", justifyContent: "space-between", alignItems: "center", border: "1px solid rgba(201,162,39,0.25)" }} className="bg-surface">
          <div>
            <p className="font-display font-black text-primary" style={{ fontSize: "3.5vw", lineHeight: 1 }}>$3.7T+</p>
            <p className="font-body text-muted" style={{ fontSize: "1vw", marginTop: "0.3vh" }}>Combined addressable market across all verticals</p>
          </div>
          <div style={{ width: "1px", height: "6vh" }} className="bg-primary opacity-20" />
          <div style={{ textAlign: "right", maxWidth: "35vw" }}>
            <p className="font-body text-text" style={{ fontSize: "1.1vw", opacity: 0.85 }}>
              Every motorcycle rider, boat owner, fleet manager, and weekend off-roader uses the same protocol. Same wallet. Same proof engine. Same network.
            </p>
            <p className="font-body font-semibold text-primary" style={{ fontSize: "1vw", marginTop: "0.8vh" }}>
              One scan. One tap. Every vehicle type.
            </p>
          </div>
        </div>

        <div style={{ marginTop: "1.5vh", textAlign: "center" }}>
          <p className="font-body text-muted" style={{ fontSize: "1vw", fontStyle: "italic", opacity: 0.7 }}>
            "Stripe built the payment layer for the internet. ONYX builds the value exchange layer for every engine ever made."
          </p>
        </div>
      </div>
    </div>
  );
}
