import { EmptyState } from "@/components/empty_state";
import { KpiCard } from "@/components/kpi_card";
import { PageHeader } from "@/components/page_header";
import { Panel, PanelToolbar } from "@/components/panel";
import { SearchInput } from "@/components/search_input";
import { Segmented } from "@/components/segmented";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SOURCE_LANGUAGE } from "@/constants/language";
import {
  DEFAULT_TEMPLATE_LANGUAGE,
  NO_RELEASE,
  TEMPLATE_TYPES,
  TemplateStatus,
  TemplateType,
  TRANSLATION_STATES,
  TranslationState,
} from "@/constants/template";
import { CURRENT_USER } from "@/data/mock_data";
import {
  getTemplateLanguage,
  RELEASE_VERSIONS,
  TEMPLATE_LANGUAGES,
  TEMPLATES,
} from "@/data/templates";
import { formatPercent } from "@/lib/format";
import { templateRow } from "@/lib/template";
import { releaseLabel } from "@/pages/templates/components/labels";
import {
  TemplateDialog,
  type TranslationValues,
} from "@/pages/templates/components/template_dialog";
import { TemplateTable } from "@/pages/templates/components/template_table";
import type { TemplateRow } from "@/types/template";
import { Bell, CircleCheck, Languages, Search, TriangleAlert } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

const ALL = "all" as const;

type TypeFilter = TemplateType | typeof ALL;

type StateFilter = TranslationState | typeof ALL;

const TARGET_LANGUAGES = TEMPLATE_LANGUAGES.filter((language) => language.code !== SOURCE_LANGUAGE);

