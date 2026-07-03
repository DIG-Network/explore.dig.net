// renderWithIntl — RTL render wrapped in the store's I18nProvider (forced to English so tests
// assert stable copy regardless of the host machine's locale).

import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { I18nProvider } from "@/i18n/I18nProvider";

export function renderWithIntl(ui: ReactElement, locale = "en") {
  return render(<I18nProvider initial={locale}>{ui}</I18nProvider>);
}
