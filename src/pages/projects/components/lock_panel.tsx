import { useState, type FormEvent } from "react";
import { CalendarCheck, CalendarDays, CalendarRange, Lock, LockOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { InputField } from "@/components/input_field";
import { Segmented } from "@/components/segmented";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LOCK_MODES, LockMode, LockStatus } from "@/constants/lock";
import { useLocks } from "@/hooks/use_locks";
import { fromIsoDate, toIsoDate } from "@/lib/dates";
import { lockLabel, lockStatus, lockSummary, projectLockInfo } from "@/lib/lock";
import { cn } from "@/lib/utils";
import type { ProjectListItem } from "@/types/project";

const STATUS_ICON = {
  [LockStatus.Open]: LockOpen,
  [LockStatus.Locked]: Lock,
  [LockStatus.Scheduled]: CalendarDays,
} satisfies Record<LockStatus, unknown>;

const MODE_OPTION = {
  [LockMode.Now]: { icon: Lock, label: "lock.panel.lockNow" },
  [LockMode.Schedule]: { icon: CalendarRange, label: "lock.panel.schedule" },
} as const satisfies Record<LockMode, unknown>;

export function LockStatusIcon({ status, className }: { status: LockStatus; className?: string }) {
  const Icon = STATUS_ICON[status];
  return (
    <span
      role="img"
      title={lockLabel(status)}
      aria-label={lockLabel(status)}
      className={cn(
        "grid size-7 shrink-0 place-items-center rounded-full bg-good-bg text-good",
        status === LockStatus.Locked && "bg-warn-bg text-warn",
        status === LockStatus.Scheduled && "bg-brand-soft text-brand",
        className,
      )}
    >
      <Icon className="size-3.5" />
    </span>
  );
}

export function LockPanel({ project }: { project: ProjectListItem }) {
  const { t } = useTranslation();
  const { now, lockNow, scheduleLock, unlock } = useLocks();
  const lock = projectLockInfo(project);
  const status = lockStatus(lock, now);
  const todayIso = toIsoDate(now);
  const [mode, setMode] = useState<LockMode>(LockMode.Now);
  const [from, setFrom] = useState(todayIso);
  const [until, setUntil] = useState("");
  const [invalid, setInvalid] = useState<{ from?: boolean; until?: boolean }>({});

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (mode === LockMode.Now) {
      lockNow(project);
      return;
    }
    const errors = {
      from: !from || from < todayIso,
      until: !until || until < from || until < todayIso,
    };
    setInvalid(errors);
    if (errors.from || errors.until) return;
    scheduleLock(project, from <= todayIso ? new Date() : fromIsoDate(from), fromIsoDate(until));
  };

  return (
    <>
      {status !== LockStatus.Open && (
        <div
          className={cn(
            "flex items-center gap-3.5 rounded-lg border px-4 py-3.5",
            status === LockStatus.Locked && "border-warn-line bg-warn-bg",
            status === LockStatus.Scheduled && "border-brand-muted bg-brand-soft",
          )}
        >
          <div className="min-w-0 flex-1">
            <div className="font-semibold">{t(`lock.panel.${status}.title`)}</div>
            <div className="mt-0.5 text-xs text-text-2">{lockSummary(lock, now)}</div>
          </div>
          <Button variant="outline" size="sm" onClick={() => unlock(project)}>
            {status === LockStatus.Locked ? (
              <>
                <LockOpen /> {t("lock.panel.unlock")}
              </>
            ) : (
              t("common.cancel")
            )}
          </Button>
        </div>
      )}

      {status === LockStatus.Open && (
        <form onSubmit={submit} noValidate>
          <Segmented
            stretch
            className="mb-3"
            value={mode}
            onChange={setMode}
            options={LOCK_MODES.map((m) => {
              const { icon: Icon, label } = MODE_OPTION[m];
              return {
                value: m,
                label: (
                  <>
                    <Icon /> {t(label)}
                  </>
                ),
              };
            })}
          />
          {mode === LockMode.Schedule && (
            <>
              <div className="mb-2 grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label htmlFor={`lock-from-${project.id}`} className="text-xs" required>
                    {t("lock.panel.startDate")}
                  </Label>
                  <Input
                    id={`lock-from-${project.id}`}
                    type="date"
                    min={todayIso}
                    value={from}
                    aria-invalid={invalid.from}
                    onChange={(e) => {
                      setFrom(e.target.value);
                      setInvalid((v) => ({ ...v, from: false }));
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor={`lock-until-${project.id}`} className="text-xs" required>
                    {t("lock.panel.endDate")}
                  </Label>
                  <InputField
                    id={`lock-until-${project.id}`}
                    type="date"
                    min={from || todayIso}
                    value={until}
                    invalid={invalid.until}
                    error={t("lock.panel.endDateInvalid")}
                    onChange={(e) => {
                      setUntil(e.target.value);
                      setInvalid((v) => ({ ...v, until: false }));
                    }}
                  />
                </div>
              </div>
              <p className="mb-3 text-xs text-muted-foreground">{t("lock.panel.scheduleHint")}</p>
            </>
          )}
          <div className="flex justify-end">
            <Button type="submit" size="sm" className="bg-warn text-white hover:bg-warn/90">
              {mode === LockMode.Now ? (
                <>
                  <Lock /> {t("lock.panel.lockNow")}
                </>
              ) : (
                <>
                  <CalendarCheck /> {t("lock.panel.scheduleLock")}
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </>
  );
}
