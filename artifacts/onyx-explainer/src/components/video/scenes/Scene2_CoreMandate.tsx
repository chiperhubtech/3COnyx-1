import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak, stopAudio } from '@/lib/voiceover';

export function Scene2_CoreMandate() {
  useEffect(() => {
    speak("While others write pitch decks, we built the protocol. Live today: over twenty operational systems. Seven autonomous AI agents. SHA-256 proof engine. Sovereign wallet. Split payments. Global remittance across twenty-eight currencies. Bank payoff integration. Location node network. Twenty culture-driven themes. Ask ONYX natural language processing. Developer platform. Federation protocol. Settlement layer. Data intelligence. IoT gateway. All operational. Right now.", "scene2");
    return () => stopAudio("scene2");
  }, []);

  const systems = [
    { label: "7-Agent Mesh", status: "LIVE" },
    { label: "Proof Engine", status: "LIVE" },
    { label: "Street Network", status: "LIVE" },
    { label: "Sovereign Wallet", status: "LIVE" },
    { label: "VIN Passport", status: "LIVE" },
    { label: "Anti-Abuse Engine", status: "LIVE" },
    { label: "ONYX Wallet", status: "LIVE" },
    { label: "Split Payments", status: "LIVE" },
    { label: "Ask ONYX NLP", status: "LIVE" },
    { label: "Bank Payoff", status: "LIVE" },
    { label: "Location Nodes", status: "LIVE" },
    { label: "Global Remittance", status: "LIVE" },
    { label: "Theme Engine", status: "LIVE" },
    { label: "Developer Platform", status: "LIVE" },
    { label: "Federation Protocol", status: "LIVE" },
    { label: "Settlement Layer", status: "LIVE" },
    { label: "Invite Network", status: "LIVE" },
    { label: "Social Proof", status: "LIVE" },
    { label: "IoT Gateway", status: "LIVE" },
    { label: "Data Intelligence", status: "LIVE" },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      style={{ padding: '0 4vw' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(5px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.p
        className="font-body text-[#C9A227] uppercase tracking-widest font-semibold"
        style={{ fontSize: '1.2vw', letterSpacing: '0.3em', marginBottom: '0.8vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        WHAT WE BUILT
      </motion.p>

      <motion.h2
        className="font-display font-bold text-white text-center leading-tight"
        style={{ fontSize: '3vw', marginBottom: '0.8vh' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        Not a Pitch. <span className="text-gradient-gold">A Protocol.</span>
      </motion.h2>

      <motion.p
        className="font-body text-[#8B8680] text-center"
        style={{ fontSize: '1.1vw', marginBottom: '2.5vh', maxWidth: '50vw' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        Every system below is built, tested, and operational today.
      </motion.p>

      <div className="grid grid-cols-5 w-full" style={{ gap: '0.7vw' }}>
        {systems.map((sys, i) => (
          <motion.div
            key={sys.label}
            className="flex flex-col items-center text-center bg-[#0A0A0A]/80"
            style={{ padding: '1.2vh 0.5vw', border: '1px solid rgba(201,162,39,0.2)', borderRadius: '0.4vw' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 1.2 + (i * 0.08) }}
          >
            <div className="rounded-full bg-[#10B981]/20 flex items-center justify-center text-[#10B981] font-bold" style={{ width: '1.6vw', height: '1.6vw', fontSize: '0.55vw', marginBottom: '0.5vh' }}>
              {sys.status}
            </div>
            <span className="text-white font-semibold" style={{ fontSize: '0.7vw' }}>{sys.label}</span>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="text-[#C9A227] font-bold tracking-wide text-center"
        style={{ fontSize: '1.2vw', marginTop: '2vh', padding: '1vh 3vw', background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.3)', borderRadius: '0.5vw' }}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, delay: 3.5, type: "spring" }}
      >
        20+ Systems Live — Capital is for scaling and market capture.
      </motion.div>
    </motion.div>
  );
}
