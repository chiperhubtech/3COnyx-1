import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';

export function Scene9_Moat() {
  useEffect(() => {
    speak("The moat is deep. The platform is 100% built and deployable. All systems are forensically branded under Ronald Antonio Cadet. And by solving contracts in transit, ONYX adds value to the very banks providing the loan.");
    return () => window.speechSynthesis.cancel();
  }, []);

  const pillars = [
    "100% Built & Deployable",
    "Forensically Branded IP",
    "Solves Contracts in Transit"
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 px-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.1 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.h2
        className="font-display text-6xl font-bold text-white mb-20 tracking-wide uppercase"
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, delay: 0.5 }}
      >
        The <span className="text-[#C9A227]">Moat</span>
      </motion.h2>

      <div className="flex gap-12 w-full max-w-6xl">
        {pillars.map((pillar, i) => (
          <motion.div
            key={i}
            className="flex-1 flex flex-col items-center justify-center text-center p-12 border-t-4 border-[#C9A227] bg-gradient-to-b from-[#C9A227]/10 to-transparent"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.5 + (i * 0.4), type: "spring", bounce: 0.2 }}
          >
            <div className="w-16 h-16 rounded-full bg-[#0A0A0A] border border-[#C9A227]/30 flex items-center justify-center text-2xl font-display text-[#C9A227] mb-8">
              {i + 1}
            </div>
            <h3 className="text-2xl text-white font-medium leading-snug">{pillar}</h3>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
