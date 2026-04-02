import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';

export function Scene8_ViralEngine() {
  useEffect(() => {
    speak("Lean Startup to launch. Blitzscaling to win. Phase 1: Bootstrap. 25 deals per month, $6,250 monthly revenue. Validate the unit economics. Phase 2: 10 million users. Network effects compound. Every new QR code increases the value for every existing user. Phase 3: 100 million users. ONYX becomes the protocol layer for the global automotive industry. AI agents handle execution. AR overlays inspect vehicles. Humanoid robotics fulfill service. Full autonomy. Move faster than the market can react.");
    return () => window.speechSynthesis.cancel();
  }, []);

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      style={{ padding: '0 6vw' }}
      initial={{ opacity: 0, scale: 1.05 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(5px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.p
        className="font-body text-[#C9A227] uppercase tracking-widest font-semibold"
        style={{ fontSize: '1.2vw', letterSpacing: '0.3em', marginBottom: '1vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        LEAN STARTUP → BLITZSCALING
      </motion.p>

      <motion.h2
        className="font-display font-bold text-white text-center"
        style={{ fontSize: '3vw', marginBottom: '5vh' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        The Trajectory: <span className="text-[#C9A227]">10M → 100M Users</span>
      </motion.h2>

      <div className="w-full flex flex-col" style={{ gap: '2.5vh', maxWidth: '70vw' }}>
        <motion.div
          className="flex justify-between items-center bg-[#0A0A0A]/80"
          style={{ padding: '2.5vh 3vw', border: '1px solid rgba(201,162,39,0.2)', borderRadius: '0.8vw' }}
          initial={{ opacity: 0, x: '-5vw' }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 1 }}
        >
          <div>
            <div className="text-[#8B8680] uppercase tracking-widest font-semibold" style={{ fontSize: '0.9vw', marginBottom: '0.5vh' }}>PHASE I — BOOTSTRAP</div>
            <div className="text-white font-medium" style={{ fontSize: '1.5vw' }}>25 deals/month • Validate unit economics</div>
          </div>
          <div className="text-right">
            <div className="font-display font-bold text-[#C9A227]" style={{ fontSize: '2.5vw' }}>$6,250</div>
            <div className="text-[#8B8680]" style={{ fontSize: '0.9vw' }}>MRR</div>
          </div>
        </motion.div>

        <motion.div
          className="flex justify-between items-center bg-[#0A0A0A]/80"
          style={{ padding: '2.5vh 3vw', border: '2px solid rgba(201,162,39,0.4)', borderRadius: '0.8vw' }}
          initial={{ opacity: 0, x: '-5vw' }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 2 }}
        >
          <div>
            <div className="text-[#C9A227] uppercase tracking-widest font-semibold" style={{ fontSize: '0.9vw', marginBottom: '0.5vh' }}>PHASE II — 10M USERS</div>
            <div className="text-white font-bold" style={{ fontSize: '1.5vw' }}>Network effects compound • K&gt;1</div>
          </div>
          <div className="text-right">
            <div className="font-display font-bold text-gradient-gold" style={{ fontSize: '2.5vw' }}>$37,500</div>
            <div className="text-[#8B8680]" style={{ fontSize: '0.9vw' }}>MRR • 7.5x DCR</div>
          </div>
        </motion.div>

        <motion.div
          className="flex justify-between items-center bg-gradient-to-r from-[#C9A227]/10 to-[#0A0A0A]/80"
          style={{ padding: '2.5vh 3vw', border: '2px solid #C9A227', borderRadius: '0.8vw', boxShadow: '0 0 30px rgba(201,162,39,0.15)' }}
          initial={{ opacity: 0, x: '-5vw' }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1, delay: 3 }}
        >
          <div>
            <div className="text-[#C9A227] uppercase tracking-widest font-bold" style={{ fontSize: '0.9vw', marginBottom: '0.5vh' }}>PHASE III — 100M USERS</div>
            <div className="text-white font-bold" style={{ fontSize: '1.5vw' }}>ONYX becomes the protocol layer</div>
          </div>
          <div className="text-right">
            <div className="font-display font-bold text-[#C9A227]" style={{ fontSize: '2.5vw' }}>STANDARD</div>
            <div className="text-[#8B8680]" style={{ fontSize: '0.9vw' }}>Global automotive</div>
          </div>
        </motion.div>
      </div>

      <motion.p
        className="text-[#8B8680] italic text-center"
        style={{ fontSize: '1.2vw', marginTop: '3vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 4.5 }}
      >
        "First-scaler advantage. Move faster than the market can react."
      </motion.p>
    </motion.div>
  );
}
