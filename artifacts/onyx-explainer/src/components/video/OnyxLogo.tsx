import { motion } from 'framer-motion';

export function OnyxLogo({ className = "w-32 h-32", style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={style}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full text-[var(--color-primary)]">
        {/* Outer Circle */}
        <circle cx="50" cy="50" r="46" stroke="currentColor" strokeWidth="3" fill="none" />
        
        {/* Peace Symbol Lines */}
        <line x1="50" y1="4" x2="50" y2="96" stroke="currentColor" strokeWidth="3" />
        <line x1="50" y1="50" x2="18" y2="84" stroke="currentColor" strokeWidth="3" />
        <line x1="50" y1="50" x2="82" y2="84" stroke="currentColor" strokeWidth="3" />
        
        {/* 3C Text embedded */}
        <text 
          x="30" 
          y="48" 
          fontFamily="Inter, sans-serif" 
          fontWeight="600" 
          fontSize="24" 
          fill="currentColor"
          textAnchor="middle"
          dominantBaseline="central"
        >
          3
        </text>
        <text 
          x="70" 
          y="48" 
          fontFamily="Inter, sans-serif" 
          fontWeight="600" 
          fontSize="24" 
          fill="currentColor"
          textAnchor="middle"
          dominantBaseline="central"
        >
          C
        </text>
      </svg>
    </div>
  );
}