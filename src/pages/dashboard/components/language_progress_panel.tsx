import { CoverageTrack } from "@/components/coverage_bar";
import { EmptyState } from "@/components/empty_state";
import { Panel, PanelHeader } from "@/components/panel";
import { Pill } from "@/components/pill";
import { Button } from "@/components/ui/button";
import { coverage } from "@/lib/coverage";
import { formatNumber } from "@/lib/format";
import type { DashboardLanguage } from "@/types/dashboard";
import { Check, Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";

export function LanguageProgressPanel({
  languages,
  className,
}: {
  languages: DashboardLanguage[];
  className?: string;
}) {
  const { t } = useTranslation();

  return (
    <Panel className={className}>
      <PanelHeader
        title={t("dashboard.keysToTranslate")}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link to="/languages">{t("dashboard.allLanguages")}</Link>
          </Button>
        }
      />
      {languages.length === 0 ? (
        <EmptyState icon={Languages} title={t("dashboard.noLanguages")} />
      ) : (
        <div className="px-5 py-2">
          {languages.map((l) => (
            <div
              key={l.code}
              className="grid grid-cols-[--spacing(44)_1fr_auto] items-center gap-3 py-2"
            >
              <div className="truncate text-sm font-medium">{l.name}</div>
              <CoverageTrack value={coverage(l.totalKeys - l.untranslatedCount, l.totalKeys)} />
              <div className="min-w-26 text-right tabular-nums">
                {l.untranslatedCount === 0 ? (
                  <Pill tone="good">
                    <Check /> {t("dashboard.done")}
                  </Pill>
                ) : (
                  <>
                    <b>{formatNumber(l.untranslatedCount)}</b>{" "}
                    <span className="text-xs text-muted-foreground">
                      {t("dashboard.keysUnit", {
                        count: l.untranslatedCount,
                      })}
                    </span>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
