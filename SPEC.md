# explore.dig.net — normative specification

explore.dig.net is the curated dApp store for the DIG Network / Chia ecosystem: a static site
whose entire content is this repository. **One folder per listed dApp** under `apps/`, holding a
`metadata.json` and an `assets/` tree. CI validates every listing against this spec on every push
and pull request; **a listing that violates any MUST in this document fails the build and cannot
merge**. The machine-executable form of §3–§4 is `scripts/validate-apps.mjs` +
`apps/app.schema.json`; this document is the authoritative contract they implement.

Key words MUST, MUST NOT, SHOULD, MAY are to be interpreted as in RFC 2119.

---

## 1. Store model

- The store is **curated**: a listing enters by pull request to this repository and ships only
  after maintainer review + green CI. There is no self-service publishing pipeline.
- The unit of listing is a **dApp**: a web-served decentralized application that settles on the
  Chia blockchain.
- Every listing is **public content**: metadata and assets are served verbatim at
  `https://explore.dig.net/catalog/<slug>/…` and enumerated in the machine catalog
  (`/catalog.json`), the sitemap, and `llms.txt`.
- The store performs **no chain interaction** of its own: it holds no keys, builds no spend
  bundles, and proxies no wallet traffic. The "Open dApp" CTA is a plain link to the listing's
  `url`.

### 1.1 Submission paths

A listing is added by a pull request that creates the listing's `apps/<slug>/` folder (§2). Such a
pull request MAY originate two ways, and **both are governed identically** by this specification —
the same `app.schema.json` + CI validation gate (§3–§5) decides whether the pull request can merge,
and a maintainer still reviews it:

1. **Manual** — an author forks the repository and opens the pull request by hand (§7).
2. **Authorized automated path** — an external, authorized service opens the pull request on a
   submitter's behalf. In the DIG Network ecosystem this is the dApp-submission flow on
   **hub.dig.net**: a developer submits their dApp there (metadata + assets) with their Chia wallet
   as identity; a store maintainer approves the submission; on approval the hub authenticates to
   GitHub with a scoped, server-held token and opens a pull request that adds
   `apps/<slug>/metadata.json` plus the uploaded `assets/` exactly per §2–§4. The token is never
   embodied in this repository and grants only the access needed to open that pull request.

An automated pull request is **NOT** privileged: it carries no special merge rights, `featured`
MUST be `false` on it (curation stays a maintainer decision, §4.3), and it MUST pass the same
build-blocking validation (§3–§5) as any manual submission — a non-conforming automated pull
request fails CI and cannot merge, identically to a manual one. The store therefore has no
self-service publishing pipeline regardless of how a pull request is opened: nothing ships without
green CI and maintainer review.

## 2. Repository layout (per listing)

```
apps/
  app.schema.json          # JSON Schema (2020-12) for metadata.json — normative with §3
  <slug>/
    metadata.json          # §3 — the listing metadata
    assets/                # §4 — the listing art
      icon-512.png         #   required to list
      og.png               #   required to list
      icon-1024.png        #   optional
      hero.png             #   required to feature
      tile.png             #   optional
      screenshots/
        desktop-01.png …   #   sequential, §4.2
        mobile-01.png  …
```

- The folder name MUST equal the metadata `slug`.
- Slugs MUST be unique across the store.
- No files other than those named above are permitted in `assets/` (unknown files fail CI).

## 3. `metadata.json` — the listing metadata

`metadata.json` MUST validate against `apps/app.schema.json` (JSON Schema draft 2020-12,
`additionalProperties: false` — unknown keys fail). A top-level `$schema` key is permitted as an
editor hint and ignored by validation.

### 3.1 Required fields

