import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';

export function Scene1_Problem() {
  useEffect(() => {
    speak("The automotive industry is broken. It takes 14 days to close a single deal. 5 different vendors. 4.2 hours wasted per buyer. And zero cryptographic proof of anything.");
    return () => window.speechSynthesis.cancel();
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 1.5, delayChildren: 1.5 }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      style={{ padding: '0 10vw' }}
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(5px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.h2
        className="font-display font-bold text-white text-center"
        style={{ fontSize: '3.5vw', marginBottom: '5vh' }}
        initial={{ opacity: 0, y: '-3vh' }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.5 }}
      >
        The Automotive Industry <span className="text-[#EF4444]">Is Broken</span>
      </motion.h2>

      <motion.div
        className="grid grid-cols-2 w-full"
        style={{ gap: '4vh 6vw' }}
        variants={container}
        initial="hidden"
        animate="show"
      >
        {[
          { text: "14 days", sub: "to close a deal" },
          { text: "5 vendors", sub: "per sale" },
          { text: "4.2 hours", sub: "wasted per buyer" },
          { text: "Zero", sub: "cryptographic proof" }
        ].map((point, i) => (
          <motion.div key={i} variants={item} className="flex flex-col items-start" style={{ borderLeft: '0.2vw solid rgba(239,68,68,0.3)', paddingLeft: '2vw' }}>
            <div className="font-display text-[#EF4444] font-bold leading-none" style={{ fontSize: '2.5vw', marginBottom: '0.8vh' }}>{point.text}</div>
            <div className="text-[#8B8680] uppercase tracking-wider leading-none" style={{ fontSize: '1.2vw' }}>{point.sub}</div>
          </motion.div>
        ))}
      </motion.div>
    </motion.div>
  );
}
