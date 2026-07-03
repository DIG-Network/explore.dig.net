import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nProvider, useLocale } from "./I18nProvider";
import { LOCALE_STORAGE_KEY } from "./locales";
import { useT } from "./useT";

beforeEach(() => localStorage.clear());
afterEach(() => localStorage.clear());

function Probe() {
  const { locale, setLocale } = useLocale();
  const t = useT();
  return (
    <div>
      <span data-testid="locale">{locale}</span>
      <span data-testid="msg">{t("featuredHeading")}</span>
      <button onClick={() => setLocale("fr")}>fr</button>
    </div>
  );
}

describe("<I18nProvider>", () => {
  it("renders children under the forced initial locale", () => {
    render(
      <I18nProvider initial="de">
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByTestId("locale")).toHaveTextContent("de");
    expect(screen.getByTestId("msg")).toHaveTextContent("Empfohlen");
    expect(document.documentElement.lang).toBe("de");
  });

  it("switches locale at runtime and persists it", async () => {
    const user = userEvent.setup();
    render(
      <I18nProvider initial="en">
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByTestId("msg")).toHaveTextContent("Featured");
    await user.click(screen.getByRole("button", { name: "fr" }));
    expect(screen.getByTestId("locale")).toHaveTextContent("fr");
    expect(document.documentElement.lang).toBe("fr");
    expect(localStorage.getItem(LOCALE_STORAGE_KEY)).toBe("fr");
  });

  it("defaults to the detected browser locale when nothing is persisted (jsdom = en)", () => {
    render(
      <I18nProvider>
        <Probe />
      </I18nProvider>,
    );
    expect(screen.getByTestId("locale")).toHaveTextContent("en");
  });
});
