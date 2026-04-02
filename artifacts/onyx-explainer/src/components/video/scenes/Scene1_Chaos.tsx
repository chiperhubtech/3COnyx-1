import { motion } from 'framer-motion';

export function Scene1_Chaos() {
  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: "blur(20px)", scale: 0.5 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Chaotic lines */}
        {Array.from({ length: 30 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-[var(--color-text-muted)] opacity-20"
            style={{
              height: '1px',
              width: Math.random() * 30 + 10 + 'vw',
              left: Math.random() * 100 + 'vw',
              top: Math.random() * 100 + 'vh',
            }}
            initial={{ x: -100, rotate: (Math.random() - 0.5) * 45 }}
            animate={{ 
              x: [null, (Math.random() > 0.5 ? 1 : -1) * 500], 
            }}
            transition={{ duration: Math.random() * 1 + 0.5, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </div>

      <motion.div
        className="flex flex-col items-center"
        initial={{ scale: 1.1, opacity: 0, filter: "blur(10px)" }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="text-[5vw] font-display text-[var(--color-text-primary)] text-center leading-tight">
          The entire automotive industry
        </h2>
        
        <div className="flex gap-[2vw] mt-[2vh]">
          {["Fragmented.", "Chaotic.", "Slow."].map((word, i) => (
            <motion.span
              key={i}
              className="text-[2vw] font-body text-[var(--color-text-secondary)] italic"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.2, duration: 0.5 }}
            >
              {word}
            </motion.span>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}