export function TemplatesPage() {
  const { t } = useTranslation();
  const [templates, setTemplates] = useState(TEMPLATES);
  const [lang, setLang] = useState(DEFAULT_TEMPLATE_LANGUAGE);
  const [release, setRelease] = useState(String(RELEASE_VERSIONS[0].id));
  const [type, setType] = useState<TypeFilter>(ALL);
  const [state, setState] = useState<StateFilter>(ALL);
  const [service, setService] = useState<string>(ALL);
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const releaseId = release === NO_RELEASE ? null : Number(release);
  const language = getTemplateLanguage(lang);
  const allRows = templates.map((template) => templateRow(template, lang, releaseId));
  const ofType = allRows.filter((row) => type === ALL || row.template.type === type);
  const q = query.trim().toLowerCase();
  const rows = ofType.filter(
    (row) =>
      (state === ALL || row.state === state) &&
      (service === ALL || row.template.service === service) &&
      `${row.template.name} ${row.template.code}`.toLowerCase().includes(q),
  );
  const opened = allRows.find((row) => row.template.id === openId);
  const services = [
    ...new Set(templates.flatMap((template) => (template.service ? [template.service] : []))),
  ].sort();

  const translatable = allRows.filter((row) => row.source);
  const countOf = (...states: TranslationState[]) =>
    translatable.filter((row) => states.includes(row.state)).length;
  const percentOf = (count: number) =>
    translatable.length ? (count * 100) / translatable.length : 100;
  const translated = countOf(
    TranslationState.Draft,
    TranslationState.Published,
    TranslationState.Archived,
  );
  const published = countOf(TranslationState.Published, TranslationState.Archived);
  const missing = countOf(TranslationState.Missing);
  const outdated = countOf(TranslationState.Outdated);

  const typeOptions: { value: TypeFilter; label: string; count: number }[] = [
    { value: ALL, label: t("templates.allTypes"), count: allRows.length },
    ...TEMPLATE_TYPES.map((value) => ({
      value,
      label: t(`templates.type.${value}`),
      count: allRows.filter((row) => row.template.type === value).length,
    })),
  ].filter((option) => option.value === ALL || option.count > 0);

  const save = (row: TemplateRow, values: TranslationValues) => {
    const { target, source } = row;
    // A draft of this release is updated; otherwise the save starts a new draft in this release.
    const draftId =
      target?.releaseId === releaseId && target.status === TemplateStatus.Draft ? target.id : null;
    const updatedAt = new Date();
    setTemplates((current) =>
      current.map((template) => {
        if (template.id !== row.template.id) return template;
        const contents = draftId
          ? template.contents.map((content) =>
              content.id === draftId
                ? { ...content, ...values, updatedBy: CURRENT_USER.name, updatedAt }
                : content,
            )
          : [
              ...template.contents,
              {
                id: crypto.randomUUID(),
                language: lang,
                releaseId,
                ...values,
                phoneCodes: (target ?? source)?.phoneCodes ?? [],
                status: TemplateStatus.Draft,
                updatedBy: CURRENT_USER.name,
                updatedAt,
              },
            ];
        return { ...template, contents };
      }),
    );
    toast.success(
      t("templates.dialog.saved", {
        name: row.template.name,
        language: language.name,
        release: releaseLabel(releaseId, t),
      }),
    );
  };

  return (
    <>
      <PageHeader
        title={t("templates.title")}
        description={t("templates.description")}
        breadcrumbs={[{ label: t("nav.templates") }, { label: t("nav.template.notification") }]}
        actions={
          <>
            <Select value={release} onValueChange={setRelease}>
              <SelectTrigger
                className="h-9 w-auto min-w-36 bg-card"
                aria-label={t("templates.releaseLabel")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RELEASE_VERSIONS.map((item) => (
                  <SelectItem key={item.id} value={String(item.id)}>
                    {releaseLabel(item.id, t)}
                  </SelectItem>
                ))}
                <SelectItem value={NO_RELEASE}>{releaseLabel(null, t)}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={lang} onValueChange={setLang}>
              <SelectTrigger
                className="h-9 w-auto min-w-52 bg-card"
                aria-label={t("templates.languageLabel")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TARGET_LANGUAGES.map((item) => (
                  <SelectItem key={item.code} value={item.code}>
                    {item.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </>
        }
      />

      <div className="mb-5 grid gap-4 sm:grid-cols-3">
        <KpiCard
          label={t("templates.kpi.translated")}
          value={formatPercent(percentOf(translated))}
          icon={Languages}
          footer={t("templates.kpi.ofTemplates", {
            count: translated,
            total: translatable.length,
          })}
        />
        <KpiCard
          label={t("templates.kpi.published")}
          value={formatPercent(percentOf(published))}
          icon={CircleCheck}
          iconTone="good"
          footer={t("templates.kpi.ofTemplates", {
            count: published,
            total: translatable.length,
          })}
        />
        <KpiCard
          label={t("templates.kpi.needsWork")}
          value={missing + outdated}
          icon={TriangleAlert}
          iconTone="warn"
          footer={t("templates.kpi.needsWorkFooter", { missing, outdated })}
        />
      </div>

      <Panel>
        <PanelToolbar>
          <Segmented value={type} onChange={setType} options={typeOptions} />
          <Select value={state} onValueChange={(value) => setState(value as StateFilter)}>
            <SelectTrigger className="w-auto min-w-32" aria-label={t("templates.stateLabel")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("templates.allStates")}</SelectItem>
              {TRANSLATION_STATES.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`templates.state.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={service} onValueChange={setService}>
            <SelectTrigger className="w-auto min-w-32" aria-label={t("templates.serviceLabel")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>{t("templates.allServices")}</SelectItem>
              {services.map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <SearchInput
            className="ml-auto max-w-[260px]"
            placeholder={t("templates.searchPlaceholder")}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </PanelToolbar>

        {ofType.length === 0 ? (
          <EmptyState icon={Bell} title={t("templates.empty")} />
        ) : rows.length === 0 ? (
          <EmptyState icon={Search} title={t("templates.noMatch")}>
            {t("templates.noMatchHint")}
          </EmptyState>
        ) : (
          <TemplateTable
            rows={rows}
            releaseId={releaseId}
            onOpen={(row) => setOpenId(row.template.id)}
          />
        )}
      </Panel>

      {opened?.source && (
        <TemplateDialog
          key={`${opened.template.id}-${lang}-${release}`}
          row={opened}
          source={opened.source}
          lang={lang}
          releaseId={releaseId}
          onClose={() => setOpenId(null)}
          onSave={(values) => save(opened, values)}
        />
      )}
    </>
  );
}
