// App shell tests: routing, chrome (header/footer), the version display (§6.7), and the shared
// bug-report widget mount. The widget itself is @dignetwork/components' concern — mocked here so
// the shell test asserts only OUR contract with it (repo + appVersion props).

import { afterEach, describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/renderWithIntl";
import { APP_VERSION } from "@/lib/version";
import { App } from "./App";

vi.mock("@dignetwork/components", () => ({
  BugReportButton: ({ repo, appVersion }: { repo: string; appVersion?: string }) => (
    <div data-testid="bug-report-button" data-repo={repo} data-app-version={appVersion} />
  ),
}));

/** Force the launcher breakpoint match so `/` resolves to the phone launcher (#51 follow-up). */
function mockViewport(isLauncher: boolean) {
  window.matchMedia = vi.fn().mockImplementation((q: string) => ({
    matches: isLauncher,
    media: q,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

// Reset to the desktop default after every test so the many tests that don't set a viewport keep
// getting the store landing (jsdom has no real matchMedia; setup.ts stubs matches:false).
afterEach(() => {
  mockViewport(false);
});

describe("<App>", () => {
  it("renders the store home at / with header, main landmark, and footer", () => {
    renderWithIntl(<App pathname="/" search="" />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("contentinfo")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1 })).toBeInTheDocument();
    // The seeded catalog renders on the shelf.
    expect(screen.getByTestId("app-card-xchtip")).toBeInTheDocument();
  });

  it("offers a skip-to-content link as the first focusable", () => {
    renderWithIntl(<App pathname="/" search="" />);
    const skip = screen.getByRole("link", { name: "Skip to content" });
    expect(skip).toHaveAttribute("href", "#main");
  });

  it("renders an app detail page from its route and titles the tab", () => {
    renderWithIntl(<App pathname="/app/xchtip" search="" />);
    expect(screen.getByTestId("detail-xchtip")).toBeInTheDocument();
    expect(document.title).toContain("xchtip.app");
  });

  it("renders not-found for an unknown path", () => {
    renderWithIntl(<App pathname="/app/ghost" search="" />);
    expect(screen.getByTestId("not-found")).toBeInTheDocument();
  });

  it("renders the Apps home-screen tab at /apps with every listing as a tile", () => {
    renderWithIntl(<App pathname="/apps" search="" />);
    expect(screen.getByTestId("app-home-grid")).toBeInTheDocument();
    expect(screen.getByTestId("app-tile-xchtip")).toBeInTheDocument();
    expect(document.title).toBe("Apps — explore.dig.net");
  });

  it("shows the Store/Apps view tabs on the home view, marking Store active", () => {
    renderWithIntl(<App pathname="/" search="" />);
    expect(screen.getByTestId("view-tab-store")).toHaveAttribute("aria-current", "page");
    expect(screen.getByTestId("view-tab-apps")).not.toHaveAttribute("aria-current");
  });

  it("defaults the phone landing (/) to the Apps launcher, marking Apps active (#51 follow-up)", () => {
    mockViewport(true); // phone-width viewport → launcher is the landing
    renderWithIntl(<App pathname="/" search="" />);
    expect(screen.getByTestId("app-home-grid")).toBeInTheDocument();
    expect(screen.queryByTestId("app-card-xchtip")).not.toBeInTheDocument();
    expect(screen.getByTestId("view-tab-apps")).toHaveAttribute("aria-current", "page");
    // The Store stays reachable from the launcher via an explicit override.
    expect(screen.getByTestId("view-tab-store")).toHaveAttribute("href", "/?view=store");
  });

  it("keeps the desktop landing (/) on the store even as the phone default changes", () => {
    mockViewport(false); // desktop-width viewport → store is the landing
    renderWithIntl(<App pathname="/" search="" />);
    expect(screen.getByTestId("app-card-xchtip")).toBeInTheDocument();
    expect(screen.getByTestId("view-tab-store")).toHaveAttribute("aria-current", "page");
    expect(screen.getByTestId("view-tab-store")).toHaveAttribute("href", "/");
  });

  it("honors ?view=store on a phone so the store is deep-linkable below the breakpoint", () => {
    mockViewport(true);
    renderWithIntl(<App pathname="/" search="?view=store" />);
    expect(screen.getByTestId("app-card-xchtip")).toBeInTheDocument();
    expect(screen.getByTestId("view-tab-store")).toHaveAttribute("aria-current", "page");
  });

  it("treats a filter query (?q=) as store intent so a bookmarked search opens the store on a phone", () => {
    mockViewport(true);
    renderWithIntl(<App pathname="/" search="?q=annuity" />);
    expect(screen.getByTestId("app-grid")).toBeInTheDocument();
    expect(screen.getByTestId("view-tab-store")).toHaveAttribute("aria-current", "page");
  });

  it("shows the Store/Apps view tabs on the Apps view, marking Apps active", () => {
    renderWithIntl(<App pathname="/apps" search="" />);
    expect(screen.getByTestId("view-tab-apps")).toHaveAttribute("aria-current", "page");
    expect(screen.getByTestId("view-tab-store")).not.toHaveAttribute("aria-current");
  });

  it("does not show the view tabs on a detail page or the not-found state", () => {
    renderWithIntl(<App pathname="/app/xchtip" search="" />);
    expect(screen.queryByTestId("view-tab-store")).not.toBeInTheDocument();
    expect(screen.queryByTestId("view-tab-apps")).not.toBeInTheDocument();
  });

  it("shows the build version in the footer (§6.7 human-readable form)", () => {
    renderWithIntl(<App pathname="/" search="" />);
    expect(screen.getByTestId("app-version")).toHaveTextContent(`v${APP_VERSION}`);
  });

  it("mounts the shared bug-report widget once, filing into explore.dig.net", () => {
    renderWithIntl(<App pathname="/" search="" />);
    const widget = screen.getByTestId("bug-report-button");
    expect(widget).toHaveAttribute("data-repo", "explore.dig.net");
    expect(widget).toHaveAttribute("data-app-version", APP_VERSION);
  });

  it("links to the submission spec from the header", () => {
    renderWithIntl(<App pathname="/" search="" />);
    expect(screen.getByRole("link", { name: "List your dApp" })).toHaveAttribute(
      "href",
      "https://github.com/DIG-Network/explore.dig.net/blob/main/SPEC.md",
    );
  });
});
