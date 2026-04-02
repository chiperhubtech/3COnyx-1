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
      className="absolute inset-0 flex items-center justify-center z-10"
      style={{ padding: '0 8vw' }}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, filter: 'blur(5px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex w-full items-center" style={{ gap: '4vw' }}>
        <div style={{ flex: 1 }}>
          <motion.h2
            className="font-display font-bold text-white leading-tight"
            style={{ fontSize: '3.2vw', marginBottom: '3vh' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Every VIN. <br />
            Every Event. <br />
            <span className="text-[#C9A227]">Cryptographically Proven.</span>
          </motion.h2>

          <motion.div
            className="text-[#8B8680] font-light italic"
            style={{ fontSize: '1.5vw' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.5 }}
          >
            "CarFax tells you. <strong className="text-white not-italic font-semibold">ONYX proves it.</strong>"
          </motion.div>
        </div>

        <div className="flex flex-col items-center justify-center" style={{ flex: 1, gap: '1.5vh' }}>
          {[1, 2, 3].map((block, i) => (
            <motion.div
              key={block}
              className="w-full bg-[#0A0A0A]/80 backdrop-blur flex items-center justify-between relative"
              style={{ padding: '2vh 2vw', border: '1px solid rgba(201,162,39,0.2)', borderRadius: '0.5vw', maxWidth: '30vw' }}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 2 + (i * 0.4) }}
            >
              {i > 0 && (
                <div className="absolute bg-[#C9A227]/30" style={{ top: '-1.5vh', left: '50%', width: '1px', height: '1.5vh' }} />
              )}
              <div className="flex flex-col">
                <span className="text-[#8B8680] uppercase tracking-wider" style={{ fontSize: '0.7vw', marginBottom: '0.3vh' }}>Block {1048590 + i}</span>
                <span className="font-mono text-[#F5F0E1]" style={{ fontSize: '0.9vw' }}>0x{(Math.random() * 10000000).toString(16).padEnd(8, '0').slice(0, 8)}...</span>
              </div>
              <div className="rounded-full bg-[#10B981]/20 flex items-center justify-center text-[#10B981]" style={{ width: '2vw', height: '2vw', fontSize: '1vw' }}>
                ✓
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
