import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  initialLocale,
  isSupportedLocale,
  LOCALE_STORAGE_KEY,
  localeEntry,
  persistLocale,
  resolveLocale,
  resolveOne,
  SUPPORTED_LOCALES,
} from "./locales";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("SUPPORTED_LOCALES", () => {
  it("ships the ecosystem's standard 14 locales, English first", () => {
    expect(SUPPORTED_LOCALES).toHaveLength(14);
    expect(SUPPORTED_LOCALES[0].code).toBe("en");
    expect(SUPPORTED_LOCALES.map((l) => l.code)).toEqual([
      "en", "zh-CN", "zh-TW", "ko", "ja", "ru", "es", "pt-BR", "fr", "de", "tr", "vi", "id", "hi",
    ]);
  });

  it("every entry has an endonym and English name", () => {
    for (const l of SUPPORTED_LOCALES) {
      expect(l.endonym.length).toBeGreaterThan(0);
      expect(l.englishName.length).toBeGreaterThan(0);
    }
  });
});

describe("isSupportedLocale / localeEntry", () => {
  it("accepts exact canonical codes only", () => {
    expect(isSupportedLocale("en")).toBe(true);
    expect(isSupportedLocale("pt-BR")).toBe(true);
    expect(isSupportedLocale("pt")).toBe(false);
    expect(isSupportedLocale(null)).toBe(false);
  });
  it("looks up entries by code", () => {
    expect(localeEntry("ja")?.endonym).toBe("日本語");
    expect(localeEntry("xx")).toBeUndefined();
  });
});

describe("resolveOne", () => {
  it("matches exact canonical tags", () => {
    expect(resolveOne("zh-CN")).toBe("zh-CN");
    expect(resolveOne("pt-BR")).toBe("pt-BR");
  });
  it("maps traditional-script Chinese regions to zh-TW", () => {
    expect(resolveOne("zh-TW")).toBe("zh-TW");
    expect(resolveOne("zh-HK")).toBe("zh-TW");
    expect(resolveOne("zh-Hant")).toBe("zh-TW");
  });
  it("falls back to the primary language", () => {
    expect(resolveOne("en-GB")).toBe("en");
    expect(resolveOne("pt-PT")).toBe("pt-BR");
    expect(resolveOne("es-419")).toBe("es");
    expect(resolveOne("de_DE")).toBe("de");
  });
  it("returns null for unsupported languages and junk", () => {
    expect(resolveOne("sv")).toBeNull();
    expect(resolveOne("")).toBeNull();
    expect(resolveOne(null)).toBeNull();
    expect(resolveOne(undefined)).toBeNull();
  });
});

describe("resolveLocale", () => {
  it("returns the first supported tag from an ordered list", () => {
    expect(resolveLocale(["sv", "zh-HK", "en"])).toBe("zh-TW");
  });
  it("falls back to the default when nothing matches", () => {
    expect(resolveLocale(["sv", "fi"])).toBe(DEFAULT_LOCALE);
    expect(resolveLocale([])).toBe(DEFAULT_LOCALE);
    expect(resolveLocale(null)).toBe(DEFAULT_LOCALE);
  });
});

describe("initialLocale / persistLocale", () => {
  it("honors a persisted explicit choice", () => {
    persistLocale("ko");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("ko");
    expect(initialLocale()).toBe("ko");
  });
  it("ignores a corrupted persisted value and falls back to detection", () => {
    localStorage.setItem(LOCALE_STORAGE_KEY, "klingon");
    // jsdom's navigator.language is "en-US" → resolves to "en".
    expect(initialLocale()).toBe("en");
  });
});
