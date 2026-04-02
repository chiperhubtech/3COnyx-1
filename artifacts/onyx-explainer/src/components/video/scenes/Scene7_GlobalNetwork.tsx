import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak, stopAudio } from '@/lib/voiceover';

export function Scene7_GlobalNetwork() {
  useEffect(() => {
    speak("The Global Automotive Economic Network. ONYX Wallet: Cash App for cars. Send, receive, split, and settle, all in one tap. Global remittance across twenty-eight currencies, Haiti to Florida in seconds. Location nodes turning every gas station and mechanic shop into a revenue-generating point on the network. Twenty culture-driven visual themes from Motorsport to Military, GTA to Luxury. This platform lives and breathes culture.", "scene7");
    return () => stopAudio("scene7");
  }, []);

  const features = [
    {
      title: "ONYX Wallet",
      desc: "Cash App for Cars",
      detail: "Send, receive, split, settle — one tap",
      color: "#10B981",
    },
    {
      title: "Global Remittance",
      desc: "28 Currencies",
      detail: "Haiti → Florida in seconds. 1.5% fee.",
      color: "#3B82F6",
    },
    {
      title: "Location Nodes",
      desc: "Revenue Network",
      detail: "Every gas station = revenue-generating node",
      color: "#F59E0B",
    },
    {
      title: "20 Themes",
      desc: "Culture-Driven",
      detail: "Motorsport, GTA, Military, Luxury, more",
      color: "#A855F7",
    },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      style={{ padding: '0 5vw' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(5px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.p
        className="font-body text-[#C9A227] uppercase tracking-widest font-semibold"
        style={{ fontSize: '1.2vw', letterSpacing: '0.3em', marginBottom: '0.8vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        GLOBAL ECONOMIC NETWORK
      </motion.p>

      <motion.h2
        className="font-display font-bold text-white text-center leading-tight"
        style={{ fontSize: '3vw', marginBottom: '0.8vh' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        Money Moves. <span className="text-[#C9A227]">Globally.</span> Instantly.
      </motion.h2>

      <motion.p
        className="font-body text-[#8B8680] text-center"
        style={{ fontSize: '1.2vw', marginBottom: '3vh', maxWidth: '55vw' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        From the block to the boardroom. From Port-au-Prince to Miami. The network has no borders.
      </motion.p>

      <div className="grid grid-cols-2 w-full" style={{ gap: '1.5vw', maxWidth: '70vw' }}>
        {features.map((f, i) => (
          <motion.div
            key={f.title}
            className="bg-[#0A0A0A]/80 flex flex-col"
            style={{
              padding: '3vh 2.5vw',
              border: `1px solid ${f.color}33`,
              borderLeft: `4px solid ${f.color}`,
              borderRadius: '0 0.8vw 0.8vw 0',
            }}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 1.3 + i * 0.3 }}
          >
            <div className="flex items-center" style={{ gap: '1vw', marginBottom: '0.8vh' }}>
              <span className="font-display font-bold" style={{ fontSize: '1.5vw', color: f.color }}>{f.title}</span>
              <span className="text-white/50" style={{ fontSize: '1vw' }}>|</span>
              <span className="text-white font-semibold" style={{ fontSize: '1.1vw' }}>{f.desc}</span>
            </div>
            <span className="text-[#8B8680]" style={{ fontSize: '1vw' }}>{f.detail}</span>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="flex items-center justify-center"
        style={{ marginTop: '3vh', gap: '3vw' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 3.5 }}
      >
        <div className="text-center">
          <span className="font-display font-bold text-[#C9A227]" style={{ fontSize: '2.5vw' }}>28</span>
          <p className="text-[#8B8680] uppercase tracking-wider" style={{ fontSize: '0.7vw' }}>Currencies</p>
        </div>
        <div className="text-center">
          <span className="font-display font-bold text-[#C9A227]" style={{ fontSize: '2.5vw' }}>14</span>
          <p className="text-[#8B8680] uppercase tracking-wider" style={{ fontSize: '0.7vw' }}>Corridors</p>
        </div>
        <div className="text-center">
          <span className="font-display font-bold text-[#C9A227]" style={{ fontSize: '2.5vw' }}>20</span>
          <p className="text-[#8B8680] uppercase tracking-wider" style={{ fontSize: '0.7vw' }}>Themes</p>
        </div>
        <div className="text-center">
          <span className="font-display font-bold text-[#C9A227]" style={{ fontSize: '2.5vw' }}>4</span>
          <p className="text-[#8B8680] uppercase tracking-wider" style={{ fontSize: '0.7vw' }}>Languages</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
