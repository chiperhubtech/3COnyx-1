function OnyxLogo({ size }: { size: number }) {
  const gold = "#C9A227";
  const gold2 = "#E8B830";
  const white = "#FFFFFF";
  const RAD = Math.PI / 180;
  const cx = 50, cy = 50, r = 31;
  const top = { x: cx, y: cy - r };
  const bot = { x: cx, y: cy + r };
  const botL = { x: cx + r * Math.cos(210 * RAD), y: cy + r * Math.sin(210 * RAD) };
  const botR = { x: cx + r * Math.cos(330 * RAD), y: cy + r * Math.sin(330 * RAD) };
  const sw = 2.8;

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={gold} stopOpacity="0.2" />
          <stop offset="100%" stopColor={gold} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={gold2} stopOpacity="0.9" />
          <stop offset="50%" stopColor={gold} stopOpacity="0.6" />
          <stop offset="100%" stopColor={gold2} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={48} fill="url(#cglow)" />
      <circle cx={cx} cy={cy} r={46} fill="none" stroke={gold} strokeWidth="0.6" strokeOpacity="0.35" />
      <circle cx={cx} cy={cy} r={43.5} fill="none" stroke={gold} strokeWidth="0.3" strokeOpacity="0.18" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#cringGrad)" strokeWidth={sw} strokeLinecap="round" />
      <line x1={top.x} y1={top.y} x2={bot.x} y2={bot.y} stroke={gold} strokeWidth={sw} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={botL.x} y2={botL.y} stroke={gold} strokeWidth={sw} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={botR.x} y2={botR.y} stroke={gold} strokeWidth={sw} strokeLinecap="round" />
      <text x="37" y="50" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="16" fill={white} textAnchor="start">3</text>
      <text x="50" y="56" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="20" fill={white} textAnchor="middle">C</text>
    </svg>
  );
}

export default function CloseSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(201,162,39,0.08) 0%, transparent 60%)" }} />
      <div className="relative" style={{ zIndex: 1, textAlign: "center" }}>
        <OnyxLogo size={140} />
        <p className="font-display font-black tracking-tighter text-text" style={{ fontSize: "5vw", lineHeight: 1.05, marginTop: "3vh" }}>3C ONYX</p>
        <p className="font-body font-semibold tracking-widest text-primary" style={{ fontSize: "1.4vw", letterSpacing: "0.35em", marginTop: "1.5vh" }}>SOVEREIGN AUTOMOTIVE ECOSYSTEM OS</p>
        <div style={{ width: "6vw", height: "0.3vh", margin: "3vh auto" }} className="bg-primary" />
        <p className="font-body text-text" style={{ fontSize: "1.8vw", opacity: 0.85, maxWidth: "40vw", margin: "0 auto" }}>
          "The entire automotive economy reduced to a single, hyper-secure tap."
        </p>
        <div style={{ marginTop: "5vh", display: "flex", gap: "4vw", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <p className="font-body font-semibold text-primary" style={{ fontSize: "1.4vw" }}>Ronald Antonio Cadet</p>
            <p className="font-body text-muted" style={{ fontSize: "1.1vw", marginTop: "0.5vh" }}>CVO / Founder</p>
          </div>
          <div style={{ width: "1px", height: "5vh" }} className="bg-primary opacity-30" />
          <div style={{ textAlign: "center" }}>
            <p className="font-body font-semibold text-text" style={{ fontSize: "1.4vw" }}>ron@cuxtomcandyclub.com</p>
            <p className="font-body text-muted" style={{ fontSize: "1.1vw", marginTop: "0.5vh" }}>CUXTOMCANDYCLUB LLC</p>
          </div>
        </div>
      </div>
      <div className="absolute" style={{ bottom: "4vh", left: "6vw", right: "6vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="font-body text-muted" style={{ fontSize: "1vw", opacity: 0.5 }}>Confidential -- For Authorized Review Only</p>
        <p className="font-body text-muted" style={{ fontSize: "1vw", opacity: 0.5 }}>3C ONYX -- CUXTOMCANDYCLUB LLC -- 2026</p>
      </div>
    </div>
  );
}
