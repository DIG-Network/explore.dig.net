// Sibling declaration for resolve-app-version.mjs so vite.config.ts / vitest.config.ts (compiled
// under tsconfig.node.json) import it fully typed. Keep in sync with the .mjs export.

/** Read package.json `version`, appending `+<git-short-sha>` when git resolves one. */
export declare function resolveAppVersion(): string;
