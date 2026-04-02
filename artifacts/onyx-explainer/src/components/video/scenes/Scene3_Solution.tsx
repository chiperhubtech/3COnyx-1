import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';

export function Scene3_Solution() {
  useEffect(() => {
    speak("We are decentralizing the dealership. Every gas station clerk, every mechanic, every smartphone — a high-conversion point of sale. ONYX acts. Member confirms. Money moves. Instantly.");
    return () => window.speechSynthesis.cancel();
  }, []);

  const nodes = [
    { label: "Gas Station", icon: "⛽", delay: 2.0 },
    { label: "Mechanic Bay", icon: "🔧", delay: 2.3 },
    { label: "Smartphone", icon: "📱", delay: 2.6 },
    { label: "Body Shop", icon: "🏗️", delay: 2.9 },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, y: -50, filter: 'blur(10px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative flex items-center justify-center" style={{ width: '12vw', height: '12vw', marginBottom: '3vh' }}>
        <motion.div
          className="absolute rounded-full"
          style={{ width: '100%', height: '100%', border: '2px solid rgba(201,162,39,0.2)' }}
          animate={{ scale: [1, 2], opacity: [1, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="absolute rounded-full"
          style={{ width: '100%', height: '100%', border: '2px solid rgba(201,162,39,0.4)' }}
          animate={{ scale: [1, 1.5], opacity: [1, 0] }}
          transition={{ duration: 2, delay: 0.5, repeat: Infinity, ease: "easeOut" }}
        />
        <motion.div
          className="rounded-full bg-gradient-to-tr from-[#C9A227] to-[#E8B830] shadow-[0_0_50px_rgba(201,162,39,0.5)] z-10 flex items-center justify-center"
          style={{ width: '6vw', height: '6vw' }}
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 1.5, type: "spring", bounce: 0.4 }}
        >
          <span className="font-display font-bold text-black" style={{ fontSize: '1.3vw' }}>ONYX</span>
        </motion.div>
      </div>

      <motion.h2
        className="font-display font-bold text-white text-center leading-tight"
        style={{ fontSize: '3vw', maxWidth: '70vw', marginBottom: '1vh' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 1 }}
      >
        Decentralizing the Dealership
      </motion.h2>

      <motion.p
        className="text-[#C9A227] font-body text-center"
        style={{ fontSize: '1.6vw', maxWidth: '55vw', marginBottom: '3vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.5 }}
      >
        Every location becomes a point-of-sale
      </motion.p>

      <div className="flex items-center justify-center" style={{ gap: '2.5vw', marginBottom: '3vh' }}>
        {nodes.map((node) => (
          <motion.div
            key={node.label}
            className="flex flex-col items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: node.delay, type: "spring" }}
          >
            <div
              className="rounded-full bg-[#0A0A0A] flex items-center justify-center"
              style={{ width: '4vw', height: '4vw', border: '1px solid rgba(201,162,39,0.4)', fontSize: '1.8vw' }}
            >
              {node.icon}
            </div>
            <span className="text-[#8B8680] font-semibold uppercase" style={{ fontSize: '0.7vw', marginTop: '0.8vh', letterSpacing: '0.1em' }}>{node.label}</span>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="flex items-center text-[#8B8680] uppercase font-semibold"
        style={{ gap: '2vw', fontSize: '1.2vw', letterSpacing: '0.15em' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 3.5 }}
      >
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3.5 }}>ONYX ACTS</motion.span>
        <span className="text-[#C9A227]">•</span>
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.0 }}>MEMBER CONFIRMS</motion.span>
        <span className="text-[#C9A227]">•</span>
        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 4.5 }} className="text-[#C9A227]">MONEY MOVES</motion.span>
      </motion.div>
    </motion.div>
  );
}
