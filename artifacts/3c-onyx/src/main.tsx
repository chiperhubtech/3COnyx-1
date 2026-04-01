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
