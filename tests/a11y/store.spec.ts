// Accessibility (WCAG 2.2 AA via axe) + interaction smoke over the BUILT store — desktop and
// mobile projects (see playwright.config.ts). Every public view is scanned: home, an app detail
// page, the not-found state, and the filtered/empty states.

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function expectAxeClean(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test.describe("home", () => {
  test("renders the seeded catalog and is axe-clean", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("app-card-xchtip")).toBeVisible();
    await expect(page.getByTestId("app-card-xchannuity")).toBeVisible();
    await expect(page.getByTestId("app-card-cxch")).toBeVisible();
    // The featured carousel shows a curated slide with a direct Open CTA (which slide leads
    // rotates by day, so assert the carousel + a slide rather than a specific app).
    await expect(page.getByTestId("featured-carousel")).toBeVisible();
    await expect(page.locator(".carousel-viewport .featured-card")).toBeVisible();
    await expectAxeClean(page);
  });

  test("defaults to the dark theme", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  });

  test("theme toggle switches to light and persists", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("theme-toggle").click();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expectAxeClean(page); // the light theme must hold WCAG contrast too
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("search + category filter drive the grid and the URL", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("search-input").fill("annuity");
    await expect(page.getByTestId("apps-count")).toHaveText("1 app");
    await expect(page).toHaveURL(/q=annuity/);
    await page.getByTestId("clear-filters").click();
    await page.getByTestId("category-payments").click();
    await expect(page.getByTestId("app-card-xchtip")).toBeVisible();
    await expect(page.getByTestId("app-card-cxch")).toHaveCount(0);
  });

  test("empty state is a real, recoverable state and axe-clean", async ({ page }) => {
    await page.goto("/?q=zzz-no-such-app");
    await expect(page.getByTestId("empty-state")).toBeVisible();
    await expectAxeClean(page);
  });

  test("language selector switches the store chrome", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("language-selector").selectOption("de");
    await expect(page.locator("html")).toHaveAttribute("lang", "de");
    await expect(page.getByRole("heading", { name: "Alle Apps" })).toBeVisible();
  });

  test("skip link focuses main content", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    await expect(page.locator(".skip-link")).toBeFocused();
  });

  // WCAG 2.4.7 Focus Visible (AA): every keyboard-focusable control must show a visible
  // indicator on focus. axe's static DOM scan can't catch a focus-only CSS regression (it never
  // drives focus), so this asserts the computed outline directly once the search input is
  // actually focused via the keyboard.
  test("search input shows a visible focus outline", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("search-input").focus();
    const outline = await page.getByTestId("search-input").evaluate((el) => {
      const style = getComputedStyle(el);
      return { style: style.outlineStyle, width: style.outlineWidth };
    });
    expect(outline.style).not.toBe("none");
    expect(outline.width).not.toBe("0px");
  });
});

test.describe("featured carousel", () => {
  // Reduced motion pauses auto-rotation, making the slide change ONLY on explicit interaction —
  // so these control tests are deterministic (and it exercises the reduced-motion contract).
  // Emulate BEFORE navigation so matchMedia reports it at first mount.
  test.beforeEach(async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  const activeSlug = (page: Page) => page.locator(".carousel-viewport .featured-card");

  test("auto-rotation stays paused under prefers-reduced-motion", async ({ page }) => {
    await page.goto("/");
    const region = page.getByTestId("featured-carousel");
    await expect(region).toHaveAttribute("data-playing", "false");
    await expect(page.getByTestId("carousel-playpause")).toHaveAttribute(
      "aria-label",
      "Resume auto-rotation",
    );
  });

  test("next / prev controls change the slide", async ({ page }) => {
    await page.goto("/");
    const before = await activeSlug(page).getAttribute("data-testid");
    await page.getByTestId("carousel-next").click();
    const afterNext = await activeSlug(page).getAttribute("data-testid");
    expect(afterNext).not.toBe(before);
    await page.getByTestId("carousel-prev").click();
    await expect(activeSlug(page)).toHaveAttribute("data-testid", before!);
  });

  test("dot controls jump to a slide and mark the current one", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("carousel-dot-1").click();
    await expect(page.getByTestId("carousel-dot-1")).toHaveAttribute("aria-current", "true");
    await expect(page.getByTestId("carousel-dot-0")).toHaveAttribute("aria-current", "false");
  });

  test("is keyboard operable with the arrow keys", async ({ page }) => {
    await page.goto("/");
    const before = await activeSlug(page).getAttribute("data-testid");
    await page.getByTestId("carousel-next").focus();
    await page.keyboard.press("ArrowRight");
    const afterRight = await activeSlug(page).getAttribute("data-testid");
    expect(afterRight).not.toBe(before);
    await page.keyboard.press("ArrowLeft");
    await expect(activeSlug(page)).toHaveAttribute("data-testid", before!);
  });

  test("announces the current slide via a polite live region", async ({ page }) => {
    await page.goto("/");
    const status = page.getByTestId("carousel-status");
    await expect(status).toHaveAttribute("aria-live", "polite"); // polite while paused
    await expect(status).not.toBeEmpty();
    await expectAxeClean(page);
  });

  test("every featured slide is reachable and opens the live dApp", async ({ page }) => {
    await page.goto("/");
    const dots = page.locator(".carousel-dot");
    const total = await dots.count();
    expect(total).toBeGreaterThanOrEqual(2);
    for (let i = 0; i < total; i++) {
      await dots.nth(i).click();
      const open = page.locator(".carousel-viewport .featured-actions a.btn-primary");
      await expect(open).toHaveAttribute("href", /^https?:\/\//);
      await expect(open).toHaveAttribute("target", "_blank");
    }
  });
});

test.describe("app detail", () => {
  test("prerendered detail page renders the listing and is axe-clean", async ({ page }) => {
    await page.goto("/app/xchtip");
    await expect(page.getByRole("heading", { level: 1, name: "xchtip.app" })).toBeVisible();
    await expect(page.getByTestId("open-dapp")).toHaveAttribute("href", "https://xchtip.app/");
    await expect(page.getByTestId("screenshot-gallery")).toBeVisible();
    await expectAxeClean(page);
  });

  test("placeholder art is disclosed on listings that carry it", async ({ page }) => {
    await page.goto("/app/cxch");
    await expect(page.getByTestId("placeholder-note")).toBeVisible();
  });

  test("unknown slug renders the not-found state, axe-clean", async ({ page }) => {
    await page.goto("/app/no-such-app");
    await expect(page.getByTestId("not-found")).toBeVisible();
    await expectAxeClean(page);
  });
});
