/// <reference types="vite/client" />

// Build-time constant injected by Vite `define` (see vite.config.ts / vitest.config.ts): the
// app's semver from package.json + an optional git short-SHA. Consumed via src/lib/version.ts.
declare const __APP_VERSION__: string;
