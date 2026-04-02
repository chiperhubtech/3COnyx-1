import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';

export function Scene7_Growth() {
  useEffect(() => {
    speak("Phase 1: 25 deals per month generating $6,250 in monthly revenue. Phase 2: 150 deals per month, $37,500 monthly revenue, with a 7.5x debt coverage ratio.");
    return () => window.speechSynthesis.cancel();
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 px-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-full max-w-5xl flex flex-col gap-12">
        <motion.div
          className="flex justify-between items-end border-b-2 border-[#333] pb-8"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <div>
            <div className="text-[#8B8680] text-xl tracking-widest uppercase mb-2">Phase I</div>
            <div className="text-3xl text-white font-medium">25 deals/month</div>
          </div>
          <div className="text-right">
            <div className="font-display text-5xl font-bold text-[#C9A227]">$6,250</div>
            <div className="text-[#8B8680] text-lg">Monthly Revenue</div>
          </div>
        </motion.div>

        <motion.div
          className="flex justify-between items-end border-b-2 border-[#C9A227]/50 pb-8"
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 2 }}
        >
          <div>
            <div className="text-[#8B8680] text-xl tracking-widest uppercase mb-2">Phase II</div>
            <div className="text-4xl text-white font-bold">150 deals/month</div>
          </div>
          <div className="text-right">
            <div className="font-display text-6xl font-bold text-gradient-gold">$37,500</div>
            <div className="text-[#8B8680] text-lg">Monthly Revenue</div>
          </div>
        </motion.div>

        <motion.div
          className="self-center mt-8 px-8 py-4 bg-[#C9A227]/10 border border-[#C9A227] rounded-full text-[#E8B830] text-2xl font-bold tracking-wide"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 3.5, type: "spring" }}
        >
          7.5x Debt Coverage Ratio
        </motion.div>
      </div>
    </motion.div>
  );
}
