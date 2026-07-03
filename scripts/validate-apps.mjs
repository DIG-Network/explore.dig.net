// validate-apps — the CI listing gate (SPEC.md §3-§4, normative).
//
// Validates EVERY apps/<slug>/ folder against the full submission contract:
//   1. metadata.json validates against apps/app.schema.json (JSON Schema 2020-12, Ajv strict);
//   2. the folder name equals `slug` (and slugs are unique);
//   3. the asset set matches SPEC.md §4 exactly — required files present, EXACT pixel dimensions,
//      max byte sizes, sequential screenshot numbering, and no unexpected files;
//   4. featured listings carry the full featured set (hero + ≥2 desktop screenshots) and are not
//      status "draft".
//
// Exit code 1 with a per-error report on any violation — an invalid listing FAILS the build.
// Exported as functions so build-catalog.mjs reuses the same gate and vitest exercises the rules.

import { readFileSync, readdirSync, existsSync, statSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import Ajv2020 from "ajv/dist/2020.js";
import addFormats from "ajv-formats";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const APPS_DIR = join(ROOT, "apps");

/**
 * The normative asset table (SPEC.md §4). `requiredToList` files must exist for ANY listing;
 * `requiredToFeature` additionally for featured ones. Dimensions are EXACT; sizes are maxima.
 */
export const ASSET_RULES = Object.freeze({
  "icon-512.png": { width: 512, height: 512, maxBytes: 512 * 1024, requiredToList: true },
  "icon-1024.png": { width: 1024, height: 1024, maxBytes: 1024 * 1024, requiredToList: false },
  "og.png": { width: 1200, height: 630, maxBytes: 1024 * 1024, requiredToList: true },
  "hero.png": { width: 1600, height: 900, maxBytes: 2 * 1024 * 1024, requiredToFeature: true },
  "tile.png": { width: 800, height: 450, maxBytes: 1024 * 1024, requiredToList: false },
});

export const SCREENSHOT_RULES = Object.freeze({
  desktop: { width: 1280, height: 800, maxBytes: 2 * 1024 * 1024, max: 8, minToFeature: 2 },
  mobile: { width: 1080, height: 1920, maxBytes: 2 * 1024 * 1024, max: 8, minToFeature: 0 },
});

/** Parse a PNG buffer's IHDR dimensions. Returns null if the buffer is not a PNG. */
export function readPngSize(buf) {
  const SIG = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (buf.length < 24 || SIG.some((b, i) => buf[i] !== b)) return null;
  if (buf.toString("ascii", 12, 16) !== "IHDR") return null;
  return { width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
}

function compileSchema() {
  const schema = JSON.parse(readFileSync(join(APPS_DIR, "app.schema.json"), "utf-8"));
  const ajv = new Ajv2020({ allErrors: true, strict: true });
  addFormats(ajv);
  return ajv.compile(schema);
}

function checkPng(file, rule, errors, label) {
  const buf = readFileSync(file);
  const size = readPngSize(buf);
  if (!size) {
    errors.push(`${label}: not a valid PNG`);
    return;
  }
  if (size.width !== rule.width || size.height !== rule.height) {
    errors.push(
      `${label}: must be exactly ${rule.width}×${rule.height}, got ${size.width}×${size.height}`,
    );
  }
  if (buf.length > rule.maxBytes) {
    errors.push(`${label}: ${buf.length} bytes exceeds the ${rule.maxBytes}-byte maximum`);
  }
}

/** Validate one app folder. Returns { meta, assets, errors } — errors [] when compliant. */
export function validateAppDir(dir, validate) {
  const slug = dir.split(/[\\/]/).pop();
  const errors = [];
  const metaPath = join(dir, "metadata.json");
  if (!existsSync(metaPath)) {
    return { meta: null, assets: null, errors: [`${slug}: missing metadata.json`] };
  }
  let meta;
  try {
    meta = JSON.parse(readFileSync(metaPath, "utf-8"));
  } catch (e) {
    return { meta: null, assets: null, errors: [`${slug}/metadata.json: invalid JSON — ${e.message}`] };
  }
  // The $schema editor hint is allowed in the file but is not part of the contract.
  const { $schema: _ignored, ...candidate } = meta;
  if (!validate(candidate)) {
    for (const err of validate.errors ?? []) {
      errors.push(`${slug}/metadata.json${err.instancePath || ""}: ${err.message}`);
    }
  }
  if (candidate.slug && candidate.slug !== slug) {
    errors.push(`${slug}: folder name must equal metadata slug ("${candidate.slug}")`);
  }

  // ---- assets ----
  const assetsDir = join(dir, "assets");
  if (!existsSync(assetsDir)) {
    errors.push(`${slug}: missing assets/ directory`);
    return { meta: candidate, assets: null, errors };
  }

  const found = { files: [], screenshots: { desktop: [], mobile: [] } };
  const topEntries = readdirSync(assetsDir, { withFileTypes: true });
  for (const entry of topEntries) {
    if (entry.isDirectory()) {
      if (entry.name !== "screenshots") {
        errors.push(`${slug}/assets/${entry.name}/: unexpected directory (only screenshots/ is allowed)`);
      }
      continue;
    }
    if (!(entry.name in ASSET_RULES)) {
      errors.push(`${slug}/assets/${entry.name}: unexpected file (SPEC.md §4 lists the allowed set)`);
      continue;
    }
    found.files.push(entry.name);
    checkPng(join(assetsDir, entry.name), ASSET_RULES[entry.name], errors, `${slug}/assets/${entry.name}`);
  }

  for (const [name, rule] of Object.entries(ASSET_RULES)) {
    if (rule.requiredToList && !found.files.includes(name)) {
      errors.push(`${slug}/assets/${name}: REQUIRED to list, missing`);
    }
  }

  const shotsDir = join(assetsDir, "screenshots");
  if (existsSync(shotsDir)) {
    for (const file of readdirSync(shotsDir).sort()) {
      const m = /^(desktop|mobile)-(\d{2})\.png$/.exec(file);
      if (!m) {
        errors.push(`${slug}/assets/screenshots/${file}: name must be desktop-NN.png or mobile-NN.png`);
        continue;
      }
      const kind = m[1];
      found.screenshots[kind].push(file);
      checkPng(join(shotsDir, file), SCREENSHOT_RULES[kind], errors, `${slug}/assets/screenshots/${file}`);
    }
    for (const kind of ["desktop", "mobile"]) {
      const list = found.screenshots[kind];
      if (list.length > SCREENSHOT_RULES[kind].max) {
        errors.push(`${slug}: more than ${SCREENSHOT_RULES[kind].max} ${kind} screenshots`);
      }
      // Numbering must be sequential from 01 (…-01.png, …-02.png, …).
      list.forEach((file, i) => {
        const expected = `${kind}-${String(i + 1).padStart(2, "0")}.png`;
        if (file !== expected) {
          errors.push(`${slug}/assets/screenshots/${file}: expected ${expected} (sequential from 01, no gaps)`);
        }
      });
    }
  }

  // ---- featured contract (SPEC.md §4.3) ----
  if (candidate.featured === true) {
    if (candidate.status === "draft") {
      errors.push(`${slug}: a featured app must not be status "draft"`);
    }
    if (!found.files.includes("hero.png")) {
      errors.push(`${slug}/assets/hero.png: REQUIRED to feature, missing`);
    }
    if (found.screenshots.desktop.length < SCREENSHOT_RULES.desktop.minToFeature) {
      errors.push(
        `${slug}: featured apps need ≥${SCREENSHOT_RULES.desktop.minToFeature} desktop screenshots, ` +
          `got ${found.screenshots.desktop.length}`,
      );
    }
  }

  // Placeholder-marked assets must actually exist (a phantom marker is a listing bug).
  for (const p of candidate.placeholderAssets ?? []) {
    if (!found.files.includes(p)) {
      errors.push(`${slug}: placeholderAssets lists "${p}" but assets/${p} does not exist`);
    }
  }

  return { meta: candidate, assets: found, errors };
}

/** Validate every app folder under appsDir. Returns { apps, errors }. */
export function validateApps(appsDir = APPS_DIR) {
  const validate = compileSchema();
  const errors = [];
  const apps = [];
  const seen = new Set();
  const dirs = readdirSync(appsDir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  if (dirs.length === 0) errors.push("apps/: no app folders found");
  for (const name of dirs) {
    const res = validateAppDir(join(appsDir, name), validate);
    errors.push(...res.errors);
    if (res.meta) {
      if (seen.has(res.meta.slug)) errors.push(`${name}: duplicate slug "${res.meta.slug}"`);
      seen.add(res.meta.slug);
      apps.push({ dir: join(appsDir, name), meta: res.meta, assets: res.assets });
    }
  }
  return { apps, errors };
}

// ---- CLI entry (the CI gate) ----
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const { apps, errors } = validateApps();
  if (errors.length) {
    console.error(`[validate-apps] ${errors.length} violation(s):\n  - ` + errors.join("\n  - "));
    process.exit(1);
  }
  console.log(`[validate-apps] OK — ${apps.length} listing(s) conform to SPEC.md.`);
}
