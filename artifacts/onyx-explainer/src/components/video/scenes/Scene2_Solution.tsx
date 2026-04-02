import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene2_Solution() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      {...sceneTransitions.scaleFade}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="relative flex flex-col items-center justify-center w-full h-full">
        {/* Implosion / Consolidation effect */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0">
          {[1, 2, 3, 4].map((ring, i) => (
            <motion.div
              key={ring}
              className="absolute border border-[var(--color-primary)] rounded-full"
              initial={{ width: "120vw", height: "120vw", opacity: 0 }}
              animate={{ width: 0, height: 0, opacity: [0, 0.4, 0] }}
              transition={{ delay: i * 0.4, duration: 2.5, ease: "circIn" }}
            />
          ))}
        </div>

        <motion.div
          className="absolute w-[10vw] h-[10vw] bg-[var(--color-primary)] rounded-full shadow-[0_0_100px_var(--color-primary)] z-10 mix-blend-screen"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 1.2, 1], opacity: [0, 0.8, 0.5] }}
          transition={{ delay: 1.5, duration: 2, type: "spring", stiffness: 100 }}
        />

        <div className="z-20 text-center flex flex-col items-center mt-[10vh]">
          <motion.h2
            className="text-[6vw] font-display text-[var(--color-text-primary)] tracking-wide leading-tight mb-[4vh]"
            initial={{ y: 50, opacity: 0, filter: "blur(20px)" }}
            animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
            transition={{ delay: 2.0, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            One Platform. <span className="text-[var(--color-primary)] italic">One Tap.</span>
          </motion.h2>

          <motion.p
            className="text-[1.8vw] font-body text-[var(--color-text-secondary)] tracking-widest uppercase max-w-[70vw] leading-relaxed"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 3.0, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
          >
            Every transaction in automotive — purchase, service, parts, insurance — reduced to a single confirmation
          </motion.p>
        </div>
      </div>
    </motion.div>
  );
}