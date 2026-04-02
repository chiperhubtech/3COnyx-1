import { motion } from 'framer-motion';
import { OnyxLogo } from '../OnyxLogo';

export function Scene4_Closing() {
  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10 bg-[var(--color-bg-dark)]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 1 }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle radial glow */}
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{ background: 'radial-gradient(circle at center, var(--color-primary) 0%, transparent 60%)' }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.2 }}
          transition={{ duration: 2, ease: "easeOut" }}
        />
      </div>

      <motion.div
        initial={{ scale: 0.5, opacity: 0, filter: "blur(10px)" }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <OnyxLogo className="w-[10vw] h-[10vw] mb-[6vh]" />
      </motion.div>

      <div className="overflow-hidden">
        <motion.h2 
          className="text-[4vw] font-display text-[var(--color-text-primary)] tracking-wide mb-[8vh]"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ delay: 0.5, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          ONYX acts; <span className="text-[var(--color-primary)] italic">member confirms.</span>
        </motion.h2>
      </div>

      <motion.div
        className="flex flex-col items-center gap-[1vh]"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 1, ease: "easeOut" }}
      >
        <p className="text-[1.2vw] font-body text-[var(--color-text-secondary)] tracking-widest uppercase">
          CarFax tells you. <span className="text-[var(--color-primary)]">ONYX proves it.</span>
        </p>
        <div className="w-[20vw] h-[1px] bg-[var(--color-text-muted)]/30 my-[1vh]" />
        <p className="text-[1vw] font-body text-[var(--color-text-muted)] tracking-widest uppercase">
          Architect: Ronald Antonio Cadet, CVO
        </p>
        <p className="text-[0.8vw] font-body text-[var(--color-text-muted)]/50 tracking-widest uppercase">
          CUXTOMCANDYCLUB LLC
        </p>
      </motion.div>
    </motion.div>
  );
}