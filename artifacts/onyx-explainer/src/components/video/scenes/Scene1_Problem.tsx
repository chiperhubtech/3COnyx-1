import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak, stopAudio } from '@/lib/voiceover';

export function Scene1_Problem() {
  useEffect(() => {
    speak("Twelve handoffs per deal. Fourteen days to close. Five vendors that don't talk to each other. The car business loses billions every year to inefficiency, fraud, and broken trust. This isn't disruption. This is reconstruction.", "scene1");
    return () => stopAudio("scene1");
  }, []);

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.8, delayChildren: 1.5 }
    }
  };

  const item = {
    hidden: { opacity: 0, x: -20 },
    show: { opacity: 1, x: 0, transition: { duration: 0.8, ease: "easeOut" as const } }
  };

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      style={{ padding: '0 8vw' }}
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(5px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.p
        className="font-body text-[#EF4444] uppercase tracking-widest font-semibold"
        style={{ fontSize: '1.2vw', letterSpacing: '0.3em', marginBottom: '1.5vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        $2.7 TRILLION PROBLEM
      </motion.p>

      <motion.h2
        className="font-display font-bold text-white text-center"
        style={{ fontSize: '3.5vw', marginBottom: '1vh' }}
        initial={{ opacity: 0, y: '-3vh' }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.2, delay: 0.5 }}
      >
        A 1950s Model in a <span className="text-[#EF4444]">Smartphone World</span>
      </motion.h2>

      <motion.p
        className="font-body text-[#8B8680] text-center"
        style={{ fontSize: '1.3vw', maxWidth: '50vw', marginBottom: '4vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        The automotive industry was never digitized. It was just given email.
      </motion.p>

      <motion.div
        className="grid grid-cols-3 w-full"
        style={{ gap: '3vw' }}
        variants={container}
        initial="hidden"
        animate="show"
      >
        {[
          { text: "14 days", sub: "to close one deal", detail: "12 handoffs between departments" },
          { text: "4.2 hours", sub: "wasted per buyer", detail: "Credit pulled 3x, no transparency" },
          { text: "Zero", sub: "cryptographic proof", detail: "History can be fabricated" }
        ].map((point, i) => (
          <motion.div key={i} variants={item} className="flex flex-col items-center text-center bg-[#0A0A0A]/80" style={{ padding: '3vh 2vw', borderTop: '3px solid rgba(239,68,68,0.5)', borderRadius: '0.5vw' }}>
            <div className="font-display text-[#EF4444] font-bold leading-none" style={{ fontSize: '3vw', marginBottom: '0.8vh' }}>{point.text}</div>
            <div className="text-white font-semibold uppercase tracking-wider" style={{ fontSize: '1.2vw', marginBottom: '1vh' }}>{point.sub}</div>
            <div className="text-[#8B8680]" style={{ fontSize: '1vw' }}>{point.detail}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.p
        className="font-body text-[#8B8680] italic text-center"
        style={{ fontSize: '1.2vw', marginTop: '3vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 5 }}
      >
        5 vendors per sale: VinSolutions, Dealertrack, RouteOne, Simoniz, Sonsio.
      </motion.p>
    </motion.div>
  );
}
