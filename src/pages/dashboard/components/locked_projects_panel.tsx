import { Panel, PanelHeader } from "@/components/panel";
import { Pill } from "@/components/pill";
import { ProjectIcon } from "@/components/project_icon";
import { LockStatus } from "@/constants/lock";
import { useLocks } from "@/hooks/use_locks";
import { formatDay } from "@/lib/format";
import { lastLockedDay, lockStatus, projectLockInfo } from "@/lib/lock";
import type { DashboardLockedProject } from "@/types/dashboard";
import { CalendarDays, Lock, LockOpen } from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { Link } from "react-router";

export function LockedProjectsPanel({
  projects,
  className,
}: {
  projects: DashboardLockedProject[];
  className?: string;
}) {
  const { t } = useTranslation();
  const { now } = useLocks();

  const lockedProjects = projects.flatMap((project) => {
    const lock = projectLockInfo(project);
    const status = lockStatus(lock, now);
    return lock && status !== LockStatus.Open
      ? [{ id: project.id, name: project.name, lock, status }]
      : [];
  });

  return (
    <Panel className={className}>
      <PanelHeader
        title={t("dashboard.lockedProjects")}
        actions={
          <Pill tone={lockedProjects.length > 0 ? "warn" : "gray"}>{lockedProjects.length}</Pill>
        }
      />
      <div className="px-5 py-2">
        {lockedProjects.length === 0 && (
          <div className="flex items-center justify-center gap-1.5 py-4 text-sm text-muted-foreground">
            <LockOpen className="size-4" /> {t("dashboard.noLockedProjects")}
          </div>
        )}
        {lockedProjects.map((project) => {
          const { lock } = project;
          const scheduled = project.status === LockStatus.Scheduled;
          return (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="group flex items-center gap-3 border-b py-2.5 last:border-b-0"
            >
              <ProjectIcon project={project} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold group-hover:text-brand">{project.name}</div>
                <div className="text-xs text-muted-foreground">
                  {t(scheduled ? "dashboard.lockStarts" : "dashboard.lockSince", {
                    date: formatDay(lock.startAt),
                  })}
                </div>
              </div>
              <div className="shrink-0 text-right">
                {scheduled ? (
                  <Pill tone="blue">
                    <CalendarDays /> {t("dashboard.scheduled")}
                  </Pill>
                ) : (
                  <Pill tone="warn">
                    <Lock /> {t("dashboard.locked")}
                  </Pill>
                )}
                <div className="mt-1 text-xs text-muted-foreground">
                  {lock.endAt ? (
                    <Trans
                      i18nKey="dashboard.lockUntil"
                      values={{ date: formatDay(lastLockedDay(lock)!) }}
                      components={{
                        b: <b className="text-foreground" />,
                      }}
                    />
                  ) : (
                    t("dashboard.lockUntilUnlocked")
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </Panel>
  );
}
