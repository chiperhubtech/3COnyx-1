const audioCache: Map<string, HTMLAudioElement> = new Map();

export function speak(text: string, sceneId?: string) {
  window.speechSynthesis?.cancel();

  if (sceneId) {
    const audioPath = `${import.meta.env.BASE_URL}audio/${sceneId}.mp3`;

    if (audioCache.has(sceneId)) {
      const cached = audioCache.get(sceneId)!;
      if (cached.readyState >= 2) {
        cached.currentTime = 0;
        cached.play().catch(() => {
          fallbackSpeak(text);
        });
        return;
      }
      fallbackSpeak(text);
      return;
    }

    const audio = new Audio(audioPath);
    audio.volume = 1;
    audio.preload = "auto";
    audioCache.set(sceneId, audio);

    audio.addEventListener("canplaythrough", () => {
      audio.play().catch(() => {
        fallbackSpeak(text);
      });
    }, { once: true });

    audio.addEventListener("error", () => {
      fallbackSpeak(text);
    }, { once: true });

    audio.load();
    return;
  }

  fallbackSpeak(text);
}

function fallbackSpeak(text: string) {
  if (!window.speechSynthesis) return;
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  utterance.pitch = 0.8;
  utterance.volume = 1;
  const voices = window.speechSynthesis.getVoices();
  const preferred = voices.find((v: SpeechSynthesisVoice) => v.name.includes('Google US English') || v.name.includes('Daniel') || v.name.includes('Alex')) || voices.find((v: SpeechSynthesisVoice) => v.lang.startsWith('en')) || voices[0];
  if (preferred) utterance.voice = preferred;
  window.speechSynthesis.speak(utterance);
}

export function stopAudio(sceneId?: string) {
  window.speechSynthesis?.cancel();
  if (sceneId && audioCache.has(sceneId)) {
    const audio = audioCache.get(sceneId)!;
    audio.pause();
    audio.currentTime = 0;
  }
  audioCache.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
}

export function preloadAllAudio() {
  const scenes = ['scene0', 'scene1', 'scene2', 'scene3', 'scene4', 'scene5', 'scene6', 'scene7', 'scene8', 'scene9', 'scene10', 'scene11'];
  scenes.forEach(id => {
    const audioPath = `${import.meta.env.BASE_URL}audio/${id}.mp3`;
    const audio = new Audio();
    audio.preload = "auto";
    audio.src = audioPath;
    audio.addEventListener("error", () => {
      audioCache.delete(id);
    }, { once: true });
    audioCache.set(id, audio);
  });
}
