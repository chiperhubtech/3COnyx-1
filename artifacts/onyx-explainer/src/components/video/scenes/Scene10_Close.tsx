import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';
import { OnyxLogo } from '../OnyxLogo';

export function Scene10_Close() {
  useEffect(() => {
    speak("Deploy the global trust and commerce layer for the automotive industry. Execute the build. Launch the movement. Secure the empire.");
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
        style={{ marginBottom: '4vh' }}
      >
        <OnyxLogo className="text-[#C9A227]" style={{ width: '8vw', height: '8vw' }} />
      </motion.div>

      <motion.h2
        className="font-display font-bold text-white leading-tight"
        style={{ fontSize: '2.8vw', marginBottom: '5vh', maxWidth: '60vw' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, delay: 1.5 }}
      >
        Deploy the global trust and commerce layer for the automotive industry.
      </motion.h2>

      <motion.div
        className="flex flex-col items-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.5, delay: 3 }}
      >
        <div className="text-[#C9A227] font-medium tracking-wide" style={{ fontSize: '1.4vw', marginBottom: '0.5vh' }}>Ronald Antonio Cadet</div>
        <div className="text-[#8B8680] uppercase tracking-widest" style={{ fontSize: '1vw', marginBottom: '1.5vh' }}>CVO / Founder</div>
        <div className="text-white/60 font-mono" style={{ fontSize: '0.9vw', border: '1px solid rgba(255,255,255,0.1)', padding: '0.8vh 1.5vw', borderRadius: '0.3vw' }}>ron@cuxtomcandyclub.com</div>
      </motion.div>
    </motion.div>
  );
}