| Field | Type | Constraint | Meaning |
|---|---|---|---|
| `slug` | string | `^[a-z0-9](?:[a-z0-9-]{1,38})[a-z0-9]$` (3–40 chars, lowercase/digits/hyphens, alnum ends); MUST equal the folder name | URL-safe unique id; the detail page is `/app/<slug>` |
| `name` | string | 1–40 chars | Display name, as branded (e.g. `xchtip.app`, `cMojo`) |
| `tagline` | string | 10–120 chars, plain text (no markdown) | One-line pitch on cards + social previews |
| `description` | string | 80–5000 chars, markdown SUBSET (§3.3) | Long description on the detail page |
| `category` | enum | one of `payments` `defi` `nft` `gaming` `social` `storage` `identity` `infrastructure` `tools` `other` | Exactly one primary category (drives the filter rail) |
| `tags` | string[] | 1–8 unique items, each `^[a-z0-9](?:[a-z0-9-]{0,22})[a-z0-9]$` (2–24 chars) | Free-form searchable keywords |
| `url` | string | `https://` URI | The live dApp — the "Open dApp" target |
| `author` | object | `{ name (1–60 chars, required), url? (https) }` | Who ships the dApp |
| `chain` | const | `"chia"` | The settlement chain (the store lists Chia dApps) |
| `status` | enum | `live` \| `beta` \| `draft` | §3.2 |
| `featured` | boolean | — | Curated flag, set by store maintainers only (not self-service). See §4.3 |
| `accentColor` | string | `^#[0-9a-fA-F]{6}$` | Brand accent; drives the card glow + detail hero tint |
| `addedDate` | string | ISO 8601 `YYYY-MM-DD` | Date the listing was added; drives default sort |

### 3.2 Status semantics

- `live` — production; real users on Chia mainnet.
- `beta` — publicly usable pre-release / mainnet-experimental.
- `draft` — the listing is incomplete or the dApp is not yet public. Draft listings render with a
  Draft badge and MUST NOT be `featured`.

### 3.3 Description markdown subset

The `description` is rendered by a safe subset renderer. ONLY the following constructs render;
everything else (including raw HTML) renders as inert plain text:

