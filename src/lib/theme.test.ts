import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  applyTheme,
  DEFAULT_THEME,
  initialTheme,
  isTheme,
  otherTheme,
  persistTheme,
  THEME_STORAGE_KEY,
} from "./theme";

beforeEach(() => {
  localStorage.clear();
  delete document.documentElement.dataset.theme;
});

afterEach(() => {
  localStorage.clear();
});

describe("isTheme", () => {
  it("accepts only the two theme names", () => {
    expect(isTheme("dark")).toBe(true);
    expect(isTheme("light")).toBe(true);
    expect(isTheme("solarized")).toBe(false);
    expect(isTheme(null)).toBe(false);
    expect(isTheme(undefined)).toBe(false);
  });
});

describe("initialTheme", () => {
  it("defaults to DARK with no persisted choice (regardless of OS preference)", () => {
    expect(DEFAULT_THEME).toBe("dark");
    expect(initialTheme()).toBe("dark");
  });

  it("honors a persisted explicit choice", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    expect(initialTheme()).toBe("light");
  });

  it("ignores a corrupted persisted value", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "banana");
    expect(initialTheme()).toBe("dark");
  });
});

describe("persistTheme", () => {
  it("stores the choice under the theme key", () => {
    persistTheme("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
  });
});

describe("applyTheme", () => {
  it("sets data-theme on <html>", () => {
    applyTheme("light");
    expect(document.documentElement.dataset.theme).toBe("light");
    applyTheme("dark");
    expect(document.documentElement.dataset.theme).toBe("dark");
  });

  it("keeps the theme-color meta in sync when present", () => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "theme-color");
    document.head.appendChild(meta);
    try {
      applyTheme("light");
      expect(meta.getAttribute("content")).toBe("#FFFFFF");
      applyTheme("dark");
      expect(meta.getAttribute("content")).toBe("#0A0A20");
    } finally {
      meta.remove();
    }
  });
});

describe("otherTheme", () => {
  it("flips between dark and light", () => {
    expect(otherTheme("dark")).toBe("light");
    expect(otherTheme("light")).toBe("dark");
  });
});
