export default function AdoptionSlide() {
  const segments = [
    {
      group: "Law Enforcement",
      examples: "NYPD · LAPD · FBI · State Troopers",
      how: "Fleet maintenance for patrol vehicles. Officers refer fellow officers. Departments save on service contracts. Every precinct becomes a node.",
      icon: "🛡",
    },
    {
      group: "Military & Government",
      examples: "Army · Navy · Marines · Air Force · Federal Agencies",
      how: "Service members need vehicles at every duty station. PCS moves need transport. Base auto shops become service nodes. Families earn from referrals.",
      icon: "⭐",
    },
    {
      group: "Motorcycle & Biker Clubs",
      examples: "Riding Clubs · Rally Groups · Custom Builders",
      how: "Club buys helmets, jackets, boots through the platform. Club treasury earns on every member purchase. Group rides generate referral income.",
      icon: "🏍",
    },
    {
      group: "Car Clubs & Enthusiasts",
      examples: "JDM · Lowrider · Classic · Exotic · Off-Road Clubs",
      how: "Members buy, sell, and customize through the network. Club meets become ONYX events. Parts and accessories at group pricing.",
      icon: "🏎",
    },
    {
      group: "Sports Teams & Leagues",
      examples: "Baseball · Basketball · Football · Soccer · Little League",
      how: "Team vehicle fleets managed on platform. Players and staff earn residual income. Booster clubs become distribution nodes.",
      icon: "⚾",
    },
    {
      group: "First Responders & Unions",
      examples: "Firefighters · EMTs · Electricians · Plumbers · Teamsters",
      how: "Union becomes an organizational node. Members get fleet pricing on work vehicles. Every brother and sister they refer earns them income.",
      icon: "🔧",
    },
    {
      group: "Churches & Communities",
      examples: "Congregations · Nonprofits · Fraternities · Neighborhood Groups",
      how: "Help your congregation with vehicle needs. Organization earns as a node. Community wealth-building — not charity, partnership.",
      icon: "🏛",
    },
    {
      group: "Any Individual, Anywhere",
      examples: "Barbers · Uber Drivers · Teachers · Nurses · Students",
      how: "Download the app. Refer the people you already know. Every vehicle transaction in your network pays you. Residual. Forever.",
      icon: "📱",
    },
  ];

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg" style={{ padding: "3vh 4.5vw" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(201,162,39,0.05) 0%, transparent 50%)" }} />
      <div className="relative" style={{ zIndex: 1 }}>
        <p className="font-body font-semibold tracking-widest text-primary" style={{ fontSize: "1vw", letterSpacing: "0.3em" }}>UNIVERSAL ADOPTION</p>
        <p className="font-display font-black tracking-tight text-text" style={{ fontSize: "2.4vw", lineHeight: 1.1, marginTop: "0.3vh" }}>
          Everyone Drives. <span className="text-primary">Everyone Earns.</span>
        </p>
        <p className="font-body text-muted" style={{ fontSize: "0.95vw", marginTop: "0.3vh", maxWidth: "55vw" }}>
          The core is simple: your vehicle needs service, parts, insurance, and eventually replacement. ONYX handles all of it. But every person and organization connected to the network also earns — automatically, permanently.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.6vw", marginTop: "1.5vh" }}>
          {segments.map((s) => (
            <div key={s.group} className="bg-surface" style={{ padding: "1.2vh 1.2vw", borderRadius: "0.4vw", display: "flex", gap: "0.8vw", alignItems: "flex-start", borderLeft: s.group === "Any Individual, Anywhere" ? "3px solid #C9A227" : "3px solid rgba(201,162,39,0.2)" }}>
              <div style={{ fontSize: "1.5vw", flexShrink: 0, marginTop: "0.2vh" }}>{s.icon}</div>
              <div>
                <p className="font-display font-bold text-text" style={{ fontSize: "0.9vw", lineHeight: 1.2 }}>{s.group}</p>
                <p className="font-body text-primary" style={{ fontSize: "0.6vw", marginTop: "0.1vh", letterSpacing: "0.05em" }}>{s.examples}</p>
                <p className="font-body text-muted" style={{ fontSize: "0.7vw", marginTop: "0.4vh", lineHeight: 1.4 }}>{s.how}</p>
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: "1.2vh", padding: "1vh 2vw", borderRadius: "0.5vw", textAlign: "center", border: "1px solid rgba(201,162,39,0.25)" }} className="bg-surface">
          <p className="font-body text-text" style={{ fontSize: "0.95vw", opacity: 0.9 }}>
            <span className="text-primary font-semibold">One platform. One account. One network.</span> Whether you're a police officer in Brooklyn, a Marine in Camp Lejeune, a biker in Sturgis, or a Little League dad in Ohio — you own a vehicle, you know people who own vehicles, and now that's worth money.
          </p>
        </div>
      </div>
    </div>
  );
}