- paragraphs (blank-line separated), `## ` and `### ` headings (rendered one level down — the
  page's h1/h2 belong to the store), `- ` / `* ` bullet lists;
- inline: `**bold**`, `*italic*`, `` `code` ``, `[label](https://…)` — link targets MUST be
  http(s); other schemes are not linked.

### 3.4 Optional fields

| Field | Type | Constraint | Meaning |
|---|---|---|---|
| `repo` | string | `https://github.com/<org>/<repo>` | Public source repository. Listings SHOULD be open source; omit when the source is not public — the detail page then shows no source link |
| `version` | string | semver `X.Y.Z(-/+suffix)` | The dApp's own released version |
| `license` | string | 2–40 chars | SPDX identifier of the dApp's source license |
| `links` | object | keys fixed: `docs` `discord` `x` `youtube` `blog`; values https URIs | Extra links; add only what exists |
| `placeholderAssets` | string[] | unique; each one of `icon-512.png` `icon-1024.png` `og.png` `hero.png` `tile.png` | §4.4 — declares which art is branded placeholder |

## 4. Assets — exact requirements

All assets are **PNG** files at the **EXACT pixel dimensions** below (validation reads the PNG
IHDR; a 1px deviation fails). Sizes are maxima. Paths are relative to `apps/<slug>/assets/`.

### 4.1 Fixed assets

| Path | Exact size (px) | Max bytes | Required |
|---|---|---|---|
| `icon-512.png` | 512 × 512 | 512 KiB | **to list** |
| `og.png` | 1200 × 630 | 1 MiB | **to list** |
| `icon-1024.png` | 1024 × 1024 | 1 MiB | optional |
| `hero.png` | 1600 × 900 (16:9) | 2 MiB | **to feature** (§4.3) |
| `tile.png` | 800 × 450 (16:9) | 1 MiB | optional |

Purpose: `icon-*` — the app medallion on cards and the detail page (1024 for high-DPI reuse);
`og.png` — the detail page's social-preview card; `hero.png` — the featured-shelf banner and the
detail-page hero; `tile.png` — compact promotional art for future shelf layouts.

### 4.2 Screenshots — `assets/screenshots/`

| Kind | File name | Exact size (px) | Max bytes | Count |
|---|---|---|---|---|
| desktop | `desktop-NN.png` | 1280 × 800 | 2 MiB each | ≤ 8; **≥ 2 required to feature** |
| mobile | `mobile-NN.png` | 1080 × 1920 | 2 MiB each | ≤ 8 |

- `NN` is two digits, numbered **sequentially from 01 with no gaps** (`desktop-01.png`,
  `desktop-02.png`, …). Any other file name in `screenshots/` fails validation.
- **A screenshot MUST be a real capture of the running dApp.** Mock-ups, renders, or branded
  placeholders are FORBIDDEN as screenshots (they are permitted only for the §4.1 art, per §4.4).
  `scripts/capture-screenshots.mjs` captures compliant screenshots from the live app.
- Screenshots SHOULD show the dApp's primary flow first.

### 4.3 Featured listings

A listing with `featured: true` MUST additionally satisfy:

- `status` is NOT `draft`;
- `hero.png` present (per §4.1);
- at least 2 desktop screenshots (per §4.2).

`featured` is a curation decision made by store maintainers; submissions SHOULD propose
`featured: false`.

### 4.4 Placeholder art

While a team's final art is pending, the §4.1 assets (icons, `og.png`, `hero.png`, `tile.png`) MAY
be clean, branded placeholders — the app's name/monogram and tagline on the store's brand
canvas (`scripts/gen-placeholder-assets.mjs` generates compliant ones). Every placeholder file
MUST be declared in `placeholderAssets`; the detail page then discloses "artwork pending" to
visitors. A declared placeholder that does not exist on disk fails validation. Screenshots MUST
NEVER be placeholders (§4.2).

## 5. Build artifacts (informative for consumers, normative for this repo)

Every build regenerates, and every deploy serves:

- `/catalog.json` — the machine catalog: every listing's full metadata plus resolved asset URLs
  (`assets.icon`, `assets.og`, `assets.hero?`, `assets.tile?`, `assets.icon1024?`,
  `assets.screenshots.desktop[]/mobile[]`, all under `/catalog/<slug>/…`) and `detailUrl`.
  Top-level: `generatedAt` (ISO 8601 build time), `storeVersion` (this package's semver),
  `siteUrl`, `count`, `apps[]` ordered featured-first, then newest `addedDate`, then name.
  **Agents MUST consume `catalog.json` rather than scraping HTML.**
- `/store.json` — the lean **launcher manifest** (§5.1): just what an app launcher needs — `name`
  + absolute `icon` + absolute `link` per listing. Derived from the same catalog build, so it never
  drifts from `catalog.json`. Consumers building a launcher grid (e.g. the dig-chrome-extension)
  MUST consume `store.json` rather than `catalog.json` or scraped HTML.
- `/app/<slug>` — a prerendered HTML page per listing carrying its own title, meta description,
  canonical URL, OG/Twitter tags (including the app's OWN `og:image` — sharing a detail page
  unfurls that app's card, never the generic store card), and `SoftwareApplication` JSON-LD.
- `/apps` — a prerendered HTML page for the Apps home-screen tab (§6), carrying its own title,
  meta description, canonical URL, and OG/Twitter tags (the store's own `og.png`, since the tab has
  no per-listing art of its own).
- `/sitemap.xml`, `/robots.txt`, `/llms.txt` — kept in sync with the catalog on every build; the
  sitemap and `llms.txt` both list `/apps` alongside home and every `/app/<slug>` page.
- The store's own icon set: `/favicon.svg`, `/apple-touch-icon.png` (180×180), `/icon-192.png`,
  `/icon-512.png`, `/site.webmanifest`, and the store's social card `/og.png` (1200×630).
- **Build gate** (`scripts/check-dist.mjs`): a build fails unless every file above exists, the
  home head carries the complete social/OG set, every prerendered app page carries its own
  canonical + `og:image`, and every OG image in the output is exactly 1200×630.
- The home page embeds `WebSite` + `ItemList` JSON-LD enumerating the catalog.

Stability: `slug`, the category enum, the §4 file names, and the `catalog.json` field names above
are stable identifiers; new OPTIONAL metadata/catalog fields MAY be added, existing ones MUST NOT
be renamed or repurposed.

### 5.1 Launcher manifest (`/store.json`) — normative

`/store.json` is a purpose-built, machine-consumable **launcher manifest**: the minimal data a
client needs to render a grid of app icons (an app launcher / phone home screen) that opens each
dApp. It is a stable, cross-repo contract — the **dig-chrome-extension** fetches it to build its
native mobile-phone launcher. It is DERIVED from the same build as `catalog.json` (§5), so the two
never drift.

**Serving.** Served as a real static JSON object at the site root `https://explore.dig.net/store.json`
(a 200 response, never the SPA `index.html` fallback), with `Content-Type: application/json` and
`Access-Control-Allow-Origin: *` so a cross-origin consumer may fetch it directly. It is regenerated
on every build and served under the short revalidating cache (a deploy propagates within minutes).

**Shape.**

```json
{
  "generatedAt": "2026-07-05T14:48:00.915Z",
  "version": "0.4.0",
  "apps": [
    {
      "slug": "chia-offer",
      "name": "Chia-Offer",
      "icon": "https://explore.dig.net/catalog/chia-offer/icon-512.png",
      "link": "https://chia-offer.on.dig.net/",
      "category": "tools",
      "featured": true,
      "accentColor": "#3aaa35"
    }
  ]
}
```

| Field | Type | Presence | Meaning |
|---|---|---|---|
| `generatedAt` | string | always | ISO 8601 build time (same value as `catalog.json`) |
| `version` | string | always | the store's semver (`catalog.json`'s `storeVersion`) |
| `apps` | array | always | one entry per listing, in the same order as `catalog.json` (featured first, then newest, then name) |
| `apps[].slug` | string | always | the listing's stable id (§3.1) |
| `apps[].name` | string | always | display name for the tile label |
| `apps[].icon` | string | always | **ABSOLUTE** `https://` URL of the 512×512 launcher icon |
| `apps[].link` | string | always | **ABSOLUTE** `https://` URL of the dApp — the tile's tap target (the listing's `url`) |
| `apps[].category` | string | always | the listing's category enum (§3.1) — for grouping/filtering the launcher |
| `apps[].featured` | boolean | always | the curated flag (§4.3) — a launcher MAY surface featured apps first |
| `apps[].accentColor` | string | optional | `#RRGGBB` brand accent for the icon backdrop, when the listing sets one |

`icon` and `link` are ABSOLUTE by contract: a consumer that does not know the site origin renders
the icon and opens the link without any base-URL knowledge. `store.json` intentionally omits the
long description, screenshots, tags, author, and status carried by `catalog.json` — a client needing
those consumes `catalog.json` instead. The field names above are stable identifiers; new OPTIONAL
fields MAY be added, existing ones MUST NOT be renamed or repurposed.

The build gate (`scripts/check-dist.mjs`) fails a deploy unless `store.json` is present, valid, has
the same app count as `catalog.json`, and every entry carries a `name` plus an absolute `icon` and
`link`.

## 6. Store frontend contract

- **Theme:** DIG brand light + dark; **dark is the default**. An explicit user choice persists
  (`localStorage["explore.theme"]`).
- **Featured carousel:** the featured shelf (every `featured: true` listing, §4.3 — no additional
  metadata is required for carousel eligibility) is presented as an auto-rotating carousel that
  gives every featured listing EQUAL exposure. The lead slide is chosen deterministically by a
  stable daily seed (prerender-safe — never `Math.random`), so a different featured listing leads
  on each day's build while a given render is stable; auto-advance then cycles through all featured
  slides. Auto-rotation MUST pause on pointer hover, on keyboard focus within the carousel, and
  under `prefers-reduced-motion`. The carousel MUST be operable by pointer AND keyboard (arrow keys
  + previous/next + a slide-picker + a play/pause rotation control), expose the ARIA carousel
  pattern (region with `aria-roledescription="carousel"`, each slide a `group` with
  `aria-roledescription="slide"`), and announce the current slide through a polite live region
  (WCAG 2.2 AA). Each slide carries a prominent "Open dApp" call-to-action linking to the listing's
  `url`. A single featured listing renders as a static hero (no rotation controls); zero featured
  listings render no shelf.
- **i18n:** all store chrome is react-intl over the ecosystem's 14 locales (en, zh-CN, zh-TW, ko,
  ja, ru, es, pt-BR, fr, de, tr, vi, id, hi); browser-locale detection with a persisted explicit
  choice (`localStorage["explore.locale"]`). Listing content (name/tagline/description) is
  author-provided and not machine-translated.
