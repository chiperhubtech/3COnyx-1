import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';

export function Scene6_RevenueModel() {
  useEffect(() => {
    speak("The revenue model is a tollbooth. 150 to 300 dollars per vehicle deal. Embedded commissions on parts, service, and transport. Recurring revenue from insurance binding and lender leads.");
    return () => window.speechSynthesis.cancel();
  }, []);

  const streams = [
    { title: "$150-$300", desc: "per vehicle deal" },
    { title: "Commissions", desc: "Parts, Service, Transport" },
    { title: "Recurring", desc: "Insurance & Lender Spreads" }
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 px-24"
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: -50, filter: 'blur(5px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="text-[#C9A227] tracking-[0.2em] text-lg uppercase font-semibold mb-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        THE REVENUE MODEL
      </motion.div>
      <motion.h2
        className="font-display text-6xl font-bold text-white mb-16 text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.8 }}
      >
        The Tollbooth
      </motion.h2>

      <div className="grid grid-cols-3 gap-8 w-full max-w-6xl">
        {streams.map((stream, i) => (
          <motion.div
            key={i}
            className="flex flex-col items-center text-center p-10 border border-[#333] rounded-xl bg-gradient-to-b from-[#111] to-[#0A0A0A]"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.5 + (i * 0.3), type: "spring" }}
          >
            <div className="font-display text-4xl font-bold text-[#E8B830] mb-4">{stream.title}</div>
            <div className="text-xl text-[#F5F0E1]">{stream.desc}</div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
