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
      <div className="relative flex items-center justify-center" style={{ width: '15vw', height: '15vw', marginBottom: '5vh' }}>
        <motion.div
          className="absolute rounded-full"
          style={{ width: '100%', height: '100%', border: '2px solid rgba(201,162,39,0.2)' }}
          animate={{ scale: [1, 2], opacity: [1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{ width: '100%', height: '100%', border: '2px solid rgba(201,162,39,0.4)' }}
          animate={{ scale: [1, 1.5], opacity: [1, 0] }}
          transition={{ duration: 2, delay: 0.5, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="rounded-full bg-gradient-to-tr from-[#C9A227] to-[#E8B830] shadow-[0_0_50px_rgba(201,162,39,0.5)] z-10"
          style={{ width: '8vw', height: '8vw' }}
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1.5, type: "spring", bounce: 0.4 }}
        />
      </div>

      <motion.h2
        className="font-display font-bold text-white text-center leading-tight"
        style={{ fontSize: '3.5vw', maxWidth: '70vw' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1 }}
      >
        The Entire Automotive Industry <br />
        <span className="text-gradient-gold">— Reduced to One Tap</span>
      </motion.h2>

      <motion.div
        className="flex items-center text-[#8B8680] uppercase font-semibold"
        style={{ gap: '2vw', marginTop: '4vh', fontSize: '1.3vw', letterSpacing: '0.15em' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2 }}
      >
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2 }}>ONYX ACTS</motion.span>
        <span className="text-[#C9A227]">•</span>
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.5 }}>MEMBER CONFIRMS</motion.span>
        <span className="text-[#C9A227]">•</span>
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }} className="text-white">DONE</motion.span>
      </motion.div>
    </motion.div>
  );
}
