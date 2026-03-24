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

// Apply RTL direction on initial load based on stored language
const storedLang = localStorage.getItem("onyx-lang");
if (storedLang) {
  const isRtl = storedLang === "ar";
  document.documentElement.dir = isRtl ? "rtl" : "ltr";
  document.documentElement.lang = storedLang;
}

export default i18n;
