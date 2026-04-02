import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';

export function Scene4_AgentMesh() {
  useEffect(() => {
    speak("Seven AI agents. One event bus. Zero human coordination. Sales identifies the opportunity. Finance processes the approval. Service dispatches the mechanic. Parts sources the components. Delivery tracks the transport. Support handles the follow-up. Referral attributes the commission. All working simultaneously. All auditable. All autonomous.");
    return () => window.speechSynthesis.cancel();
  }, []);

  const agents = [
    { name: "Sales", role: "Identifies deals" },
    { name: "Finance", role: "Processes approval" },
    { name: "Service", role: "Dispatches mechanic" },
    { name: "Parts", role: "Sources components" },
    { name: "Delivery", role: "Tracks transport" },
    { name: "Support", role: "Handles follow-up" },
    { name: "Referral", role: "Attributes commission" },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      style={{ padding: '0 6vw' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.9, filter: 'blur(5px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.p
        className="font-body text-[#C9A227] uppercase tracking-widest font-semibold"
        style={{ fontSize: '1.2vw', letterSpacing: '0.3em', marginBottom: '1vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        AUTONOMOUS INTELLIGENCE
      </motion.p>

      <motion.h2
        className="font-display font-bold text-white text-center"
        style={{ fontSize: '3.2vw', marginBottom: '1vh' }}
        initial={{ opacity: 0, y: '-2vh' }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1 }}
      >
        7 Agents. One Event Bus. <span className="text-[#C9A227]">Zero Humans.</span>
      </motion.h2>

      <motion.p
        className="text-[#8B8680] font-body text-center"
        style={{ fontSize: '1.2vw', marginBottom: '5vh', maxWidth: '50vw' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        Every agent is autonomous, auditable, and works simultaneously.
      </motion.p>

      <div className="relative flex items-center justify-center" style={{ width: '55vw', height: '32vh' }}>
        <motion.div
          className="absolute rounded-full bg-[#0A0A0A] flex flex-col items-center justify-center z-20"
          style={{ width: '8vw', height: '8vw', border: '0.3vw solid #E8B830', boxShadow: '0 0 40px rgba(232,184,48,0.3)' }}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1, delay: 1, type: "spring" }}
        >
          <span className="font-display font-bold text-white" style={{ fontSize: '1.2vw' }}>ONYX</span>
          <span className="text-[#C9A227]" style={{ fontSize: '0.6vw' }}>EVENT BUS</span>
        </motion.div>

        {agents.map((agent, i) => {
          const angle = (i * (360 / agents.length) - 90) * (Math.PI / 180);
          const rx = 22;
          const ry = 14;
          const x = Math.cos(angle) * rx;
          const y = Math.sin(angle) * ry;

          return (
            <motion.div
              key={agent.name}
              className="absolute z-10 flex flex-col items-center"
              style={{ left: '50%', top: '50%' }}
              initial={{ x: 0, y: 0, opacity: 0, scale: 0 }}
              animate={{ x: `${x}vw`, y: `${y}vh`, opacity: 1, scale: 1 }}
              transition={{ duration: 1.5, delay: 1.5 + (i * 0.15), type: "spring", bounce: 0.3 }}
            >
              <div
                className="rounded-full bg-[#0A0A0A] flex items-center justify-center"
                style={{ width: '4vw', height: '4vw', border: '2px solid rgba(201,162,39,0.5)', boxShadow: '0 0 20px rgba(201,162,39,0.15)' }}
              >
                <span className="font-bold text-[#C9A227]" style={{ fontSize: '0.7vw' }}>{agent.name.slice(0, 3).toUpperCase()}</span>
              </div>
              <span className="text-white font-semibold tracking-wider uppercase" style={{ fontSize: '0.7vw', marginTop: '0.5vh' }}>{agent.name}</span>
              <span className="text-[#8B8680]" style={{ fontSize: '0.55vw' }}>{agent.role}</span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
