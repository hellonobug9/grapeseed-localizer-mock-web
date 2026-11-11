import { useState } from "react";
import {
  CalendarDays,
  ChevronDown,
  CloudUpload,
  Download,
  FileArchive,
  Lock,
  Plus,
  Rocket,
  Send,
  SlidersHorizontal,
} from "lucide-react";
import { Trans, useTranslation } from "react-i18next";
import { Link, useLocation, useNavigate, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";
import { ProjectIcon } from "@/components/project_icon";
import { Callout } from "@/components/callout";
import { CoverageBar } from "@/components/coverage_bar";
import { EmptyState } from "@/components/empty_state";
import { EnvBadge } from "@/components/env_badge";
import { KpiCard } from "@/components/kpi_card";
import { PageHeader } from "@/components/page_header";
import { Panel } from "@/components/panel";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LockStatus } from "@/constants/lock";
import { getProject, getLanguage } from "@/data/mock_data";
import { statsFor, targetLanguagesOf } from "@/data/stats";
import { useLocks } from "@/hooks/use_locks";
import { formatExact, formatRelative } from "@/lib/format";
import { slugify } from "@/lib/slug";
import { cn } from "@/lib/utils";
import { DownloadDialog } from "@/pages/project_details/components/download_dialog";
import { LanguagesTab } from "@/pages/project_details/components/languages_tab";
import { PublishDialog } from "@/pages/project_details/components/publish_dialog";
import {
  TranslationsTab,
  type KeyStatus,
  type TranslationFilters,
} from "@/pages/project_details/components/translations_tab";
import type { ProjectInfo } from "@/types/project";
import type { Environment } from "@/types/publish";
import type { ProjectStats } from "@/types/stats";

const STATUSES: KeyStatus[] = ["all", "missing", "translated", "new"];

function EnvCard({
  env,
  stats,
  onPublish,
}: {
  env: Environment;
  stats: ProjectStats;
  onPublish: () => void;
}) {
  const { t } = useTranslation();
  const isLive = env === "LIVE";
  const info = isLive ? stats.project.live : stats.project.test;
  return (
    <Panel
      className={cn(
        "flex h-full flex-col gap-3 px-5 py-4",
        isLive && "border-brand-line bg-linear-to-br from-[#f4f8ff] to-white to-60%",
      )}
    >
      <div>
        <EnvBadge env={env} />
      </div>
      <div className="text-sm text-muted-foreground">
        {t("projectDetails.env.published", {
          time: formatRelative(info.publishedAt),
          user: info.publishedBy,
        })}
      </div>
      <div className="mt-auto flex justify-end">
        <Button
          size="sm"
          onClick={onPublish}
          className={cn(isLive && "bg-live hover:bg-live-strong")}
        >
          {isLive ? <Rocket /> : <Send />} {t("projectDetails.env.publishTo", { env })}
        </Button>
      </div>
    </Panel>
  );
}

