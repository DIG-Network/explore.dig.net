// LanguageSelector — the header's locale switcher: a native <select> (keyboard + SR friendly for
// free) listing every supported locale by its endonym. Switching updates react-intl live and
// persists the choice (see I18nProvider).

import { useLocale } from "@/i18n/I18nProvider";
import { SUPPORTED_LOCALES } from "@/i18n/locales";
import { useT } from "@/i18n/useT";

export function LanguageSelector() {
  const { locale, setLocale } = useLocale();
  const t = useT();
  return (
    <label className="lang-select">
      <span className="visually-hidden">{t("languageLabel")}</span>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        data-testid="language-selector"
      >
        {SUPPORTED_LOCALES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.endonym}
          </option>
        ))}
      </select>
    </label>
  );
}
