import { describe, expect, it } from "vitest";
import { APP_VERSION, publishAppVersion } from "./version";

describe("APP_VERSION", () => {
  it("is the injected build-time semver (package.json version, optional +sha suffix)", () => {
    expect(APP_VERSION).toMatch(/^\d+\.\d+\.\d+(\+[0-9a-f]+)?$/);
  });
});

describe("publishAppVersion", () => {
  it("publishes window.__APP_VERSION__ and a <meta name=\"app-version\"> tag (§6.7)", () => {
    publishAppVersion("1.2.3+abc");
    expect((window as typeof window & { __APP_VERSION__?: string }).__APP_VERSION__).toBe("1.2.3+abc");
    const meta = document.head.querySelector('meta[name="app-version"]');
    expect(meta?.getAttribute("content")).toBe("1.2.3+abc");
  });

  it("is idempotent — a repeat call updates the one meta tag in place", () => {
    publishAppVersion("1.0.0");
    publishAppVersion("2.0.0");
    const metas = document.head.querySelectorAll('meta[name="app-version"]');
    expect(metas).toHaveLength(1);
    expect(metas[0].getAttribute("content")).toBe("2.0.0");
  });

  it("defaults to the build's APP_VERSION", () => {
    publishAppVersion();
    const meta = document.head.querySelector('meta[name="app-version"]');
    expect(meta?.getAttribute("content")).toBe(APP_VERSION);
  });
});
