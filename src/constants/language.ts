export const SOURCE_LANGUAGE = "en";

export const MAX_TRANSLATORS = 3;

export const LOCALES = [
  { code: "en", label: "English", intl: "en-GB" },
  { code: "vi", label: "Tiếng Việt", intl: "vi-VN" },
] as const;

export type Locale = (typeof LOCALES)[number]["code"];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_STORAGE_KEY = "locale";
