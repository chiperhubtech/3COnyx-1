import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';
import { OnyxLogo } from '../OnyxLogo';

export function Scene6_Closing() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      {...sceneTransitions.fadeBlur}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Subtle radial glow */}
        <motion.div
          className="absolute inset-0 opacity-30"
          style={{ background: 'radial-gradient(circle at center, var(--color-primary) 0%, transparent 50%)' }}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 0.3 }}
          transition={{ duration: 2.5, ease: "easeOut" }}
        />
      </div>

      <motion.div
        initial={{ scale: 0.5, opacity: 0, filter: "blur(20px)" }}
        animate={{ scale: 1, opacity: 1, filter: "blur(0px)" }}
        transition={{ duration: 2, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="mb-12"
      >
        <OnyxLogo className="w-[12vw] h-[12vw]" />
      </motion.div>

      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2.0, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <h2 className="text-[4vw] font-display text-[var(--color-text-primary)] tracking-wide mb-[8vh]">
          The Future of Automotive. <span className="text-[var(--color-primary)] italic">Already Built.</span>
        </h2>

        <div className="flex flex-col gap-[2vh] text-[1.5vw] font-body text-[var(--color-text-secondary)] tracking-widest uppercase">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 3.5, duration: 1.5 }}
          >
            <span className="text-[var(--color-text-muted)]">Architect:</span> Ronald Antonio Cadet — CVO/Founder
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 4.0, duration: 1.5 }}
          >
            ron@cuxtomcandyclub.com
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
}