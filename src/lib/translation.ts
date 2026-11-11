// Same rule as the API: a text is untranslated when it is missing, empty, or
// the same as the English text after trimming.
export const isUntranslated = (
  text: string | null | undefined,
  english: string | null | undefined,
) => {
  const value = text?.trim();
  return !value || value === english?.trim();
};
