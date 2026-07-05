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
    // Viewport-agnostic: start from /apps (always the launcher) and toggle both ways. The Store pill
    // carries an explicit override on phones (where / defaults to the launcher), so it is reachable
    // on desktop AND mobile.
    await page.goto("/apps");
    await expect(page.getByTestId("view-tab-apps")).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("app-home-grid")).toBeVisible();

    await page.getByTestId("view-tab-store").click();
    await expect(page.getByTestId("view-tab-store")).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("app-grid")).toBeVisible();

    await page.getByTestId("view-tab-apps").click();
    await expect(page).toHaveURL(/\/apps$/);
    await expect(page.getByTestId("view-tab-apps")).toHaveAttribute("aria-current", "page");
    await expect(page.getByTestId("app-home-grid")).toBeVisible();
  });

  // #51 follow-up: the landing (`/`) is width-aware — a phone visitor lands ON the launcher (the
  // "just like your home screen" promise), a desktop visitor on the curated store. The breakpoint
  // is 600px; the mobile project (Pixel 5) is 393px and the desktop project is ~1280px.
  test("the landing at / defaults to the launcher on phones and the store on desktop", async ({
    page,
  }) => {
    const width = page.viewportSize()?.width ?? 0;
    await page.goto("/");
    if (width <= 600) {
      await expect(page.getByTestId("app-home-grid")).toBeVisible();
      await expect(page.getByTestId("view-tab-apps")).toHaveAttribute("aria-current", "page");
      await expect(page.getByTestId("view-tab-store")).toHaveAttribute("href", "/?view=store");
      await expectAxeClean(page);
    } else {
      await expect(page.getByTestId("app-grid")).toBeVisible();
      await expect(page.getByTestId("view-tab-store")).toHaveAttribute("aria-current", "page");
    }
  });

  test("the ambient launcher wallpaper shows on phones and is absent on desktop", async ({
    page,
  }) => {
    const width = page.viewportSize()?.width ?? 0;
    await page.goto("/apps");
    const wallpaper = page.getByTestId("launcher-wallpaper");
    if (width <= 600) {
      await expect(wallpaper).toBeVisible();
    } else {
      await expect(wallpaper).toBeHidden();
    }
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

  // Regression for #51 follow-up: on phones the grid must read as a home-screen launcher — a
  // full-width, evenly-distributed 4-up column layout — NOT the old centered fixed-72px cluster
  // (`repeat(auto-fit, 72px)` + `justify-content: center`, which rendered a handful of icons as a
  // small centered widget). Asserted against real CSS at the exact target phone widths.
  for (const width of [360, 390, 414]) {
    test(`renders a full-width 4-up launcher grid at ${width}px`, async ({ page }) => {
      await page.setViewportSize({ width, height: 780 });
      await page.goto("/apps");
      const grid = page.getByTestId("app-home-grid");
      await expect(grid).toBeVisible();
      const tracks = await grid.evaluate(
        (el) =>
          getComputedStyle(el)
            .gridTemplateColumns.split(" ")
            .map((v) => parseFloat(v)),
      );
      // Exactly four equal columns (the cluster layout produced one track per app / collapsed
      // 72px tracks, never four evenly-sized ones).
      expect(tracks).toHaveLength(4);
      // Each 1fr track is far wider than the old fixed 72px cluster track — proof the grid spans
      // the full shell width instead of centering a small icon cluster.
      for (const track of tracks) expect(track).toBeGreaterThan(74);
    });
  }
});
