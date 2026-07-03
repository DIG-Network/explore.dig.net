import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from "node:url";
import { resolveAppVersion } from "./scripts/resolve-app-version.mjs";

// explore.dig.net is a static SPA (S3 + CloudFront). Vite builds to ./dist; the deploy syncs it.
// public/ (robots.txt + the build-generated catalog/, catalog.json, sitemap.xml, llms.txt) is
// copied verbatim. The Vitest config lives in vitest.config.ts (separate file to avoid
// vite/vitest type-version clash).

// Content-Security-Policy, injected at BUILD ONLY (a meta CSP in dev would block Vite's HMR
// websocket). connect-src includes api.bugreport.dig.net for the shared <BugReportButton>
// (CLAUDE.md §6.7); fonts come from Google Fonts; everything else is same-origin.
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src https://fonts.gstatic.com",
  "img-src 'self' data: blob:",
  "connect-src 'self' https://api.bugreport.dig.net",
  "frame-ancestors 'self'",
].join("; ");

function injectCspAtBuild(): Plugin {
  return {
    name: "explore:inject-csp",
    apply: "build",
    transformIndexHtml(html) {
      return html.replace(
        "<!--%CSP%-->",
        `<meta http-equiv="Content-Security-Policy" content="${CSP}" />`,
      );
    },
  };
}

export default defineConfig({
  plugins: [react(), injectCspAtBuild()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
  // __APP_VERSION__ (declared in src/vite-env.d.ts, consumed via src/lib/version.ts) — the build's
  // semver read from package.json + an optional git short-SHA, baked in at build time so the
  // bug-report widget + the footer can show which build a report/screenshot came from (§6.7).
  define: {
    __APP_VERSION__: JSON.stringify(resolveAppVersion()),
  },
  build: {
    outDir: "dist",
    // Content-hashed asset filenames → long/immutable CloudFront cache (see terraform).
    assetsDir: "assets",
    sourcemap: false,
  },
});
