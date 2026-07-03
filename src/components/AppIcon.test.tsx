import { describe, expect, it } from "vitest";
import { fireEvent, screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/renderWithIntl";
import { makeApp } from "@/test/fixtures";
import { AppIcon } from "./AppIcon";

describe("<AppIcon>", () => {
  it("renders the listing's real icon with a localized alt", () => {
    const app = makeApp({ name: "Tipper" });
    renderWithIntl(<AppIcon app={app} size={64} />);
    const img = screen.getByAltText("Tipper icon");
    expect(img).toHaveAttribute("src", app.assets.icon);
    expect(img).toHaveAttribute("width", "64");
  });

  it("falls back to an accent-tinted monogram when the image fails to load", () => {
    renderWithIntl(<AppIcon app={makeApp({ name: "cMojo" })} />);
    fireEvent.error(screen.getByRole("img"));
    const fallback = screen.getByTestId("app-icon-fallback");
    expect(fallback).toHaveTextContent("C");
    expect(fallback).toHaveAttribute("aria-label", "cMojo icon");
  });
});
