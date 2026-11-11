// Same shape as the API: endAt is exclusive (the start of the day after the
// last locked day); null = locked until someone unlocks it.
export type LockInfo = {
  lockedBy: string;
  startAt: Date;
  endAt: Date | null;
};