- **Accessibility:** WCAG 2.2 AA; CI runs axe over home/detail/not-found AND the Apps launcher at
  desktop + mobile widths (dark + light) and fails on any violation. The launcher's ambient
  wallpaper and home-indicator are decorative (`aria-hidden`); labels keep AA contrast against the
  solid launcher base in both themes.
- **Version exposure (§6.7 ecosystem rule):** the build's semver is visible in the footer, in
  `<meta name="app-version">`, and at `window.__APP_VERSION__`.
- **Bug reporting:** the shared `@dignetwork/components` `<BugReportButton repo="explore.dig.net">`
  is mounted at the shell; its API host `api.bugreport.dig.net` is allowed in the CSP.
- **Routing:** `/` (home), `/apps` (the Apps launcher), `/app/<slug>` (detail), anything else
  renders the not-found state. The filter state mirrors to the URL as `?category=<cat>&q=<text>`
  (home store only — the Apps launcher has no filter/search).
- **Width-aware landing (`/`):** there is a CLEAR launcher breakpoint at **600px**. On the bare
  landing `/`, a viewport **≤ 600px** (a phone) defaults to the Apps launcher — the "just like your
  home screen" promise — while a viewport **> 600px** (desktop) defaults to the curated store. An
  explicit `?view=` override on `/` always wins (`?view=store` / `?view=apps`), as does a filter
  query (`?q=` / `?category=` is store intent), so both surfaces stay deep-linkable and the Store
  pill remains reachable from the launcher on a phone. `/apps` is always the launcher; `/app/<slug>`
  and not-found are width-independent. (The document body is client-rendered, so the correct surface
  paints on first render — no store→launcher flash.)
