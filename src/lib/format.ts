import { DEFAULT_LOCALE, LOCALES } from "@/constants/language";
import { addDays, daysBetween, now, today } from "@/lib/dates";
import i18n from "@/locales/i18n";

const intlLocale = () =>
  (
    LOCALES.find((l) => l.code === i18n.resolvedLanguage) ??
    LOCALES.find((l) => l.code === DEFAULT_LOCALE)!
  ).intl;

export const formatDay = (date: Date) =>
  new Intl.DateTimeFormat(intlLocale(), {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);

export const formatTime = (date: Date) =>
  new Intl.DateTimeFormat(intlLocale(), {
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(date);

export const formatExact = (date: Date) => `${formatDay(date)}, ${formatTime(date)}`;

export const formatRelative = (date: Date) => {
  const rtf = new Intl.RelativeTimeFormat(intlLocale(), { numeric: "auto" });
  const minutes = (now.getTime() - date.getTime()) / 60_000;
  if (minutes < 1) return i18n.t("time.justNow");
  if (minutes < 60) return rtf.format(-Math.floor(minutes), "minute");
  const hours = minutes / 60;
  if (hours < 24) return rtf.format(-Math.floor(hours), "hour");
  const days = hours / 24;
  if (days < 30) return rtf.format(-Math.floor(days), "day");
  const months = Math.floor(days / 30);
  if (months < 12) return rtf.format(-months, "month");
  return rtf.format(-Math.max(1, Math.floor(days / 365)), "year");
};

export const formatDayLabel = (day: Date) => {
  if (day.getTime() === today.getTime()) return i18n.t("time.today");
  if (day.getTime() === addDays(today, -1).getTime()) return i18n.t("time.yesterday");
  return new Intl.DateTimeFormat(intlLocale(), {
    weekday: "long",
    day: "2-digit",
    month: "short",
  }).format(day);
};

export const formatNumber = (n: number) => new Intl.NumberFormat(intlLocale()).format(n);

export const formatPercent = (value: number, digits = 0) =>
  new Intl.NumberFormat(intlLocale(), {
    style: "percent",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value / 100);

export const initials = (name: string) => {
  const parts = name?.split(" ").filter(Boolean);
  if (!parts || !parts[0]) return "";
  return parts.length === 1
    ? parts[0][0]
    : `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
};

export const isStale = (lastTranslated: Date) => daysBetween(lastTranslated, now) > 14;

export const plainText = (html: string | null | undefined) => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  return (doc.body.textContent ?? "").replace(/\s+/g, " ").trim();
};

export const plural = (count: number, singular: string, pluralForm = `${singular}s`) =>
  `${count} ${count === 1 ? singular : pluralForm}`;
