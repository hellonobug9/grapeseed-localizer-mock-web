export const ACTIVITY_PERIODS = [
  { days: 1, label: "last24Hours" },
  { days: 7, label: "last7Days" },
  { days: 30, label: "last30Days" },
  { days: 0, label: "allTime" },
] as const;

export const DEFAULT_ACTIVITY_PERIOD = 30;
