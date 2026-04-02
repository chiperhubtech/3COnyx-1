import { motion } from 'framer-motion';
import { OnyxLogo } from '../OnyxLogo';

export function Scene0_Reveal() {
  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
      transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <OnyxLogo className="w-[15vw] h-[15vw]" />
      </motion.div>
      
      <div className="mt-[4vh] overflow-hidden">
        <motion.h1 
          className="text-[6vw] font-display text-[var(--color-primary)] tracking-[0.2em] uppercase"
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          transition={{ delay: 0.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          3C ONYX
        </motion.h1>
      </div>

      <motion.div 
        className="h-[1px] bg-gradient-to-r from-transparent via-[var(--color-primary)] to-transparent"
        initial={{ width: 0, opacity: 0 }}
        animate={{ width: "30vw", opacity: 0.5 }}
        transition={{ delay: 0.8, duration: 1.2, ease: "easeInOut" }}
      />

      <div className="mt-[2vh] overflow-hidden">
        <motion.p
          className="text-[1.5vw] font-body text-[var(--color-text-secondary)] tracking-widest uppercase"
          initial={{ y: "-100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.9, duration: 1, ease: [0.16, 1, 0.3, 1] }}
        >
          Sovereign Automotive Ecosystem OS
        </motion.p>
      </div>
    </motion.div>
  );
}