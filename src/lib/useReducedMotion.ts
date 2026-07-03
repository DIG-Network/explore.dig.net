// useReducedMotion — subscribe to the `prefers-reduced-motion: reduce` media query. Returns true
// when the user has asked the OS for reduced motion; updates live if they change it. Motion-driven
// UI (the featured carousel) reads this to disable auto-rotation for those users (§6.6, WCAG 2.2).

import { useEffect, useState } from "react";

const QUERY = "(prefers-reduced-motion: reduce)";

function query(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(QUERY).matches;
}

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState<boolean>(query);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    setReduced(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return reduced;
}
