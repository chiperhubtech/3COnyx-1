import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';

export function Scene7_Growth() {
  useEffect(() => {
    speak("This is the breakthrough. A gas station clerk tapes a QR code to a pump. A driver scans it to fix a flat tire. ONYX dispatches the service. The vehicle history is stamped. The clerk earns commission instantly. No training. No inventory. No overhead. Just a QR code and a smartphone. Viral coefficient greater than one. The network compounds itself.");
    return () => window.speechSynthesis.cancel();
  }, []);

  const steps = [
    { icon: "📲", label: "QR Placed", sub: "Gas pump, counter, window" },
    { icon: "👆", label: "Driver Scans", sub: "10-second onboarding" },
    { icon: "⚡", label: "ONYX Dispatches", sub: "AI routes service" },
    { icon: "🔗", label: "Proof Stamped", sub: "SHA-256 hash chain" },
    { icon: "💰", label: "Clerk Paid", sub: "Stripe instant" },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10 text-center"
      style={{ padding: '0 5vw' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.p
        className="font-body text-[#C9A227] uppercase tracking-widest font-semibold"
        style={{ fontSize: '1.2vw', letterSpacing: '0.3em', marginBottom: '1vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.3 }}
      >
        THE STREET ECONOMY
      </motion.p>

      <motion.h2
        className="font-display font-bold text-white"
        style={{ fontSize: '3.2vw', marginBottom: '1vh' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        Every Surface Becomes a <span className="text-gradient-gold">Point-of-Sale</span>
      </motion.h2>

      <motion.p
        className="font-body text-[#8B8680]"
        style={{ fontSize: '1.3vw', marginBottom: '4vh', maxWidth: '50vw' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1 }}
      >
        Zero training. Zero inventory. Zero overhead. Just a QR code and a smartphone.
      </motion.p>

      <div className="flex items-center justify-center" style={{ gap: '0.8vw', width: '85vw' }}>
        {steps.map((step, i) => (
          <motion.div
            key={step.label}
            className="flex items-center"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 1.5 + i * 0.4 }}
          >
            <div className="flex flex-col items-center" style={{ minWidth: '11vw' }}>
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
                style={{ fontSize: '1.5vw', margin: '0 0.2vw', marginBottom: '3vh' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.7 + i * 0.4 }}
              >
                →
              </motion.span>
            )}
          </motion.div>
        ))}
      </div>

      <motion.div
        className="flex items-center justify-center"
        style={{ marginTop: '4vh', gap: '4vw' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 4.5 }}
      >
        <div className="text-center">
          <div className="font-display font-bold text-[#C9A227]" style={{ fontSize: '3vw' }}>K&gt;1</div>
          <div className="text-[#8B8680] uppercase tracking-wider" style={{ fontSize: '0.8vw' }}>Viral Coefficient</div>
        </div>
        <div className="text-center">
          <div className="font-display font-bold text-[#C9A227]" style={{ fontSize: '3vw' }}>$0</div>
          <div className="text-[#8B8680] uppercase tracking-wider" style={{ fontSize: '0.8vw' }}>Customer Acq. Cost</div>
        </div>
        <div className="text-center">
          <div className="font-display font-bold text-[#C9A227]" style={{ fontSize: '3vw' }}>10s</div>
          <div className="text-[#8B8680] uppercase tracking-wider" style={{ fontSize: '0.8vw' }}>Setup Time</div>
        </div>
      </motion.div>
    </motion.div>
  );
}
