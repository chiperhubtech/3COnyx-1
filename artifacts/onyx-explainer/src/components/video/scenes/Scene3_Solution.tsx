import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';

export function Scene3_Solution() {
  useEffect(() => {
    speak("The entire automotive industry, reduced to one tap. ONYX acts. Member confirms. Done. Everything is handled.");
    return () => window.speechSynthesis.cancel();
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -50, filter: 'blur(10px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* Abstract one-tap visualization */}
      <div className="relative w-64 h-64 mb-16 flex items-center justify-center">
        <motion.div
          className="absolute w-full h-full rounded-full border-2 border-[#C9A227]/20"
          animate={{ scale: [1, 2], opacity: [1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute w-full h-full rounded-full border-2 border-[#C9A227]/40"
          animate={{ scale: [1, 1.5], opacity: [1, 0] }}
          transition={{ duration: 2, delay: 0.5, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="w-32 h-32 rounded-full bg-gradient-to-tr from-[#C9A227] to-[#E8B830] shadow-[0_0_50px_rgba(201,162,39,0.5)] z-10"
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1.5, type: "spring", bounce: 0.4 }}
        />
      </div>

      <motion.h2
        className="font-display text-5xl md:text-6xl font-bold text-white text-center max-w-4xl leading-tight"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1 }}
      >
        The Entire Automotive Industry <br />
        <span className="text-gradient-gold">— Reduced to One Tap</span>
      </motion.h2>

      <motion.div
        className="flex gap-8 mt-12 text-xl tracking-widest text-[#8B8680] uppercase font-semibold"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2, staggerChildren: 0.5 }}
      >
        <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>ONYX ACTS</motion.span>
        <span className="text-[#C9A227]">•</span>
        <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 2.5 }}>MEMBER CONFIRMS</motion.span>
        <span className="text-[#C9A227]">•</span>
        <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 3 }} className="text-white">DONE</motion.span>
      </motion.div>
    </motion.div>
  );
}
