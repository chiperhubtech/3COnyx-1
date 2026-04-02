import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';

export function Scene2_CoreMandate() {
  useEffect(() => {
    speak("Our core mandate: zero cognitive load and total trust. Every transaction resolved in under 2 minutes.");
    return () => window.speechSynthesis.cancel();
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      style={{ padding: '0 8vw' }}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 1.1, filter: 'blur(5px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.h2
        className="font-display font-bold text-gradient-gold text-center leading-tight"
        style={{ fontSize: '4.5vw', marginBottom: '4vh' }}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.5, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        Zero Cognitive Load. <br />
        <span className="text-white">Total Trust.</span>
      </motion.h2>

      <motion.div
        className="text-[#E8B830] font-light tracking-wide bg-[#0A0A0A]/50 backdrop-blur-sm"
        style={{ fontSize: '1.8vw', padding: '1.5vh 3vw', border: '1px solid rgba(201,162,39,0.3)', borderRadius: '5vw' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1.5 }}
      >
        Time to resolution: <strong className="font-semibold text-white">under 2 minutes</strong>
      </motion.div>
    </motion.div>
  );
}
