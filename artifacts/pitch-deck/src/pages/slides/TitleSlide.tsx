const base = import.meta.env.BASE_URL;

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
        <radialGradient id="tglow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={gold} stopOpacity="0.2" />
          <stop offset="100%" stopColor={gold} stopOpacity="0" />
        </radialGradient>
        <linearGradient id="tgoldGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={gold2} />
          <stop offset="100%" stopColor={gold} />
        </linearGradient>
        <linearGradient id="tringGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={gold2} stopOpacity="0.9" />
          <stop offset="50%" stopColor={gold} stopOpacity="0.6" />
          <stop offset="100%" stopColor={gold2} stopOpacity="0.9" />
        </linearGradient>
      </defs>
      <circle cx={cx} cy={cy} r={48} fill="url(#tglow)" />
      <circle cx={cx} cy={cy} r={46} fill="none" stroke={gold} strokeWidth="0.6" strokeOpacity="0.35" />
      <circle cx={cx} cy={cy} r={43.5} fill="none" stroke={gold} strokeWidth="0.3" strokeOpacity="0.18" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#tringGrad)" strokeWidth={sw} strokeLinecap="round" />
      <line x1={top.x} y1={top.y} x2={bot.x} y2={bot.y} stroke={gold} strokeWidth={sw} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={botL.x} y2={botL.y} stroke={gold} strokeWidth={sw} strokeLinecap="round" />
      <line x1={cx} y1={cy} x2={botR.x} y2={botR.y} stroke={gold} strokeWidth={sw} strokeLinecap="round" />
      <text x="37" y="50" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="16" fill={white} textAnchor="start">3</text>
      <text x="50" y="56" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="20" fill={white} textAnchor="middle">C</text>
    </svg>
  );
}

export default function TitleSlide() {
  return (
    <div className="relative w-screen h-screen overflow-hidden bg-bg">
      <img
        src={`${base}hero-car.png`}
        crossOrigin="anonymous"
        alt="Luxury automotive"
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      />
      <div className="absolute inset-0" style={{ background: "linear-gradient(135deg, rgba(10,10,10,0.92) 0%, rgba(10,10,10,0.6) 50%, rgba(10,10,10,0.85) 100%)" }} />
      <div className="absolute" style={{ left: "6vw", top: "6vh" }}>
        <div className="flex items-center" style={{ gap: "1.5vw" }}>
          <OnyxLogo size={80} />
          <div>
            <p className="font-display font-black tracking-tight text-primary" style={{ fontSize: "2.4vw", lineHeight: 1 }}>3C ONYX</p>
            <p className="font-body text-muted" style={{ fontSize: "1vw", letterSpacing: "0.25em", marginTop: "0.3vh" }}>CUXTOMCANDYCLUB LLC</p>
          </div>
        </div>
      </div>
      <div className="absolute" style={{ left: "6vw", bottom: "18vh", maxWidth: "60vw" }}>
        <p className="font-display font-black tracking-tighter text-text" style={{ fontSize: "5.5vw", lineHeight: 1.05 }}>
          Sovereign Automotive
        </p>
        <p className="font-display font-black tracking-tighter text-primary" style={{ fontSize: "5.5vw", lineHeight: 1.05 }}>
          Ecosystem OS
        </p>
        <div style={{ width: "8vw", height: "0.4vh", marginTop: "3vh" }} className="bg-primary" />
        <p className="font-body font-light text-text" style={{ fontSize: "1.8vw", marginTop: "2.5vh", opacity: 0.85 }}>
          The entire automotive industry reduced to one confirmation tap.
        </p>
      </div>
      <div className="absolute" style={{ right: "6vw", bottom: "6vh" }}>
        <p className="font-body text-muted" style={{ fontSize: "1.2vw" }}>Ronald Antonio Cadet, CVO / Founder</p>
        <p className="font-body text-muted" style={{ fontSize: "1vw", marginTop: "0.5vh", opacity: 0.6 }}>ron@cuxtomcandyclub.com</p>
      </div>
    </div>
  );
}
