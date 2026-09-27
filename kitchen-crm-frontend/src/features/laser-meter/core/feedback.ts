/** Capture feedback: a short beep (Web Audio) and a vibration pulse. Both best-effort. */

let audioCtx: AudioContext | null = null;

export const beep = (frequency = 1320, durationMs = 90): void => {
  try {
    const Ctx =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) {
      return;
    }
    audioCtx = audioCtx ?? new Ctx();
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = 'sine';
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + durationMs / 1000);
    osc.connect(gain).connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + durationMs / 1000);
  } catch {
    // Autoplay policy or no audio device — silence is fine.
  }
};

export const vibrate = (pattern: number | number[] = 60): void => {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // Not supported (iOS) — ignore.
  }
};

export const captureFeedback = (opts: { beep: boolean; vibrate: boolean }, ok = true): void => {
  if (opts.beep) {
    if (ok) {
      beep();
    } else {
      beep(330, 180);
    }
  }
  if (opts.vibrate) {
    vibrate(ok ? 60 : [80, 60, 80]);
  }
};
