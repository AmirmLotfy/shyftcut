/**
 * Play success sound when roadmap generation completes.
 * Prefers custom file from public/sounds/ (replace roadmap-ready.wav with your Eleven Labs export).
 * Falls back to Web Audio API chime if file is missing or fails.
 */
const SOUND_URLS = ['/sounds/roadmap-ready.mp3', '/sounds/roadmap-ready.wav'];

export function playRoadmapReadySound(): void {
  try {
    // Try custom file first (MP3 preferred, then WAV)
    const audio = new Audio();
    let tried = 0;
    const tryNext = () => {
      if (tried >= SOUND_URLS.length) {
        playFallbackChime();
        return;
      }
      audio.src = SOUND_URLS[tried++];
      audio.volume = 0.6;
      audio.play().then(
        () => {},
        () => tryNext()
      );
    };
    tryNext();
  } catch {
    playFallbackChime();
  }
}

function playFallbackChime(): void {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    if (ctx.state === 'suspended') ctx.resume();
    const playTone = (freq: number, start: number, duration: number, volume = 0.12) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(volume, start);
      gain.gain.exponentialRampToValueAtTime(0.01, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };
    playTone(523.25, 0, 0.12);
    playTone(659.25, 0.12, 0.18);
  } catch {
    /* ignore */
  }
}
