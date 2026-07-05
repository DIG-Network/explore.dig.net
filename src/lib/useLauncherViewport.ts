// useLauncherViewport — subscribe to the launcher breakpoint (`max-width: 600px`). Returns true on
// phone-width viewports and updates live as the viewport crosses it. The Apps launcher is the phone
// experience (#51): below the breakpoint the landing (`/`) defaults to the home-screen launcher and
// `/apps` renders as an immersive launcher; above it the landing is the desktop store. The value is
// read synchronously on the first render (client-only SPA) so the correct surface paints without a
// store→launcher flash. SSR/no-matchMedia environments fall back to false (desktop store).

import { useEffect, useState } from "react";

/** The launcher breakpoint. Below this width the Apps launcher is the phone experience (#51). */
export const LAUNCHER_BREAKPOINT_PX = 600;

const QUERY = `(max-width: ${LAUNCHER_BREAKPOINT_PX}px)`;

function query(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  return window.matchMedia(QUERY).matches;
}

export function useLauncherViewport(): boolean {
  const [isLauncher, setIsLauncher] = useState<boolean>(query);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mql = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsLauncher(e.matches);
    setIsLauncher(mql.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isLauncher;
}
