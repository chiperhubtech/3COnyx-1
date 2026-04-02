import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';

export function Scene2_CoreMandate() {
  useEffect(() => {
    speak("While others write pitch decks, we built the platform. Live today: 7 autonomous AI agents. A SHA-256 proof engine. Street-level QR distribution. Stripe Connect payments. VIN digital passports. Anti-abuse detection. Identity role progression. Real-time leaderboards. All operational. Right now.");
    return () => window.speechSynthesis.cancel();
  }, []);

  const systems = [
    { label: "7-Agent Mesh", status: "LIVE" },
    { label: "Proof Engine", status: "LIVE" },
    { label: "Street Network", status: "LIVE" },
    { label: "Sovereign Wallet", status: "LIVE" },
    { label: "VIN Passport", status: "LIVE" },
    { label: "Anti-Abuse Engine", status: "LIVE" },
    { label: "Attribution Chain", status: "LIVE" },
    { label: "Identity Roles", status: "LIVE" },
    { label: "Leaderboard", status: "LIVE" },
    { label: "SDV Intelligence", status: "LIVE" },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      style={{ padding: '0 6vw' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(5px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.p
        className="font-body text-[#C9A227] uppercase tracking-widest font-semibold"
        style={{ fontSize: '1.2vw', letterSpacing: '0.3em', marginBottom: '1vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        WHAT WE BUILT
      </motion.p>

      <motion.h2
        className="font-display font-bold text-white text-center leading-tight"
        style={{ fontSize: '3.5vw', marginBottom: '1vh' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        Not a Pitch. <span className="text-gradient-gold">A Platform.</span>
      </motion.h2>

      <motion.p
        className="font-body text-[#8B8680] text-center"
        style={{ fontSize: '1.3vw', marginBottom: '4vh', maxWidth: '50vw' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        Every system below is built, tested, and operational today.
      </motion.p>

      <div className="grid grid-cols-5 w-full" style={{ gap: '1vw' }}>
        {systems.map((sys, i) => (
          <motion.div
            key={sys.label}
            className="flex flex-col items-center text-center bg-[#0A0A0A]/80"
            style={{ padding: '2vh 1vw', border: '1px solid rgba(201,162,39,0.2)', borderRadius: '0.5vw' }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.5 + (i * 0.15) }}
          >
            <div className="rounded-full bg-[#10B981]/20 flex items-center justify-center text-[#10B981] font-bold" style={{ width: '2vw', height: '2vw', fontSize: '0.8vw', marginBottom: '0.8vh' }}>
              {sys.status}
            </div>
            <span className="text-white font-semibold" style={{ fontSize: '0.85vw' }}>{sys.label}</span>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="text-[#C9A227] font-bold tracking-wide text-center"
        style={{ fontSize: '1.4vw', marginTop: '3vh', padding: '1.5vh 3vw', background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.3)', borderRadius: '0.5vw' }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 3.5, type: "spring" }}
      >
        Capital is for scaling and market capture — not R&D.
      </motion.div>
    </motion.div>
  );
}
