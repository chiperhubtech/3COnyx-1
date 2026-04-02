import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';

export function Scene9_Moat() {
  useEffect(() => {
    speak("The moat is deep. The platform is 100% built and deployable. All systems are forensically branded under Ronald Antonio Cadet. And by solving contracts in transit, ONYX adds value to the very banks providing the loan.");
    return () => window.speechSynthesis.cancel();
  }, []);

  const pillars = [
    "100% Built &\nDeployable",
    "Forensically\nBranded IP",
    "Solves Contracts\nin Transit"
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      style={{ padding: '0 8vw' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.1 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.h2
        className="font-display font-bold text-white uppercase tracking-wide"
        style={{ fontSize: '4vw', marginBottom: '8vh' }}
        initial={{ opacity: 0, y: '-3vh' }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, delay: 0.5 }}
      >
        The <span className="text-[#C9A227]">Moat</span>
      </motion.h2>

      <div className="flex w-full" style={{ gap: '3vw' }}>
        {pillars.map((pillar, i) => (
          <motion.div
            key={i}
            className="flex-1 flex flex-col items-center justify-center text-center bg-gradient-to-b from-[#C9A227]/10 to-transparent"
            style={{ padding: '4vh 2vw', borderTop: '3px solid #C9A227' }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.5 + (i * 0.4), type: "spring", bounce: 0.2 }}
          >
            <div
              className="rounded-full bg-[#0A0A0A] flex items-center justify-center font-display text-[#C9A227]"
              style={{ width: '3.5vw', height: '3.5vw', border: '1px solid rgba(201,162,39,0.3)', fontSize: '1.5vw', marginBottom: '2vh' }}
            >
              {i + 1}
            </div>
            <h3 className="text-white font-medium leading-snug whitespace-pre-line" style={{ fontSize: '1.5vw' }}>{pillar}</h3>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
