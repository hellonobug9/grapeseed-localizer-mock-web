import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LOCALE, LOCALE_STORAGE_KEY, LOCALES } from "@/constants/language";
import en from "@/locales/en.json";
import vi from "@/locales/vi.json";

const resources = {
  en: { translation: en },
  vi: { translation: vi },
} as const;

i18n.on("languageChanged", (lng) => {
  document.documentElement.lang = lng;
});

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: LOCALES.map((l) => l.code),
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage", "navigator"],
      caches: ["localStorage"],
      lookupLocalStorage: LOCALE_STORAGE_KEY,
    },
  });

export default i18n;
