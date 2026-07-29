// StoreAddress — the detail page's "read this from the DIG Network" panel.
//
// A DIG-hosted listing has a trustless address (`chia://<storeId>/`) as well as its https URL, and
// until now that address existed nowhere a person could see: the only way to obtain one was reading
// an `X-Dig-Store` response header off the dApp's origin. This panel puts the address, its canonical
// URN, and the one command that fetches it on the page — visible, selectable, and one-click
// copyable — so a newcomer with a freshly installed node has a concrete first fetch.
//
// Listings served from ordinary web hosting have no store address; the panel renders nothing for
// them rather than showing an empty field.

import { useState } from "react";
import type { CatalogApp } from "@/catalog/types";
import { useT } from "@/i18n/useT";

/** The command a newcomer runs to fetch the store through their local DIG node. */
function firstFetchCommand(digAddress: string): string {
  return `dign open ${digAddress}`;
}

type CopyState = "idle" | "copied" | "failed";

/**
 * One labelled, monospace, copyable value. The value itself is always plain selectable text, so a
 * browser or environment without clipboard access still leaves the user a way through.
 */
function CopyRow({
  label,
  value,
  testId,
  onCopied,
}: {
  label: string;
  value: string;
  testId: string;
  onCopied: (state: CopyState) => void;
}) {
  const t = useT();

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      onCopied("copied");
    } catch {
      // A denied or unavailable clipboard is a normal outcome, not an error state worth shouting
      // about — the value stays on screen for manual selection.
      onCopied("failed");
    }
  }

  return (
    <div className="store-address-row">
      <dt>{label}</dt>
      <dd>
        <code className="mono store-address-value" data-testid={`${testId}-value`}>
          {value}
        </code>
        <button
          type="button"
          className="btn btn-ghost btn-copy"
          onClick={copy}
          aria-label={t("copyValueLabel", { label })}
          data-testid={`copy-${testId}`}
        >
          {t("copyAction")}
        </button>
      </dd>
    </div>
  );
}

export function StoreAddress({ app }: { app: CatalogApp }) {
  const t = useT();
  const [copyState, setCopyState] = useState<CopyState>("idle");

  if (!app.digAddress || !app.urn) return null;

  const statusText =
    copyState === "copied"
      ? t("copiedStatus")
      : copyState === "failed"
        ? t("copyFailedStatus")
        : "";

  return (
    <section
      className="store-address"
      data-testid="store-address"
      aria-labelledby="store-address-heading"
    >
      <h2 id="store-address-heading" className="section-heading">
        {t("storeAddressHeading")}
      </h2>
      <p className="store-address-intro">{t("storeAddressIntro", { name: app.name })}</p>
      <dl className="store-address-list">
        <CopyRow
          label={t("storeAddressLabel")}
          value={app.digAddress}
          testId="store-address"
          onCopied={setCopyState}
        />
        <CopyRow
          label={t("storeCommandLabel")}
          value={firstFetchCommand(app.digAddress)}
          testId="store-command"
          onCopied={setCopyState}
        />
        <CopyRow
          label={t("storeUrnLabel")}
          value={app.urn}
          testId="store-urn"
          onCopied={setCopyState}
        />
      </dl>
      <p
        className="store-address-status"
        role="status"
        aria-live="polite"
        data-testid="copy-status"
      >
        {statusText}
      </p>
    </section>
  );
}
