import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';
import { OnyxLogo } from '../OnyxLogo';

export function Scene10_Close() {
  useEffect(() => {
    speak("This is the money network for the automotive industry. Not a car app — a Protocol for Automotive Value Exchange. Designed, built, and owned exclusively by Ronald Antonio Cadet. CUXTOMCANDYCLUB LLC. 3C ONYX is now the standard.");
    return () => window.speechSynthesis.cancel();
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center"
      style={{ padding: '0 8vw' }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2, ease: "easeOut" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, delay: 0.5 }}
        style={{ marginBottom: '3vh' }}
      >
        <OnyxLogo className="text-[#C9A227]" style={{ width: '8vw', height: '8vw' }} />
      </motion.div>

      <motion.h2
        className="font-display font-bold text-white leading-tight"
        style={{ fontSize: '2.5vw', marginBottom: '1.5vh', maxWidth: '60vw' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, delay: 1.5 }}
      >
        The Money Network for the Automotive Industry.
      </motion.h2>

      <motion.p
        className="text-[#C9A227] font-body uppercase tracking-widest"
        style={{ fontSize: '1.2vw', letterSpacing: '0.25em', marginBottom: '4vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 2.5 }}
      >
        3C ONYX is now the standard.
      </motion.p>

      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 3.5 }}
      >
        <div className="text-[#C9A227] font-medium tracking-wide" style={{ fontSize: '1.4vw', marginBottom: '0.5vh' }}>Ronald Antonio Cadet</div>
        <div className="text-[#8B8680] uppercase tracking-widest" style={{ fontSize: '0.9vw', marginBottom: '0.5vh' }}>CVO / Founder — Sole Architect</div>
        <div className="text-[#8B8680] uppercase tracking-widest" style={{ fontSize: '0.8vw', marginBottom: '1.5vh' }}>CUXTOMCANDYCLUB LLC</div>
        <div className="text-white/60 font-mono" style={{ fontSize: '0.9vw', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8vh 1.5vw', borderRadius: '0.3vw' }}>ron@cuxtomcandyclub.com</div>
      </motion.div>

      <motion.p
        className="text-[#8B8680]/50 font-body"
        style={{ fontSize: '0.7vw', marginTop: '3vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1.5, delay: 4.5 }}
      >
        All intellectual property, systems, and protocols are the exclusive property of Ronald Antonio Cadet.
      </motion.p>
    </motion.div>
  );
}
