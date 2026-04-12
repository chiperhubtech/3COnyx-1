function OnyxLogo({ size }: { size: number }) {
  const gold = "#C9A227";
  const gold2 = "#E8B830";
  const white = "#FFFFFF";
  const cx = 50, cy = 42, r = 28, sw = 3.2;
  const forkAngle = Math.PI / 4;
  const top = { x: cx, y: cy - r };
  const bot = { x: cx, y: cy + r };
  const upL = { x: cx - r * Math.sin(forkAngle), y: cy - r * Math.cos(forkAngle) };
  const upR = { x: cx + r * Math.sin(forkAngle), y: cy - r * Math.cos(forkAngle) };

  return (
    <svg width={size} height={size} viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <radialGradient id="cglow" cx="50%" cy="40%" r="50%">
          <stop offset="0%" stopColor={gold} stopOpacity="0.2" />
          <stop offset="100%" stopColor={gold} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cgoldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gold2} />
          <stop offset="100%" stopColor={gold} />
        </linearGradient>
        <linearGradient id="cringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={gold2} stopOpacity="1" />
          <stop offset="50%" stopColor={gold} stopOpacity="0.8" />
          <stop offset="100%" stopColor={gold2} stopOpacity="1" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={42} fill="url(#cglow)" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#cringGrad)" strokeWidth={sw} strokeLinecap="round" />
      <line x1={top.x} y1={top.y} x2={bot.x} y2={bot.y} stroke={gold2} strokeWidth={sw} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={upL.x} y2={upL.y} stroke={gold2} strokeWidth={sw} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={upR.x} y2={upR.y} stroke={gold2} strokeWidth={sw} strokeLinecap="round" />
      <text x="35" y="88" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="16" fill="url(#cgoldGrad)" textAnchor="middle" dominantBaseline="middle">3</text>
      <text x="65" y="88" fontFamily="Inter, sans-serif" fontWeight="900" fontSize="16" fill={white} textAnchor="middle" dominantBaseline="middle">C</text>
    </svg>
  );
}

export default function CloseSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg" style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(201,162,39,0.08) 0%, transparent 60%)" }} />
      <div className="relative" style={{ zIndex: 1, textAlign: "center" }}>
        <OnyxLogo size={130} />
        <p className="font-display font-black tracking-tighter text-text" style={{ fontSize: "4.5vw", lineHeight: 1.05, marginTop: "2.5vh" }}>3C ONYX</p>
        <p className="font-body font-semibold tracking-widest text-primary" style={{ fontSize: "1.2vw", letterSpacing: "0.3em", marginTop: "1vh" }}>GLOBAL AUTOMOTIVE LIQUIDITY NETWORK</p>
        <div style={{ width: "6vw", height: "0.3vh", margin: "2vh auto" }} className="bg-primary" />
        <p className="font-body text-text" style={{ fontSize: "1.5vw", opacity: 0.85, maxWidth: "50vw", margin: "0 auto" }}>
          "The money network for the entire automotive industry. A broker closes a deal. A mechanic services the vehicle. A random clerk referred the user. Everyone gets paid automatically."
        </p>
        <p className="font-display font-semibold text-text" style={{ fontSize: "1.8vw", marginTop: "2vh", fontStyle: "italic" }}>
          "<span className="text-primary">Xtraordinary</span> for the ordinary. Lightning doesn't wait. Neither do we. <span className="text-primary">Join us.</span>"
        </p>
        <p className="font-body text-primary" style={{ fontSize: "1.1vw", marginTop: "1.5vh", letterSpacing: "0.15em" }}>
          Designed, built, and owned exclusively by RAC3C.
        </p>

        <div style={{ marginTop: "2.5vh", display: "flex", gap: "3vw", justifyContent: "center", alignItems: "center" }}>
          <div style={{ textAlign: "center" }}>
            <p className="font-body text-muted" style={{ fontSize: "0.9vw", letterSpacing: "0.15em" }}>TODAY</p>
            <p className="font-body font-semibold text-text" style={{ fontSize: "1.1vw" }}>20+ Systems Live</p>
          </div>
          <p className="font-body text-primary" style={{ fontSize: "1.5vw" }}>→</p>
          <div style={{ textAlign: "center" }}>
            <p className="font-body text-muted" style={{ fontSize: "0.9vw", letterSpacing: "0.15em" }}>NEXT</p>
            <p className="font-body font-semibold text-text" style={{ fontSize: "1.1vw" }}>AR Inspection + Robotics</p>
          </div>
          <p className="font-body text-primary" style={{ fontSize: "1.5vw" }}>→</p>
          <div style={{ textAlign: "center" }}>
            <p className="font-body text-muted" style={{ fontSize: "0.9vw", letterSpacing: "0.15em" }}>ENDGAME</p>
            <p className="font-body font-semibold text-text" style={{ fontSize: "1.1vw" }}>Full Autonomous Protocol</p>
          </div>
        </div>

        <div style={{ marginTop: "3vh", display: "flex", gap: "4vw", justifyContent: "center" }}>
          <div style={{ textAlign: "center" }}>
            <p className="font-body font-semibold text-primary" style={{ fontSize: "1.4vw" }}>RAC3C</p>
            <p className="font-body text-muted" style={{ fontSize: "1vw", marginTop: "0.5vh" }}>CVO / Founder — Sole Architect</p>
          </div>
          <div style={{ width: "1px", height: "5vh" }} className="bg-primary opacity-30" />
          <div style={{ textAlign: "center" }}>
            <p className="font-body font-semibold text-text" style={{ fontSize: "1.4vw" }}>ron@cuxtomcandyclub.com</p>
            <p className="font-body text-muted" style={{ fontSize: "1vw", marginTop: "0.5vh" }}>CUXTOMCANDYCLUB LLC</p>
          </div>
        </div>
      </div>
      <div className="absolute" style={{ bottom: "3vh", left: "6vw", right: "6vw", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p className="font-body text-muted" style={{ fontSize: "0.9vw", opacity: 0.5 }}>Confidential — For Authorized Review Only</p>
        <p className="font-body text-muted" style={{ fontSize: "0.9vw", opacity: 0.5 }}>All IP exclusively owned by RAC3C — CUXTOMCANDYCLUB LLC — 2026</p>
      </div>
    </div>
  );
}
