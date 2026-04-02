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
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      style={{ padding: '0 8vw' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.h2
        className="font-display font-bold text-white text-center"
        style={{ fontSize: '3.2vw', marginBottom: '1.5vh' }}
        initial={{ opacity: 0, y: '-2vh' }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        7 AI Agents. One Event Bus.
      </motion.h2>

      <motion.div
        className="text-[#C9A227] tracking-widest font-light"
        style={{ fontSize: '1.4vw', marginBottom: '6vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        ZERO MANUAL COORDINATION.
      </motion.div>

      <div className="relative flex items-center justify-center" style={{ width: '50vw', height: '30vh' }}>
        <motion.div
          className="absolute rounded-full bg-[#0A0A0A] flex items-center justify-center z-20"
          style={{ width: '6vw', height: '6vw', border: '0.3vw solid #E8B830', boxShadow: '0 0 30px rgba(232,184,48,0.3)' }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1, delay: 1, type: "spring" }}
        >
          <span className="font-display font-bold text-white" style={{ fontSize: '1.2vw' }}>ONYX</span>
        </motion.div>

        {agents.map((agent, i) => {
          const angle = (i * (360 / agents.length) - 90) * (Math.PI / 180);
          const rx = 20;
          const ry = 12;
          const x = Math.cos(angle) * rx;
          const y = Math.sin(angle) * ry;

          return (
            <motion.div
              key={agent}
              className="absolute z-10 flex flex-col items-center"
              style={{ left: '50%', top: '50%' }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{ x: `${x}vw`, y: `${y}vh`, opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, delay: 1.5 + (i * 0.15), type: "spring", bounce: 0.3 }}
            >
              <div
                className="rounded-full bg-[#0A0A0A] flex items-center justify-center"
                style={{ width: '3.5vw', height: '3.5vw', border: '1px solid rgba(201,162,39,0.5)', boxShadow: '0 0 15px rgba(201,162,39,0.15)' }}
              />
              <span className="text-[#8B8680] font-semibold tracking-wider uppercase" style={{ fontSize: '0.8vw', marginTop: '0.5vh' }}>{agent}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
