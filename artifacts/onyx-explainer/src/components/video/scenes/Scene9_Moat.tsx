import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { speak } from '@/lib/voiceover';

export function Scene9_Moat() {
  useEffect(() => {
    speak("Five walls deep. First: 100% built and deployable — capital is for scaling, not building. Second: forensic IP — every line of code exclusively owned by Ronald Antonio Cadet. Third: distribution moat — 10,000 QR codes at gas stations create an organic funnel no one can outspend. Fourth: institutional value — solving Contracts in Transit for auto lenders. Fifth: network effects — every new user makes the network more valuable for every existing user. And the architecture is modular — ready for AI agents, AR inspection, humanoid robotics, and full autonomous fulfillment. This is not a feature advantage. This is a structural one.");
    return () => window.speechSynthesis.cancel();
  }, []);

  const pillars = [
    { number: "1", title: "100% Built", detail: "Capital for scaling,\nnot R&D" },
    { number: "2", title: "Forensic IP", detail: "Sole property of\nRonald Antonio Cadet" },
    { number: "3", title: "Distribution\nMoat", detail: "10K QR codes =\nunbeatable funnel" },
    { number: "4", title: "Institutional\nValue", detail: "Solves CIT\nfor banks" },
    { number: "5", title: "Network\nEffects", detail: "Every user adds\nvalue for all" },
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      style={{ padding: '0 5vw' }}
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
        className="font-display font-bold text-white uppercase tracking-wide text-center"
        style={{ fontSize: '3.5vw', marginBottom: '1vh' }}
        initial={{ opacity: 0, y: '-3vh' }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1.5, delay: 0.5 }}
      >
        The Moat — <span className="text-[#C9A227]">Five Walls Deep</span>
      </motion.h2>

      <motion.p
        className="text-[#8B8680] text-center"
        style={{ fontSize: '1.2vw', marginBottom: '4vh' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 0.8 }}
      >
        Not a feature advantage. A structural one.
      </motion.p>

      <div className="flex w-full" style={{ gap: '1.5vw' }}>
        {pillars.map((pillar, i) => (
          <motion.div
            key={i}
            className="flex-1 flex flex-col items-center justify-start text-center bg-gradient-to-b from-[#C9A227]/10 to-transparent"
            style={{ padding: '2.5vh 1vw', borderTop: '3px solid #C9A227' }}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 1.5 + (i * 0.25), type: "spring", bounce: 0.2 }}
          >
            <div
              className="rounded-full bg-[#0A0A0A] flex items-center justify-center font-display text-[#C9A227] font-bold"
              style={{ width: '2.5vw', height: '2.5vw', border: '2px solid rgba(201,162,39,0.5)', fontSize: '1.1vw', marginBottom: '1.2vh' }}
            >
              {pillar.number}
            </div>
            <h3 className="text-white font-semibold leading-snug whitespace-pre-line" style={{ fontSize: '1.1vw', marginBottom: '0.8vh' }}>{pillar.title}</h3>
            <p className="text-[#8B8680] whitespace-pre-line" style={{ fontSize: '0.75vw' }}>{pillar.detail}</p>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="flex items-center justify-center"
        style={{ marginTop: '3vh', gap: '3vw' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1, delay: 4 }}
      >
        <div className="text-center">
          <div className="text-[#C9A227] font-bold uppercase tracking-widest" style={{ fontSize: '0.9vw' }}>FUTURE-READY</div>
          <div className="text-[#8B8680]" style={{ fontSize: '0.75vw', marginTop: '0.3vh' }}>AI • AR • Robotics</div>
        </div>
        <div style={{ width: '1px', height: '3vh' }} className="bg-[#C9A227] opacity-30" />
        <div className="text-center">
          <div className="text-white font-semibold" style={{ fontSize: '0.9vw' }}>Modular architecture designed for next-gen integration</div>
        </div>
      </motion.div>
    </motion.div>
  );
}
