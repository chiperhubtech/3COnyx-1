import { createRoot } from "react-dom/client";
import { ThemeProvider } from "next-themes";
import { SeasonalThemeProvider } from "./context/SeasonalThemeContext";
import App from "./App";
import "./index.css";
import "./lib/i18n";

createRoot(document.getElementById("root")!).render(
  <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false} storageKey="onyx-theme">
    <SeasonalThemeProvider>
      <App />
    </SeasonalThemeProvider>
  </ThemeProvider>
);

// ── PWA Service Worker Registration (production only) ──
// Architect: Ronald Antonio Cadet — enables "Add to Home Screen" + offline shell.
if ("serviceWorker" in navigator && import.meta.env.PROD) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .catch(() => { /* swallow registration errors in field — don't break app */ });
  });
}
