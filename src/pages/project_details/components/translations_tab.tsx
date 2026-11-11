import { ConfirmDialog } from "@/components/confirm_dialog";
import { DataTable, Td, Th, Tr } from "@/components/data_table";
import { EmptyState } from "@/components/empty_state";
import { Highlight } from "@/components/highlight";
import { Pager } from "@/components/pager";
import { PanelToolbar } from "@/components/panel";
import { SearchInput } from "@/components/search_input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { KeyFormat } from "@/constants/key_format";
import { SOURCE_LANGUAGE } from "@/constants/language";
import { PAGE_SIZE } from "@/constants/pagination";
import { getLanguage, isNewKey } from "@/data/mock_data";
import { keysOf, languageStatsFor, targetLanguagesOf } from "@/data/stats";
import { formatExact, formatPercent, formatRelative } from "@/lib/format";
import { isUntranslated } from "@/lib/translation";
import { cn } from "@/lib/utils";
import { ModulesNav } from "@/pages/project_details/components/modules_nav";
import { HtmlTranslationDialog } from "@/pages/project_details/components/html_translation_drawer";
import { MissingText, TranslationCell } from "@/pages/project_details/components/translation_cell";
import { TranslationValuePreview } from "@/pages/project_details/components/translation_value_preview";
import type { ProjectInfo } from "@/types/project";
import type { ModuleStat } from "@/types/stats";
import type { TranslationKey } from "@/types/translation_key";
import {
  Clipboard,
  Ellipsis,
  FolderOpen,
  Inbox,
  Languages,
  Layers,
  Pencil,
  Save,
  Trash,
  X,
} from "lucide-react";
import { useEffect, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router";
import { toast } from "sonner";

export type KeyStatus = "all" | "missing" | "translated" | "new";

export type TranslationFilters = {
  lang?: string;
  module?: string;
  status: KeyStatus;
  query: string;
  page: number;
};

type TranslationsTabProps = {
  project: ProjectInfo;
  filters: TranslationFilters;
  onFiltersChange: (next: Partial<TranslationFilters>) => void;
};

const STATUS_OPTIONS: KeyStatus[] = ["all", "missing", "translated", "new"];

function middleTruncate(value: string, maxLength = 56) {
  if (value.length <= maxLength) return value;
  const startLength = Math.ceil((maxLength - 1) * 0.6);
  const endLength = maxLength - startLength - 1;
  return `${value.slice(0, startLength)}…${value.slice(-endLength)}`;
}

export function TranslationsTab({ project, filters, onFiltersChange }: TranslationsTabProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { lang, module, status, query, page } = filters;
  const moduleLabel = (name: string) => {
    const labelKey = project.moduleLabelKeys?.[name];
    return labelKey ? (t(labelKey as never) as string) : name;
  };
  const [draftQuery, setDraftQuery] = useState(query);
  const [syncedQuery, setSyncedQuery] = useState(query);
  // Saved edits stand in for persisted API data. Pending edits can be committed
  // per row or together as a batch.
  const [savedEdits, setSavedEdits] = useState<Record<string, string>>({});
  const [pendingEdits, setPendingEdits] = useState<Record<string, string>>({});
  const [editingIds, setEditingIds] = useState<Set<number>>(() => new Set());
  const [editingLang, setEditingLang] = useState(lang);
  const [editingLong, setEditingLong] = useState<TranslationKey | null>(null);
  const [deleting, setDeleting] = useState<TranslationKey | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState<{
    then?: () => void;
  } | null>(null);
  const pendingCount = Object.keys(pendingEdits).length;

  if (query !== syncedQuery) {
    setSyncedQuery(query);
    setDraftQuery(query);
  }

  if (lang !== editingLang) {
    setEditingLang(lang);
    setEditingIds(new Set());
    setEditingLong(null);
  }

  useEffect(() => {
    if (!pendingCount) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [pendingCount]);

  const targets = targetLanguagesOf(project);
  const languageStats = languageStatsFor([project]);
  const selectedLang = lang ? getLanguage(lang) : undefined;
  const sourceLang = getLanguage(SOURCE_LANGUAGE);
  const projectKeys = keysOf(project.id);
  const editKey = (key: TranslationKey, code: string) => `${key.id}:${code}`;
  const savedValueOf = (key: TranslationKey, code: string) =>
    savedEdits[editKey(key, code)] ?? key.values[code];
  const valueOf = (key: TranslationKey, code: string) =>
    pendingEdits[editKey(key, code)] ?? savedValueOf(key, code);
  const missingIn = (key: TranslationKey, code: string) => !valueOf(key, code);
  // Filters and counts use saved values, like the API will, so a row doesn't
  // disappear from a filtered list while it's being typed in.
  const savedMissingIn = (key: TranslationKey, code: string) =>
    isUntranslated(savedValueOf(key, code), savedValueOf(key, SOURCE_LANGUAGE));

  const modules: ModuleStat[] = project.modules.map((name) => {
    const keys = projectKeys.filter((k) => k.module === name);
    return {
      name,
      total: keys.length,
      newCount: keys.filter(isNewKey).length,
      missing: lang ? keys.filter((k) => savedMissingIn(k, lang)).length : 0,
    };
  });
  const activeModule = modules.find((m) => m.name === module);
  const hasFilters = !!query.trim() || status !== "all";
  const showKeys = !!module || hasFilters;

  const q = query.trim().toLowerCase();
  const filtered = projectKeys
    .filter((k) => !module || k.module === module)
    .filter(
      (k) =>
        !q ||
        k.key.toLowerCase().includes(q) ||
        [SOURCE_LANGUAGE, lang].some(
          (code) => code && savedValueOf(k, code)?.toLowerCase().includes(q),
        ),
    )
    .filter((k) => {
      if (status === "missing") return !!lang && savedMissingIn(k, lang);
      if (status === "translated") return !lang || !savedMissingIn(k, lang);
      if (status === "new") return isNewKey(k);
      return true;
    })
    .sort((a, b) => Number(isNewKey(b)) - Number(isNewKey(a)) || a.key.localeCompare(b.key));

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(Math.max(page, 1), pageCount);
  const pageKeys = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const submitSearch = (e: FormEvent) => {
    e.preventDefault();
    onFiltersChange({ query: draftQuery, page: 1 });
  };

  const stageEdit = (key: TranslationKey, value: string) => {
    if (!lang || !selectedLang) return;
    const id = editKey(key, lang);
    const unchanged = value.trim() === (savedValueOf(key, lang) ?? "");
    setPendingEdits((current) => {
      if (unchanged) {
        const { [id]: _discarded, ...remaining } = current;
        return remaining;
      }
      return { ...current, [id]: value };
    });
  };

  const closeEditor = (id: number) =>
    setEditingIds((current) => {
      const next = new Set(current);
      next.delete(id);
      return next;
    });

  // Stands in for PUT /api/projects/{id}/translations/{languageCode}, one
  // request per language. Changes the API reports as failed must stay pending,
  // and a change typed in after the request was sent stays pending too.
  const persist = (changes: Record<string, string>) => {
    const texts = Object.fromEntries(
      Object.entries(changes).map(([id, text]) => [id, text.trim()]),
    );
    setSavedEdits((current) => ({ ...current, ...texts }));
    setPendingEdits((current) =>
      Object.fromEntries(Object.entries(current).filter(([id, text]) => text.trim() !== texts[id])),
    );
  };

  const discardEdit = (key: TranslationKey) => {
    if (!lang) return;
    const id = editKey(key, lang);
    setPendingEdits((current) => {
      const { [id]: _discarded, ...remaining } = current;
      return remaining;
    });
  };

  const saveEdit = (key: TranslationKey, value: string) => {
    if (!lang || !selectedLang) return;
    const id = editKey(key, lang);
    closeEditor(key.id);
    if (!(id in pendingEdits)) return;
    persist({ [id]: value });
  };

  const saveLongEdit = (key: TranslationKey, value: string) => {
    if (!lang || !selectedLang) return;
    const id = editKey(key, lang);
    if (value.trim() === (savedValueOf(key, lang) ?? "")) {
      discardEdit(key);
      return;
    }
    persist({ [id]: value });
  };

  const discardAll = () => {
    setPendingEdits({});
    setEditingIds(new Set());
  };

  const saveAll = () => {
    if (!pendingCount) return;
    persist(pendingEdits);
    setEditingIds(new Set());
    toast.success(t("projectDetails.translations.savedAll", { count: pendingCount }));
  };

  // Leaving the tab's state drops pending changes, so ask first.
  const confirmIfPending = (then: () => void) => {
    if (pendingCount) setConfirmDiscard({ then });
    else then();
  };

  const openKeyEditor = (key: TranslationKey) =>
    confirmIfPending(() => navigate(`/keys/${key.id}/edit`));

  const copyTranslation = (key: TranslationKey, code: string) => {
    navigator.clipboard?.writeText(valueOf(key, code) ?? "");
    toast.success(
      t("projectDetails.translations.copiedTranslation", {
        language: getLanguage(code).name,
        key: key.key,
      }),
    );
  };

  const startEdit = (key: TranslationKey) => {
    // Template keys (HTML or plain-text SMS) are edited in the dialog with a preview.
    if ((key.format === KeyFormat.LongText || key.name) && lang && selectedLang)
      setEditingLong(key);
    else if (key.format === KeyFormat.LongText || !lang) openKeyEditor(key);
    else setEditingIds((current) => new Set(current).add(key.id));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[230px_minmax(0,1fr)]">
      <ModulesNav
        modules={modules}
        active={module}
        moduleLabelKeys={project.moduleLabelKeys}
        onSelect={(name) => onFiltersChange({ module: name, query: "", page: 1 })}
      />

      <div className={cn("min-w-0", pendingCount > 0 && "pb-20")}>
        <PanelToolbar>
          <form onSubmit={submitSearch} className="flex min-w-[220px] flex-1">
            <SearchInput
              value={draftQuery}
              onChange={(e) => setDraftQuery(e.target.value)}
              placeholder={
                module
                  ? t("projectDetails.translations.searchIn", { module: moduleLabel(module) })
                  : t("projectDetails.translations.searchAll")
              }
            />
          </form>
          {targets.length > 0 && (
            <Select
              value={lang}
              onValueChange={(value) =>
                confirmIfPending(() => onFiltersChange({ lang: value, page: 1 }))
              }
            >
              <SelectTrigger
                className="h-9! w-auto bg-card"
                aria-label={t("projectDetails.translations.languageLabel")}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {targets.map((code) => {
                  const l = getLanguage(code);
                  const stat = languageStats.find((s) => s.language.code === code);
                  return (
                    <SelectItem key={code} value={code}>
                      {l.name} {stat && `(${formatPercent(stat.coverage)})`}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
          <Select
            value={status}
            onValueChange={(value) => onFiltersChange({ status: value as KeyStatus, page: 1 })}
          >
            <SelectTrigger
              className="h-9! w-auto bg-card"
              aria-label={t("projectDetails.translations.statusLabel")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((value) => (
                <SelectItem key={value} value={value}>
                  {t(`projectDetails.translations.status.${value}`)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {hasFilters && (
            <Button
              variant="link"
              size="sm"
              className="text-muted-foreground"
              onClick={() => onFiltersChange({ query: "", status: "all", page: 1 })}
            >
              {t("projectDetails.translations.clearFilters")}
            </Button>
          )}
        </PanelToolbar>

        {showKeys && (
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 border-b bg-surface-2 px-5 py-2.5 text-sm">
            {activeModule ? (
              <>
                <span className="flex items-center gap-1.5">
                  <FolderOpen className="size-4 text-brand" />{" "}
                  <b>{moduleLabel(activeModule.name)}</b>
                </span>
                <span className="text-muted-foreground">
                  {t("common.keyCount", { count: activeModule.total })}
                  {selectedLang &&
                    ` · ${t("projectDetails.translations.untranslatedIn", { count: activeModule.missing, language: selectedLang.name })}`}
                </span>
                <Button
                  variant="link"
                  size="sm"
                  className="ml-auto h-auto p-0 text-muted-foreground"
                  onClick={() => onFiltersChange({ module: undefined, page: 1 })}
                >
                  <X /> {t("projectDetails.translations.clearModule")}
                </Button>
              </>
            ) : (
              <>
                <span className="flex items-center gap-1.5">
                  <Layers className="size-4 text-brand" />{" "}
                  <b>{t("projectDetails.translations.allModules")}</b>
                </span>
                <span className="text-muted-foreground">
                  {t("projectDetails.translations.pickModule")}
                </span>
              </>
            )}
          </div>
        )}

        {!showKeys ? (
          <EmptyState icon={FolderOpen} title={t("projectDetails.translations.selectModule")}>
            {t("projectDetails.translations.selectModuleHint", {
              count: modules.length,
            })}
          </EmptyState>
        ) : pageKeys.length === 0 ? (
          <EmptyState icon={Inbox} title={t("projectDetails.translations.noMatch")}>
            {t("projectDetails.translations.noMatchHint")}
          </EmptyState>
        ) : (
          <>
            <DataTable>
              <thead>
                <tr>
                  <Th className="w-[32%] min-w-[340px]">
                    {t("projectDetails.translations.columns.key")}
                  </Th>
                  <Th>
                    {sourceLang.name}{" "}
                    <span className="font-normal lowercase">
                      {t("projectDetails.translations.columns.source")}
                    </span>
                  </Th>
                  {selectedLang && <Th>{selectedLang.name}</Th>}
                  <Th>{t("projectDetails.translations.columns.updated")}</Th>
                  <Th />
                </tr>
              </thead>
              <tbody>
                {pageKeys.map((k) => {
                  const isLong = k.format === KeyFormat.LongText;
                  const isTemplate = !!k.name;
                  const editing = editingIds.has(k.id);
                  return (
                    <Tr
                      key={k.id}
                      className={cn("group/row", editing && "bg-brand-soft hover:bg-brand-soft")}
                    >
                      <Td>
                        <div className="flex w-0 min-w-full items-center text-sm font-medium text-brand-strong">
                          <span
                            className={cn("min-w-0", isTemplate ? "truncate" : "break-all")}
                            title={isTemplate ? k.key : undefined}
                          >
                            <Highlight
                              text={isTemplate ? middleTruncate(k.key) : k.key}
                              query={query}
                            />
                          </span>
                        </div>
                        <div
                          className="mt-0.5 min-w-0 truncate text-xs text-muted-foreground"
                          title={isTemplate ? k.name : k.description}
                        >
                          {isTemplate ? k.name : k.description}
                        </div>
                      </Td>
                      <Td className="max-w-[360px]">
                        <TranslationValuePreview
                          value={valueOf(k, SOURCE_LANGUAGE)}
                          lang={SOURCE_LANGUAGE}
                          query={query}
                          html={isLong}
                        />
                      </Td>
                      {selectedLang && lang && (
                        <Td
                          className="max-w-[360px]"
                          onDoubleClick={() => !editing && startEdit(k)}
                        >
                          <div className="min-w-0">
                            {isLong ? (
                              missingIn(k, lang) ? (
                                <MissingText />
                              ) : (
                                <TranslationValuePreview
                                  value={valueOf(k, lang)}
                                  lang={lang}
                                  query={query}
                                  html
                                />
                              )
                            ) : (
                              <TranslationCell
                                value={valueOf(k, lang)}
                                query={query}
                                lang={lang}
                                langName={selectedLang.name}
                                source={savedValueOf(k, SOURCE_LANGUAGE) ?? ""}
                                editing={editing}
                                onChange={(value) => stageEdit(k, value)}
                                onSave={(value) => saveEdit(k, value)}
                                onCancel={() => {
                                  discardEdit(k);
                                  closeEditor(k.id);
                                }}
                              />
                            )}
                          </div>
                        </Td>
                      )}
                      <Td className="whitespace-nowrap">
                        <div title={formatExact(k.updatedAt)}>{formatRelative(k.updatedAt)}</div>
                        <div className="text-xs text-muted-foreground">{k.updatedBy}</div>
                      </Td>
                      <Td className="text-right whitespace-nowrap">
                        <Button
                          variant="outline"
                          size="icon-sm"
                          title={t("projectDetails.translations.edit")}
                          aria-label={t("projectDetails.translations.edit")}
                          onClick={() => startEdit(k)}
                          className="text-text-2 hover:border-brand-line hover:bg-brand-soft hover:text-brand-strong"
                        >
                          <Pencil className="size-3.5" strokeWidth={1.5} />
                        </Button>{" "}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon-sm"
                              aria-label={t("projectDetails.translations.more")}
                              className="text-text-2 hover:border-brand-line hover:bg-brand-soft hover:text-brand-strong"
                            >
                              <Ellipsis className="size-3.5" strokeWidth={1.5} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40">
                            {/* <DropdownMenuItem
                              onSelect={() => {
                                navigator.clipboard?.writeText(k.key)
                                toast.success(t('projectDetails.translations.copied', { key: k.key }))
                              }}
                            >
                              <Clipboard /> {t('projectDetails.translations.copyKey')}
                            </DropdownMenuItem> */}
                            <DropdownMenuItem onSelect={() => openKeyEditor(k)}>
                              <Languages /> {t("projectDetails.translations.translate")}
                            </DropdownMenuItem>
                            {selectedLang && lang && !missingIn(k, lang) && (
                              <DropdownMenuItem onSelect={() => copyTranslation(k, lang)}>
                                <Clipboard /> {t("projectDetails.translations.copyTranslation")}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem variant="destructive" onSelect={() => setDeleting(k)}>
                              <Trash /> {t("projectDetails.translations.deleteKey")}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </Td>
                    </Tr>
                  );
                })}
              </tbody>
            </DataTable>
            <Pager
              page={currentPage}
              pageCount={pageCount}
              pageSize={PAGE_SIZE}
              shown={pageKeys.length}
              total={filtered.length}
              noun={t("projectDetails.translations.keysNoun")}
              onPageChange={(p) => onFiltersChange({ page: p })}
            />
          </>
        )}
      </div>
      <ConfirmDialog
        open={!!deleting}
        onOpenChange={(open) => !open && setDeleting(null)}
        title={t("projectDetails.translations.deleteDialog.title", {
          key: deleting?.key,
        })}
        confirmLabel={t("projectDetails.translations.deleteKey")}
        onConfirm={() =>
          toast.success(
            t("projectDetails.translations.deleted", {
              key: deleting?.key,
            }),
          )
        }
      />
      <ConfirmDialog
        open={!!confirmDiscard}
        onOpenChange={(open) => !open && setConfirmDiscard(null)}
        title={t("projectDetails.translations.discardDialog.title", {
          count: pendingCount,
        })}
        confirmLabel={t("projectDetails.translations.discardDialog.confirm")}
        onConfirm={() => {
          discardAll();
          confirmDiscard?.then?.();
        }}
      >
        {t("projectDetails.translations.discardDialog.warning")}
      </ConfirmDialog>
      {editingLong && lang && selectedLang && (
        <HtmlTranslationDialog
          key={`${editingLong.id}:${lang}`}
          translationKey={editingLong}
          html={editingLong.format === KeyFormat.LongText}
          language={selectedLang}
          source={savedValueOf(editingLong, SOURCE_LANGUAGE) ?? ""}
          value={savedValueOf(editingLong, lang)}
          open
          onOpenChange={(open) => !open && setEditingLong(null)}
          onSave={(value) => saveLongEdit(editingLong, value)}
        />
      )}
      {pendingCount > 0 && (
        <div className="fixed right-4 bottom-4 left-4 z-40 mx-auto flex max-w-2xl flex-wrap items-center gap-3 rounded-xl border bg-popover px-4 py-3 shadow-lg sm:left-auto">
          <span role="status" className="text-sm font-medium">
            {t("projectDetails.translations.pendingChanges", {
              count: pendingCount,
            })}
          </span>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setConfirmDiscard({})}>
              {t("projectDetails.translations.discardAll")}
            </Button>
            <Button size="sm" onClick={saveAll}>
              <Save /> {t("projectDetails.translations.saveAll")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
