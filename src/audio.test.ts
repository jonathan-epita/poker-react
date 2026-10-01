import { describe, expect, it } from "vitest";

import { type Sound, createSounder, noopSounder } from "./audio";

const ALL_SOUNDS: Sound[] = ["deal", "hold", "draw", "win", "bust"];

/**
 * Hand-rolled fake AudioContext: records every node built and every
 * oscillator start, satisfies the calls `createSounder` makes, and assumes
 * nothing about jsdom having a real AudioContext.
 */
function fakeAudioContext() {
  const nodes: ("oscillator" | "gain")[] = [];
  const started: number[] = [];
  const destination = { name: "destination" };

  const param = () => ({
    setValueAtTime: () => undefined,
    exponentialRampToValueAtTime: () => undefined,
  });
  const connect = (target: unknown) => target;

  function createGain() {
    nodes.push("gain");
    return { gain: param(), connect };
  }
  function createOscillator() {
    nodes.push("oscillator");
    return {
      type: "sine",
      frequency: param(),
      connect,
      start: (when: number) => started.push(when),
      stop: () => undefined,
    };
  }

  const raw = { currentTime: 1.5, destination, createGain, createOscillator };
  return { ctx: raw as unknown as AudioContext, nodes, started };
}

describe("createSounder", () => {
  for (const sound of ALL_SOUNDS) {
    it(`schedules at least one node for "${sound}"`, () => {
      const { ctx, nodes } = fakeAudioContext();
      createSounder(() => ctx)(sound);
      expect(nodes.length).toBeGreaterThanOrEqual(1);
    });
  }

  it("fires nothing before the first cue — the factory is lazy", () => {
    let built = 0;
    const sounder = createSounder(() => {
      built += 1;
      return fakeAudioContext().ctx;
    });
    expect(built).toBe(0);
    sounder("hold");
    expect(built).toBe(1);
  });

  it("deal is five ticks at the 60 ms deal stagger", () => {
    const { ctx, started } = fakeAudioContext();
    createSounder(() => ctx)("deal");
    expect(started).toHaveLength(5);
    started.forEach((when, tick) =>
      expect(when).toBeCloseTo(1.5 + tick * 0.06, 8),
    );
  });

  it("a throwing factory degrades to noop behavior: nothing is thrown", () => {
    const sounder = createSounder(() => {
      throw new Error("no WebAudio on this platform");
    });
    expect(() => ALL_SOUNDS.forEach((sound) => sounder(sound))).not.toThrow();
  });
});

describe("noopSounder", () => {
  it("accepts every cue without effect", () => {
    expect(() =>
      ALL_SOUNDS.forEach((sound) => noopSounder(sound)),
    ).not.toThrow();
  });
});
