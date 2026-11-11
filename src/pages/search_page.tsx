import { EmptyState } from "@/components/empty_state";
import { Highlight } from "@/components/highlight";
import { PageHeader } from "@/components/page_header";
import { Pager } from "@/components/pager";
import { Panel, PanelHeader } from "@/components/panel";
import { Pill } from "@/components/pill";
import { ProjectIcon } from "@/components/project_icon";
import { SearchInput } from "@/components/search_input";
import { Segmented } from "@/components/segmented";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PAGE_SIZE } from "@/constants/pagination";
import {
  MAX_LANGUAGE_MATCHES,
  SEARCH_FILTER_ALL,
  SEARCH_SCOPES,
  SearchScope,
  SearchScopeId,
} from "@/constants/search";
import { useLanguageCatalog } from "@/hooks/use_languages";
import { useProjects } from "@/hooks/use_projects";
import { useSearch } from "@/hooks/use_search";
import { Loader2, Pencil, Search, SearchX } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { Link, useSearchParams } from "react-router";

type SearchFilters = {
  scope: SearchScope;
  projectId?: number;
  lang?: string;
};

const INITIAL_FILTERS: SearchFilters = { scope: SearchScope.All };

const fromFilterValue = (value: string) => (value === SEARCH_FILTER_ALL ? undefined : value);

export function SearchPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const query = params.get("q")?.trim() ?? "";
  const [filters, setFilters] = useState<SearchFilters>(INITIAL_FILTERS);
  const { scope, projectId, lang } = filters;
  const pageKey = JSON.stringify([query, filters]);
  const [paging, setPaging] = useState({ key: pageKey, page: 1 });
  const page = paging.key === pageKey ? paging.page : 1;

  const { data: projects = [] } = useProjects({}, { silent: true });
  const { languages, names: languageName } = useLanguageCatalog();
  const { data, isPending, isError } = useSearch({
    q: query,
    scope: SearchScopeId[scope],
    projectId,
    languageCode: lang,
    page,
    pageSize: PAGE_SIZE,
  });

  const changePage = (value: number) => setPaging({ key: pageKey, page: value });

  const changeFilters = (next: Partial<SearchFilters>) =>
    setFilters((prev) => ({ ...prev, ...next }));

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
    changePage(1);
    setParams(q ? { q } : {});
  };

  const changeScope = (value: SearchScope) => changeFilters({ scope: value });

  const changeProject = (value: string) =>
    changeFilters({ projectId: Number(fromFilterValue(value)) || undefined });

  const changeLang = (value: string) => changeFilters({ lang: fromFilterValue(value) });

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const keyQuery = scope === SearchScope.Text ? null : query;
  const textQuery = scope === SearchScope.Key ? null : query;

  const renderResults = () => {
    if (!query) return <EmptyState icon={Search} title={t("search.emptyTitle")} />;
    if (isError && !data) return <EmptyState icon={SearchX} title={t("errors.unknown")} />;
    if (isPending)
      return <EmptyState icon={Loader2} iconClassName="animate-spin" title={t("common.loading")} />;
    if (total === 0)
      return (
        <EmptyState icon={SearchX} title={t("search.noResults", { query })}>
          {t("search.noResultsHint")}
        </EmptyState>
      );
    return (
      <>
        <PanelHeader title={t("search.resultCount", { count: total })} />
        {items.map((r) => {
          return (
            <div
              key={r.key.id}
              className="flex gap-4 border-b px-5 py-4 last:border-b-0 hover:bg-surface-2"
            >
              <ProjectIcon project={r.project} size="sm" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    to={`/keys/${r.key.id}/edit`}
                    className="font-mono text-sm font-medium break-all text-brand-strong"
                  >
                    <Highlight text={r.key.key} query={keyQuery} />
                  </Link>
                  <span className="text-xs text-muted-foreground">{t("search.in")}</span>
                  <Link to={`/projects/${r.project.id}`} className="text-xs font-semibold">
                    {r.project.name}
                  </Link>
                  {r.key.isNew && (
                    <Pill tone="new" size="xs">
                      {t("search.newBadge")}
                    </Pill>
                  )}
                </div>
                {r.texts.slice(0, MAX_LANGUAGE_MATCHES).map((m) => (
                  <div key={m.languageCode} className="mt-1.5 flex gap-2.5 text-sm text-text-2">
                    <span
                      className="min-w-[3.5em] pt-0.5 font-mono text-xs font-semibold text-muted-foreground"
                      title={languageName.get(m.languageCode)}
                    >
                      {m.languageCode}
                    </span>
                    <span lang={m.languageCode} dir="auto">
                      <Highlight text={m.text} query={textQuery} />
                    </span>
                  </div>
                ))}
                {r.texts.length > MAX_LANGUAGE_MATCHES && (
                  <div className="mt-1 text-xs text-muted-foreground">
                    {t("search.moreLanguages", {
                      count: r.texts.length - MAX_LANGUAGE_MATCHES,
                    })}
                  </div>
                )}
              </div>
              <Button asChild variant="outline" size="sm" className="self-start">
                <Link to={`/keys/${r.key.id}/edit`}>
                  <Pencil /> {t("search.edit")}
                </Link>
              </Button>
            </div>
          );
        })}
        <Pager
          page={data.page}
          pageCount={pageCount}
          pageSize={PAGE_SIZE}
          shown={items.length}
          total={total}
          noun={t("search.resultsNoun")}
          onPageChange={changePage}
        />
      </>
    );
  };

  return (
    <>
      <PageHeader title={t("search.title")} />

      <form onSubmit={submit} className="mb-4">
        <SearchInput
          autoFocus
          key={query}
          name="q"
          defaultValue={query}
          placeholder={t("search.placeholder")}
          className="mb-3"
        />
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            value={scope}
            onChange={changeScope}
            options={SEARCH_SCOPES.map((value) => ({
              value,
              label: t(`search.scope.${value}`),
            }))}
          />
          <Select
            value={projectId ? String(projectId) : SEARCH_FILTER_ALL}
            onValueChange={changeProject}
          >
            <SelectTrigger className="h-9! w-auto bg-card" aria-label={t("search.projectLabel")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SEARCH_FILTER_ALL}>{t("search.allProjects")}</SelectItem>
              {projects.map((p) => (
                <SelectItem key={p.id} value={String(p.id)}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={lang ?? SEARCH_FILTER_ALL} onValueChange={changeLang}>
            <SelectTrigger className="h-9! w-auto bg-card" aria-label={t("search.languageLabel")}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SEARCH_FILTER_ALL}>{t("search.allLanguages")}</SelectItem>
              {languages.map((l) => (
                <SelectItem key={l.code} value={l.code}>
                  {l.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" className="ml-auto h-9">
            {t("search.submit")}
          </Button>
        </div>
      </form>

      <Panel>{renderResults()}</Panel>
    </>
  );
}
