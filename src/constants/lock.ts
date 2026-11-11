export const LockFilter = {
  All: "all",
  Open: "open",
  Locked: "locked",
} as const;

export type LockFilter = (typeof LockFilter)[keyof typeof LockFilter];

export const LOCK_FILTERS = Object.values(LockFilter);

export const LockFilterId = {
  [LockFilter.All]: 0,
  [LockFilter.Open]: 1,
  [LockFilter.Locked]: 2,
} as const satisfies Record<LockFilter, number>;

export type LockFilterId = (typeof LockFilterId)[LockFilter];

export const LockMode = {
  Now: "now",
  Schedule: "schedule",
} as const;

export type LockMode = (typeof LockMode)[keyof typeof LockMode];

export const LOCK_MODES = Object.values(LockMode);

export const LockStatus = {
  Open: "open",
  Locked: "locked",
  Scheduled: "scheduled",
} as const;

export type LockStatus = (typeof LockStatus)[keyof typeof LockStatus];
