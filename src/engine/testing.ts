/**
 * Engine test helpers. Lives in `src` (not a test-only folder) so tooling sees
 * it, but only `*.test.ts` files import it.
 */

/**
 * A seeded linear congruential generator (Numerical Recipes constants).
 * Returns an rng function producing the same deterministic sequence in
 * [0, 1) on every run for a given seed.
 */
export function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 2 ** 32;
  };
}
