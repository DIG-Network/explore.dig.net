// FeaturedCarousel behaviour: fair/deterministic rotation, manual controls (prev/next/dots/
// play-pause), keyboard operability, auto-advance on a timer, pause-on-hover, and the
// reduced-motion contract (auto-rotation stays OFF). ARIA structure is asserted here; axe over the
// built page (tests/a11y) is the WCAG gate.

import { act, fireEvent, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithIntl } from "@/test/renderWithIntl";
import { makeApp } from "@/test/fixtures";
import { FeaturedCarousel } from "./FeaturedCarousel";

const HERO = (slug: string) => ({
  icon: `/catalog/${slug}/icon-512.png`,
  og: `/catalog/${slug}/og.png`,
  hero: `/catalog/${slug}/hero.png`,
  screenshots: { desktop: [], mobile: [] },
});

const THREE = [
  makeApp({ slug: "alpha", name: "Alpha", featured: true, url: "https://alpha.example/", assets: HERO("alpha") }),
  makeApp({ slug: "bravo", name: "Bravo", featured: true, url: "https://bravo.example/", assets: HERO("bravo") }),
  makeApp({ slug: "charlie", name: "Charlie", featured: true, url: "https://charlie.example/", assets: HERO("charlie") }),
];

function setReducedMotion(reduced: boolean) {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: reduced,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

beforeEach(() => {
  setReducedMotion(false); // known baseline: no reduced motion unless a test opts in
});

afterEach(() => {
  vi.useRealTimers();
});

describe("<FeaturedCarousel>", () => {
  it("renders nothing when there are no featured apps", () => {
    const { container } = renderWithIntl(<FeaturedCarousel apps={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it("shows the active slide with a named Open CTA and a details link", () => {
    renderWithIntl(<FeaturedCarousel apps={THREE} initialIndex={0} />);
    const slide = screen.getByTestId("featured-alpha");
    const open = within(slide).getByRole("link", { name: "Open Alpha" });
    expect(open).toHaveAttribute("href", "https://alpha.example/");
    expect(open).toHaveAttribute("rel", "noopener noreferrer");
    expect(within(slide).getByRole("link", { name: "View details" })).toHaveAttribute("href", "/app/alpha");
  });

  it("exposes the carousel ARIA structure (region + slide roledescriptions + live region)", () => {
    renderWithIntl(<FeaturedCarousel apps={THREE} initialIndex={0} />);
    const region = screen.getByTestId("featured-carousel");
    expect(region).toHaveAttribute("role", "region");
    expect(region).toHaveAttribute("aria-roledescription", "carousel");
    expect(region).toHaveAttribute("aria-label", "Featured apps");
    expect(screen.getByTestId("featured-alpha")).toHaveAttribute("aria-roledescription", "slide");
    expect(screen.getByTestId("carousel-status")).toBeInTheDocument();
  });

  it("advances and rewinds with the next/prev controls (wrap-around)", () => {
    renderWithIntl(<FeaturedCarousel apps={THREE} initialIndex={0} />);
    fireEvent.click(screen.getByTestId("carousel-next"));
    expect(screen.getByTestId("featured-bravo")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("carousel-prev"));
    expect(screen.getByTestId("featured-alpha")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("carousel-prev")); // wrap to the last
    expect(screen.getByTestId("featured-charlie")).toBeInTheDocument();
  });

  it("jumps to a slide via the dot controls and marks the current one", () => {
    renderWithIntl(<FeaturedCarousel apps={THREE} initialIndex={0} />);
    fireEvent.click(screen.getByTestId("carousel-dot-2"));
    expect(screen.getByTestId("featured-charlie")).toBeInTheDocument();
    expect(screen.getByTestId("carousel-dot-2")).toHaveAttribute("aria-current", "true");
    expect(screen.getByTestId("carousel-dot-0")).toHaveAttribute("aria-current", "false");
  });

  it("is keyboard operable with the arrow keys", () => {
    renderWithIntl(<FeaturedCarousel apps={THREE} initialIndex={0} />);
    const region = screen.getByTestId("featured-carousel");
    fireEvent.keyDown(region, { key: "ArrowRight" });
    expect(screen.getByTestId("featured-bravo")).toBeInTheDocument();
    fireEvent.keyDown(region, { key: "ArrowLeft" });
    expect(screen.getByTestId("featured-alpha")).toBeInTheDocument();
  });

  it("auto-advances on the timer and can be paused", () => {
    vi.useFakeTimers();
    renderWithIntl(<FeaturedCarousel apps={THREE} initialIndex={0} intervalMs={5000} />);
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByTestId("featured-bravo")).toBeInTheDocument();

    // Pause via the control: the timer stops advancing.
    fireEvent.click(screen.getByTestId("carousel-playpause"));
    act(() => vi.advanceTimersByTime(15000));
    expect(screen.getByTestId("featured-bravo")).toBeInTheDocument();
  });

  it("pauses auto-advance while the pointer is over the carousel", () => {
    vi.useFakeTimers();
    renderWithIntl(<FeaturedCarousel apps={THREE} initialIndex={0} intervalMs={5000} />);
    const region = screen.getByTestId("featured-carousel");
    fireEvent.mouseEnter(region);
    act(() => vi.advanceTimersByTime(15000));
    expect(screen.getByTestId("featured-alpha")).toBeInTheDocument(); // unchanged while hovered
    fireEvent.mouseLeave(region);
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByTestId("featured-bravo")).toBeInTheDocument();
  });

  it("pauses auto-advance while keyboard focus is within the carousel", () => {
    vi.useFakeTimers();
    renderWithIntl(<FeaturedCarousel apps={THREE} initialIndex={0} intervalMs={5000} />);
    const next = screen.getByTestId("carousel-next");
    act(() => next.focus()); // focus enters the carousel (focusin bubbles to the region)
    act(() => vi.advanceTimersByTime(15000));
    expect(screen.getByTestId("featured-alpha")).toBeInTheDocument(); // paused while focused
    act(() => next.blur()); // focus leaves entirely
    act(() => vi.advanceTimersByTime(5000));
    expect(screen.getByTestId("featured-bravo")).toBeInTheDocument();
  });

  it("keeps auto-rotation OFF under prefers-reduced-motion", () => {
    setReducedMotion(true);
    vi.useFakeTimers();
    renderWithIntl(<FeaturedCarousel apps={THREE} initialIndex={0} intervalMs={5000} />);
    const region = screen.getByTestId("featured-carousel");
    expect(region).toHaveAttribute("data-playing", "false");
    expect(screen.getByTestId("carousel-playpause")).toHaveAttribute("aria-label", "Resume auto-rotation");
    act(() => vi.advanceTimersByTime(20000));
    expect(screen.getByTestId("featured-alpha")).toBeInTheDocument(); // never auto-advanced
  });

  it("renders a single featured app without rotation controls", () => {
    renderWithIntl(<FeaturedCarousel apps={[THREE[0]]} initialIndex={0} />);
    expect(screen.getByTestId("featured-alpha")).toBeInTheDocument();
    expect(screen.queryByTestId("carousel-next")).toBeNull();
    expect(screen.queryByTestId("carousel-playpause")).toBeNull();
  });
});
