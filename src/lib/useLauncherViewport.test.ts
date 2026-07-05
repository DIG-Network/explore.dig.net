// useLauncherViewport — reflects the launcher breakpoint (`max-width: 600px`), updating when the
// viewport crosses it. The Apps launcher is the phone experience: below the breakpoint the landing
// defaults to the home-screen launcher, above it the desktop store (#51 follow-up).

import { renderHook, act } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useLauncherViewport } from "./useLauncherViewport";

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

describe("useLauncherViewport", () => {
  it("reports false on a desktop-width viewport (above the launcher breakpoint)", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useLauncherViewport());
    expect(result.current).toBe(false);
  });

  it("reports true on a phone-width viewport (at or below the launcher breakpoint)", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useLauncherViewport());
    expect(result.current).toBe(true);
  });

  it("updates live when the viewport crosses the breakpoint", () => {
    const flip = mockMatchMedia(false);
    const { result } = renderHook(() => useLauncherViewport());
    expect(result.current).toBe(false);
    act(() => flip(true));
    expect(result.current).toBe(true);
  });
});
