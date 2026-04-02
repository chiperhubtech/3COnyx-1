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
      <div className="relative" style={{ padding: "5vh 6vw", zIndex: 1 }}>
        <p className="font-body font-semibold tracking-widest text-primary" style={{ fontSize: "1.2vw", letterSpacing: "0.3em" }}>THE STREET ECONOMY</p>
        <p className="font-display font-black tracking-tight text-text" style={{ fontSize: "3.2vw", lineHeight: 1.1, marginTop: "1vh" }}>
          Global Automotive Money Network
        </p>
        <div style={{ display: "flex", gap: "3.5vw", marginTop: "4vh", alignItems: "flex-start" }}>
          <div style={{ flex: "0 0 28vw", textAlign: "center" }}>
            <p className="font-display font-black text-primary" style={{ fontSize: "8vw", lineHeight: 1 }}>K&gt;1</p>
            <p className="font-body font-semibold text-text" style={{ fontSize: "1.6vw", marginTop: "1vh" }}>Viral Coefficient</p>
            <p className="font-body text-muted" style={{ fontSize: "1.2vw", marginTop: "1vh" }}>Every QR code placed in the wild creates a permanent, self-compounding distribution channel.</p>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ padding: "2vh 2vw", borderRadius: "0.8vw", marginBottom: "1.5vh" }} className="bg-surface">
              <p className="font-body font-semibold text-primary" style={{ fontSize: "1.4vw" }}>Gas Station Clerk Places QR</p>
              <p className="font-body text-text" style={{ fontSize: "1.2vw", marginTop: "0.6vh", opacity: 0.75 }}>10-second setup. QR on pump, counter, or window. Every scan = permanent attribution chain.</p>
            </div>
            <div style={{ padding: "2vh 2vw", borderRadius: "0.8vw", marginBottom: "1.5vh" }} className="bg-surface">
              <p className="font-body font-semibold text-primary" style={{ fontSize: "1.4vw" }}>Driver Scans → ONYX Dispatches</p>
              <p className="font-body text-text" style={{ fontSize: "1.2vw", marginTop: "0.6vh", opacity: 0.75 }}>Flat tire, oil change, inspection — service routed instantly. Vehicle history stamped. Proof chained.</p>
            </div>
            <div style={{ padding: "2vh 2vw", borderRadius: "0.8vw", marginBottom: "1.5vh" }} className="bg-surface">
              <p className="font-body font-semibold text-primary" style={{ fontSize: "1.4vw" }}>Clerk Paid Instantly</p>
              <p className="font-body text-text" style={{ fontSize: "1.2vw", marginTop: "0.6vh", opacity: 0.75 }}>3-20% commission via Stripe Connect. Multi-level: upstream referrer earns 20% of primary rate.</p>
            </div>
            <div style={{ padding: "2vh 2vw", borderRadius: "0.8vw" }} className="bg-surface">
              <p className="font-body font-semibold text-primary" style={{ fontSize: "1.4vw" }}>Network Compounds Itself</p>
              <p className="font-body text-text" style={{ fontSize: "1.2vw", marginTop: "0.6vh", opacity: 0.75 }}>Connector → Closer → Operator → Enterprise. 8 commission categories across the full lifecycle.</p>
            </div>
          </div>
        </div>
        <div className="flex" style={{ gap: "3vw", marginTop: "3vh" }}>
          <div style={{ textAlign: "center", flex: 1 }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "2.5vw" }}>8</p>
            <p className="font-body text-muted" style={{ fontSize: "1.1vw" }}>Commission Categories</p>
          </div>
          <div style={{ textAlign: "center", flex: 1 }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "2.5vw" }}>3-20%</p>
            <p className="font-body text-muted" style={{ fontSize: "1.1vw" }}>Referral Rates</p>
          </div>
          <div style={{ textAlign: "center", flex: 1 }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "2.5vw" }}>4</p>
            <p className="font-body text-muted" style={{ fontSize: "1.1vw" }}>Identity Tiers</p>
          </div>
          <div style={{ textAlign: "center", flex: 1 }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "2.5vw" }}>10s</p>
            <p className="font-body text-muted" style={{ fontSize: "1.1vw" }}>Value Delivery</p>
          </div>
          <div style={{ textAlign: "center", flex: 1 }}>
            <p className="font-display font-bold text-primary" style={{ fontSize: "2.5vw" }}>2</p>
            <p className="font-body text-muted" style={{ fontSize: "1.1vw" }}>Attribution Levels</p>
          </div>
        </div>
      </div>
    </div>
  );
}
