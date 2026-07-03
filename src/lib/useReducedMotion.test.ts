// useReducedMotion — reflects the `prefers-reduced-motion: reduce` media query, updating when the
// user flips the OS setting. Motion-driven UI (the featured carousel's auto-rotation) reads this
// to stay still for people who ask for less motion (WCAG 2.2 — §6.6).

import { renderHook, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useReducedMotion } from "./useReducedMotion";

type Listener = (e: { matches: boolean }) => void;

/** Install a controllable matchMedia mock; returns a fn to flip the match + fire the change. */
function mockMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<Listener>();
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    get matches() {
      return matches;
    },
    media: query,
    addEventListener: (_: string, cb: Listener) => listeners.add(cb),
    removeEventListener: (_: string, cb: Listener) => listeners.delete(cb),
    addListener: (cb: Listener) => listeners.add(cb),
    removeListener: (cb: Listener) => listeners.delete(cb),
    dispatchEvent: () => true,
  }));
  return (next: boolean) => {
    matches = next;
    for (const cb of listeners) cb({ matches: next });
  };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useReducedMotion", () => {
  it("reports false when the user has not asked to reduce motion", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
  });

  it("reports true when reduced motion is preferred", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(true);
  });

  it("updates live when the OS setting flips", () => {
    const flip = mockMatchMedia(false);
    const { result } = renderHook(() => useReducedMotion());
    expect(result.current).toBe(false);
    act(() => flip(true));
    expect(result.current).toBe(true);
  });
});
