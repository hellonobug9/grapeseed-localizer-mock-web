import { EmptyState } from "@/components/empty_state";
import { PageHeader } from "@/components/page_header";
import { Panel, PanelToolbar } from "@/components/panel";
import { SearchInput } from "@/components/search_input";
import { Button } from "@/components/ui/button";
import { useLanguagesOverview } from "@/hooks/use_languages";
import { coverage, languageTranslatedCount } from "@/lib/coverage";
import { formatPercent } from "@/lib/format";
import { DeleteLanguageDialog } from "@/pages/languages/components/delete_language_dialog";
import { LanguageDialog } from "@/pages/languages/components/language_dialog";
import { LanguageDrawer } from "@/pages/languages/components/language_drawer";
import { LanguageTable } from "@/pages/languages/components/language_table";
import type { Language, LanguageOverviewItem } from "@/types/language";
import { Languages, Loader2, Plus, Search, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function summarize(overviews: LanguageOverviewItem[]) {
  const targets = overviews.filter((o) => !o.isSource);
  const total = targets.reduce((sum, o) => sum + o.totalKeys, 0);
  const translated = targets.reduce((sum, o) => sum + languageTranslatedCount(o), 0);
  return {
    targets: targets.length,
    overall: coverage(translated, total),
    unstaffed: targets.filter((o) => o.translators.length === 0).length,
  };
}

export function LanguagesPage() {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [drawerCode, setDrawerCode] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{
    open: boolean;
    language: Language | null;
  }>({ open: false, language: null });
  const [deleting, setDeleting] = useState<LanguageOverviewItem | null>(null);

  const { data: overviews, isPending, isError } = useLanguagesOverview();
  const summary = overviews && summarize(overviews);
  const drawer = overviews?.find((o) => o.code === drawerCode) ?? null;

  const q = query.trim().toLowerCase();
  const rows = (overviews ?? []).filter((o) =>
    [o.name, o.nativeName, o.code, ...o.translators.map((u) => u.name)]
      .join(" ")
      .toLowerCase()
      .includes(q),
  );

  const openEdit = (overview: LanguageOverviewItem) => {
    setDrawerCode(null);
    setDialog({ open: true, language: overview });
  };

  const renderEmpty = () => {
    if (isPending)
      return <EmptyState icon={Loader2} iconClassName="animate-spin" title={t("common.loading")} />;
    if (isError && !overviews)
      return <EmptyState icon={TriangleAlert} title={t("errors.unknown")} />;
    if (rows.length > 0) return null;
    return q ? (
      <EmptyState icon={Search} title={t("languages.noMatch")} />
    ) : (
      <EmptyState icon={Languages} title={t("languages.empty")} />
    );
  };
  const empty = renderEmpty();

  return (
    <>
      <PageHeader
        title={t("languages.title")}
        description={
          overviews &&
          summary && (
            <>
              {t("languages.summary", {
                languages: t("common.languageCount", {
                  count: overviews.length,
                }),
                targets: summary.targets,
                percent: formatPercent(summary.overall, 1),
              })}
              {summary.unstaffed > 0 && (
                <>
                  {" "}
                  ·{" "}
                  <span className="text-warn">
                    {t("languages.unstaffed", { count: summary.unstaffed })}
                  </span>
                </>
              )}
            </>
          )
        }
        actions={
          <Button onClick={() => setDialog({ open: true, language: null })}>
            <Plus /> {t("languages.add")}
          </Button>
        }
      />

      <Panel>
        <PanelToolbar>
          <SearchInput
            className="max-w-[340px]"
            placeholder={t("languages.filterPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </PanelToolbar>

        {empty ?? (
          <LanguageTable
            rows={rows}
            selectedCode={drawerCode}
            onOpen={setDrawerCode}
            onEdit={(o) => setDialog({ open: true, language: o })}
            onDelete={setDeleting}
          />
        )}
      </Panel>

      <LanguageDrawer
        overview={drawer}
        onOpenChange={(open) => !open && setDrawerCode(null)}
        onEdit={openEdit}
      />
      <LanguageDialog
        open={dialog.open}
        language={dialog.language}
        onOpenChange={(open) => setDialog((d) => ({ ...d, open }))}
      />
      <DeleteLanguageDialog
        overview={deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
      />
    </>
  );
}
