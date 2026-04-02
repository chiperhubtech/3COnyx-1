import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';

export function Scene6_RevenueModel() {
  useEffect(() => {
    speak("Every transaction flows through ONYX. And ONYX takes its cut. $150 to $300 per vehicle deal. 3 to 20 percent on parts, service, transport, and aftermarket. Recurring spreads on insurance and lender leads. Auto-split via Stripe Connect. Zero manual reconciliation. The tollbooth never closes.");
    return () => window.speechSynthesis.cancel();
  }, []);

  const streams = [
    { title: "$150–$300", desc: "Per Vehicle Deal", detail: "Replaces 14-day chaos with instant execution" },
    { title: "3–20%", desc: "Logistic Commissions", detail: "Parts, service, transport, aftermarket" },
    { title: "Recurring", desc: "Insurance & Lender Spreads", detail: "Binding, leads, financing approvals" }
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      style={{ padding: '0 6vw' }}
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, filter: 'blur(5px)' }}
      transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        className="text-[#C9A227] uppercase font-semibold tracking-widest"
        style={{ fontSize: '1.2vw', letterSpacing: '0.3em', marginBottom: '1vh' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.5 }}
      >
        REVENUE MODEL
      </motion.div>

      <motion.h2
        className="font-display font-bold text-white text-center"
        style={{ fontSize: '4vw', marginBottom: '1vh' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.8 }}
      >
        The Tollbooth <span className="text-[#C9A227]">Never Closes</span>
      </motion.h2>

      <motion.p
        className="text-[#8B8680] font-body text-center"
        style={{ fontSize: '1.3vw', marginBottom: '4vh', maxWidth: '50vw' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 1.2 }}
      >
        Every transaction that flows through ONYX generates revenue. Three interlocking streams.
      </motion.p>

      <div className="grid grid-cols-3 w-full" style={{ gap: '2.5vw' }}>
        {streams.map((stream, i) => (
          <motion.div
            key={i}
            className="flex flex-col items-center text-center bg-gradient-to-b from-[#111] to-[#0A0A0A]"
            style={{ padding: '4vh 2vw', border: '1px solid rgba(201,162,39,0.3)', borderRadius: '1vw' }}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 1.5 + (i * 0.3), type: "spring" }}
          >
            <div className="font-display font-bold text-[#E8B830]" style={{ fontSize: '2.8vw', marginBottom: '1vh' }}>{stream.title}</div>
            <div className="text-[#F5F0E1] font-semibold" style={{ fontSize: '1.3vw', marginBottom: '0.8vh' }}>{stream.desc}</div>
            <div className="text-[#8B8680]" style={{ fontSize: '0.9vw' }}>{stream.detail}</div>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="flex items-center justify-center text-center"
        style={{ marginTop: '3vh', padding: '1.5vh 3vw', background: 'rgba(201,162,39,0.08)', border: '1px solid rgba(201,162,39,0.2)', borderRadius: '0.5vw' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 3 }}
      >
        <span className="text-[#C9A227] font-semibold" style={{ fontSize: '1.1vw' }}>Auto-Split via Stripe Connect</span>
        <span className="text-[#8B8680] mx-3" style={{ fontSize: '1.1vw' }}>•</span>
        <span className="text-white font-semibold" style={{ fontSize: '1.1vw' }}>Zero Manual Reconciliation</span>
      </motion.div>
    </motion.div>
  );
}
