// Bug-report widget message catalog (#1815 consumer wiring).
//
// The shared `<BugReportButton>` (@dignetwork/components ≥0.2.0) accepts a `messages` override so a
// host app can localize its copy. We route that copy through the SAME react-intl layer as the rest
// of the store, giving every widget string a stable message id so per-locale translation is a pure
// catalog follow-up — no code change.
//
// These ids live in a dedicated `bugReport.*` namespace, SEPARATE from the app's own message
// catalog (`en.ts` / `MESSAGE_KEYS`): the app catalog carries a full-translation completeness
// contract (see messages.test.ts) that we deliberately do NOT extend with 46 untranslated widget
// keys. The English defaults come verbatim from the widget's own `DEFAULT_MESSAGES`, so English
// renders byte-identically to the un-localized widget; other locales fall back to English per-key
// until their `bugReport.*` translations are added.

import { DEFAULT_MESSAGES, type BugReportMessages } from "@dignetwork/components";

/** Every message key the widget exposes (the exact `BugReportMessages` shape). */
export type BugReportMessageKey = keyof BugReportMessages;

/** All widget message keys, sourced from the widget's own defaults so it can never drift. */
export const BUG_REPORT_MESSAGE_KEYS = Object.keys(DEFAULT_MESSAGES) as BugReportMessageKey[];

/** The react-intl message id for a widget key (e.g. `launcherAriaLabel` → `bugReport.launcherAriaLabel`). */
export function bugReportMessageId(key: BugReportMessageKey): string {
  return `bugReport.${key}`;
}

/**
 * The English base catalog for the widget, keyed by namespaced id. Merged into the IntlProvider for
 * every locale so react-intl resolves each `bugReport.*` id (no missing-message warnings) and a
 * future per-locale translation can override it. Values are the widget's own English defaults.
 */
export const bugReportBaseMessages: Record<string, string> = Object.fromEntries(
  BUG_REPORT_MESSAGE_KEYS.map((key) => [bugReportMessageId(key), DEFAULT_MESSAGES[key]]),
);
