# Runbook — running explore.dig.net locally

## Prerequisites

- Node 20+ and npm.
- (a11y suite only) Playwright Chromium: `npx playwright install chromium`.

## Install + run

```bash
npm ci
npm run dev        # http://localhost:5173
```

`npm run dev` first runs `scripts/build-catalog.mjs`, which validates every `apps/<slug>/` listing
(SPEC.md gate) and generates `src/catalog/catalog.gen.json` + `public/{catalog.json,sitemap.xml,llms.txt}`
+ `public/catalog/<slug>/` asset copies — all git-ignored. If a listing violates SPEC.md the
command fails with a per-error report; fix the listing and rerun.

No env vars or secrets are needed; the store has no backend.

## Test

```bash
npm test               # vitest unit suite (jsdom)
npm run test:coverage  # + v8 coverage, thresholds 80% (lines/branches/functions/statements)
npm run test:a11y      # builds, serves on :4173, runs axe (WCAG 2.2 AA) + SEO specs, desktop+mobile
npm run lint           # eslint, zero errors
npm run typecheck      # tsc -b --noEmit
```

## Preview the production build

```bash
npm run build
npm run preview        # http://localhost:4173
```

Note: `vite preview` does not replicate the CloudFront viewer-request rewrite, so prerendered
detail pages are at `/app/<slug>/` (trailing slash) locally; in production `/app/<slug>` works.
