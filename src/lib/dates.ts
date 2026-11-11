const HOUR = 3_600_000;
const DAY = 24 * HOUR;

export const now = new Date();

export const addMinutes = (date: Date, minutes: number) =>
  new Date(date.getTime() + minutes * 60_000);

export const addHours = (date: Date, hours: number) => new Date(date.getTime() + hours * HOUR);

export const addDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

export const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate());

export const today = startOfDay(now);

export const isSameDay = (a: Date, b: Date) => startOfDay(a).getTime() === startOfDay(b).getTime();

export const hoursBetween = (from: Date, to: Date) => (to.getTime() - from.getTime()) / HOUR;

export const daysBetween = (from: Date, to: Date) => (to.getTime() - from.getTime()) / DAY;

export const toIsoDate = (date: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

export const fromIsoDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
};
