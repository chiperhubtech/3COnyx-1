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
      className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center"
      style={{ padding: '0 8vw' }}
      initial={{ opacity: 0, scale: 1.2 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(5px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="relative"
        style={{ width: '10vw', height: '10vw', marginBottom: '4vh' }}
        initial={{ rotate: -180, opacity: 0 }}
        animate={{ rotate: 0, opacity: 1 }}
        transition={{ duration: 2, delay: 0.5, ease: "easeOut" }}
      >
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
              <stop offset="100%" stopColor="#E8B830" />
            </linearGradient>
          </defs>
        </svg>
      </motion.div>

      <motion.h2
        className="font-display font-bold text-white"
        style={{ fontSize: '3.2vw', marginBottom: '2vh' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.5 }}
      >
        Every Member Becomes a <br />
        <span className="text-gradient-gold">Growth Engine</span>
      </motion.h2>

      <motion.div
        className="flex items-center text-[#8B8680] font-light"
        style={{ gap: '1.5vw', marginTop: '3vh', fontSize: '1.4vw' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2.5 }}
      >
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}>Help a friend</motion.span>
        <span className="text-[#C9A227]" style={{ fontSize: '1.8vw' }}>→</span>
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }}>Earn commission</motion.span>
        <span className="text-[#C9A227]" style={{ fontSize: '1.8vw' }}>→</span>
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5 }} className="text-white font-medium">Network compounds</motion.span>
      </motion.div>
    </motion.div>
  );
}
