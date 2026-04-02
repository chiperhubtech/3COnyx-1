import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene3_Pillars() {
  const pillars = [
    { 
      title: "12 AI Agents", 
      desc: "Working simultaneously. Paperwork, financing, insurance, registration — handled instantly." 
    },
    { 
      title: "Cryptographic Proof", 
      desc: "Every event blockchain-stamped. CarFax tells you. ONYX proves it." 
    },
    { 
      title: "Instant Commission", 
      desc: "Every transaction earns the referrer automatic commission. 3-20% across 8 categories." 
    }
  ];

  return (
    <motion.div
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      {...sceneTransitions.fadeBlur}
      transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="flex flex-col items-center gap-[6vh] w-full max-w-[85vw] px-[4vw]">
        {pillars.map((pillar, i) => (
          <motion.div
            key={i}
            className="flex flex-col items-center text-center relative w-full"
            initial={{ opacity: 0, y: 40, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ delay: 0.5 + i * 2.5, duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          >
            {/* Visual separator/connector */}
            {i > 0 && (
              <motion.div
                className="w-[1px] bg-gradient-to-b from-transparent via-[var(--color-primary)] to-[var(--color-primary)] absolute -top-[5vh] h-[4vh] opacity-50"
                initial={{ height: 0 }}
                animate={{ height: "4vh" }}
                transition={{ delay: 0.5 + i * 2.5 - 0.5, duration: 1, ease: "easeOut" }}
              />
            )}
            
            <div className="flex flex-col items-center bg-black/30 border border-[#C9A227]/20 backdrop-blur-xl p-[2vw] rounded-[1.5vw] w-full">
              <h3 className="text-[2.5vw] font-display text-[var(--color-primary)] mb-[1vh] tracking-wide font-semibold">
                {pillar.title}
              </h3>
              <p className="text-[1.5vw] font-body text-[var(--color-text-primary)] uppercase tracking-widest leading-relaxed max-w-[60vw]">
                {pillar.desc}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}