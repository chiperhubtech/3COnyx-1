export default function BlueprintSlide() {
  const stories = [
    { role: "Auto Detailer", location: "Atlanta, GA", earnings: "$187K", period: "Year 1", path: "Mobile detailing → 40 recurring fleet accounts via ONYX referral chain" },
    { role: "Uber Driver", location: "Miami, FL", earnings: "$243K", period: "18 months", path: "Rideshare → bird-dog referrals → 3 dealership partnerships" },
    { role: "Barber", location: "Newark, NJ", earnings: "$312K", period: "Year 1", path: "Shop QR codes → 200+ vehicle referrals → top 1% network connector" },
    { role: "Mechanic", location: "Houston, TX", earnings: "$198K", period: "Year 1", path: "Independent shop → ONYX service node → fleet maintenance contracts" },
  ];

  const comparisons = [
    { platform: "Direct Selling / MLM", what: "Sell supplements, cosmetics, shakes", limit: "Dangle a car bonus as the carrot — 99% never earn it", highlight: false },
    { platform: "Ride-Sharing Platforms", what: "Connected riders to drivers", limit: "Drivers earn $15-25/hr, capped by hours driven", highlight: false },
    { platform: "Gig Delivery Apps", what: "Connected restaurants to customers", limit: "Couriers earn $12-20/hr, zero equity in the network", highlight: false },
    { platform: "3C ONYX", what: "The product IS the vehicle industry", limit: "Members earn $100K-$300K+/yr — real assets, real wealth", highlight: true },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg" style={{ padding: "3vh 4.5vw" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 100%, rgba(201,162,39,0.06) 0%, transparent 50%)" }} />
      <div className="relative" style={{ zIndex: 1 }}>
        <p className="font-body font-semibold tracking-widest text-primary" style={{ fontSize: "1vw", letterSpacing: "0.3em" }}>THE MISSION</p>
        <p className="font-display font-black tracking-tight text-text" style={{ fontSize: "2.4vw", lineHeight: 1.1, marginTop: "0.4vh" }}>
          Built for the People Who <span className="text-primary">Build America.</span>
        </p>
        <p className="font-body text-muted" style={{ fontSize: "0.95vw", marginTop: "0.4vh", maxWidth: "55vw" }}>
          Regular people making extraordinary income — from their phones. Not gig wages. Not MLM shakes. Real wealth from the real economy.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "0.7vw", marginTop: "1.5vh" }}>
          {stories.map((s) => (
            <div key={s.role} className="bg-surface" style={{ padding: "1.5vh 1.1vw", borderRadius: "0.5vw", borderTop: "2px solid #C9A227" }}>
              <p className="font-display font-bold text-primary" style={{ fontSize: "1.8vw", lineHeight: 1 }}>{s.earnings}</p>
              <p className="font-body font-semibold text-text" style={{ fontSize: "0.8vw", marginTop: "0.4vh" }}>{s.role}</p>
              <p className="font-body text-muted" style={{ fontSize: "0.65vw" }}>{s.location} · {s.period}</p>
              <div style={{ width: "2vw", height: "1px", margin: "0.6vh 0" }} className="bg-primary opacity-30" />
              <p className="font-body text-muted" style={{ fontSize: "0.65vw", lineHeight: 1.4 }}>{s.path}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "1.5vh" }}>
          <p className="font-body font-semibold text-muted" style={{ fontSize: "0.75vw", letterSpacing: "0.15em", marginBottom: "0.5vh" }}>THE $40B DIRECT SELLING INDUSTRY DANGLES THE CAR AS A BONUS. WE HAND THEM THE ENTIRE INDUSTRY.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35vw" }}>
            {comparisons.map((c) => (
              <div key={c.platform} style={{ display: "flex", alignItems: "center", gap: "1.2vw", padding: "0.9vh 1.3vw", borderRadius: "0.4vw", background: c.highlight ? "rgba(201,162,39,0.12)" : "rgba(255,255,255,0.06)", borderLeft: c.highlight ? "3px solid #C9A227" : "3px solid transparent" }}>
                <p className="font-display font-bold" style={{ fontSize: "0.85vw", width: "13vw", flexShrink: 0, color: c.highlight ? "#C9A227" : "#5a5550" }}>{c.platform}</p>
                <p className="font-body text-text" style={{ fontSize: "0.75vw", width: "20vw", flexShrink: 0, opacity: c.highlight ? 0.9 : 0.5 }}>{c.what}</p>
                <p className="font-body" style={{ fontSize: "0.75vw", color: c.highlight ? "#C9A227" : "#5a5550", fontWeight: c.highlight ? 600 : 400 }}>{c.limit}</p>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: "1.2vh", display: "flex", gap: "1.5vw", alignItems: "center" }}>
          <div style={{ flex: 1, padding: "1vh 1.3vw", borderRadius: "0.5vw", border: "1px solid rgba(201,162,39,0.2)" }} className="bg-surface">
            <p className="font-body text-text" style={{ fontSize: "0.8vw", opacity: 0.85 }}>
              <span className="text-primary font-semibold">$1.53M total earnings</span> across early members. Avg: <span className="text-primary">$191K/year</span>. No degree. No franchise fee. No inventory of weight-loss shakes in the garage. Just a phone and hustle.
            </p>
          </div>
          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "1.1vw" }}>Xtraordinary for the Ordinary.</p>
            <p className="font-body text-muted" style={{ fontSize: "0.75vw", marginTop: "0.2vh" }}>They sell the carrot. We give them the farm.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
