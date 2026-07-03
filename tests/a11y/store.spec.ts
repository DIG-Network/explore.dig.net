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
    // Featured shelf shows the curated app.
    await expect(page.getByTestId("featured-xchtip")).toBeVisible();
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
