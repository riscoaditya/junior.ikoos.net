const AUDIO_FEEDBACK_PATHS = {
  correctBlock: '/assets/stages/stage-1/sounds/hebat.mp3',
  completeRun: '/assets/stages/stage-1/sounds/alkhamdulillah-kamu-luar-biasa.mp3',
};

type WindowWithWebkitAudio = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

let audioContext: AudioContext | null = null;
const audioElements = new Map<string, HTMLAudioElement>();

function getAudioContext() {
  if (typeof window === 'undefined') return null;

  const AudioContextConstructor =
    window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;

  if (!AudioContextConstructor) return null;
  audioContext ||= new AudioContextConstructor();
  return audioContext;
}

function getFeedbackAudio(src: string) {
  if (typeof window === 'undefined') return null;

  const cachedAudio = audioElements.get(src);
  if (cachedAudio) return cachedAudio;

  const audio = new Audio(src);
  audio.preload = 'auto';
  audio.volume = 1;
  audioElements.set(src, audio);
  return audio;
}

function playFeedbackAudio(src: string) {
  const audio = getFeedbackAudio(src);
  if (!audio) return;

  audio.pause();
  audio.currentTime = 0;
  void audio.play().catch(() => undefined);
}

function playDescendingTone(
  context: AudioContext,
  output: AudioNode,
  startAt: number,
  fromFrequency: number,
  toFrequency: number,
  duration: number,
) {
  const oscillator = context.createOscillator();
  const toneGain = context.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(fromFrequency, startAt);
  oscillator.frequency.exponentialRampToValueAtTime(toFrequency, startAt + duration);
  toneGain.gain.setValueAtTime(0.0001, startAt);
  toneGain.gain.exponentialRampToValueAtTime(0.75, startAt + 0.02);
  toneGain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration);
  oscillator.connect(toneGain);
  toneGain.connect(output);
  oscillator.start(startAt);
  oscillator.stop(startAt + duration + 0.03);
}

export function warmAudioFeedback() {
  Object.values(AUDIO_FEEDBACK_PATHS).forEach((src) => getFeedbackAudio(src)?.load());
}

export function playCorrectBlockFeedback() {
  playFeedbackAudio(AUDIO_FEEDBACK_PATHS.correctBlock);
}

export function playCompleteRunFeedback() {
  playFeedbackAudio(AUDIO_FEEDBACK_PATHS.completeRun);
}

export function playWrongBlockFeedback() {
  const context = getAudioContext();
  if (!context) return;

  void context.resume().catch(() => undefined);

  const startAt = context.currentTime + 0.02;
  const masterGain = context.createGain();
  masterGain.gain.setValueAtTime(0.0001, startAt);
  masterGain.gain.exponentialRampToValueAtTime(0.28, startAt + 0.02);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.48);
  masterGain.connect(context.destination);

  playDescendingTone(context, masterGain, startAt, 260, 145, 0.17);
  playDescendingTone(context, masterGain, startAt + 0.2, 200, 95, 0.22);

  window.setTimeout(() => masterGain.disconnect(), 700);
}
