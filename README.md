# explore.dig.net

The curated dApp store for the DIG Network / Chia ecosystem — live at
**<https://explore.dig.net>**.

Every listing is a folder in this repository (`apps/<slug>/` = `metadata.json` + `assets/`),
validated in CI against the normative submission contract in **[SPEC.md](SPEC.md)**. The site is a
static React SPA with per-app prerendered pages, built with Vite and served from S3 + CloudFront.

## List your dApp

Read **[SPEC.md](SPEC.md)** (§7 has the checklist), add `apps/<your-slug>/`, and open a PR. CI
enforces the schema, exact asset dimensions, and the store's quality gates automatically.

## Machine consumption

- `https://explore.dig.net/catalog.json` — every listing's full metadata + asset URLs; consume
  this instead of scraping HTML.
- `https://explore.dig.net/llms.txt` — the agent-facing map of the store.
- Per-app pages at `/app/<slug>` ship `SoftwareApplication` JSON-LD; the home page ships
  `WebSite` + `ItemList`.

## Development

```bash
npm ci
npm run dev            # build the catalog + start Vite on http://localhost:5173
npm test               # unit suite (vitest)
npm run test:coverage  # + coverage, gated ≥80%
npm run test:a11y      # Playwright: axe (WCAG 2.2 AA) + SEO over the built site
npm run validate:apps  # the SPEC listing gate on its own
npm run build          # catalog → tsc → vite → prerender → dist sanity gate
```

Maintainer tooling: `scripts/capture-screenshots.mjs <slug>` (real screenshots of a live dApp at
the SPEC dimensions), `scripts/gen-placeholder-assets.mjs <slug>` (branded placeholder art).

Deployment + infrastructure: see [runbooks/deploy.md](runbooks/deploy.md) and
[runbooks/local.md](runbooks/local.md). CI is `.github/workflows/ci.yml` (tests, lint, typecheck,
coverage, the SPEC gate, axe) and `deploy.yml` (Terraform + S3 sync + CloudFront invalidation via
OIDC).
