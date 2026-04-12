export default function ResidualSlide() {
  const tiers = [
    {
      name: "Casual Member",
      hours: "5-10 hrs/week",
      activity: "Join the club. Buy your own gear. Refer a few friends and family.",
      year1: "$1,800 – $6,000",
      year2: "$4,000 – $12,000",
      residual: "Your referrals keep buying and referring. You earn while you sleep.",
      opacity: 0.6,
    },
    {
      name: "Active Connector",
      hours: "15-20 hrs/week",
      activity: "Place QR codes. Connect buyers to sellers. Refer 15-25 people/month.",
      year1: "$8,400 – $21,600",
      year2: "$18,000 – $48,000",
      residual: "Your network of 50-100 members generates 200+ monthly transactions. Passive.",
      opacity: 0.75,
    },
    {
      name: "Dedicated Operator",
      hours: "25-35 hrs/week",
      activity: "Run it like a business. Vehicle deals, logistics, runner missions.",
      year1: "$37,000 – $112,000",
      year2: "$60,000 – $180,000",
      residual: "200+ downstream members. QR locations producing deals 24/7. Compounding.",
      opacity: 0.9,
    },
    {
      name: "Network Builder",
      hours: "Full commitment",
      activity: "Build a team. Train connectors. Establish territory. Lead an organization.",
      year1: "$100,000 – $300,000+",
      year2: "$200,000 – $500,000+",
      residual: "The network runs itself. You built an asset. It pays you like one.",
      opacity: 1,
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg" style={{ padding: "3vh 4.5vw" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 80%, rgba(201,162,39,0.06) 0%, transparent 50%)" }} />
      <div className="relative" style={{ zIndex: 1 }}>
        <p className="font-body font-semibold tracking-widest text-primary" style={{ fontSize: "1vw", letterSpacing: "0.3em" }}>RESIDUAL INCOME MODEL</p>
        <p className="font-display font-black tracking-tight text-text" style={{ fontSize: "2.4vw", lineHeight: 1.1, marginTop: "0.3vh" }}>
          Work Once. <span className="text-primary">Get Paid Forever.</span>
        </p>
        <p className="font-body text-muted" style={{ fontSize: "0.95vw", marginTop: "0.3vh", maxWidth: "58vw" }}>
          Every referral is permanently stamped. Every transaction in your network pays you — this month, next month, next year. The more you build early, the more it compounds without you.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "0.6vw", marginTop: "1.8vh" }}>
          {tiers.map((t) => (
            <div key={t.name} style={{ display: "flex", alignItems: "stretch", gap: "0.8vw", opacity: t.opacity }}>
              <div className="bg-surface" style={{ width: "14vw", flexShrink: 0, padding: "1.2vh 1.2vw", borderRadius: "0.4vw", borderLeft: t.name === "Network Builder" ? "3px solid #C9A227" : "3px solid rgba(201,162,39,0.25)" }}>
                <p className="font-display font-bold text-text" style={{ fontSize: "1vw" }}>{t.name}</p>
                <p className="font-body text-primary" style={{ fontSize: "0.7vw", marginTop: "0.2vh" }}>{t.hours}</p>
                <p className="font-body text-muted" style={{ fontSize: "0.65vw", marginTop: "0.3vh", lineHeight: 1.4 }}>{t.activity}</p>
              </div>
              <div className="bg-surface" style={{ flex: 1, padding: "1.2vh 1.5vw", borderRadius: "0.4vw", display: "flex", alignItems: "center", gap: "2vw" }}>
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <p className="font-body text-muted" style={{ fontSize: "0.6vw", letterSpacing: "0.1em" }}>YEAR 1</p>
                  <p className="font-display font-bold text-text" style={{ fontSize: "1.1vw", marginTop: "0.2vh" }}>{t.year1}</p>
                </div>
                <div style={{ width: "1px", height: "4vh", flexShrink: 0 }} className="bg-primary opacity-20" />
                <div style={{ textAlign: "center", flexShrink: 0 }}>
                  <p className="font-body text-muted" style={{ fontSize: "0.6vw", letterSpacing: "0.1em" }}>YEAR 2</p>
                  <p className="font-display font-bold text-primary" style={{ fontSize: "1.1vw", marginTop: "0.2vh" }}>{t.year2}</p>
                </div>
                <div style={{ width: "1px", height: "4vh", flexShrink: 0 }} className="bg-primary opacity-20" />
                <div>
                  <p className="font-body text-muted" style={{ fontSize: "0.7vw", lineHeight: 1.4, fontStyle: "italic" }}>{t.residual}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "1.2vh", display: "flex", gap: "1.2vw" }}>
          <div className="bg-surface" style={{ flex: 1, padding: "1.2vh 1.5vw", borderRadius: "0.5vw", borderTop: "2px solid #C9A227" }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "0.9vw" }}>How It Works</p>
            <p className="font-body text-text" style={{ fontSize: "0.75vw", marginTop: "0.4vh", opacity: 0.85, lineHeight: 1.5 }}>
              You refer Maria. Maria buys a helmet. You earn. Maria refers her brother. He gets his truck serviced. You earn again. He refers his coworker. She sells her car through the platform. You earn again. <span className="text-primary">The chain never breaks. The attribution never expires.</span>
            </p>
          </div>
          <div className="bg-surface" style={{ flex: 1, padding: "1.2vh 1.5vw", borderRadius: "0.5vw", borderTop: "2px solid #E8B830" }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "0.9vw" }}>Why It's Different</p>
            <p className="font-body text-text" style={{ fontSize: "0.75vw", marginTop: "0.4vh", opacity: 0.85, lineHeight: 1.5 }}>
              No inventory. No monthly minimums. No buying cases of product you can't sell. The income comes from real transactions — vehicles, parts, service, gear — things 280 million Americans already spend money on. <span className="text-primary">You just connected them to the network.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
