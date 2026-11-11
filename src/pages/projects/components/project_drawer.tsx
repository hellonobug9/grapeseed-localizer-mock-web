import { Callout } from "@/components/callout";
import { CheckGrid, CheckTile } from "@/components/choice_tile";
import { CoverageBar } from "@/components/coverage_bar";
import { EmptyState } from "@/components/empty_state";
import { MiniStat } from "@/components/kpi_card";
import { Pill } from "@/components/pill";
import { ProjectIcon } from "@/components/project_icon";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SOURCE_LANGUAGE } from "@/constants/language";
import { useLanguageCatalog } from "@/hooks/use_languages";
import { useLocks } from "@/hooks/use_locks";
import { useProjectLanguages } from "@/hooks/use_projects";
import { coverage, projectCoverage } from "@/lib/coverage";
import { formatExact, formatNumber, formatPercent, formatRelative } from "@/lib/format";
import { lockStatus, projectLockInfo } from "@/lib/lock";
import { LockPanel, LockStatusIcon } from "@/pages/projects/components/lock_panel";
import type { ProjectListItem } from "@/types/project";
import { Clock, Download, ExternalLink, TriangleAlert } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";

type ProjectDrawerProps = {
  project: ProjectListItem | null;
  focusLanguages?: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ProjectDrawer({ project, focusLanguages, onOpenChange }: ProjectDrawerProps) {
  return (
    <Sheet open={!!project} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-[480px]">
        {project && (
          <ProjectDrawerBody key={project.id} project={project} focusLanguages={focusLanguages} />
        )}
      </SheetContent>
    </Sheet>
  );
}

function DrawerSection({
  title,
  id,
  children,
}: {
  title?: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="border-b px-6 py-4 last:border-b-0">
      {title && (
        <h6 className="mb-2.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
          {title}
        </h6>
      )}
      {children}
    </section>
  );
}

function LanguageSettings({ project }: { project: ProjectListItem }) {
  const { t } = useTranslation();
  const { source, targets } = useLanguageCatalog();
  const initial = project.targetLanguageCodes;
  const [selected, setSelected] = useState(initial);
  const removed = initial.some((code) => !selected.includes(code));

  const toggle = (code: string, checked: boolean) =>
    setSelected((prev) => (checked ? [...prev, code] : prev.filter((c) => c !== code)));

  const submit = (e: FormEvent) => {
    e.preventDefault();
    toast.success(t("projects.drawer.saved", { name: project.name }));
  };

  return (
    <form onSubmit={submit}>
      <div className="mb-2 flex items-center gap-2 rounded-lg border bg-surface-2 px-3 py-2 text-sm">
        <Checkbox checked disabled />
        {source?.name ?? SOURCE_LANGUAGE}{" "}
        <Pill tone="blue" className="ml-auto">
          {t("common.source")}
        </Pill>
      </div>
      <CheckGrid className="grid-cols-2">
        {targets.map((l) => (
          <CheckTile
            key={l.code}
            checked={selected.includes(l.code)}
            onCheckedChange={(v) => toggle(l.code, v)}
          >
            {l.name}
          </CheckTile>
        ))}
      </CheckGrid>
      {removed && (
        <Callout icon={TriangleAlert} tone="warn" className="mt-3">
          {t("projects.drawer.removedWarning")}
        </Callout>
      )}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          {t("common.selectedOf", {
            selected: selected.length,
            total: targets.length,
          })}
        </span>
        <Button type="submit" size="sm" disabled={selected.length === 0}>
          {t("projects.drawer.saveLanguages")}
        </Button>
      </div>
    </form>
  );
}

function LanguageProgressList({ project }: { project: ProjectListItem }) {
  const { t } = useTranslation();
  const { data: progress, isPending, isError } = useProjectLanguages(project.id);
  const { names: languageName } = useLanguageCatalog();
  const total = project.totalKeys;

  if (isPending) return <p className="text-xs text-muted-foreground">{t("common.loading")}</p>;
  if (isError) return <p className="text-xs text-bad">{t("errors.unknown")}</p>;
  if (progress.length === 0) return <EmptyState title={t("projects.drawer.noLanguages")} />;

  return progress.map(({ code, untranslatedCount, lastTranslatedAt }) => {
    const translated = total - untranslatedCount;
    const percent = coverage(translated, total);
    const lastAt = lastTranslatedAt ? new Date(lastTranslatedAt) : null;
    return (
      <Link
        key={code}
        to={`/projects/${project.id}?lang=${code}&status=${untranslatedCount > 0 ? "missing" : "all"}`}
        className="-mx-3 block rounded-lg px-3 py-2.5 hover:bg-brand-soft"
      >
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-medium">{languageName.get(code) ?? code}</span>
          <span
            className="flex items-center gap-1 text-xs whitespace-nowrap text-muted-foreground"
            title={lastAt ? formatExact(lastAt) : undefined}
          >
            {lastAt ? (
              <>
                <Clock className="size-3" /> {formatRelative(lastAt)}
              </>
            ) : (
              "-"
            )}
          </span>
        </div>
        <CoverageBar value={percent} className="mt-1" />
        <div className="mt-1 text-xs text-muted-foreground">
          {t("projects.drawer.progress", {
            translated: formatNumber(translated),
            total: formatNumber(total),
          })}
          {untranslatedCount > 0 && (
            <>
              {" · "}
              <span className="text-bad">
                {t("projects.drawer.missing", { count: untranslatedCount })}
              </span>
            </>
          )}
        </div>
      </Link>
    );
  });
}

function ProjectDrawerBody({
  project,
  focusLanguages,
}: {
  project: ProjectListItem;
  focusLanguages?: boolean;
}) {
  const { t } = useTranslation();
  const { now } = useLocks();
  const lastTranslatedAt = project.lastTranslatedAt ? new Date(project.lastTranslatedAt) : null;

  return (
    <>
      <SheetHeader className="border-b px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <ProjectIcon project={project} />
          <div className="min-w-0">
            <SheetTitle className="flex items-center gap-2 text-lg font-semibold">
              <LockStatusIcon status={lockStatus(projectLockInfo(project), now)} />
              <span className="truncate">{project.name}</span>
            </SheetTitle>
            <SheetDescription className="text-xs">
              {t("common.languageCount", {
                count: project.targetLanguageCodes.length,
              })}
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div
        className="flex-1 overflow-y-auto"
        ref={(el) => {
          if (el && focusLanguages)
            el.querySelector("#drawer-languages")?.scrollIntoView({
              block: "start",
            });
        }}
      >
        <DrawerSection title={t("projects.drawer.translationLock")}>
          <LockPanel project={project} />
        </DrawerSection>

        <DrawerSection>
          <div className="grid grid-cols-2 gap-2">
            <MiniStat value={project.totalKeys} label={t("projects.drawer.totalKeys")} />
            <MiniStat
              value={project.untranslatedKeyCount}
              label={t("projects.drawer.untranslatedKeys")}
              valueClassName={project.untranslatedKeyCount > 0 ? "text-bad" : undefined}
            />
            <MiniStat
              value={formatPercent(projectCoverage(project), 1)}
              label={t("projects.drawer.coverage")}
            />
            <MiniStat
              value={lastTranslatedAt ? formatRelative(lastTranslatedAt) : "-"}
              valueClassName="text-base leading-[1.65rem]"
              label={
                project.lastTranslatedBy
                  ? t("projects.drawer.lastTranslatedBy", {
                      name: project.lastTranslatedBy,
                    })
                  : t("projects.columns.lastTranslated")
              }
              title={lastTranslatedAt ? formatExact(lastTranslatedAt) : undefined}
            />
          </div>
        </DrawerSection>

        <DrawerSection title={t("projects.drawer.byLanguage")}>
          <LanguageProgressList project={project} />
        </DrawerSection>

        <DrawerSection title={t("projects.drawer.languagesToTranslate")} id="drawer-languages">
          <LanguageSettings key={project.id} project={project} />
        </DrawerSection>
      </div>

      <div className="flex gap-2 border-t bg-surface-2 px-6 py-3.5">
        <Button asChild className="flex-1">
          <Link to={`/projects/${project.id}`}>
            <ExternalLink /> {t("projects.openTranslations")}
          </Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={`/projects/${project.id}#download`}>
            <Download /> {t("common.download")}
          </Link>
        </Button>
        <Button asChild variant="outline" size="icon" title={t("projects.drawer.activity")}>
          <Link to={`/activity?projectId=${project.id}`}>
            <Clock />
          </Link>
        </Button>
      </div>
    </>
  );
}
