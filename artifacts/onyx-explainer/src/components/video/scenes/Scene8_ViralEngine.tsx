import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';

export function Scene8_ViralEngine() {
  useEffect(() => {
    speak("The Street Economy. A gas station clerk places a QR code on a pump. A driver scans it to fix a flat tire. ONYX dispatches the service. The vehicle history is stamped. The clerk is paid instantly. This is the money network.");
    return () => window.speechSynthesis.cancel();
  }, []);

  const steps = [
    { icon: "📲", label: "QR Placed", sub: "Gas Station / Shop / Bay" },
    { icon: "👆", label: "Driver Scans", sub: "10-Second Onboarding" },
    { icon: "⚡", label: "ONYX Dispatches", sub: "Service Routed Instantly" },
    { icon: "🔗", label: "Proof Stamped", sub: "SHA-256 Hash Chain" },
    { icon: "💰", label: "Clerk Paid", sub: "Commission Instant" },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center"
      style={{ padding: '0 6vw' }}
      initial={{ opacity: 0, scale: 1.2 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(5px)' }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.p
        className="font-body text-[#C9A227] uppercase tracking-widest font-semibold"
        style={{ fontSize: '1.2vw', letterSpacing: '0.3em', marginBottom: '1.5vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        THE STREET ECONOMY
      </motion.p>

      <motion.h2
        className="font-display font-bold text-white"
        style={{ fontSize: '3vw', marginBottom: '1.5vh' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.8 }}
      >
        Every Surface Becomes a <br />
        <span className="text-gradient-gold">Point-of-Sale</span>
      </motion.h2>

      <motion.p
        className="font-body text-[#8B8680]"
        style={{ fontSize: '1.3vw', marginBottom: '5vh', maxWidth: '50vw' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.3 }}
      >
        QR on a pump → scan → service dispatched → vehicle stamped → clerk paid. Instantly.
      </motion.p>

      <div className="flex items-center justify-center" style={{ gap: '1vw', width: '80vw' }}>
        {steps.map((step, i) => (
          <motion.div
            key={step.label}
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 2 + i * 0.4 }}
          >
            <div className="flex flex-col items-center" style={{ minWidth: '10vw' }}>
              <div
                className="rounded-full bg-[#0A0A0A] flex items-center justify-center"
                style={{
                  width: '4.5vw', height: '4.5vw',
                  border: '2px solid rgba(201,162,39,0.5)',
                  boxShadow: '0 0 20px rgba(201,162,39,0.15)',
                  fontSize: '2vw',
                }}
              >
                {step.icon}
              </div>
              <span className="text-white font-semibold" style={{ fontSize: '0.9vw', marginTop: '1vh' }}>{step.label}</span>
              <span className="text-[#8B8680]" style={{ fontSize: '0.7vw', marginTop: '0.3vh' }}>{step.sub}</span>
            </div>
            {i < steps.length - 1 && (
              <motion.span
                className="text-[#C9A227] font-bold"
                style={{ fontSize: '1.5vw', margin: '0 0.3vw', marginBottom: '3vh' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 2.2 + i * 0.4 }}
              >
                →
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
