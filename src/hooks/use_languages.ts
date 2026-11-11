import { STALE_TIME } from "@/constants/common";
import { SOURCE_LANGUAGE } from "@/constants/language";
import { queryKeys } from "@/constants/query_keys";
import { USER_STATUS_BY_ID } from "@/constants/user";
import { useLocalizerApi } from "@/hooks/use_localizer_api";
import type { ApiQueryMeta } from "@/types/api";
import type {
  CreateLanguageRequest,
  Language,
  LanguageOverviewItem,
  LanguageOverviewItemResponse,
  LanguageProjectProgress,
  UpdateLanguageRequest,
} from "@/types/language";
import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

type LocalizerRequest = ReturnType<typeof useLocalizerApi>["request"];

function languagesQueryOptions(request: LocalizerRequest) {
  return queryOptions({
    queryKey: queryKeys.languages.all,
    queryFn: ({ signal }) => request<Language[]>({ method: "GET", path: "languages", signal }),
    staleTime: STALE_TIME,
  });
}

export function useLanguages(meta?: ApiQueryMeta) {
  const { request } = useLocalizerApi();
  return useQuery({ ...languagesQueryOptions(request), meta });
}

function toLanguageOverview(items: LanguageOverviewItemResponse[]): LanguageOverviewItem[] {
  return items.map((item) => ({
    ...item,
    translators: item.translators.map((u) => ({
      ...u,
      status: USER_STATUS_BY_ID[u.status],
    })),
  }));
}

export function useLanguagesOverview(meta?: ApiQueryMeta) {
  const { request } = useLocalizerApi();
  return useQuery({
    queryKey: queryKeys.languages.overview,
    queryFn: async ({ signal }) =>
      toLanguageOverview(
        await request<LanguageOverviewItemResponse[]>({
          method: "GET",
          path: "languages/overview",
          signal,
        }),
      ),
    meta,
    staleTime: STALE_TIME,
  });
}

export function useLanguageProjects(code: string, meta?: ApiQueryMeta) {
  const { request } = useLocalizerApi();
  return useQuery({
    queryKey: queryKeys.languages.projects(code),
    queryFn: ({ signal }) =>
      request<LanguageProjectProgress[]>({
        method: "GET",
        path: `languages/${encodeURIComponent(code)}/projects`,
        signal,
      }),
    meta,
    staleTime: STALE_TIME,
  });
}

function toLanguageCatalog(languages: Language[]) {
  return {
    languages,
    source: languages.find((l) => l.code === SOURCE_LANGUAGE),
    targets: languages.filter((l) => l.code !== SOURCE_LANGUAGE),
    names: new Map(languages.map((l) => [l.code, l.name])),
  };
}

const EMPTY_LANGUAGE_CATALOG = toLanguageCatalog([]);

export function useLanguageCatalog() {
  const { request } = useLocalizerApi();
  const { data = EMPTY_LANGUAGE_CATALOG } = useQuery({
    ...languagesQueryOptions(request),
    meta: { silent: true },
    select: toLanguageCatalog,
  });
  return data;
}

function useInvalidateLanguages() {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.languages.all }),
      queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
    ]);
}

export function useCreateLanguage() {
  const { request } = useLocalizerApi();
  const invalidate = useInvalidateLanguages();
  return useMutation({
    mutationFn: (body: CreateLanguageRequest) =>
      request<void, CreateLanguageRequest>({
        method: "POST",
        path: "languages",
        body,
      }),
    onSuccess: invalidate,
  });
}

export function useUpdateLanguage() {
  const { request } = useLocalizerApi();
  const invalidate = useInvalidateLanguages();
  return useMutation({
    mutationFn: ({ code, ...body }: UpdateLanguageRequest & { code: string }) =>
      request<void, UpdateLanguageRequest>({
        method: "PUT",
        path: `languages/${encodeURIComponent(code)}`,
        body,
      }),
    onSuccess: invalidate,
  });
}

export function useDeleteLanguage() {
  const { request } = useLocalizerApi();
  const invalidate = useInvalidateLanguages();
  return useMutation({
    mutationFn: (code: string) =>
      request<void>({
        method: "DELETE",
        path: `languages/${encodeURIComponent(code)}`,
      }),
    onSuccess: invalidate,
  });
}
