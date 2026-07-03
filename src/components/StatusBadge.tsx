// StatusBadge — the lifecycle chip (live / beta / draft) every card and detail page shows. The
// label is localized; the color is semantic (live = ok green, beta = warm amber, draft = muted).

import type { AppStatus } from "@/catalog/types";
import { useT } from "@/i18n/useT";

const KEY: Record<AppStatus, "statusLive" | "statusBeta" | "statusDraft"> = {
  live: "statusLive",
  beta: "statusBeta",
  draft: "statusDraft",
};

export function StatusBadge({ status }: { status: AppStatus }) {
  const t = useT();
  return (
    <span className={`status-badge status-${status}`} data-testid={`status-${status}`}>
      {t(KEY[status])}
    </span>
  );
}
