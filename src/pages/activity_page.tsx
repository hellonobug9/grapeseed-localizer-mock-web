import { ProjectDot } from "@/components/project_icon";
import { EmptyState } from "@/components/empty_state";
import { PageHeader } from "@/components/page_header";
import { Pager } from "@/components/pager";
import { Panel, PanelToolbar } from "@/components/panel";
import { Pill } from "@/components/pill";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ACTIVITY_PERIODS, DEFAULT_ACTIVITY_PERIOD } from "@/constants/activity";
import { PAGE_SIZE } from "@/constants/pagination";
import { ROLE_TONE } from "@/constants/role";
import { ACTIVITIES, PROJECTS, LANGUAGES, USERS, getProject, getLanguage } from "@/data/mock_data";
import { addDays, now, startOfDay } from "@/lib/dates";
import { formatDayLabel, formatExact, formatTime } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ActivityItem, ActivityKind } from "@/types/activity";
import {
  Clock,
  CloudUpload,
  Languages,
  Lock,
  LockOpen,
  Pencil,
  Plus,
  Rocket,
  Send,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";

const KIND_ICONS: Record<ActivityKind, LucideIcon> = {
  translate: Languages,
  edit: Pencil,
  upload: CloudUpload,
  add: Plus,
  "publish-test": Send,
  "publish-live": Rocket,
  lock: Lock,
  unlock: LockOpen,
  settings: Settings,
};

const KIND_CLASSES: Partial<Record<ActivityKind, string>> = {
  "publish-live": "bg-live text-white",
  "publish-test": "bg-test-bg text-test",
  lock: "bg-warn-bg text-warn",
  unlock: "bg-warn-bg text-warn",
  settings: "bg-warn-bg text-warn",
  add: "bg-good-bg text-good",
};

const groupByDay = (items: ActivityItem[]) => {
  const groups: { day: Date; items: ActivityItem[] }[] = [];
  for (const item of items) {
    const day = startOfDay(item.when);
    const last = groups[groups.length - 1];
    if (last && last.day.getTime() === day.getTime()) last.items.push(item);
    else groups.push({ day, items: [item] });
  }
  return groups;
};

export function ActivityPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const projectId = getProject(Number(params.get("projectId")))?.id;
  const langParam = params.get("lang");
  const lang = LANGUAGES.some((l) => l.code === langParam) ? langParam! : undefined;
  const days =
    ACTIVITY_PERIODS.find((p) => String(p.days) === params.get("days"))?.days ??
    DEFAULT_ACTIVITY_PERIOD;
  const page = Number(params.get("page")) || 1;

  const update = (next: Record<string, string | number | undefined>) => {
    const merged = new URLSearchParams(params);
    merged.delete("page");
    for (const [k, v] of Object.entries(next)) {
      if (
        v === undefined ||
        v === FILTER_ALL ||
        (k === "days" && v === DEFAULT_ACTIVITY_PERIOD) ||
        (k === "page" && v === 1)
      )
        merged.delete(k);
      else merged.set(k, String(v));
    }
    setParams(merged);
  };

  const filtered = ACTIVITIES.filter(
    (a) =>
      (!projectId || a.projectId === projectId) &&
      (!lang || a.lang === lang) &&
      (days === 0 || a.when >= addDays(now, -days)),
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  const items = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const hasFilters = !!projectId || !!lang || days !== DEFAULT_ACTIVITY_PERIOD;

  return (
    <>
      <PageHeader title={t("activity.title")} />

      <Panel className="mb-4">
        <PanelToolbar className="border-b-0">
          <Select
            value={projectId ? String(projectId) : FILTER_ALL}
            onValueChange={(value) => update({ projectId: value })}
          >
            <SelectTrigger className="h-9! w-52 bg-card" aria-label={t("activity.projectLabel")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL}>{t("activity.allProjects")}</SelectItem>
              {PROJECTS.map((a) => (
                <SelectItem key={a.id} value={String(a.id)}>
                  {a.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={lang ?? FILTER_ALL} onValueChange={(value) => update({ lang: value })}>
            <SelectTrigger className="h-9! w-52 bg-card" aria-label={t("activity.languageLabel")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={FILTER_ALL}>{t("activity.allLanguages")}</SelectItem>
              {LANGUAGES.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={String(days)} onValueChange={(value) => update({ days: Number(value) })}>
            <SelectTrigger className="h-9! w-52 bg-card" aria-label={t("activity.periodLabel")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ACTIVITY_PERIODS.map((p) => (
                <SelectItem key={p.days} value={String(p.days)}>
                  {t(`activity.periods.${p.label}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="link"
              size="sm"
              className="text-muted-foreground"
              onClick={() => setParams({})}
            >
              {t("activity.clearFilters")}
            </Button>
          )}
        </PanelToolbar>
      </Panel>

      <Panel className="overflow-hidden">
        {items.length === 0 ? (
          <EmptyState icon={Clock} title={t("activity.noActivity")}>
            {t("activity.noActivityHint")}
          </EmptyState>
        ) : (
          <>
            {groupByDay(items).map((group) => (
              <div key={group.day.getTime()}>
                <div className="flex items-center justify-between gap-4 border-b bg-surface-2 px-5 py-2 text-xs font-semibold tracking-wide text-text-2 uppercase">
                  <span>{formatDayLabel(group.day)}</span>
                  <span className="font-normal tracking-normal text-muted-foreground normal-case">
                    {t("activity.eventCount", { count: group.items.length })}
                  </span>
                </div>
                {group.items.map((act, i) => {
                  const project = act.projectId ? getProject(act.projectId) : undefined;
                  const language = act.lang ? getLanguage(act.lang) : undefined;
                  const user = USERS.find((u) => u.name === act.user);
                  const Icon = KIND_ICONS[act.kind];
                  return (
                    <div
                      key={i}
                      className="flex items-start gap-3.5 border-b px-5 py-3 hover:bg-[#fafcff]"
                    >
                      <span
                        className={cn(
                          "grid size-8 shrink-0 place-items-center rounded-full bg-brand-soft text-brand",
                          KIND_CLASSES[act.kind],
                        )}
                      >
                        <Icon className="size-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm text-text-2">
                          <b className="font-semibold text-foreground">{act.user}</b>
                          {user && (
                            <Pill
                              tone={ROLE_TONE[user.role]}
                              size="xs"
                              className="mx-1 align-[1px]"
                            >
                              {user.role}
                            </Pill>
                          )}{" "}
                          {act.text}
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          {project && (
                            <button
                              type="button"
                              onClick={() => update({ projectId: project.id })}
                              title={t("activity.filterByProject", {
                                project: project.name,
                              })}
                              className="inline-flex items-center gap-1.5 rounded-full border bg-white px-2 py-0.5 text-xs font-medium text-text-2 hover:border-brand-line hover:bg-brand-soft hover:text-brand-strong"
                            >
                              <ProjectDot projectId={project.id} /> {project.name}
                            </button>
                          )}
                          {language && (
                            <button
                              type="button"
                              onClick={() => update({ lang: language.code })}
                              title={t("activity.filterByLanguage", {
                                language: language.name,
                              })}
                              className="inline-flex items-center gap-1.5 rounded-full border bg-white px-2 py-0.5 text-xs font-medium text-text-2 hover:border-brand-line hover:bg-brand-soft hover:text-brand-strong"
                            >
                              {language.name}
                            </button>
                          )}
                          {project &&
                            language &&
                            (act.kind === "translate" || act.kind === "edit") && (
                              <Link
                                to={`/projects/${project.id}?lang=${language.code}`}
                                className="ml-1 text-xs text-brand"
                              >
                                {t("activity.viewTranslations")}
                              </Link>
                            )}
                        </div>
                      </div>
                      <span
                        className="pt-0.5 text-xs whitespace-nowrap text-muted-foreground tabular-nums"
                        title={formatExact(act.when)}
                      >
                        {formatTime(act.when)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}
            <Pager
              page={currentPage}
              pageCount={pageCount}
              pageSize={PAGE_SIZE}
              shown={items.length}
              total={filtered.length}
              noun={t("activity.eventsNoun")}
              onPageChange={(p) => update({ page: p })}
            />
          </>
        )}
      </Panel>
    </>
  );
}
const FILTER_ALL = "all";
