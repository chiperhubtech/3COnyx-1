import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene4_HowItWorks() {
  const steps = [
    "ONYX handles everything behind the scenes",
    "Member gets one confirmation prompt",
    "Done. Everything is handled."
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      {...sceneTransitions.fadeBlur}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.h2
        className="text-[4vw] font-display text-[var(--color-text-primary)] tracking-wide mb-[8vh] text-center"
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
      >
        ONYX acts; <span className="text-[var(--color-primary)] italic">member confirms.</span>
      </motion.h2>

      <div className="flex gap-[4vw] items-stretch justify-center w-full max-w-[90vw]">
        {steps.map((step, i) => (
          <motion.div
            key={i}
            className="flex-1 flex flex-col items-center text-center bg-gradient-to-b from-black/60 to-transparent border border-white/5 p-[2vw] rounded-[1.5vw] relative"
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 2.0 + i * 1.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="w-[4vw] h-[4vw] rounded-full bg-black border-[0.2vw] border-[var(--color-primary)] flex items-center justify-center mb-[3vh] shadow-[0_0_30px_rgba(201,162,39,0.2)]">
              <span className="text-[1.8vw] font-display text-[var(--color-primary)]">{i + 1}</span>
            </div>
            
            <p className="text-[1.5vw] font-body text-[var(--color-text-primary)] leading-relaxed tracking-wide">
              {step}
            </p>

            {i < steps.length - 1 && (
              <motion.div 
                className="absolute -right-[2vw] top-1/2 w-[2vw] h-[2px] bg-[var(--color-primary)]/50"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: 1 }}
                transition={{ delay: 2.0 + i * 1.5 + 0.8, duration: 0.8 }}
                style={{ originX: 0, y: "-50%" }}
              />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}