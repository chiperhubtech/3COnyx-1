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
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      style={{ padding: '0 10vw' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="w-full flex flex-col" style={{ gap: '5vh' }}>
        <motion.div
          className="flex justify-between items-end"
          style={{ borderBottom: '2px solid #333', paddingBottom: '3vh' }}
          initial={{ opacity: 0, x: '-5vw' }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
        >
          <div>
            <div className="text-[#8B8680] uppercase tracking-widest" style={{ fontSize: '1.2vw', marginBottom: '0.5vh' }}>Phase I</div>
            <div className="text-white font-medium" style={{ fontSize: '2vw' }}>25 deals/month</div>
          </div>
          <div className="text-right">
            <div className="font-display font-bold text-[#C9A227]" style={{ fontSize: '3.5vw' }}>$6,250</div>
            <div className="text-[#8B8680]" style={{ fontSize: '1.1vw' }}>Monthly Revenue</div>
          </div>
        </motion.div>

        <motion.div
          className="flex justify-between items-end"
          style={{ borderBottom: '2px solid rgba(201,162,39,0.5)', paddingBottom: '3vh' }}
          initial={{ opacity: 0, x: '-5vw' }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 2 }}
        >
          <div>
            <div className="text-[#8B8680] uppercase tracking-widest" style={{ fontSize: '1.2vw', marginBottom: '0.5vh' }}>Phase II</div>
            <div className="text-white font-bold" style={{ fontSize: '2.5vw' }}>150 deals/month</div>
          </div>
          <div className="text-right">
            <div className="font-display font-bold text-gradient-gold" style={{ fontSize: '4vw' }}>$37,500</div>
            <div className="text-[#8B8680]" style={{ fontSize: '1.1vw' }}>Monthly Revenue</div>
          </div>
        </motion.div>

        <motion.div
          className="self-center text-[#E8B830] font-bold tracking-wide"
          style={{ fontSize: '1.6vw', marginTop: '2vh', padding: '1.5vh 3vw', background: 'rgba(201,162,39,0.1)', border: '1px solid #C9A227', borderRadius: '5vw' }}
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
