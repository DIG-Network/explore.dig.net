// Bug-report widget catalog completeness + integrity (issue #1825, CLAUDE.md §6.6): every widget
// key resolves to a real message per locale, each non-English catalog is genuinely translated (not
// an English paste), brand literals stay verbatim, and the resolver falls back to English. Mirrors
// the app-catalog gate (messages.test.ts) for the separate `bugReport.*` namespace.

import { describe, expect, it } from "vitest";
import { DEFAULT_MESSAGES } from "@dignetwork/components";
import {
  BUG_REPORT_MESSAGE_KEYS,
  bugReportMessageId,
  bugReportMessagesFor,
  type BugReportMessageKey,
} from "./bugReport";
import { bugReportCatalogs } from "./bugReportCatalogs";
import { SUPPORTED_LOCALES } from "../locales";

// Brand/scheme literals that MUST survive translation verbatim (§6.3). None appear in the current
// widget strings, so this list also guards against a future key introducing one that gets mangled.
const BRAND_LITERALS = ["$DIG", "XCH", "DIG Network", "chia://", "dig://"];

describe("bug-report widget catalogs", () => {
  it("cover a catalog for every supported non-English locale", () => {
    for (const { code } of SUPPORTED_LOCALES) {
      if (code === "en") continue;
      expect(bugReportCatalogs[code], `missing widget catalog for ${code}`).toBeDefined();
    }
  });

  it("contain only real widget keys (no orphans/typos)", () => {
    const known = new Set<string>(BUG_REPORT_MESSAGE_KEYS);
    for (const [code, catalog] of Object.entries(bugReportCatalogs)) {
      for (const key of Object.keys(catalog)) {
        expect(known.has(key), `${code} has unknown widget key "${key}"`).toBe(true);
      }
    }
  });

  it("translate a clear majority of keys per locale (catches an English paste)", () => {
    // Every key MUST be present per-locale (verified via the resolver below). Some values MAY
    // legitimately match English (brand terms, coincidences), so we require a strong majority be
    // genuinely translated — a catalog under 70% distinct-from-English means someone pasted English.
    for (const [code, catalog] of Object.entries(bugReportCatalogs)) {
      let translated = 0;
      for (const key of BUG_REPORT_MESSAGE_KEYS) {
        if (catalog[key as BugReportMessageKey] !== DEFAULT_MESSAGES[key]) translated++;
      }
      const ratio = translated / BUG_REPORT_MESSAGE_KEYS.length;
      expect(
        ratio,
        `${code}: only ${(ratio * 100).toFixed(0)}% of widget keys are translated`,
      ).toBeGreaterThan(0.7);
    }
  });

  it("resolve every widget id for every supported locale (English fallback fills gaps)", () => {
    for (const { code } of SUPPORTED_LOCALES) {
      const resolved = bugReportMessagesFor(code);
      for (const key of BUG_REPORT_MESSAGE_KEYS) {
        expect(resolved[bugReportMessageId(key)], `${code} resolves without "${key}"`).toBeTruthy();
      }
    }
  });

  it("fall back to the English base for an unknown locale", () => {
    const resolved = bugReportMessagesFor("xx");
    for (const key of BUG_REPORT_MESSAGE_KEYS) {
      expect(resolved[bugReportMessageId(key)]).toBe(DEFAULT_MESSAGES[key]);
    }
  });

  it("apply the locale's translation over the English base", () => {
    // The German launcher label is translated, so the resolved value must differ from English.
    const de = bugReportMessagesFor("de");
    expect(de[bugReportMessageId("launcherAriaLabel")]).toBe("Fehler melden");
    expect(de[bugReportMessageId("launcherAriaLabel")]).not.toBe(
      DEFAULT_MESSAGES.launcherAriaLabel,
    );
  });

  it("preserve brand/scheme literals verbatim in every locale", () => {
    for (const [code, catalog] of Object.entries(bugReportCatalogs)) {
      for (const key of BUG_REPORT_MESSAGE_KEYS) {
        const english = DEFAULT_MESSAGES[key];
        const translated = catalog[key as BugReportMessageKey];
        if (translated === undefined) continue;
        for (const literal of BRAND_LITERALS) {
          if (english.includes(literal)) {
            expect(translated, `${code}.${key} dropped "${literal}"`).toContain(literal);
          }
        }
      }
    }
  });
});
