import { useContext } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { LockStatus } from "@/constants/lock";
import { CURRENT_USER } from "@/data/mock_data";
import { addDays, startOfDay } from "@/lib/dates";
import { formatDay } from "@/lib/format";
import { lockStatus, lockSummary } from "@/lib/lock";
import { LockContext } from "@/state/lock_context";
import type { ProjectInfo } from "@/types/project";

type LockTarget = Pick<ProjectInfo, "id" | "name">;

export function useLocks() {
  const { t } = useTranslation();
  const context = useContext(LockContext);
  if (!context) throw new Error("useLocks must be used inside LockProvider");
  const { locks, setLock, now } = context;

  const statusOf = (projectId: number) => lockStatus(locks[projectId], now);

  const summaryOf = (projectId: number) => lockSummary(locks[projectId], now);

  const lockNow = (project: LockTarget) => {
    setLock(project.id, { lockedBy: CURRENT_USER.name, startAt: new Date(), endAt: null });
    toast.success(t("lock.toast.locked", { project: project.name }));
  };

  // until is the last locked day picked in the form; the lock ends at the
  // start of the next day.
  const scheduleLock = (project: LockTarget, from: Date, until: Date) => {
    setLock(project.id, {
      lockedBy: CURRENT_USER.name,
      startAt: from,
      endAt: addDays(startOfDay(until), 1),
    });
    toast.success(
      from > new Date()
        ? t("lock.toast.scheduled", {
            project: project.name,
            from: formatDay(from),
            until: formatDay(until),
          })
        : t("lock.toast.lockedUntil", { project: project.name, until: formatDay(until) }),
    );
  };

  const unlock = (project: LockTarget) => {
    const wasScheduled = statusOf(project.id) === LockStatus.Scheduled;
    setLock(project.id, undefined);
    toast.success(
      wasScheduled
        ? t("lock.toast.scheduleCancelled", { project: project.name })
        : t("lock.toast.unlocked", { project: project.name }),
    );
  };

  return { locks, now, statusOf, summaryOf, lockNow, scheduleLock, unlock };
}
