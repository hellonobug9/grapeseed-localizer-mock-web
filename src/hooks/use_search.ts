import { queryKeys } from "@/constants/query_keys";
import { useLocalizerApi } from "@/hooks/use_localizer_api";
import type { ApiQueryMeta } from "@/types/api";
import type { SearchQuery, SearchResponse } from "@/types/search";
import { keepPreviousData, useQuery } from "@tanstack/react-query";

export function useSearch(query: SearchQuery, meta?: ApiQueryMeta) {
  const { request } = useLocalizerApi();
  return useQuery({
    queryKey: queryKeys.search.list(query),
    queryFn: ({ signal }) =>
      request<SearchResponse>({
        method: "GET",
        path: "search",
        queryParams: query,
        signal,
      }),
    enabled: query.q.length > 0,
    meta,
    placeholderData: keepPreviousData,
  });
}
