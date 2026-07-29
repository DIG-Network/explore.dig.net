// useBugReportMessages — the app's translated copy for the shared `<BugReportButton>` widget.
//
// Maps every `BugReportMessages` key to its react-intl translation (id `bugReport.<key>`, English
// default from the widget's own `DEFAULT_MESSAGES`), so the widget renders in the store's active
// locale via the same i18n layer as everything else. English is behaviour-preserving: each id
// resolves to the widget default, so passing this object equals today's un-localized render.

import { useMemo } from "react";
import { useIntl } from "react-intl";
import { DEFAULT_MESSAGES, type BugReportMessages } from "@dignetwork/components";
import { BUG_REPORT_MESSAGE_KEYS, bugReportMessageId } from "@/i18n/messages/bugReport";

/** Build the `messages` prop for `<BugReportButton>` from the store's i18n catalog. */
export function useBugReportMessages(): BugReportMessages {
  const intl = useIntl();
  return useMemo(() => {
    const entries = BUG_REPORT_MESSAGE_KEYS.map((key) => [
      key,
      intl.formatMessage({ id: bugReportMessageId(key), defaultMessage: DEFAULT_MESSAGES[key] }),
    ]);
    return Object.fromEntries(entries) as BugReportMessages;
  }, [intl]);
}
