// Vitest setup: extend expect with @testing-library/jest-dom matchers + auto-cleanup the DOM
// between tests (React Testing Library).
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach, vi } from "vitest";

// jsdom ships no window.matchMedia; components that read media queries (e.g. prefers-reduced-motion)
// need a stub. Default: nothing matches (no reduced motion). Individual tests override window
// .matchMedia to exercise the reduced-motion path.
if (typeof window !== "undefined" && !window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

afterEach(() => {
  cleanup();
});
