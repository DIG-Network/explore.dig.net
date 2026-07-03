// route.ts — the store's tiny path router (pure). The site is a static SPA with REAL links (full
// navigations — every page is prerendered for crawlers), so routing is just: which page does this
// pathname address?

export type Route = { kind: "home" } | { kind: "app"; slug: string } | { kind: "not-found" };

const APP_PATH = /^\/app\/([a-z0-9][a-z0-9-]*)(?:\/(?:index\.html)?)?$/;

/** Classify a pathname: home, an app detail page, or not-found. */
export function parseRoute(pathname: string): Route {
  if (pathname === "/" || pathname === "" || pathname === "/index.html") return { kind: "home" };
  const m = APP_PATH.exec(pathname);
  if (m) return { kind: "app", slug: m[1] };
  return { kind: "not-found" };
}
