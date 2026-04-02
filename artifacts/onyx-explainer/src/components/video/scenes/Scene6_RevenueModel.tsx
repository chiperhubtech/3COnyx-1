import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';

export function Scene6_RevenueModel() {
  useEffect(() => {
    speak("The revenue model is a tollbooth. 150 to 300 dollars per vehicle deal. Embedded commissions on parts, service, and transport. Recurring revenue from insurance binding and lender leads.");
    return () => window.speechSynthesis.cancel();
  }, []);

  const streams = [
    { title: "$150–$300", desc: "Per Vehicle Deal" },
    { title: "3–20%", desc: "Logistic Commissions" },
    { title: "Recurring", desc: "Insurance & Lender Spreads" }
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      style={{ padding: '0 8vw' }}
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(5px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="text-[#C9A227] uppercase font-semibold"
        style={{ fontSize: '1.2vw', letterSpacing: '0.2em', marginBottom: '1.5vh' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        THE REVENUE MODEL
      </motion.div>

      <motion.h2
        className="font-display font-bold text-white text-center"
        style={{ fontSize: '4vw', marginBottom: '6vh' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.8 }}
      >
        The Tollbooth
      </motion.h2>

      <div className="grid grid-cols-3 w-full" style={{ gap: '3vw' }}>
        {streams.map((stream, i) => (
          <motion.div
            key={i}
            className="flex flex-col items-center text-center bg-gradient-to-b from-[#111] to-[#0A0A0A]"
            style={{ padding: '4vh 2vw', border: '1px solid #333', borderRadius: '1vw' }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.5 + (i * 0.3), type: "spring" }}
          >
            <div className="font-display font-bold text-[#E8B830]" style={{ fontSize: '2.8vw', marginBottom: '1.5vh' }}>{stream.title}</div>
            <div className="text-[#F5F0E1]" style={{ fontSize: '1.3vw' }}>{stream.desc}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
