// carousel.ts — the featured carousel's pure rotation math, kept out of the component so it is
// exhaustively unit-testable and deterministic (no Math.random: an SSR/prerender-safe daily seed
// rotates which featured app leads, giving every featured listing equal airtime over time).

/** Milliseconds in a day. */
const DAY_MS = 86_400_000;

/**
 * A stable, deterministic seed that advances once per calendar day (whole days since the Unix
 * epoch). Using this as the carousel's start seed rotates the leading featured app daily while
 * staying identical for every render within a day — so it never reshuffles mid-session and never
 * differs between a prerendered shell and the hydrated client.
 */
export function dailySeed(now: number = Date.now()): number {
  return Math.floor(now / DAY_MS);
}

/** Normalize any (possibly out-of-range or negative) index into [0, count), or 0 when empty. */
export function wrapIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return ((Math.trunc(index) % count) + count) % count;
}

/** The next slide index, wrapping from the last back to the first. */
export function nextIndex(current: number, count: number): number {
  return wrapIndex(current + 1, count);
}

/** The previous slide index, wrapping from the first back to the last. */
export function prevIndex(current: number, count: number): number {
  return wrapIndex(current - 1, count);
}

/**
 * The initial featured slide to show: the seed mapped into range. With `dailySeed()` as the seed
 * every featured app leads on an equal share of days (fair exposure), yet the choice is fully
 * deterministic and testable (pass an explicit seed).
 */
export function initialFeaturedIndex(count: number, seed: number): number {
  return wrapIndex(seed, count);
}
