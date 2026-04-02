import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene5_ViralEngine() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      {...sceneTransitions.scaleFade}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 overflow-hidden z-0 pointer-events-none">
        {/* Network nodes background effect */}
        <motion.div 
          className="absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          transition={{ delay: 1, duration: 2 }}
        >
          {Array.from({ length: 20 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-[var(--color-primary)]"
              style={{
                width: Math.random() * 6 + 2 + 'px',
                height: Math.random() * 6 + 2 + 'px',
                left: Math.random() * 100 + 'vw',
                top: Math.random() * 100 + 'vh',
                boxShadow: '0 0 20px var(--color-primary)'
              }}
              animate={{ 
                scale: [1, 2, 1],
                opacity: [0.2, 0.8, 0.2]
              }}
              transition={{ 
                duration: Math.random() * 3 + 2, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: Math.random() * 2
              }}
            />
          ))}
        </motion.div>
      </div>

      <motion.div
        className="flex flex-col items-center text-center z-10 bg-black/40 p-[4vw] rounded-[3vw] border border-[var(--color-primary)]/20 backdrop-blur-xl"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <motion.h2
          className="text-[4vw] font-display text-[var(--color-text-primary)] tracking-wide mb-[6vh]"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 1.0, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          Every Member Becomes a <span className="text-[var(--color-primary)] italic">Growth Engine</span>
        </motion.h2>

        <motion.div
          className="text-[1.8vw] font-body text-[var(--color-text-secondary)] tracking-widest uppercase mb-[4vh] flex flex-col gap-[3vh]"
        >
          <motion.div
            initial={{ x: -30, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: 2.0, duration: 1.2, ease: "easeOut" }}
          >
            Help a friend buy a car <span className="text-[var(--color-primary)] mx-4">→</span> earn commission automatically
          </motion.div>
          
          <motion.div
            className="text-[var(--color-primary)] font-semibold mt-4"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 3.5, duration: 1.2, ease: "easeOut" }}
          >
            K-Factor {'>'} 1 — the network grows itself
          </motion.div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}