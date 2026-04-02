import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak, stopAudio } from '@/lib/voiceover';

export function Scene5_ProofEngine() {
  useEffect(() => {
    speak("Every vehicle gets a digital passport. Every transaction cryptographically stamped with SHA-256 hash chains. Every record tamper-evident and immutable. CarFax tells you what happened. ONYX proves it mathematically.", "scene5");
    return () => stopAudio("scene5");
  }, []);

  const events = [
    { type: "OWNERSHIP", hash: "a7f3b2c1", status: "VERIFIED" },
    { type: "SERVICE", hash: "d4e8f9a0", status: "VERIFIED" },
    { type: "INSPECTION", hash: "b1c2d3e4", status: "VERIFIED" },
    { type: "OTA UPDATE", hash: "f5a6b7c8", status: "VERIFIED" },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex items-center justify-center z-10"
      style={{ padding: '0 6vw' }}
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, filter: 'blur(5px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex w-full items-center" style={{ gap: '4vw' }}>
        <div style={{ flex: 1 }}>
          <motion.p
            className="font-body text-[#C9A227] uppercase tracking-widest font-semibold"
            style={{ fontSize: '1vw', letterSpacing: '0.3em', marginBottom: '1.5vh' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
          >
            TRUST LAYER
          </motion.p>

          <motion.h2
            className="font-display font-bold text-white leading-tight"
            style={{ fontSize: '3vw', marginBottom: '2vh' }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5 }}
          >
            Every VIN. <br />
            Every Event. <br />
            <span className="text-[#C9A227]">Mathematically Proven.</span>
          </motion.h2>

          <motion.p
            className="text-[#8B8680] font-body"
            style={{ fontSize: '1.2vw', maxWidth: '30vw', marginBottom: '3vh' }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1 }}
          >
            SHA-256 hash chain. Tamper-evident. Immutable. Every vehicle action generates a publicly verifiable cryptographic proof.
          </motion.p>

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

        <div className="flex flex-col items-center justify-center" style={{ flex: 1, gap: '1vh' }}>
          <motion.div
            className="w-full bg-[#0A0A0A]/80 backdrop-blur text-center"
            style={{ padding: '2vh 2vw', border: '2px solid rgba(201,162,39,0.4)', borderRadius: '0.5vw', maxWidth: '30vw', marginBottom: '1vh' }}
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.5 }}
          >
            <span className="text-[#C9A227] font-bold uppercase tracking-widest" style={{ fontSize: '0.9vw' }}>VIN Digital Passport</span>
            <div className="font-mono text-white" style={{ fontSize: '1vw', marginTop: '0.5vh' }}>1HGBH41JXMN109186</div>
          </motion.div>

          {events.map((event, i) => (
            <motion.div
              key={event.type}
              className="w-full bg-[#0A0A0A]/80 backdrop-blur flex items-center justify-between relative"
              style={{ padding: '1.5vh 2vw', border: '1px solid rgba(201,162,39,0.2)', borderRadius: '0.5vw', maxWidth: '30vw' }}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 2 + (i * 0.3) }}
            >
              {i > 0 && (
                <div className="absolute bg-[#C9A227]/30" style={{ top: '-1vh', left: '50%', width: '1px', height: '1vh' }} />
              )}
              <div className="flex flex-col">
                <span className="text-[#C9A227] uppercase tracking-wider font-semibold" style={{ fontSize: '0.7vw' }}>{event.type}</span>
                <span className="font-mono text-[#F5F0E1]" style={{ fontSize: '0.8vw' }}>0x{event.hash}...</span>
              </div>
              <div className="rounded-full bg-[#10B981]/20 flex items-center justify-center text-[#10B981] font-bold" style={{ width: '2vw', height: '2vw', fontSize: '0.7vw' }}>
                ✓
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
