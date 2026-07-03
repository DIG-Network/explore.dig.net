import { describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import { renderWithIntl } from "@/test/renderWithIntl";
import { makeApp } from "@/test/fixtures";
import { ScreenshotGallery } from "./ScreenshotGallery";

function withShots(desktop: string[], mobile: string[]) {
  return makeApp({
    slug: "s",
    name: "Shotty",
    assets: {
      icon: "/catalog/s/icon-512.png",
      og: "/catalog/s/og.png",
      screenshots: { desktop, mobile },
    },
  });
}

describe("<ScreenshotGallery>", () => {
  it("renders nothing when the listing has no screenshots", () => {
    const { container } = renderWithIntl(<ScreenshotGallery app={withShots([], [])} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("renders desktop and mobile captures with numbered, localized alts", () => {
    renderWithIntl(
      <ScreenshotGallery
        app={withShots(
          ["/catalog/s/screenshots/desktop-01.png", "/catalog/s/screenshots/desktop-02.png"],
          ["/catalog/s/screenshots/mobile-01.png"],
        )}
      />,
    );
    expect(screen.getByAltText("Shotty — desktop screenshot 1")).toBeInTheDocument();
    expect(screen.getByAltText("Shotty — desktop screenshot 2")).toBeInTheDocument();
    expect(screen.getByAltText("Shotty — mobile screenshot 1")).toBeInTheDocument();
    expect(screen.getByTestId("screenshot-gallery").querySelectorAll("img")).toHaveLength(3);
  });
});
