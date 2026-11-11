import { Download, Upload } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { toast } from "sonner";
import { CoverageBar } from "@/components/coverage_bar";
import { DataTable, Td, Th, Tr } from "@/components/data_table";
import { Pill } from "@/components/pill";
import { Button } from "@/components/ui/button";
import { getLanguage } from "@/data/mock_data";
import { languageStatsFor } from "@/data/stats";
import { formatExact } from "@/lib/format";
import { slugify } from "@/lib/slug";
import type { ProjectStats } from "@/types/stats";

type LanguagesTabProps = {
  stats: ProjectStats;
  onShowMissing: (lang: string) => void;
};

export function LanguagesTab({ stats, onShowMissing }: LanguagesTabProps) {
  const { t } = useTranslation();
  const { project } = stats;
  const languages = languageStatsFor([project]);
  const english = getLanguage("en");
  const download = (code: string) =>
    toast.success(t("common.downloading", { file: `${slugify(project.name)}/${code}.json` }));

  return (
    <DataTable>
      <thead>
        <tr>
          <Th>{t("projectDetails.languagesTab.columns.language")}</Th>
          <Th numeric>{t("projectDetails.languagesTab.columns.translated")}</Th>
          <Th numeric>{t("projectDetails.languagesTab.columns.missing")}</Th>
          <Th className="w-[28%]">{t("projectDetails.languagesTab.columns.coverage")}</Th>
          <Th>{t("projectDetails.languagesTab.columns.lastUpdate")}</Th>
          <Th />
        </tr>
      </thead>
      <tbody>
        <Tr>
          <Td>
            <b>{english.name}</b>{" "}
            <Pill tone="blue" className="ml-1">
              {t("common.source")}
            </Pill>
          </Td>
          <Td numeric>{stats.totalKeys}</Td>
          <Td numeric className="text-muted-foreground">
            –
          </Td>
          <Td>
            <CoverageBar value={100} />
          </Td>
          <Td className="text-muted-foreground">–</Td>
          <Td className="text-right whitespace-nowrap">
            <Button variant="outline" size="sm" onClick={() => download("en")}>
              <Download /> en.json
            </Button>
          </Td>
        </Tr>
        {languages.map((l) => (
          <Tr key={l.language.code}>
            <Td>
              <b>{l.language.name}</b>{" "}
              <span className="text-xs text-muted-foreground">{l.language.nativeName}</span>
            </Td>
            <Td numeric>{l.translated}</Td>
            <Td numeric>
              {l.missing > 0 ? (
                <button
                  type="button"
                  className="font-semibold text-bad hover:underline"
                  onClick={() => onShowMissing(l.language.code)}
                >
                  {l.missing}
                </button>
              ) : (
                <span className="text-muted-foreground">0</span>
              )}
            </Td>
            <Td>
              <CoverageBar value={l.coverage} />
            </Td>
            <Td className="whitespace-nowrap">
              {l.lastUpdated ? formatExact(l.lastUpdated) : "–"}
            </Td>
            <Td className="text-right whitespace-nowrap">
              <Button
                asChild
                variant="outline"
                size="icon-sm"
                title={t("projectDetails.languagesTab.upload", { file: `${l.language.code}.json` })}
              >
                <Link to={`/keys/upload?projectId=${project.id}&lang=${l.language.code}`}>
                  <Upload />
                </Link>
              </Button>{" "}
              <Button variant="outline" size="sm" onClick={() => download(l.language.code)}>
                <Download /> {l.language.code}.json
              </Button>
            </Td>
          </Tr>
        ))}
      </tbody>
    </DataTable>
  );
}
