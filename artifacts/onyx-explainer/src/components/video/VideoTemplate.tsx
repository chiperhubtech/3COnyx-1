import { AnimatePresence, motion } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { useEffect } from 'react';
import { preloadAllAudio } from '@/lib/voiceover';
import { Scene0_Reveal } from './scenes/Scene0_Reveal';
import { Scene1_Problem } from './scenes/Scene1_Problem';
import { Scene2_CoreMandate } from './scenes/Scene2_CoreMandate';
import { Scene3_Solution } from './scenes/Scene3_Solution';
import { Scene4_AgentMesh } from './scenes/Scene4_AgentMesh';
import { Scene5_ProofEngine } from './scenes/Scene5_ProofEngine';
import { Scene6_Kilocorn } from './scenes/Scene6_Kilocorn';
import { Scene7_GlobalNetwork } from './scenes/Scene7_GlobalNetwork';
import { Scene8_RevenueModel } from './scenes/Scene6_RevenueModel';
import { Scene9_Growth } from './scenes/Scene7_Growth';
import { Scene10_Moat } from './scenes/Scene9_Moat';
import { Scene11_Close } from './scenes/Scene10_Close';

const SCENE_DURATIONS = {
  scene0: 18000,
  scene1: 22000,
  scene2: 26000,
  scene3: 22000,
  scene4: 24000,
  scene5: 22000,
  scene6: 28000,
  scene7: 28000,
  scene8: 22000,
  scene9: 30000,
  scene10: 28000,
  scene11: 34000,
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({
    durations: SCENE_DURATIONS,
  });

  useEffect(() => {
    preloadAllAudio();
  }, []);

  return (
    <div
      className="w-full h-screen overflow-hidden relative"
      style={{ backgroundColor: 'var(--color-bg-dark)' }}
    >
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(circle at center, var(--color-primary) 0%, transparent 70%)',
          }}
          animate={{
            scale: currentScene % 2 === 0 ? 1 : 1.2,
            opacity: currentScene === 0 ? 0.3 : 0.15,
            backgroundPosition: currentScene % 2 === 0 ? '50% 50%' : '50% 60%',
          }}
          transition={{ duration: 4, ease: [0.16, 1, 0.3, 1] }}
        />

        <div
          className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
        />
      </div>

      <AnimatePresence mode="wait">
        {currentScene === 0 && <Scene0_Reveal key="scene0" />}
        {currentScene === 1 && <Scene1_Problem key="scene1" />}
        {currentScene === 2 && <Scene2_CoreMandate key="scene2" />}
        {currentScene === 3 && <Scene3_Solution key="scene3" />}
        {currentScene === 4 && <Scene4_AgentMesh key="scene4" />}
        {currentScene === 5 && <Scene5_ProofEngine key="scene5" />}
        {currentScene === 6 && <Scene6_Kilocorn key="scene6" />}
        {currentScene === 7 && <Scene7_GlobalNetwork key="scene7" />}
        {currentScene === 8 && <Scene8_RevenueModel key="scene8" />}
        {currentScene === 9 && <Scene9_Growth key="scene9" />}
        {currentScene === 10 && <Scene10_Moat key="scene10" />}
        {currentScene === 11 && <Scene11_Close key="scene11" />}
      </AnimatePresence>
    </div>
  );
}
