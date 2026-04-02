export function OnyxLogo({ className = "w-32 h-32", style }: { className?: string; style?: React.CSSProperties }) {
  const gold = "#C9A227";
  const gold2 = "#E8B830";
  const cx = 50, cy = 50, r = 31;
  const sw = 2.8;

  return (
    <div className={`relative flex items-center justify-center ${className}`} style={style}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        <defs>
          <radialGradient id="eglow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={gold} stopOpacity="0.2" />
            <stop offset="100%" stopColor={gold} stopOpacity="0" />
          </radialGradient>
          <linearGradient id="eringGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={gold2} stopOpacity="0.9" />
            <stop offset="50%" stopColor={gold} stopOpacity="0.6" />
            <stop offset="100%" stopColor={gold2} stopOpacity="0.9" />
          </linearGradient>
        </defs>
        <circle cx={cx} cy={cy} r={48} fill="url(#eglow)" />
        <circle cx={cx} cy={cy} r={46} fill="none" stroke={gold} strokeWidth="0.6" strokeOpacity="0.35" />
        <circle cx={cx} cy={cy} r={43.5} fill="none" stroke={gold} strokeWidth="0.3" strokeOpacity="0.18" />
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="url(#eringGrad)" strokeWidth={sw} strokeLinecap="round" />
        <line x1={cx} y1={cy - r} x2={cx} y2={cy + r} stroke={gold} strokeWidth={sw} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={23} y2={34.5} stroke={gold} strokeWidth={sw} strokeLinecap="round" />
        <line x1={cx} y1={cy} x2={77} y2={34.5} stroke={gold} strokeWidth={sw} strokeLinecap="round" />
        <text x="37" y="50" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="16" fill="#FFFFFF" textAnchor="start">3</text>
        <text x="50" y="56" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="20" fill="#FFFFFF" textAnchor="middle">C</text>
      </svg>
    </div>
  );
}