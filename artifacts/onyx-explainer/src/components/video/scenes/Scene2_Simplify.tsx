import { motion } from 'framer-motion';

export function Scene2_Simplify() {
  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="relative flex items-center justify-center w-[30vw] h-[30vw]">
        {/* Implosion effect rings */}
        {[1, 2, 3].map((ring, i) => (
          <motion.div
            key={ring}
            className="absolute border border-[var(--color-primary)] rounded-full opacity-0"
            initial={{ width: "100vw", height: "100vw", opacity: 0 }}
            animate={{ width: 0, height: 0, opacity: [0, 0.5, 0] }}
            transition={{ delay: i * 0.2, duration: 1, ease: "circIn" }}
          />
        ))}

        {/* The single tap point */}
        <motion.div 
          className="absolute w-[4vw] h-[4vw] bg-[var(--color-primary)] rounded-full shadow-[0_0_50px_var(--color-primary)] z-20"
          initial={{ scale: 0 }}
          animate={{ scale: [0, 1.5, 1] }}
          transition={{ delay: 0.8, duration: 0.6, type: "spring", stiffness: 200 }}
        />

        {/* Outward ripple after tap */}
        <motion.div
          className="absolute border-2 border-[var(--color-primary)] rounded-full"
          initial={{ width: "4vw", height: "4vw", opacity: 0 }}
          animate={{ width: "40vw", height: "40vw", opacity: [0, 1, 0] }}
          transition={{ delay: 1.2, duration: 1.5, ease: "easeOut" }}
        />
      </div>

      <motion.h2 
        className="absolute bottom-[20vh] text-[4.5vw] font-display text-[var(--color-text-primary)] tracking-wide"
        initial={{ y: 20, opacity: 0, filter: "blur(10px)" }}
        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
        transition={{ delay: 1.4, duration: 1, ease: [0.16, 1, 0.3, 1] }}
      >
        Reduced to <span className="text-[var(--color-primary)] italic">one tap</span>
      </motion.h2>
    </motion.div>
  );
}