import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';
import { OnyxLogo } from '../OnyxLogo';

export function Scene10_Close() {
  useEffect(() => {
    speak("This is not a car app. This is the money network for the entire automotive industry. The protocol that every gas station, every mechanic, every dealership, and every smartphone runs on. A broker closes a deal. A mechanic services the vehicle. A random clerk referred the user. Everyone gets paid automatically. All tracked, verified, and visible in one platform. Making the life of the ordinary become extraordinary. Designed, architected, and owned exclusively by Ronald Antonio Cadet. CUXTOMCANDYCLUB LLC. 3C ONYX. The standard is set.");
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
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, delay: 0.5 }}
        style={{ marginBottom: '2vh' }}
      >
        <OnyxLogo className="text-[#C9A227] drop-shadow-[0_0_40px_rgba(201,162,39,0.4)]" style={{ width: '10vw', height: '10vw' }} />
      </motion.div>

      <motion.h2
        className="font-display font-bold text-white leading-tight"
        style={{ fontSize: '3vw', marginBottom: '0.5vh', maxWidth: '60vw' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, delay: 1.5 }}
      >
        The Protocol for Automotive Value Exchange.
      </motion.h2>

      <motion.p
        className="text-[#8B8680] font-body"
        style={{ fontSize: '1.2vw', marginBottom: '2vh', maxWidth: '50vw' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 2.5 }}
      >
        A broker closes a deal. A mechanic services the vehicle. A random clerk referred the user. Everyone gets paid automatically. All in one platform.
      </motion.p>

      <motion.p
        className="font-display text-[#F5F0E1] italic font-semibold"
        style={{ fontSize: '1.8vw', marginBottom: '1.5vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 3.2 }}
      >
        "Making the life of the ordinary become <span className="text-[#C9A227]">extraordinary.</span>"
      </motion.p>

      <motion.p
        className="text-[#C9A227] font-body uppercase tracking-widest font-semibold"
        style={{ fontSize: '1.1vw', letterSpacing: '0.25em', marginBottom: '2.5vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 4 }}
      >
        The standard is set.
      </motion.p>

      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 4 }}
      >
        <div className="text-[#C9A227] font-medium tracking-wide" style={{ fontSize: '1.4vw', marginBottom: '0.5vh' }}>Ronald Antonio Cadet</div>
        <div className="text-[#8B8680] uppercase tracking-widest" style={{ fontSize: '0.9vw', marginBottom: '0.5vh' }}>CVO / Founder — Sole Architect</div>
        <div className="text-[#8B8680] uppercase tracking-widest" style={{ fontSize: '0.8vw', marginBottom: '1.5vh' }}>CUXTOMCANDYCLUB LLC</div>
        <div className="text-white/60 font-mono" style={{ fontSize: '0.9vw', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8vh 1.5vw', borderRadius: '0.3vw' }}>ron@cuxtomcandyclub.com</div>
      </motion.div>

      <motion.p
        className="text-[#8B8680]/50 font-body"
        style={{ fontSize: '0.7vw', marginTop: '2vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1.5, delay: 5 }}
      >
        All intellectual property, systems, agents, and protocols are the exclusive property of Ronald Antonio Cadet — CUXTOMCANDYCLUB LLC.
      </motion.p>
    </motion.div>
  );
}
