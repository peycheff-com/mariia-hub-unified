import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { I18nextProvider } from "react-i18next";

import App from "./App.tsx";
import "./index.css";
import i18n from "./i18n/config";
import { log } from "./lib/logger";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </StrictMode>
);

log.info("✅ React app mounted successfully");