function DownloadMenu({
  project,
  onMoreOptions,
}: {
  project: ProjectInfo;
  onMoreOptions: () => void;
}) {
  const { t } = useTranslation();
  const notify = (file: string) => toast.success(t("common.downloading", { file }));
  const fileName = slugify(project.name);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          <Download /> {t("common.download")} <ChevronDown />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-[70vh] w-72">
        <DropdownMenuItem
          onSelect={() =>
            notify(
              `${fileName}.zip (${t("common.languageCount", { count: project.languages.length })})`,
            )
          }
        >
          <FileArchive /> <b>{t("projectDetails.downloadMenu.allLanguages")}</b>
          <span className="ml-auto font-mono text-xs text-muted-foreground">{fileName}.zip</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {project.languages.map((code) => {
          const l = getLanguage(code);
          return (
            <DropdownMenuItem key={code} onSelect={() => notify(`${fileName}/${code}.json`)}>
              {l.name}
              <span className="ml-auto font-mono text-xs text-muted-foreground">{code}.json</span>
            </DropdownMenuItem>
          );
        })}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={onMoreOptions}>
          <SlidersHorizontal /> {t("projectDetails.downloadMenu.moreOptions")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function ProjectDetails({ project }: { project: ProjectInfo }) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const { statusOf, summaryOf } = useLocks();
  const [downloadOpen, setDownloadOpen] = useState(location.hash === "#download");
  const [publishEnv, setPublishEnv] = useState<Environment | null>(null);
  const [tab, setTab] = useState("keys");

  const stats = statsFor(project);
  const targets = targetLanguagesOf(project);
  const status = statusOf(project.id);

  const langParam = params.get("lang");
  const moduleParam = params.get("module");
  const statusParam = params.get("status") as KeyStatus | null;
  const filters: TranslationFilters = {
    lang: langParam && targets.includes(langParam) ? langParam : targets[0],
    module: moduleParam && project.modules.includes(moduleParam) ? moduleParam : undefined,
    status: statusParam && STATUSES.includes(statusParam) ? statusParam : "all",
    query: params.get("q") ?? "",
    page: Number(params.get("page") ?? 1) || 1,
  };

  const updateFilters = (next: Partial<TranslationFilters>) => {
    const merged = { ...filters, ...next };
    const search = new URLSearchParams();
    if (merged.module) search.set("module", merged.module);
    if (merged.lang && merged.lang !== targets[0]) search.set("lang", merged.lang);
    if (merged.status !== "all") search.set("status", merged.status);
    if (merged.query.trim()) search.set("q", merged.query.trim());
    if (merged.page > 1) search.set("page", String(merged.page));
    setParams(search);
  };

  const closeDownload = (open: boolean) => {
    setDownloadOpen(open);
    if (!open && location.hash) navigate({ search: location.search, hash: "" }, { replace: true });
  };

  const calloutComponents = { b: <b />, link: <Link to="/projects" className="text-brand" /> };

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: t("nav.projects"), to: "/projects" }, { label: project.name }]}
        icon={<ProjectIcon project={project} size="lg" />}
        title={project.name}
        description={t("common.languageCount", { count: project.languages.length })}
        actions={
          <>
            <DownloadMenu project={project} onMoreOptions={() => setDownloadOpen(true)} />
            <Button asChild variant="outline">
              <Link to={`/keys/upload?projectId=${project.id}`}>
                <CloudUpload /> {t("projectDetails.uploadJson")}
              </Link>
            </Button>
            <Button asChild>
              <Link to={`/keys/new?projectId=${project.id}`}>
                <Plus /> {t("projectDetails.addKey")}
              </Link>
            </Button>
          </>
        }
      />

      {status === LockStatus.Locked && (
        <Callout icon={Lock} tone="warn" className="mb-4">
          <Trans
            i18nKey="projectDetails.lockedCallout"
            values={{ summary: summaryOf(project.id) }}
            components={calloutComponents}
          />
        </Callout>
      )}
      {status === LockStatus.Scheduled && (
        <Callout icon={CalendarDays} className="mb-4">
          <Trans
            i18nKey="projectDetails.scheduledCallout"
            values={{ summary: summaryOf(project.id) }}
            components={calloutComponents}
          />
        </Callout>
      )}

      <div className="mb-4 grid grid-cols-2 gap-4 xl:grid-cols-4">
        <KpiCard
          label={t("projectDetails.kpi.totalKeys")}
          value={stats.totalKeys}
          footer={t("projectDetails.kpi.stringsToTranslate", {
            count: stats.totalKeys * targets.length,
          })}
        />
        <KpiCard
          label={t("projectDetails.kpi.newKeys")}
          value={stats.newKeys}
          footer={
            <button
              type="button"
              className="text-brand hover:underline"
              onClick={() => updateFilters({ status: "new", page: 1 })}
            >
              {t("projectDetails.kpi.viewNewKeys")}
            </button>
          }
        />
        <KpiCard
          label={t("projectDetails.kpi.untranslated")}
          value={stats.untranslated}
          valueClassName={stats.untranslated > 0 ? "text-bad" : undefined}
          footer={<CoverageBar value={stats.coverage} className="min-w-0" />}
        />
        <KpiCard
          label={t("projectDetails.kpi.lastTranslated")}
          value={formatRelative(stats.project.lastTranslatedAt)}
          valueClassName="text-2xl"
          valueTitle={formatExact(project.lastTranslatedAt)}
          footer={t("projectDetails.kpi.lastTranslatedFooter", {
            name: project.lastTranslatedBy,
            date: formatExact(project.lastTranslatedAt),
          })}
        />
      </div>

      <div className="mb-4 grid gap-4 md:grid-cols-2">
        <EnvCard env="TEST" stats={stats} onPublish={() => setPublishEnv("TEST")} />
        <EnvCard env="LIVE" stats={stats} onPublish={() => setPublishEnv("LIVE")} />
      </div>

      <Panel>
        <Tabs value={tab} onValueChange={setTab} className="gap-0">
          <TabsList
            variant="line"
            className="h-auto! w-full justify-start gap-6 rounded-none border-b px-5"
          >
            <TabsTrigger
              value="keys"
              className="flex-none px-0 py-3.5 data-active:text-brand-strong after:bg-brand"
            >
              {t("projectDetails.tabs.translations")}{" "}
              <span className="rounded-full bg-muted px-2 text-xs text-text-2">
                {stats.totalKeys}
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="langs"
              className="flex-none px-0 py-3.5 data-active:text-brand-strong after:bg-brand"
            >
              {t("projectDetails.tabs.languages")}{" "}
              <span className="rounded-full bg-muted px-2 text-xs text-text-2">
                {project.languages.length}
              </span>
            </TabsTrigger>
          </TabsList>
          {/* Kept mounted so pending translation edits survive a tab switch. */}
          <TabsContent value="keys" forceMount className="data-[state=inactive]:hidden">
            <TranslationsTab
              key={project.id}
              project={project}
              filters={filters}
              onFiltersChange={updateFilters}
            />
          </TabsContent>
          <TabsContent value="langs">
            <LanguagesTab
              stats={stats}
              onShowMissing={(lang) => {
                updateFilters({ lang, status: "missing", page: 1 });
                setTab("keys");
              }}
            />
          </TabsContent>
        </Tabs>
      </Panel>

      <DownloadDialog
        key={project.id}
        project={project}
        open={downloadOpen}
        onOpenChange={closeDownload}
      />
      <PublishDialog
        stats={stats}
        env={publishEnv}
        onOpenChange={(open) => !open && setPublishEnv(null)}
      />
    </>
  );
}

export function ProjectDetailsPage() {
  const { t } = useTranslation();
  const { id } = useParams();
  const project = getProject(Number(id));

  if (!project) {
    return (
      <Panel>
        <EmptyState icon={Lock} title={t("projectDetails.notFound")}>
          <Link to="/projects" className="text-brand">
            {t("projectDetails.backToProjects")}
          </Link>
        </EmptyState>
      </Panel>
    );
  }

  return <ProjectDetails key={project.id} project={project} />;
}
