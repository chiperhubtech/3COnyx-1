import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak, stopAudio } from '@/lib/voiceover';

export function Scene6_Kilocorn() {
  useEffect(() => {
    speak("Kilocorn infrastructure. This is not an app. This is protocol-level infrastructure designed for one trillion dollars and beyond. Developer Platform with API keys, rate limiting, and webhooks. Federation Protocol connecting dealerships, mechanics, and service nodes worldwide. Settlement Layer with instant multi-party split payments. IoT Gateway for connected vehicles and telematics. Governance engine. Data intelligence. The AWS of automotive.", "scene6");
    return () => stopAudio("scene6");
  }, []);

  const layers = [
    { name: "Developer Platform", desc: "API keys, rate limits, webhooks, sandbox", icon: "⚡" },
    { name: "Federation Protocol", desc: "Dealerships, mechanics, nodes — interconnected", icon: "🌐" },
    { name: "Settlement Layer", desc: "Instant multi-party split payments", icon: "💰" },
    { name: "Plugin Marketplace", desc: "Third-party extensions and modules", icon: "🧩" },
    { name: "IoT Gateway", desc: "Connected vehicles, telematics, OBD", icon: "📡" },
    { name: "Governance Engine", desc: "Voting, proposals, protocol upgrades", icon: "⚖️" },
    { name: "Data Intelligence", desc: "Analytics, ML pipelines, market data", icon: "📊" },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      style={{ padding: '0 5vw' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(5px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.p
        className="font-body text-[#C9A227] uppercase tracking-widest font-semibold"
        style={{ fontSize: '1.2vw', letterSpacing: '0.3em', marginBottom: '0.8vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        KILOCORN INFRASTRUCTURE
      </motion.p>

      <motion.h2
        className="font-display font-bold text-white text-center leading-tight"
        style={{ fontSize: '3vw', marginBottom: '0.8vh' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        The <span className="text-[#C9A227]">AWS</span> of Automotive
      </motion.h2>

      <motion.p
        className="font-body text-[#8B8680] text-center"
        style={{ fontSize: '1.2vw', marginBottom: '3vh', maxWidth: '50vw' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        Protocol-level infrastructure others build on. Designed from day one for $1T+.
      </motion.p>

      <div className="w-full flex flex-col items-center" style={{ gap: '0.8vh', maxWidth: '65vw' }}>
        {layers.map((layer, i) => (
          <motion.div
            key={layer.name}
            className="w-full flex items-center bg-[#0A0A0A]/80"
            style={{
              padding: '1.5vh 2vw',
              border: '1px solid rgba(201,162,39,0.2)',
              borderLeft: '4px solid #C9A227',
              borderRadius: '0 0.5vw 0.5vw 0',
            }}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 1.3 + i * 0.2 }}
          >
            <span style={{ fontSize: '1.5vw', marginRight: '1.2vw' }}>{layer.icon}</span>
            <div className="flex-1">
              <span className="text-[#C9A227] font-bold" style={{ fontSize: '1.1vw' }}>{layer.name}</span>
              <span className="text-[#8B8680] ml-2" style={{ fontSize: '0.9vw' }}>— {layer.desc}</span>
            </div>
            <div className="rounded bg-[#10B981]/20 text-[#10B981] font-bold" style={{ padding: '0.3vh 0.8vw', fontSize: '0.6vw' }}>LIVE</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="text-center"
        style={{ marginTop: '2vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 3.5 }}
      >
        <span className="text-[#8B8680] italic" style={{ fontSize: '1.1vw' }}>"Others build apps. We built the infrastructure apps run on."</span>
      </motion.div>
    </motion.div>
  );
}
