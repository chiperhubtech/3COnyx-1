import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene1_Problem() {
  const painPoints = [
    "14 days to close a deal. 5 vendors per sale.",
    "4.2 hours wasted per buyer.",
    "Zero cryptographic proof of anything."
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      {...sceneTransitions.fadeBlur}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-[var(--color-error)] opacity-10"
            style={{
              height: '1px',
              width: Math.random() * 40 + 10 + 'vw',
              left: Math.random() * 100 + 'vw',
              top: Math.random() * 100 + 'vh',
            }}
            initial={{ x: -100, rotate: (Math.random() - 0.5) * 20 }}
            animate={{ x: [null, (Math.random() > 0.5 ? 1 : -1) * 800] }}
            transition={{ duration: Math.random() * 2 + 1, repeat: Infinity, ease: "linear" }}
          />
        ))}
      </div>

      <motion.div
        className="flex flex-col items-center w-full max-w-[80vw]"
      >
        <motion.h2
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-[4vw] font-display text-[var(--color-text-primary)] text-center leading-tight mb-[8vh] tracking-wide"
        >
          The Automotive Industry Is <span className="text-[var(--color-error)] italic">Broken</span>
        </motion.h2>

        <div className="flex flex-col gap-[4vh] w-full items-center">
          {painPoints.map((point, i) => (
            <motion.div
              key={i}
              className="flex items-center gap-[2vw] bg-black/40 border border-white/5 backdrop-blur-md p-[2vw] rounded-[1vw] w-[60vw]"
              initial={{ opacity: 0, x: -50, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
              transition={{ delay: 2.0 + i * 2.0, duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="w-[0.5vw] h-[0.5vw] rounded-full bg-[var(--color-error)] shadow-[0_0_10px_var(--color-error)] shrink-0" />
              <span className="text-[1.8vw] font-body text-[var(--color-text-secondary)] tracking-wide">
                {point}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}