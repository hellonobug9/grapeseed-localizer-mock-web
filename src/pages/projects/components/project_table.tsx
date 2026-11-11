import { CoverageBar } from "@/components/coverage_bar";
import { DataTable, Td, Th, Tr } from "@/components/data_table";
import { Pill } from "@/components/pill";
import { ProjectIcon } from "@/components/project_icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useLanguageCatalog } from "@/hooks/use_languages";
import { LockStatus } from "@/constants/lock";
import { useLocks } from "@/hooks/use_locks";
import { projectCoverage, projectStringCount } from "@/lib/coverage";
import { formatExact, formatNumber } from "@/lib/format";
import { lockLabel, lockSummary } from "@/lib/lock";
import { cn } from "@/lib/utils";
import type { LockInfo } from "@/types/lock";
import type { ProjectListItem } from "@/types/project";
import {
  CalendarDays,
  CalendarX,
  Download,
  Ellipsis,
  ExternalLink,
  Languages,
  Lock,
  LockOpen,
  Plus,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router";

export type ProjectTableRow = {
  project: ProjectListItem;
  lock: LockInfo | undefined;
  status: LockStatus;
};

type ProjectTableProps = {
  rows: ProjectTableRow[];
  selectedProjectId: number | null;
  onOpenProject: (project: ProjectListItem, focusLanguages?: boolean) => void;
};

export function ProjectTable({ rows, selectedProjectId, onOpenProject }: ProjectTableProps) {
  const { t } = useTranslation();
  const { now } = useLocks();
  const { names: languageName } = useLanguageCatalog();

  return (
    <DataTable>
      <thead>
        <tr>
          <Th>{t("projects.columns.project")}</Th>
          <Th>{t("projects.columns.languages")}</Th>
          <Th>{t("projects.columns.coverage")}</Th>
          <Th>{t("projects.columns.lastTranslated")}</Th>
          <Th>{t("projects.columns.status")}</Th>
          <Th />
        </tr>
      </thead>
      <tbody>
        {rows.map(({ project, lock, status }) => {
          const targets = project.targetLanguageCodes;
          const lastTranslatedAt = project.lastTranslatedAt
            ? new Date(project.lastTranslatedAt)
            : null;
          return (
            <Tr
              key={project.id}
              tabIndex={0}
              onDoubleClick={(e) => {
                if ((e.target as HTMLElement).closest('a, button, label, [role="menu"]')) return;
                onOpenProject(project);
              }}
              onKeyDown={(e) =>
                e.key === "Enter" && e.target === e.currentTarget && onOpenProject(project)
              }
              className={cn(
                "group focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand",
                status === LockStatus.Locked && "bg-surface-2",
                selectedProjectId === project.id && "bg-brand-soft hover:bg-brand-soft",
              )}
            >
              <Td className="cursor-pointer" onClick={() => onOpenProject(project)}>
                <div className="flex items-center gap-2">
                  <ProjectIcon project={project} size="sm" />
                  <div className="min-w-0 font-semibold">{project.name}</div>
                </div>
              </Td>
              <Td>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="cursor-default">{targets.length}</span>
                  </TooltipTrigger>
                  <TooltipContent side="bottom" align="start">
                    <ul className="flex flex-col gap-1">
                      {targets.map((code) => (
                        <li key={code}>{languageName.get(code) ?? code}</li>
                      ))}
                    </ul>
                  </TooltipContent>
                </Tooltip>
              </Td>
              <Td>
                <CoverageBar
                  value={projectCoverage(project)}
                  showValue="hover"
                  className="max-w-48"
                />
                <div
                  className={cn(
                    "mt-0.5 text-xs text-muted-foreground tabular-nums",
                    project.untranslatedStringCount === 0 && "text-good",
                  )}
                >
                  {formatNumber(projectStringCount(project) - project.untranslatedStringCount)}/{" "}
                  {formatNumber(projectStringCount(project))}
                </div>
              </Td>
              <Td className="whitespace-nowrap">
                {!lastTranslatedAt ? (
                  <span className="text-muted-foreground">-</span>
                ) : project.lastTranslatedBy ? (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-default">{formatExact(lastTranslatedAt)}</span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" align="start">
                      {t("projects.byUser", {
                        name: project.lastTranslatedBy,
                      })}
                    </TooltipContent>
                  </Tooltip>
                ) : (
                  formatExact(lastTranslatedAt)
                )}
              </Td>
              <Td>
                {status === LockStatus.Open && (
                  <Pill tone="gray" title={t("projects.canTranslate")}>
                    <LockOpen /> {lockLabel(status)}
                  </Pill>
                )}
                {status === LockStatus.Locked && (
                  <Pill tone="warn" title={lockSummary(lock, now)}>
                    <Lock /> {lockLabel(status)}
                  </Pill>
                )}
                {status === LockStatus.Scheduled && (
                  <Pill tone="blue" title={lockSummary(lock, now)}>
                    <CalendarDays /> {lockLabel(status)}
                  </Pill>
                )}
              </Td>
              <Td className="text-right whitespace-nowrap">
                <ProjectRowActions
                  project={project}
                  status={status}
                  onOpenLanguages={() => onOpenProject(project, true)}
                />
              </Td>
            </Tr>
          );
        })}
      </tbody>
    </DataTable>
  );
}

type ProjectRowActionsProps = {
  project: ProjectListItem;
  status: LockStatus;
  onOpenLanguages: () => void;
};

function ProjectRowActions({ project, status, onOpenLanguages }: ProjectRowActionsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lockNow, unlock } = useLocks();

  return (
    <div className="flex justify-end gap-1 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100 has-data-[state=open]:opacity-100">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon-sm"
            title={t("projects.moreActions")}
            aria-label={t("projects.moreActions")}
          >
            <Ellipsis />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem onSelect={() => navigate(`/projects/${project.id}`)}>
            <ExternalLink /> {t("projects.openTranslations")}
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={() => navigate(`/projects/${project.id}#download`)}>
            <Download /> {t("common.download")}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={`/keys/new?projectId=${project.id}`}>
              <Plus /> {t("projects.addKey")}
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem onSelect={onOpenLanguages}>
            <Languages /> {t("projects.languageSettings")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {status === LockStatus.Open && (
            <DropdownMenuItem onSelect={() => lockNow(project)}>
              <Lock /> {t("projects.lockNow")}
            </DropdownMenuItem>
          )}
          {status === LockStatus.Locked && (
            <DropdownMenuItem onSelect={() => unlock(project)}>
              <LockOpen /> {t("projects.unlock")}
            </DropdownMenuItem>
          )}
          {status === LockStatus.Scheduled && (
            <DropdownMenuItem onSelect={() => unlock(project)}>
              <CalendarX /> {t("projects.cancelScheduledLock")}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
