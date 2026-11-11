import { EmptyState } from "@/components/empty_state";
import { PageHeader } from "@/components/page_header";
import { Panel, PanelToolbar } from "@/components/panel";
import { Segmented } from "@/components/segmented";
import { Button } from "@/components/ui/button";
import { LOCK_FILTERS, LockFilter, LockFilterId } from "@/constants/lock";
import { useLocks } from "@/hooks/use_locks";
import { useProjects, useProjectsSummary } from "@/hooks/use_projects";
import { lockStatus, projectLockInfo } from "@/lib/lock";
import { NewProjectDialog } from "@/pages/projects/components/new_project_dialog";
import { ProjectDrawer } from "@/pages/projects/components/project_drawer";
import { ProjectSearchForm } from "@/pages/projects/components/project_search_form";
import { ProjectTable, type ProjectTableRow } from "@/pages/projects/components/project_table";
import type { ProjectListItem } from "@/types/project";
import { FolderOpen, Loader2, Lock, Plus, Search, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

export function ProjectsPage() {
  const { t } = useTranslation();
  const { now } = useLocks();
  const [lockFilter, setLockFilter] = useState<LockFilter>(LockFilter.All);
  const [drawerProjectId, setDrawerProjectId] = useState<number | null>(null);
  const [focusLanguages, setFocusLanguages] = useState(false);
  const [newProjectOpen, setNewProjectOpen] = useState(false);
  const [search, setSearch] = useState("");

  const { data: summary } = useProjectsSummary({ silent: true });
  const {
    data: projects,
    isPending,
    isError,
  } = useProjects({
    filter: lockFilter === LockFilter.All ? undefined : LockFilterId[lockFilter],
    search: search || undefined,
  });

  const withLock = (project: ProjectListItem): ProjectTableRow => {
    const lock = projectLockInfo(project);
    return { project, lock, status: lockStatus(lock, now) };
  };
  const filterCounts =
    summary &&
    ({
      [LockFilter.All]: summary.projectCount,
      [LockFilter.Open]: summary.statusCounts.open,
      [LockFilter.Locked]: summary.statusCounts.locked,
    } satisfies Record<LockFilter, number>);
  const isFiltered = lockFilter !== LockFilter.All || !!search;
  const rows = (projects ?? []).map(withLock);
  const drawerProject = projects?.find((p) => p.id === drawerProjectId) ?? null;

  const openDrawer = (project: ProjectListItem, languages = false) => {
    setFocusLanguages(languages);
    setDrawerProjectId(project.id);
  };

  const renderEmpty = () => {
    if (isPending)
      return <EmptyState icon={Loader2} iconClassName="animate-spin" title={t("common.loading")} />;
    if (isError && !projects)
      return <EmptyState icon={TriangleAlert} title={t("errors.unknown")} />;
    if (rows.length > 0) return null;
    return isFiltered ? (
      <EmptyState icon={Search} title={t("projects.noMatch")} />
    ) : (
      <EmptyState icon={FolderOpen} title={t("projects.empty")} />
    );
  };
  const empty = renderEmpty();

  return (
    <>
      <PageHeader
        title={t("projects.title")}
        description={
          summary &&
          t("projects.description", {
            projects: t("common.projectCount", { count: summary.projectCount }),
            keys: t("common.keyCount", { count: summary.keyCount }),
          })
        }
        actions={
          <Button onClick={() => setNewProjectOpen(true)}>
            <Plus /> {t("projects.new")}
          </Button>
        }
      />

      <Panel>
        <PanelToolbar>
          <ProjectSearchForm onSearch={setSearch} />
          <Segmented
            value={lockFilter}
            onChange={setLockFilter}
            options={LOCK_FILTERS.map((f) => ({
              value: f,
              label: (
                <>
                  {f === LockFilter.Locked && <Lock />}
                  {t(`projects.filter.${f}`)}
                </>
              ),
              count: filterCounts?.[f],
            }))}
          />
        </PanelToolbar>

        {empty ?? (
          <ProjectTable
            rows={rows}
            selectedProjectId={drawerProject?.id ?? null}
            onOpenProject={openDrawer}
          />
        )}
      </Panel>

      <ProjectDrawer
        project={drawerProject}
        focusLanguages={focusLanguages}
        onOpenChange={(open) => !open && setDrawerProjectId(null)}
      />
      <NewProjectDialog open={newProjectOpen} onOpenChange={setNewProjectOpen} />
    </>
  );
}
