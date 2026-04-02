import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';

export function Scene3_Solution() {
  useEffect(() => {
    speak("One input. The system handles everything. Scan a VIN — ONYX decodes it. Diagnose the need — AI routes the service. Execute the transaction — payment splits automatically. The member taps once. ONYX coordinates seven agents simultaneously. Under two minutes. Every time.");
    return () => window.speechSynthesis.cancel();
  }, []);

  const steps = [
    { phase: "SCAN", label: "VIN Decoded", detail: "NHTSA + AI Summary", color: "#C9A227" },
    { phase: "DIAGNOSE", label: "AI Routes", detail: "7 Agents Coordinate", color: "#E8B830" },
    { phase: "EXECUTE", label: "Deal Closed", detail: "Payment Auto-Split", color: "#10B981" },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -50, filter: 'blur(10px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.p
        className="font-body text-[#C9A227] uppercase tracking-widest font-semibold"
        style={{ fontSize: '1.2vw', letterSpacing: '0.3em', marginBottom: '1vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        THE PROTOCOL
      </motion.p>

      <motion.h2
        className="font-display font-bold text-white text-center leading-tight"
        style={{ fontSize: '3.5vw', maxWidth: '70vw', marginBottom: '1vh' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        Scan. Diagnose. Execute.
      </motion.h2>

      <motion.p
        className="text-[#8B8680] font-body text-center"
        style={{ fontSize: '1.4vw', maxWidth: '45vw', marginBottom: '5vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        One input from the member. Seven agents coordinate autonomously.
      </motion.p>

      <div className="flex items-center justify-center" style={{ gap: '2vw', width: '75vw' }}>
        {steps.map((step, i) => (
          <motion.div key={step.phase} className="flex items-center" style={{ flex: 1 }}>
            <div className="flex flex-col items-center text-center" style={{ flex: 1 }}>
              <motion.div
                className="rounded-full bg-[#0A0A0A] flex items-center justify-center"
                style={{
                  width: '6vw', height: '6vw',
                  border: `3px solid ${step.color}`,
                  boxShadow: `0 0 30px ${step.color}33`,
                }}
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ duration: 1, delay: 1.5 + i * 0.5, type: "spring" }}
              >
                <span className="font-display font-bold text-white" style={{ fontSize: '1vw' }}>{step.phase}</span>
              </motion.div>
              <motion.span
                className="text-white font-semibold"
                style={{ fontSize: '1.2vw', marginTop: '1.5vh' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2 + i * 0.5 }}
              >
                {step.label}
              </motion.span>
              <motion.span
                className="text-[#8B8680]"
                style={{ fontSize: '0.9vw', marginTop: '0.3vh' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.2 + i * 0.5 }}
              >
                {step.detail}
              </motion.span>
            </div>
            {i < steps.length - 1 && (
              <motion.div
                className="flex items-center"
                style={{ width: '4vw', marginBottom: '4vh' }}
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ delay: 2 + i * 0.5, duration: 0.5 }}
              >
                <div style={{ flex: 1, height: '2px', background: `linear-gradient(90deg, ${step.color}, ${steps[i + 1].color})` }} />
                <span style={{ color: steps[i + 1].color, fontSize: '1.5vw', marginLeft: '0.3vw' }}>→</span>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>

      <motion.div
        className="flex items-center text-[#8B8680] uppercase font-semibold"
        style={{ gap: '2vw', fontSize: '1.2vw', letterSpacing: '0.15em', marginTop: '5vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 4 }}
      >
        <span>MEMBER TAPS ONCE</span>
        <span className="text-[#C9A227]">•</span>
        <span>ONYX HANDLES EVERYTHING</span>
        <span className="text-[#C9A227]">•</span>
        <span className="text-[#10B981]">UNDER 2 MINUTES</span>
      </motion.div>
    </motion.div>
  );
}
