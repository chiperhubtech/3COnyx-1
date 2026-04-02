import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';

export function Scene8_ViralEngine() {
  useEffect(() => {
    speak("Every completed transaction triggers the viral loop. You helped someone? Help someone else. Every member becomes a growth engine. The network compounds itself.");
    return () => window.speechSynthesis.cancel();
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 px-24 text-center"
      initial={{ opacity: 0, scale: 1.2 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -50, filter: 'blur(5px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="mb-12 relative w-48 h-48"
        initial={{ rotate: -180, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
      >
        {/* Abstract Loop */}
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
          <motion.path
            d="M50 10 a 40 40 0 1 1 -1 0"
            fill="none"
            stroke="url(#grad)"
            strokeWidth="4"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 2, delay: 1, ease: "easeInOut" }}
          />
          <defs>
            <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C9A227" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      <motion.h2
        className="font-display text-5xl font-bold text-white mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.5 }}
      >
        Every Member Becomes a <br/>
        <span className="text-gradient-gold">Growth Engine</span>
      </motion.h2>

      <motion.div
        className="text-2xl text-[#8B8680] font-light flex items-center gap-4 mt-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2.5, staggerChildren: 0.5 }}
      >
        <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>Help a friend</motion.span>
        <span className="text-[#C9A227]">→</span>
        <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>Earn commission</motion.span>
        <span className="text-[#C9A227]">→</span>
        <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="text-white font-medium">Network compounds</motion.span>
      </motion.div>
    </motion.div>
  );
}
