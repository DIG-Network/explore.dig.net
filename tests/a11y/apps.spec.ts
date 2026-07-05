// Accessibility (WCAG 2.2 AA via axe) + interaction smoke over the "Apps" home-screen tab (#51) —
// the phone-home-screen icon grid presentation of the same catalog the store home renders. Desktop
// and mobile projects (see playwright.config.ts).

import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

async function expectAxeClean(page: Page) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(results.violations, JSON.stringify(results.violations, null, 2)).toEqual([]);
}

test.describe("Apps home-screen tab", () => {
  test("renders every listed dApp as a tile and is axe-clean", async ({ page }) => {
    await page.goto("/apps");
    await expect(page.getByRole("heading", { level: 1, name: "Apps" })).toBeVisible();
    await expect(page.getByTestId("app-tile-xchtip")).toBeVisible();
    await expect(page.getByTestId("app-tile-cxch")).toBeVisible();
    await expect(page.getByTestId("app-tile-xchannuity")).toBeVisible();
    await expectAxeClean(page);
  });

  test("tapping a tile opens the dApp directly, in a new tab", async ({ page }) => {
    await page.goto("/apps");
    const link = page.getByTestId("app-tile-link-xchtip");
    await expect(link).toHaveAttribute("href", "https://xchtip.app/");
    await expect(link).toHaveAttribute("target", "_blank");
  });

  test("the info affordance opens the listing's detail page", async ({ page }) => {
    await page.goto("/apps");
    await expect(page.getByTestId("app-tile-info-xchtip")).toHaveAttribute("href", "/app/xchtip");
  });

  test("the Store/Apps view tabs switch views and mark the current one", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("view-tab-store")).toHaveAttribute("aria-current", "page");
    await page.getByTestId("view-tab-apps").click();
    await expect(page).toHaveURL(/\/apps$/);
    await expect(page.getByTestId("view-tab-apps")).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("app-home-grid")).toBeVisible();
  });

  test("is keyboard operable: a tile link and its info affordance are both reachable by Tab", async ({
    page,
  }) => {
    await page.goto("/apps");
    await page.getByTestId("app-tile-link-xchtip").focus();
    await expect(page.getByTestId("app-tile-link-xchtip")).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(page.getByTestId("app-tile-info-xchtip")).toBeFocused();
  });

  test("holds WCAG contrast in the light theme too", async ({ page }) => {
    await page.goto("/apps");
    await page.evaluate(() => localStorage.setItem("explore.theme", "light"));
    await page.reload();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
    await expectAxeClean(page);
  });
});
