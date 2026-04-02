import { AnimatePresence, motion } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene0_Reveal } from './scenes/Scene0_Reveal';
import { Scene1_Chaos } from './scenes/Scene1_Chaos';
import { Scene2_Simplify } from './scenes/Scene2_Simplify';
import { Scene3_Pillars } from './scenes/Scene3_Pillars';
import { Scene4_Closing } from './scenes/Scene4_Closing';

const SCENE_DURATIONS = {
  scene0: 2500,
  scene1: 2000,
  scene2: 2000,
  scene3: 2500,
  scene4: 2500, // Total 11.5s approx
};

export default function VideoTemplate() {
  const { currentScene } = useVideoPlayer({
    durations: SCENE_DURATIONS,
  });

  return (
    <div
      className="w-full h-screen overflow-hidden relative"
      style={{ backgroundColor: 'var(--color-bg-dark)' }}
    >
      {/* Persistent Background layer */}
      <div className="absolute inset-0 z-0">
        <motion.div 
          className="absolute inset-0 opacity-20"
          style={{
            background: 'radial-gradient(circle at center, var(--color-primary) 0%, transparent 70%)',
          }}
          animate={{
            scale: currentScene === 1 ? 0.5 : currentScene === 2 ? 0.2 : currentScene === 3 ? 1.5 : 1,
            opacity: currentScene === 1 ? 0.1 : currentScene === 2 ? 0.5 : currentScene === 4 ? 0.3 : 0.2,
            backgroundPosition: currentScene === 1 ? '50% 100%' : '50% 50%',
          }}
          transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
        />
        
        {/* Subtle noise texture */}
        <div 
          className="absolute inset-0 opacity-[0.03] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
        />
      </div>

      <AnimatePresence mode="wait">
        {currentScene === 0 && <Scene0_Reveal key="scene0" />}
        {currentScene === 1 && <Scene1_Chaos key="scene1" />}
        {currentScene === 2 && <Scene2_Simplify key="scene2" />}
        {currentScene === 3 && <Scene3_Pillars key="scene3" />}
        {currentScene === 4 && <Scene4_Closing key="scene4" />}
      </AnimatePresence>
    </div>
  );
}