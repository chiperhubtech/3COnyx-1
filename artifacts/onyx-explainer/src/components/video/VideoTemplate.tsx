import { AnimatePresence, motion } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene0_Reveal } from './scenes/Scene0_Reveal';
import { Scene1_Problem } from './scenes/Scene1_Problem';
import { Scene2_Solution } from './scenes/Scene2_Solution';
import { Scene3_Pillars } from './scenes/Scene3_Pillars';
import { Scene4_HowItWorks } from './scenes/Scene4_HowItWorks';
import { Scene5_ViralEngine } from './scenes/Scene5_ViralEngine';
import { Scene6_Closing } from './scenes/Scene6_Closing';

const SCENE_DURATIONS = {
  scene0: 6000,
  scene1: 8000,
  scene2: 7000,
  scene3: 10000,
  scene4: 7000,
  scene5: 6000,
  scene6: 6000,
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
            scale: currentScene === 1 ? 0.8 : currentScene === 2 ? 0.5 : currentScene === 3 ? 1.5 : currentScene === 5 ? 1.2 : 1,
            opacity: currentScene === 1 ? 0.15 : currentScene === 2 ? 0.3 : currentScene === 4 ? 0.2 : currentScene === 6 ? 0.4 : 0.2,
            backgroundPosition: currentScene === 1 ? '50% 100%' : '50% 50%',
          }}
          transition={{ duration: 2.5, ease: [0.16, 1, 0.3, 1] }}
        />
        
        {/* Subtle noise texture */}
        <div 
          className="absolute inset-0 opacity-[0.04] mix-blend-overlay pointer-events-none"
          style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
        />
      </div>

      <AnimatePresence mode="wait">
        {currentScene === 0 && <Scene0_Reveal key="scene0" />}
        {currentScene === 1 && <Scene1_Problem key="scene1" />}
        {currentScene === 2 && <Scene2_Solution key="scene2" />}
        {currentScene === 3 && <Scene3_Pillars key="scene3" />}
        {currentScene === 4 && <Scene4_HowItWorks key="scene4" />}
        {currentScene === 5 && <Scene5_ViralEngine key="scene5" />}
        {currentScene === 6 && <Scene6_Closing key="scene6" />}
      </AnimatePresence>
    </div>
  );
}