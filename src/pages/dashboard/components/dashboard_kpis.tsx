import { CoverageTrack } from "@/components/coverage_bar";
import { KpiCard } from "@/components/kpi_card";
import { coverage, coverageTone } from "@/lib/coverage";
import { formatNumber, formatPercent } from "@/lib/format";
import type { Dashboard } from "@/types/dashboard";
import { CircleCheck, CirclePlus, Key, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

export function DashboardKpis({ data }: { data: Dashboard }) {
  const { t } = useTranslation();

  const delta = data.newKeyCount - data.newKeyCountPrevious;
  const languageKeys = data.languages.reduce((sum, l) => sum + l.totalKeys, 0);
  const untranslated = data.languages.reduce((sum, l) => sum + l.untranslatedCount, 0);
  const overallCoverage = coverage(languageKeys - untranslated, languageKeys);

  return (
    <div className="mb-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <KpiCard label={t("dashboard.totalKeys")} value={formatNumber(data.totalKeys)} icon={Key} />
      <KpiCard
        label={t("dashboard.newKeys")}
        value={formatNumber(data.newKeyCount)}
        icon={CirclePlus}
        footer={
          <>
            <span className="font-semibold text-brand-strong">
              {delta >= 0 ? `▲ +${formatNumber(delta)}` : `▼ ${formatNumber(delta)}`}
            </span>{" "}
            {t("dashboard.newKeysFooter", {
              previous: formatNumber(data.newKeyCountPrevious),
            })}
          </>
        }
      />
      <KpiCard
        label={t("dashboard.untranslated")}
        value={formatNumber(untranslated)}
        icon={TriangleAlert}
        iconTone="warn"
      />
      <KpiCard
        label={t("dashboard.coverage")}
        value={formatPercent(overallCoverage, 1)}
        icon={CircleCheck}
        iconTone={coverageTone(overallCoverage)}
        footer={<CoverageTrack value={overallCoverage} className="mt-1 flex-none" />}
      />
    </div>
  );
}
