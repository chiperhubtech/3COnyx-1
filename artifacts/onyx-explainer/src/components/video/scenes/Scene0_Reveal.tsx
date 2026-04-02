import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';
import { OnyxLogo } from '../OnyxLogo';

export function Scene0_Reveal() {
  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      {...sceneTransitions.fadeBlur}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      {/* 3C Logo Reveal */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0, filter: 'blur(10px)' }}
        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 2, ease: [0.16, 1, 0.3, 1] }}
        className="mb-[5vh]"
      >
        <OnyxLogo className="w-[15vw] h-[15vw] drop-shadow-[0_0_30px_rgba(201,162,39,0.3)]" />
      </motion.div>

      {/* Brand Text */}
      <div className="text-center">
        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.5, ease: [0.16, 1, 0.3, 1] }}
          className="text-[6vw] font-display text-[#F5F0E1] mb-[3vh] font-semibold tracking-wide leading-none"
        >
          3C ONYX
        </motion.h1>
        
        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2, delay: 2.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-[2vw] font-body text-[#C9A227] uppercase tracking-[0.2em] mb-[6vh]"
        >
          Sovereign Automotive Ecosystem OS
        </motion.p>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 3.5, ease: 'easeInOut' }}
          className="text-[1vw] font-body text-[#8B8680] uppercase tracking-widest"
        >
          By CUXTOMCANDYCLUB LLC
        </motion.div>
      </div>
    </motion.div>
  );
}