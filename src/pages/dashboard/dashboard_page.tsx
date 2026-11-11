import { EmptyState } from "@/components/empty_state";
import { PageHeader } from "@/components/page_header";
import { Panel } from "@/components/panel";
import { useDashboard } from "@/hooks/use_dashboard";
import { Loader2, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DashboardKpis } from "./components/dashboard_kpis";
import { LanguageProgressPanel } from "./components/language_progress_panel";
import { LockedProjectsPanel } from "./components/locked_projects_panel";
import { NeedsAttentionPanel } from "./components/needs_attention_panel";

export function DashboardPage() {
  const { t } = useTranslation();
  const { data, isPending, isError } = useDashboard();

  if (isPending || (isError && !data))
    return (
      <>
        <PageHeader title={t("dashboard.title")} />
        <Panel>
          {isPending ? (
            <EmptyState icon={Loader2} iconClassName="animate-spin" title={t("common.loading")} />
          ) : (
            <EmptyState icon={TriangleAlert} title={t("errors.unknown")} />
          )}
        </Panel>
      </>
    );

  return (
    <>
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description", {
          projects: t("common.projectCount", { count: data.projectCount }),
          languages: t("common.languageCount", { count: data.languageCount }),
        })}
      />
      <DashboardKpis data={data} />

      <div className="mb-4 grid gap-4 lg:grid-cols-12">
        <LockedProjectsPanel projects={data.lockedProjects} className="lg:col-span-5" />
        <LanguageProgressPanel languages={data.languages} className="lg:col-span-7" />
      </div>

      <NeedsAttentionPanel projects={data.needsAttention} />
    </>
  );
}
