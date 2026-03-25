import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import enTranslation from "../locales/en/translation.json";
import esTranslation from "../locales/es/translation.json";
import frTranslation from "../locales/fr/translation.json";
import ptTranslation from "../locales/pt/translation.json";
import deTranslation from "../locales/de/translation.json";
import arTranslation from "../locales/ar/translation.json";

const deviceLocale = Localization.getLocales()[0]?.languageCode ?? "en";

const SUPPORTED = ["en", "es", "fr", "pt", "de", "ar"];

const resources = {
  en: { translation: enTranslation },
  es: { translation: esTranslation },
  fr: { translation: frTranslation },
  pt: { translation: ptTranslation },
  de: { translation: deTranslation },
  ar: { translation: arTranslation },
};

const safeLng = SUPPORTED.includes(deviceLocale) ? deviceLocale : "en";

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: safeLng,
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

export default i18n;
