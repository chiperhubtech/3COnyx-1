import { motion } from 'framer-motion';

export function Scene3_Pillars() {
  const pillars = [
    { title: "12 AI Agents", desc: "Omnipresent intelligence" },
    { title: "Cryptographic Proof", desc: "Immutable trust ledger" },
    { title: "Instant Commission", desc: "Frictionless capital" }
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, y: -50 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex justify-center items-stretch gap-[4vw] w-full max-w-[90vw] px-[4vw]">
        {pillars.map((pillar, i) => (
          <motion.div 
            key={i}
            className="flex-1 flex flex-col items-center text-center relative"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.3 + 0.2, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Connection line from previous scene's dot */}
            <motion.div
              className="w-[1px] bg-gradient-to-b from-transparent via-[var(--color-primary)] to-[var(--color-primary)] mb-[2vh]"
              initial={{ height: 0 }}
              animate={{ height: "10vh" }}
              transition={{ delay: i * 0.3, duration: 0.5, ease: "easeOut" }}
            />
            
            <div className="w-[1vw] h-[1vw] rounded-full bg-[var(--color-primary)] mb-[3vh] shadow-[0_0_15px_var(--color-primary)]" />
            
            <h3 className="text-[2.5vw] font-display text-[var(--color-primary)] mb-[1vh] leading-tight">
              {pillar.title}
            </h3>
            <p className="text-[1.2vw] font-body text-[var(--color-text-secondary)] uppercase tracking-wider">
              {pillar.desc}
            </p>
          </motion.div>
        ))}
      </div>
      
      {/* Horizontal connector line */}
      <motion.div
        className="absolute top-[40%] left-[20%] right-[20%] h-[1px] bg-[var(--color-primary)]/30 -z-10"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ delay: 0.8, duration: 1, ease: "easeInOut" }}
      />
    </motion.div>
  );
}