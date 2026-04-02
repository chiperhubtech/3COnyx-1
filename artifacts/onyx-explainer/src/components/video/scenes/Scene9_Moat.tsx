import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';

export function Scene9_Moat() {
  useEffect(() => {
    speak("The moat is deep. 100% built and deployable. All systems forensically branded — sole property of Ronald Antonio Cadet and CUXTOMCANDYCLUB LLC. No outside resource can claim credit for any part of this platform. And once 10,000 QR codes are in the wild, no one can outspend that level of organic reach. The distribution moat is permanent.");
    return () => window.speechSynthesis.cancel();
  }, []);

  const pillars = [
    { number: "1", title: "100% Built &\nDeployable", detail: "Capital for scaling,\nnot R&D" },
    { number: "2", title: "Forensically\nBranded IP", detail: "Every line, every agent,\nevery protocol — sovereign" },
    { number: "3", title: "Distribution\nMoat", detail: "10K QR codes in the wild\n= unbeatable funnel" },
    { number: "4", title: "Solves CIT\nfor Banks", detail: "Adds value to the very\nlenders providing the loan" },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      style={{ padding: '0 6vw' }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, filter: 'blur(10px)', scale: 1.1 }}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.p
        className="font-body text-[#C9A227] uppercase tracking-widest font-semibold"
        style={{ fontSize: '1.2vw', letterSpacing: '0.3em', marginBottom: '1vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
      >
        DEFENSIBILITY
      </motion.p>

      <motion.h2
        className="font-display font-bold text-white uppercase tracking-wide"
        style={{ fontSize: '3.5vw', marginBottom: '6vh' }}
        initial={{ opacity: 0, y: '-3vh' }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, delay: 0.5 }}
      >
        The <span className="text-[#C9A227]">Moat</span>
      </motion.h2>

      <div className="flex w-full" style={{ gap: '2vw' }}>
        {pillars.map((pillar, i) => (
          <motion.div
            key={i}
            className="flex-1 flex flex-col items-center justify-start text-center bg-gradient-to-b from-[#C9A227]/10 to-transparent"
            style={{ padding: '3vh 1.5vw', borderTop: '3px solid #C9A227' }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.5 + (i * 0.3), type: "spring", bounce: 0.2 }}
          >
            <div
              className="rounded-full bg-[#0A0A0A] flex items-center justify-center font-display text-[#C9A227]"
              style={{ width: '3vw', height: '3vw', border: '1px solid rgba(201,162,39,0.3)', fontSize: '1.3vw', marginBottom: '1.5vh' }}
            >
              {pillar.number}
            </div>
            <h3 className="text-white font-medium leading-snug whitespace-pre-line" style={{ fontSize: '1.3vw', marginBottom: '1vh' }}>{pillar.title}</h3>
            <p className="text-[#8B8680] whitespace-pre-line" style={{ fontSize: '0.85vw' }}>{pillar.detail}</p>
          </motion.div>
        ))}
      </div>

      <motion.p
        className="text-[#8B8680] italic font-body"
        style={{ fontSize: '1.1vw', marginTop: '4vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 3.5 }}
      >
        Sole property of Ronald Antonio Cadet — no outside resource can claim credit.
      </motion.p>
    </motion.div>
  );
}
