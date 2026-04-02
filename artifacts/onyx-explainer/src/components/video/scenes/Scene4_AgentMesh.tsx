import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';

export function Scene4_AgentMesh() {
  useEffect(() => {
    speak("Seven AI agents working simultaneously through one event bus. Sales, Finance, Service, Parts, Delivery, Support, and Referral. Zero manual coordination.");
    return () => window.speechSynthesis.cancel();
  }, []);

  const agents = ["Sales", "Finance", "Service", "Parts", "Delivery", "Support", "Referral"];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 px-24"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.h2
        className="font-display text-5xl font-bold text-white mb-6 text-center"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        7 AI Agents. One Event Bus.
      </motion.h2>
      
      <motion.div
        className="text-2xl text-[#C9A227] mb-16 tracking-widest font-light"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        ZERO MANUAL COORDINATION.
      </motion.div>

      <div className="relative w-full max-w-4xl h-80 flex items-center justify-center">
        {/* Center Node */}
        <motion.div
          className="absolute w-24 h-24 rounded-full bg-[#0A0A0A] border-4 border-[#E8B830] z-20 flex items-center justify-center shadow-[0_0_30px_rgba(232,184,48,0.3)]"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1, delay: 1, type: "spring" }}
        >
          <span className="font-display font-bold text-white text-xl">ONYX</span>
        </motion.div>

        {/* Orbital Nodes */}
        {agents.map((agent, i) => {
          const angle = (i * (360 / agents.length)) * (Math.PI / 180);
          const radius = 180;
          const x = Math.cos(angle) * radius;
          const y = Math.sin(angle) * radius;

          return (
            <motion.div
              key={agent}
              className="absolute z-10 flex flex-col items-center"
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{ x, y, opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, delay: 1.5 + (i * 0.2), type: "spring", bounce: 0.3 }}
            >
              <div className="w-16 h-16 rounded-full border border-[#C9A227]/50 bg-[#0A0A0A] flex items-center justify-center text-[#F5F0E1] text-sm mb-2 shadow-[0_0_15px_rgba(201,162,39,0.15)] relative">
                {/* Connecting Line (drawn via SVG or CSS, simulated here with a pseudo element) */}
                <svg className="absolute inset-0 w-full h-full -z-10 overflow-visible" style={{ left: '50%', top: '50%', transform: `translate(-50%, -50%) rotate(${angle}rad)` }}>
                    <line x1="0" y1="0" x2="-100" y2="0" stroke="#C9A227" strokeWidth="1" strokeOpacity="0.3" strokeDasharray="4 4" />
                </svg>
              </div>
              <span className="text-[#8B8680] text-sm font-semibold tracking-wider uppercase">{agent}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
