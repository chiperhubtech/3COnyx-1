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
      className="absolute inset-0 flex flex-col items-center justify-center z-10 px-24 text-center"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 2, ease: "easeOut" }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 2, delay: 0.5 }}
        className="mb-12"
      >
        <OnyxLogo className="w-32 h-32 text-[#C9A227]" />
      </motion.div>

      <motion.h2
        className="font-display text-4xl md:text-5xl font-bold text-white mb-16 max-w-4xl leading-tight"
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
        <div className="text-[#C9A227] text-xl font-medium tracking-wide mb-2">Ronald Antonio Cadet</div>
        <div className="text-[#8B8680] text-lg uppercase tracking-widest mb-4">CVO / Founder</div>
        <div className="text-white/60 font-mono text-sm border border-white/10 px-4 py-2 rounded">ron@cuxtomcandyclub.com</div>
      </motion.div>
    </motion.div>
  );
}
