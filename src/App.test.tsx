// App shell tests: routing, chrome (header/footer), the version display (§6.7), and the shared
// bug-report widget mount. The widget itself is @dignetwork/components' concern — mocked here so
// the shell test asserts only OUR contract with it (repo + appVersion props).

import { describe, expect, it, vi } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/renderWithIntl";
import { APP_VERSION } from "@/lib/version";
import { App } from "./App";

vi.mock("@dignetwork/components", () => ({
  BugReportButton: ({ repo, appVersion }: { repo: string; appVersion?: string }) => (
    <div data-testid="bug-report-button" data-repo={repo} data-app-version={appVersion} />
  ),
}));

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
