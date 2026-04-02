import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';

export function Scene5_ProofEngine() {
  useEffect(() => {
    speak("Every vehicle gets a digital identity. Every action generates a tamper-evident, cryptographic proof. CarFax tells you. ONYX proves it.");
    return () => window.speechSynthesis.cancel();
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 px-24"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, y: 50, filter: 'blur(5px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex w-full max-w-6xl items-center justify-between">
        <div className="flex-1 pr-12">
          <motion.h2
            className="font-display text-5xl font-bold text-white leading-tight mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Every VIN. <br />
            Every Event. <br />
            <span className="text-[#C9A227]">Cryptographically Proven.</span>
          </motion.h2>

          <motion.div
            className="text-2xl text-[#8B8680] font-light italic"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
          >
            "CarFax tells you. <strong className="text-white not-italic font-semibold">ONYX proves it.</strong>"
          </motion.div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center gap-4 relative">
          {/* Abstract Hash Chain */}
          {[1, 2, 3].map((block, i) => (
            <motion.div
              key={block}
              className="w-full max-w-sm p-6 border border-[#C9A227]/20 bg-[#0A0A0A]/80 backdrop-blur rounded-lg flex items-center justify-between relative"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 2 + (i * 0.4) }}
            >
              {i > 0 && (
                <div className="absolute -top-4 left-1/2 w-0.5 h-4 bg-[#C9A227]/30" />
              )}
              <div className="flex flex-col">
                <span className="text-xs text-[#8B8680] uppercase tracking-wider mb-1">Block {1048590 + i}</span>
                <span className="font-mono text-sm text-[#F5F0E1]">0x{(Math.random() * 10000000).toString(16).padEnd(8, '0')}...</span>
              </div>
              <div className="w-8 h-8 rounded-full bg-[#10B981]/20 flex items-center justify-center text-[#10B981]">
                ✓
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
