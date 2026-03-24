import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import HttpBackend from "i18next-http-backend";

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: "en",
    supportedLngs: ["en", "es", "fr", "pt", "de", "ar", "zh", "ja", "ko", "hi", "it", "ru", "nl"],
    detection: {
      order: ["localStorage", "navigator", "htmlTag"],
      lookupLocalStorage: "onyx-lang",
      caches: ["localStorage"],
    },
    backend: {
      loadPath: `${import.meta.env.BASE_URL}locales/{{lng}}/translation.json`,
    },
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Apply RTL direction on initial load based on detected language
const RTL_LANGS = new Set(["ar"]);
function applyDir(lang: string) {
  const dir = RTL_LANGS.has(lang) ? "rtl" : "ltr";
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
  document.body.dir = dir;
}
// Check localStorage first, fall back to navigator language
const initLang = localStorage.getItem("onyx-lang")
  || navigator.language?.split("-")[0]
  || "en";
applyDir(initLang);
// Also update whenever i18n switches language
i18n.on("languageChanged", applyDir);

export default i18n;
