import { EmptyState } from "@/components/empty_state";
import { Panel, PanelHeader } from "@/components/panel";
import { ProjectIcon } from "@/components/project_icon";
import { Button } from "@/components/ui/button";
import { formatRelative } from "@/lib/format";
import type { DashboardAttentionProject } from "@/types/dashboard";
import { Clock, PartyPopper } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export function NeedsAttentionPanel({ projects }: { projects: DashboardAttentionProject[] }) {
  const { t } = useTranslation();

  return (
    <Panel>
      <PanelHeader
        title={t("dashboard.needsAttention")}
        description={t("dashboard.needsAttentionDescription")}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/activity">
              <Clock /> {t("dashboard.viewActivity")}
            </Link>
          </Button>
        }
      />
      {projects.length === 0 ? (
        <EmptyState icon={PartyPopper} title={t("dashboard.nothingNeedsAttention")} />
      ) : (
        <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-4">
          {projects.map((project) => (
            <div
              key={project.id}
              className="flex h-full items-center gap-3 rounded-lg border bg-surface-2 px-3 py-2.5"
            >
              <ProjectIcon project={project} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{project.name}</div>
                <div className="text-xs text-bad">
                  {t("dashboard.missing", {
                    count: project.untranslatedStringCount,
                  })}
                </div>
                {project.lastTranslatedAt && (
                  <div className="truncate text-xs text-muted-foreground">
                    {t("dashboard.translatedAgo", {
                      time: formatRelative(new Date(project.lastTranslatedAt)),
                    })}
                  </div>
                )}
              </div>
              <Button
                asChild
                size="sm"
                variant="secondary"
                className="bg-brand-soft text-brand-strong hover:bg-brand-muted"
              >
                <Link to={`/projects/${project.id}?status=missing`}>{t("dashboard.review")}</Link>
              </Button>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
