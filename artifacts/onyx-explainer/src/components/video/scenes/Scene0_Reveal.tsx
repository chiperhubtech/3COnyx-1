import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak, stopAudio } from '@/lib/voiceover';
import { OnyxLogo } from '../OnyxLogo';

export function Scene0_Reveal() {
  useEffect(() => {
    speak("Two point seven trillion dollars. That's the global automotive industry. And it still runs on fax machines and handshake deals. 3C ONYX. The Global Automotive Liquidity Network. Where every human, automobile, and transaction goes from ordinary to extraordinary.", "scene0");
    return () => stopAudio("scene0");
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        initial={{ scale: 0.6, opacity: 0, filter: 'blur(20px)' }}
        animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
        transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: '2vh' }}
      >
        <OnyxLogo className="drop-shadow-[0_0_40px_rgba(201,162,39,0.4)]" style={{ width: '14vw', height: '14vw' }} />
      </motion.div>

      <div className="text-center">
        <motion.div
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[#C9A227] font-bold"
          style={{ fontSize: '2vw', marginBottom: '1vh', letterSpacing: '0.15em' }}
        >
          $2.7 TRILLION INDUSTRY
        </motion.div>

        <motion.h1
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2, delay: 1.8, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[#F5F0E1] font-semibold tracking-wide leading-none"
          style={{ fontSize: '5.5vw', marginBottom: '1.5vh' }}
        >
          3C ONYX
        </motion.h1>

        <motion.p
          initial={{ y: 15, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2, delay: 2.5, ease: [0.16, 1, 0.3, 1] }}
          className="font-body text-[#C9A227] uppercase"
          style={{ fontSize: '1.8vw', letterSpacing: '0.2em', marginBottom: '1.5vh' }}
        >
          Global Automotive Liquidity Network
        </motion.p>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 1.2, delay: 3.2, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-[#F5F0E1] italic font-semibold"
          style={{ fontSize: '1.6vw', marginBottom: '2vh' }}
        >
          "<span className="text-[#C9A227]">Xtraordinary</span> for the ordinary. Lightning doesn't wait. Neither do we. <span className="text-[#C9A227]">Join us.</span>"
        </motion.p>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5, delay: 4.0, ease: 'easeInOut' }}
          className="font-body text-[#8B8680] uppercase tracking-widest"
          style={{ fontSize: '1vw' }}
        >
          Exclusively by CUXTOMCANDYCLUB LLC
        </motion.div>
      </div>
    </motion.div>
  );
}
