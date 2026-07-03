// main — boot: publish the build version for external auto-detection (§6.7), apply the persisted
// theme before first paint (default DARK), then mount the store.

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "@/App";
import { I18nProvider } from "@/i18n/I18nProvider";
import { applyTheme, initialTheme } from "@/lib/theme";
import { publishAppVersion } from "@/lib/version";
import "./styles.css";

publishAppVersion();
applyTheme(initialTheme());

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nProvider>
      <App />
    </I18nProvider>
  </StrictMode>,
);
