import { addDays } from "@/lib/dates";
import { formatDay, formatRelative } from "@/lib/format";
import i18n from "@/locales/i18n";
import { LockStatus } from "@/constants/lock";
import type { LockInfo } from "@/types/lock";
import type { ProjectListItem } from "@/types/project";

export const isLockedAt = (lock: LockInfo | undefined, when: Date) =>
  !!lock && lock.startAt <= when && (!lock.endAt || when < lock.endAt);

// The API returns only the lock window; the status depends on the time it is
// read at.
export const lockStatus = (lock: LockInfo | undefined, at: Date): LockStatus => {
  if (!lock) return LockStatus.Open;
  if (lock.startAt > at) return LockStatus.Scheduled;
  return isLockedAt(lock, at) ? LockStatus.Locked : LockStatus.Open;
};

// Last locked day for "until {date}" labels, since endAt is exclusive.
export const lastLockedDay = (lock: LockInfo) => (lock.endAt ? addDays(lock.endAt, -1) : undefined);

export const lockSummary = (lock: LockInfo | undefined, at: Date) => {
  const status = lockStatus(lock, at);
  if (!lock || status === LockStatus.Open) return "";
  const lastDay = lastLockedDay(lock);
  if (status === LockStatus.Scheduled)
    return i18n.t("lock.summary.scheduled", {
      from: formatDay(lock.startAt),
      until: formatDay(lastDay ?? lock.startAt),
      user: lock.lockedBy,
    });
  if (lastDay)
    return i18n.t("lock.summary.lockedUntil", { user: lock.lockedBy, until: formatDay(lastDay) });
  return i18n.t("lock.summary.lockedIndefinitely", {
    user: lock.lockedBy,
    since: formatRelative(lock.startAt),
  });
};

export const lockLabel = (status: LockStatus) => i18n.t(`lock.status.${status}`);

type LockWindow = {
  startAt?: string | null;
  endAt?: string | null;
  lockedBy?: string | null;
};

export const toLockInfo = (window: LockWindow | null | undefined): LockInfo | undefined =>
  window?.startAt
    ? {
        lockedBy: window.lockedBy ?? "",
        startAt: new Date(window.startAt),
        endAt: window.endAt ? new Date(window.endAt) : null,
      }
    : undefined;

type FlatLockFields = Pick<ProjectListItem, "lockStartAt" | "lockEndAt" | "lockedBy">;

export const projectLockInfo = (project: FlatLockFields) =>
  toLockInfo({
    startAt: project.lockStartAt,
    endAt: project.lockEndAt,
    lockedBy: project.lockedBy,
  });
