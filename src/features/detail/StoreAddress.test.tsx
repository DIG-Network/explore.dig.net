import { describe, expect, it, vi, beforeEach } from "vitest";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithIntl } from "@/test/renderWithIntl";
import { makeApp } from "@/test/fixtures";
import { StoreAddress } from "./StoreAddress";

const STORE_ID = "6ed1e80d44840735bf3c94a38f93e9a7c2e1077872681edf7c5985a14d17513f";

/** A DIG-hosted listing: the catalog carries the storeId plus the two derived address forms. */
function digHosted() {
  return makeApp({
    slug: "chia-offer",
    name: "Chia-Offer",
    storeId: STORE_ID,
    digAddress: `chia://${STORE_ID}/`,
    urn: `urn:dig:chia:${STORE_ID}`,
  });
}

function writeText() {
  const spy = vi.fn().mockResolvedValue(undefined);
  Object.assign(navigator, { clipboard: { writeText: spy } });
  return spy;
}

describe("<StoreAddress>", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("renders nothing for a listing that is not DIG-hosted", () => {
    // The truthful control: most listings serve from plain HTTPS and have NO store address. A
    // panel that rendered regardless would show an empty/`chia://undefined/` address.
    renderWithIntl(<StoreAddress app={makeApp({ storeId: undefined })} />);
    expect(screen.queryByTestId("store-address")).toBeNull();
  });

  it("shows the chia:// address and the URN verbatim so a human can read them off the page", () => {
    renderWithIntl(<StoreAddress app={digHosted()} />);
    expect(screen.getByTestId("store-address")).toBeInTheDocument();
    expect(screen.getByTestId("store-address-value")).toHaveTextContent(`chia://${STORE_ID}/`);
    expect(screen.getByTestId("store-urn-value")).toHaveTextContent(`urn:dig:chia:${STORE_ID}`);
  });

  it("copies the full chia:// address — not the bare hex — to the clipboard", async () => {
    // The nearest wrong implementation copies `app.storeId`, which is NOT pasteable into a client.
    const spy = writeText();
    renderWithIntl(<StoreAddress app={digHosted()} />);
    await userEvent.click(screen.getByTestId("copy-store-address"));
    expect(spy).toHaveBeenCalledWith(`chia://${STORE_ID}/`);
    expect(spy).not.toHaveBeenCalledWith(STORE_ID);
  });

  it("offers the newcomer's first-fetch command, copyable in full", async () => {
    const spy = writeText();
    renderWithIntl(<StoreAddress app={digHosted()} />);
    const command = `dign open chia://${STORE_ID}/`;
    expect(screen.getByTestId("store-command-value")).toHaveTextContent(command);
    await userEvent.click(screen.getByTestId("copy-store-command"));
    expect(spy).toHaveBeenCalledWith(command);
  });

  it("confirms a copy in an assertive live region rather than silently succeeding", async () => {
    writeText();
    renderWithIntl(<StoreAddress app={digHosted()} />);
    const status = screen.getByTestId("copy-status");
    expect(status).toHaveTextContent("");
    await userEvent.click(screen.getByTestId("copy-store-address"));
    expect(status).toHaveTextContent("Copied");
  });

  it("stays usable when the clipboard is unavailable — the text is still selectable on the page", async () => {
    // Never trap the user (professional-ui): a denied/absent clipboard must not blank the panel or
    // throw; the address remains readable and manually selectable.
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockRejectedValue(new Error("denied")) },
    });
    renderWithIntl(<StoreAddress app={digHosted()} />);
    await userEvent.click(screen.getByTestId("copy-store-address"));
    expect(screen.getByTestId("store-address-value")).toHaveTextContent(`chia://${STORE_ID}/`);
    expect(screen.getByTestId("copy-status")).toHaveTextContent("Copy failed");
  });
});
