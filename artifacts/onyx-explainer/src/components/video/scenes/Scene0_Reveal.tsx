import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';
import { OnyxLogo } from '../OnyxLogo';

export function Scene0_Reveal() {
  useEffect(() => {
    speak("3C ONYX. The Sovereign Automotive Ecosystem OS. Built by CUXTOMCANDYCLUB LLC.");
    return () => window.speechSynthesis.cancel();
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0, filter: 'blur(10px)' }}
        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: '4vh' }}
      >
        <OnyxLogo className="drop-shadow-[0_0_30px_rgba(201,162,39,0.3)]" style={{ width: '12vw', height: '12vw' }} />
      </motion.div>

      <div className="text-center">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[#F5F0E1] font-semibold tracking-wide leading-none"
          style={{ fontSize: '5vw', marginBottom: '2vh' }}
        >
          3C ONYX
        </motion.h1>

        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2, delay: 2.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-body text-[#C9A227] uppercase"
          style={{ fontSize: '1.8vw', letterSpacing: '0.2em', marginBottom: '4vh' }}
        >
          Sovereign Automotive Ecosystem OS
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 3.5, ease: 'easeInOut' }}
          className="font-body text-[#8B8680] uppercase tracking-widest"
          style={{ fontSize: '1vw' }}
        >
          By CUXTOMCANDYCLUB LLC
        </motion.div>
      </div>
    </motion.div>
  );
}
