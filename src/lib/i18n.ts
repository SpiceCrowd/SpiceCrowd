export const SUPPORTED_LOCALES = ["en", "hi"];

export function t(key: string, locale = "en") {
  // Placeholder translation function. In production use next-i18next or similar.
  const messages: Record<string, Record<string, string>> = {
    en: { "hello": "Hello" },
    hi: { "hello": "नमस्ते" }
  };
  return messages[locale]?.[key] ?? key;
}