- **Apps launcher (`/apps`, and `/` on phones):** every listed dApp renders as a phone-home-screen
  icon — the listing's `assets.icon` plus its `name` label beneath. **At or below the 600px
  breakpoint** it is a genuine Android-style home screen: a full-bleed, fixed violet→magenta ambient
  wallpaper (decorative, `aria-hidden`), four even full-width columns of big rounded (squircle) icons
  floating with soft drop shadows, labels beneath, the grid flowing from the top, and a decorative
  bottom home-indicator pill. **Above the breakpoint** it is the tidy centered desktop icon grid with
  the heading + intro (no wallpaper/indicator) — the switch is crisp, not a gradual reflow. Tapping a
  tile's icon+label opens the dApp's `url` directly in a new tab (the same action as the Store tab's
  "Open dApp" CTA); a small, separate "i" affordance on each tile links to that listing's
  `/app/<slug>` detail page. A `<nav>` labelled view switcher ("Store" / "Apps", `aria-current="page"`
  on the active one) appears on both surfaces so a visitor can move between the two presentations of
  the same catalog.

## 7. Submission checklist (author-facing)

This is the **manual** path (§1.1). To submit without forking, use the hub.dig.net dApp-submission
flow — the **authorized automated path** of §1.1 opens an equivalent pull request for you, subject
to the identical validation gate below.

1. Fork the repo; create `apps/<slug>/` (slug: lowercase letters/digits/hyphens, 3–40 chars).
2. Write `metadata.json` with every §3.1 required field (`"$schema": "../app.schema.json"`
   recommended for editor validation). Propose `featured: false`.
3. Add `assets/icon-512.png` (512×512) and `assets/og.png` (1200×630) — real brand art, or
   generated placeholders declared in `placeholderAssets`.
4. Capture real screenshots of the running dApp: at least one `desktop-01.png` (1280×800) is
   strongly recommended; mobile (1080×1920) welcome. Number sequentially from 01.
5. Run `npm ci && npm run validate:apps` — it must print `OK`.
6. Run `npm run build && npm test` — all green.
7. Open a PR titled `apps: add <slug>`; state what the dApp does and how you verified the listing.
   CI must be green; a maintainer reviews for curation fit (on-chain settlement, a working
   product, and source availability — open source with a `repo` link is strongly preferred).
