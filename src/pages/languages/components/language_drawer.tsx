import { CoverageBar } from "@/components/coverage_bar";
import { MiniStat } from "@/components/kpi_card";
import { ProjectDot } from "@/components/project_icon";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { MAX_TRANSLATORS } from "@/constants/language";
import { LockStatus } from "@/constants/lock";
import { useLanguageProjects } from "@/hooks/use_languages";
import { useLocks } from "@/hooks/use_locks";
import { coverage } from "@/lib/coverage";
import { formatExact, formatNumber, formatPercent, formatRelative } from "@/lib/format";
import { lockStatus, toLockInfo } from "@/lib/lock";
import type { LanguageOverviewItem } from "@/types/language";
import { Clock, Lock, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

type LanguageDrawerProps = {
  overview: LanguageOverviewItem | null;
  onOpenChange: (open: boolean) => void;
  onEdit: (overview: LanguageOverviewItem) => void;
};

function LanguageProjectList({ overview }: { overview: LanguageOverviewItem }) {
  const { t } = useTranslation();
  const { now } = useLocks();
  const { data, isPending, isError } = useLanguageProjects(overview.code);
  const projectNames = new Map(overview.projects.map((p) => [p.id, p.name]));

  if (isPending) return <p className="text-xs text-muted-foreground">{t("common.loading")}</p>;
  if (isError) return <p className="text-xs text-bad">{t("errors.unknown")}</p>;
  if (data.length === 0)
    return (
      <p className="text-xs text-muted-foreground">
        {t("languages.drawer.noProjects", { name: overview.name })}
      </p>
    );

  const projects = data
    .map((p) => {
      const translated = p.totalKeys - p.untranslatedCount;
      return {
        ...p,
        name: projectNames.get(p.id) ?? "",
        translated,
        coverage: coverage(translated, p.totalKeys),
        lastAt: p.lastTranslatedAt ? new Date(p.lastTranslatedAt) : null,
        locked: lockStatus(toLockInfo(p.lock), now) === LockStatus.Locked,
      };
    })
    .sort((a, b) => a.coverage - b.coverage || a.name.localeCompare(b.name));

  return projects.map((p) => (
    <Link
      key={p.id}
      to={`/projects/${p.id}?lang=${overview.code}&status=${p.untranslatedCount > 0 ? "missing" : "all"}`}
      className="-mx-3 block rounded-lg px-3 py-2.5 hover:bg-brand-soft"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <ProjectDot projectId={p.id} /> {p.name}
          {p.locked && (
            <Lock className="size-3 text-warn" aria-label={t("languages.drawer.locked")} />
          )}
        </span>
        <span
          className="flex items-center gap-1 text-xs whitespace-nowrap text-muted-foreground"
          title={p.lastAt ? formatExact(p.lastAt) : ""}
        >
          {p.lastAt && (
            <>
              <Clock className="size-3" /> {formatRelative(p.lastAt)}
            </>
          )}
        </span>
      </div>
      <CoverageBar value={p.coverage} className="mt-1" />
      <div className="mt-1 text-xs text-muted-foreground">
        {t("languages.drawer.projectProgress", {
          translated: formatNumber(p.translated),
          total: formatNumber(p.totalKeys),
        })}
        {p.untranslatedCount > 0 && (
          <>
            {" "}
            ·{" "}
            <span className="text-bad">
              {t("languages.missing", { count: p.untranslatedCount })}
            </span>
          </>
        )}
      </div>
    </Link>
  ));
}

function LanguageDrawerBody({
  overview,
  onEdit,
}: {
  overview: LanguageOverviewItem;
  onEdit: () => void;
}) {
  const { t } = useTranslation();
  const translated = overview.totalKeys - overview.untranslatedCount;
  const hasProjects = overview.projects.length > 0;

  return (
    <>
      <SheetHeader className="border-b px-6 py-4">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0">
            <SheetTitle className="text-lg font-semibold">{overview.name}</SheetTitle>
            <SheetDescription className="text-xs">
              {overview.nativeName} · <span className="font-mono">{overview.code}</span>
            </SheetDescription>
          </div>
        </div>
      </SheetHeader>

      <div className="flex-1 overflow-y-auto">
        <section className="border-b px-6 py-4">
          <div className="grid grid-cols-2 gap-2">
            <MiniStat
              value={formatPercent(coverage(translated, overview.totalKeys), 1)}
              label={t("languages.drawer.completion")}
            />
            <MiniStat
              value={formatNumber(overview.untranslatedCount)}
              label={t("languages.drawer.missingStrings")}
              valueClassName={overview.untranslatedCount > 0 ? "text-bad" : undefined}
            />
            <MiniStat value={overview.projects.length} label={t("languages.drawer.projects")} />
            <MiniStat
              value={
                <>
                  <span className="text-sm font-normal text-muted-foreground">
                    <b className="text-black  font-bold">{overview.translators.length}</b>/
                    {MAX_TRANSLATORS}
                  </span>
                </>
              }
              label={t("languages.drawer.translators")}
            />
          </div>
          {hasProjects && (
            <>
              <CoverageBar value={coverage(translated, overview.totalKeys)} className="mt-3" />
              <div className="mt-1 text-xs text-muted-foreground">
                {t("languages.drawer.translatedAcross", {
                  translated: formatNumber(translated),
                  total: formatNumber(overview.totalKeys),
                })}
              </div>
            </>
          )}
        </section>

        <section className="px-6 py-4">
          <h6 className="mb-2.5 text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            {t("languages.drawer.projects")}
          </h6>
          <LanguageProjectList overview={overview} />
        </section>
      </div>

      <div className="flex gap-2 border-t bg-surface-2 px-6 py-3.5">
        <Button className="flex-1" onClick={onEdit}>
          <Pencil /> {t("languages.drawer.edit")}
        </Button>
        <Button asChild variant="outline" size="icon" title={t("languages.activity")}>
          <Link to={`/activity?lang=${overview.code}`}>
            <Clock />
          </Link>
        </Button>
      </div>
    </>
  );
}

export function LanguageDrawer({ overview, onOpenChange, onEdit }: LanguageDrawerProps) {
  return (
    <Sheet open={!!overview} onOpenChange={onOpenChange}>
      <SheetContent className="w-full gap-0 p-0 sm:max-w-120">
        {overview && (
          <LanguageDrawerBody
            key={overview.code}
            overview={overview}
            onEdit={() => onEdit(overview)}
          />
        )}
      </SheetContent>
    </Sheet>
  );
}
