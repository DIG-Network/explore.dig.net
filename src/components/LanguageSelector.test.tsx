import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/renderWithIntl";
import { LOCALE_STORAGE_KEY, SUPPORTED_LOCALES } from "@/i18n/locales";
import { LanguageSelector } from "./LanguageSelector";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

describe("<LanguageSelector>", () => {
  it("lists all 14 supported locales by endonym", () => {
    renderWithIntl(<LanguageSelector />);
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(SUPPORTED_LOCALES.length);
    expect(options.map((o) => o.textContent)).toContain("日本語");
    expect(options.map((o) => o.textContent)).toContain("Deutsch");
  });

  it("switches the live locale, sets <html lang>, and persists the choice", async () => {
    const user = userEvent.setup();
    renderWithIntl(<LanguageSelector />);
    await user.selectOptions(screen.getByTestId("language-selector"), "de");
    expect(document.documentElement.lang).toBe("de");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("de");
    // The control's accessible label is now the German catalog's.
    expect(screen.getByLabelText("Sprache")).toBeInTheDocument();
  });
});
