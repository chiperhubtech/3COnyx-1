const base = import.meta.env.BASE_URL;

export default function GrowthSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <img
        src={`${base}tech-bg.png`}
        crossOrigin="anonymous"
        alt="Technology background"
        className="absolute inset-0 w-full h-full object-cover opacity-25"
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(to right, rgba(10,10,10,0.95) 0%, rgba(10,10,10,0.7) 50%, rgba(10,10,10,0.95) 100%)" }} />
      <div className="relative" style={{ padding: "6vh 6vw", zIndex: 1 }}>
        <p className="font-body font-semibold tracking-widest text-primary" style={{ fontSize: "1.2vw", letterSpacing: "0.3em" }}>K-FACTOR AND GROWTH</p>
        <p className="font-display font-black tracking-tight text-text" style={{ fontSize: "3.5vw", lineHeight: 1.1, marginTop: "1.5vh" }}>
          The Altruistic Viral Loop
        </p>
        <div style={{ display: "flex", gap: "4vw", marginTop: "5vh", alignItems: "flex-start" }}>
          <div style={{ flex: "0 0 30vw", textAlign: "center" }}>
            <p className="font-display font-black text-primary" style={{ fontSize: "10vw", lineHeight: 1 }}>K&gt;1</p>
            <p className="font-body font-semibold text-text" style={{ fontSize: "1.8vw", marginTop: "1vh" }}>Viral Coefficient</p>
            <p className="font-body text-muted" style={{ fontSize: "1.3vw", marginTop: "1vh" }}>Every member generates more than one new member. Self-sustaining exponential growth.</p>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ padding: "2.5vh 2vw", borderRadius: "0.8vw", marginBottom: "2vh" }} className="bg-surface">
              <p className="font-body font-semibold text-primary" style={{ fontSize: "1.5vw" }}>Member Helps Friend Buy Car</p>
              <p className="font-body text-text" style={{ fontSize: "1.3vw", marginTop: "0.8vh", opacity: 0.75 }}>Referrer earns 3% vehicle commission + 20% membership fee automatically via Stripe Connect</p>
            </div>
            <div style={{ padding: "2.5vh 2vw", borderRadius: "0.8vw", marginBottom: "2vh" }} className="bg-surface">
              <p className="font-body font-semibold text-primary" style={{ fontSize: "1.5vw" }}>Buyer Becomes Referrer</p>
              <p className="font-body text-text" style={{ fontSize: "1.3vw", marginTop: "0.8vh", opacity: 0.75 }}>Post-delivery prompt: "You helped someone. Help someone else?" -- 8-tier gamification drives engagement</p>
            </div>
            <div style={{ padding: "2.5vh 2vw", borderRadius: "0.8vw" }} className="bg-surface">
              <p className="font-body font-semibold text-primary" style={{ fontSize: "1.5vw" }}>Network Effect Compounds</p>
              <p className="font-body text-text" style={{ fontSize: "1.3vw", marginTop: "0.8vh", opacity: 0.75 }}>Connectors, Closers, Operators earn across service, parts, insurance -- 8 commission categories</p>
            </div>
          </div>
        </div>
        <div className="flex" style={{ gap: "4vw", marginTop: "4vh" }}>
          <div style={{ textAlign: "center", flex: 1 }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "3vw" }}>8</p>
            <p className="font-body text-muted" style={{ fontSize: "1.2vw" }}>Commission Categories</p>
          </div>
          <div style={{ textAlign: "center", flex: 1 }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "3vw" }}>3-20%</p>
            <p className="font-body text-muted" style={{ fontSize: "1.2vw" }}>Referral Rates</p>
          </div>
          <div style={{ textAlign: "center", flex: 1 }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "3vw" }}>4</p>
            <p className="font-body text-muted" style={{ fontSize: "1.2vw" }}>Share Channels</p>
          </div>
          <div style={{ textAlign: "center", flex: 1 }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "3vw" }}>8</p>
            <p className="font-body text-muted" style={{ fontSize: "1.2vw" }}>Engagement Tiers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
