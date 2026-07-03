import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/renderWithIntl";
import { THEME_STORAGE_KEY } from "@/lib/theme";
import { ThemeToggle } from "./ThemeToggle";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.dataset.theme = "dark";
});
afterEach(() => localStorage.clear());

describe("<ThemeToggle>", () => {
  it("starts dark by default and offers to switch to light", () => {
    renderWithIntl(<ThemeToggle />);
    expect(screen.getByRole("button", { name: "Switch to light theme" })).toBeInTheDocument();
  });

  it("toggles the document theme and persists the choice", async () => {
    const user = userEvent.setup();
    renderWithIntl(<ThemeToggle />);
    await user.click(screen.getByTestId("theme-toggle"));
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light");
    // The accessible name now offers the way back.
    expect(screen.getByRole("button", { name: "Switch to dark theme" })).toBeInTheDocument();
  });

  it("starts from a persisted light choice", () => {
    localStorage.setItem(THEME_STORAGE_KEY, "light");
    renderWithIntl(<ThemeToggle />);
    expect(screen.getByRole("button", { name: "Switch to dark theme" })).toBeInTheDocument();
  });
});
