/**
 * The sound seam: the machine's cues, synthesized — zero assets, zero deps.
 *
 * Same pattern as the engine's injectable `rng`: this module decides HOW a
 * cue is made, the UI seam decides WHETHER it is heard. `createSounder`
 * takes an `AudioContext` factory invoked on the FIRST cue — a silent
 * machine never touches the platform — and synthesizes every cue from
 * oscillators and gain envelopes only: no buffers, no files, no `<audio>`
 * element. Each cue is a pure function of its event: no state, no scheduling
 * between cues, overlapping cues are fine. React-free by the architecture
 * rule; `AudioContext` is a browser platform type, not a library.
 */

/** The five audible events of a Session. */
export type Sound = "deal" | "hold" | "draw" | "win" | "bust";

/** Plays one cue. Injected at the UI seam; `noopSounder` is the silence. */
export type Sounder = (sound: Sound) => void;

/** The silent default the machine falls back to — and the prop's twin. */
export const noopSounder: Sounder = () => {};

/** Master ceiling: every cue stays short and quiet (phase 11 rule). */
const MASTER = 0.15;

/** One oscillator note: a (optionally swept) frequency under an
 * exponential-decay gain envelope. */
interface Tone {
  type: OscillatorType;
  from: number;
  /** End of a frequency sweep; the tone holds at `from` when absent. */
  to?: number;
  /** Offset from the cue's start, seconds. */
  at: number;
  seconds: number;
  gain: number;
}

/** The whole score: five cues, each a fixed list of tones. */
const CUES: Record<Sound, readonly Tone[]> = {
  // Five woodblock-ish ticks at 60 ms spacing — the visual deal stagger,
  // heard.
  deal: Array.from({ length: 5 }, (_, tick) => ({
    type: "square",
    from: 1600,
    to: 1100,
    at: tick * 0.06,
    seconds: 0.035,
    gain: 0.08,
  })),
  // One dry click — the same cue covers a Hold going on and off.
  hold: [{ type: "square", from: 800, at: 0, seconds: 0.04, gain: 0.05 }],
  // A fast upward saw sweep: a card flipping past a low-pass filter.
  draw: [
    { type: "sawtooth", from: 250, to: 1500, at: 0, seconds: 0.11, gain: 0.05 },
  ],
  // C5–E5–G5: a three-note ascending major arpeggio, gold-plated.
  win: [523.25, 659.25, 783.99].map((hz, step) => ({
    type: "triangle" as const,
    from: hz,
    at: step * 0.09,
    seconds: 0.12,
    gain: 0.09,
  })),
  // One low descending thud under the game-over overlay.
  bust: [
    { type: "sine", from: 180, to: 45, at: 0, seconds: 0.25, gain: MASTER },
  ],
};

function playTone(ctx: AudioContext, tone: Tone): void {
  const osc = ctx.createOscillator();
  const env = ctx.createGain();
  const start = ctx.currentTime + tone.at;
  const end = start + tone.seconds;
  osc.type = tone.type;
  osc.frequency.setValueAtTime(tone.from, start);
  if (tone.to !== undefined && tone.to !== tone.from) {
    osc.frequency.exponentialRampToValueAtTime(tone.to, end);
  }
  env.gain.setValueAtTime(tone.gain, start);
  env.gain.exponentialRampToValueAtTime(0.0001, end);
  osc.connect(env).connect(ctx.destination);
  osc.start(start);
  osc.stop(end);
}

/**
 * Build a Sounder over a lazily-supplied `AudioContext`: the factory runs on
 * the first cue — the user gesture that satisfies the autoplay policy — and
 * never at import or mount. If the factory or the platform throws, the cue
 * is swallowed and the sounder falls silent for good: a machine must never
 * throw because it tried to make noise.
 */
export function createSounder(audioContext: () => AudioContext): Sounder {
  let silenced = false;
  return (sound) => {
    if (silenced) return;
    try {
      const ctx = audioContext();
      for (const tone of CUES[sound]) playTone(ctx, tone);
    } catch {
      silenced = true;
    }
  };
}
