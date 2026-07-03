// Locale-catalog completeness + integrity (CLAUDE.md §6.6): every locale key is a real message id,
// every supported locale resolves to a FULLY-populated map (English per-key fallback), brand
// literals stay verbatim, and ICU plural syntax is present where required.

import { describe, expect, it } from "vitest";
import { en, type MessageKey } from "./en";
import { MESSAGE_KEYS, messagesFor } from "./index";
import { SUPPORTED_LOCALES } from "../locales";

// Import each catalog directly so orphan keys (typos) are caught per-locale.
import { zhCN } from "./zh-CN";
import { zhTW } from "./zh-TW";
import { ko } from "./ko";
import { ja } from "./ja";
import { ru } from "./ru";
import { es } from "./es";
import { ptBR } from "./pt-BR";
import { fr } from "./fr";
import { de } from "./de";
import { tr } from "./tr";
import { vi } from "./vi";
import { id } from "./id";
import { hi } from "./hi";

const CATALOGS: Record<string, Partial<Record<MessageKey, string>>> = {
  "zh-CN": zhCN, "zh-TW": zhTW, ko, ja, ru, es, "pt-BR": ptBR, fr, de, tr, vi, id, hi,
};

const EN_KEYS = new Set(Object.keys(en));

describe("locale catalogs", () => {
  it("cover a catalog for every supported non-English locale", () => {
    for (const { code } of SUPPORTED_LOCALES) {
      if (code === "en") continue;
      expect(CATALOGS[code], `missing catalog for ${code}`).toBeDefined();
    }
  });

  it("contain only keys that exist in the English base (no orphans/typos)", () => {
    for (const [code, catalog] of Object.entries(CATALOGS)) {
      for (const key of Object.keys(catalog)) {
        expect(EN_KEYS.has(key), `${code} has unknown key "${key}"`).toBe(true);
      }
    }
  });

  it("translate every message id in every locale (full coverage, mostly non-English)", () => {
    // Every key MUST be present per-locale (full id coverage). Individual values MAY legitimately
    // coincide with English (brand literals, loanwords, cross-language coincidences like Spanish
    // "Social") — so instead of a brittle per-key check, require that a clear MAJORITY of each
    // catalog is actually translated. A locale falling below 70% identical-to-English means
    // someone pasted the English catalog.
    for (const [code, catalog] of Object.entries(CATALOGS)) {
      let translated = 0;
      for (const key of MESSAGE_KEYS) {
        const value = catalog[key];
        expect(value, `${code} is missing "${key}"`).toBeDefined();
        if (value !== en[key]) translated++;
      }
      const ratio = translated / MESSAGE_KEYS.length;
      expect(ratio, `${code}: only ${(ratio * 100).toFixed(0)}% of keys are translated`).toBeGreaterThan(0.7);
    }
  });

  it("resolve to a complete message map for every supported locale", () => {
    for (const { code } of SUPPORTED_LOCALES) {
      const messages = messagesFor(code);
      for (const key of MESSAGE_KEYS) {
        expect(messages[key], `${code} resolves without "${key}"`).toBeTruthy();
      }
    }
  });

  it("falls back to English for an unknown locale", () => {
    expect(messagesFor("xx")).toEqual(en);
  });

  it("preserves brand literals verbatim in every locale (§6.3)", () => {
    for (const { code } of SUPPORTED_LOCALES) {
      const messages = messagesFor(code);
      expect(messages.appName, `${code}.appName`).toBe("explore.dig.net");
      expect(messages.headerTagline, `${code}.headerTagline`).toContain("DIG Network");
      expect(messages.footerTagline, `${code}.footerTagline`).toContain("DIG Network");
    }
  });

  it("keeps ICU plural syntax in the count message for every locale", () => {
    for (const { code } of SUPPORTED_LOCALES) {
      const msg = messagesFor(code).appsCount;
      expect(msg, `${code}.appsCount`).toMatch(/\{count, plural,/);
      expect(msg, `${code}.appsCount`).toContain("other");
    }
  });
});
