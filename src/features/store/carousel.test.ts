// Unit tests for the featured-carousel rotation logic — the pure index math the carousel is built
// on: a deterministic, fair start index (each featured app leads over time) and wrap-around
// prev/next stepping. No timers or DOM here; the component test covers behaviour.

import { describe, expect, it } from "vitest";
import { dailySeed, initialFeaturedIndex, nextIndex, prevIndex, wrapIndex } from "./carousel";

describe("wrapIndex", () => {
  it("passes through an in-range index", () => {
    expect(wrapIndex(0, 3)).toBe(0);
    expect(wrapIndex(2, 3)).toBe(2);
  });
  it("wraps past the end back to the start", () => {
    expect(wrapIndex(3, 3)).toBe(0);
    expect(wrapIndex(4, 3)).toBe(1);
  });
  it("wraps a negative index to the end", () => {
    expect(wrapIndex(-1, 3)).toBe(2);
    expect(wrapIndex(-4, 3)).toBe(2);
  });
  it("is 0 for an empty set (no division by zero)", () => {
    expect(wrapIndex(2, 0)).toBe(0);
    expect(wrapIndex(0, -1)).toBe(0);
  });
});

describe("nextIndex / prevIndex", () => {
  it("steps forward with wrap-around", () => {
    expect(nextIndex(0, 3)).toBe(1);
    expect(nextIndex(2, 3)).toBe(0);
  });
  it("steps backward with wrap-around", () => {
    expect(prevIndex(1, 3)).toBe(0);
    expect(prevIndex(0, 3)).toBe(2);
  });
});

describe("dailySeed", () => {
  it("is the whole number of days since the epoch (rotates once per day)", () => {
    expect(dailySeed(0)).toBe(0);
    expect(dailySeed(86_400_000)).toBe(1);
    expect(dailySeed(86_400_000 * 2 + 5)).toBe(2);
  });
  it("is stable across a single day (same value all day → no mid-day reshuffle)", () => {
    const morning = dailySeed(86_400_000 * 100 + 1);
    const night = dailySeed(86_400_000 * 100 + 86_000_000);
    expect(morning).toBe(night);
  });
});

describe("initialFeaturedIndex", () => {
  it("maps the seed into range so a different app can lead each day", () => {
    expect(initialFeaturedIndex(3, 0)).toBe(0);
    expect(initialFeaturedIndex(3, 1)).toBe(1);
    expect(initialFeaturedIndex(3, 2)).toBe(2);
    expect(initialFeaturedIndex(3, 3)).toBe(0);
  });
  it("gives every featured app an equal turn at leading across a full cycle", () => {
    const count = 4;
    const leaders = new Set<number>();
    for (let seed = 0; seed < count; seed++) leaders.add(initialFeaturedIndex(count, seed));
    expect(leaders.size).toBe(count); // fair: all four lead within one cycle
  });
  it("tolerates a fractional seed and negative seed defensively", () => {
    expect(initialFeaturedIndex(3, 2.9)).toBe(2);
    expect(initialFeaturedIndex(3, -1)).toBe(2);
  });
  it("is 0 for an empty or single-item shelf", () => {
    expect(initialFeaturedIndex(0, 5)).toBe(0);
    expect(initialFeaturedIndex(1, 5)).toBe(0);
  });
});
