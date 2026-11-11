import { STALE_TIME } from "@/constants/common";
import { queryKeys } from "@/constants/query_keys";
import { useLocalizerApi } from "@/hooks/use_localizer_api";
import type { ApiQueryMeta } from "@/types/api";
import type { Dashboard } from "@/types/dashboard";
import { useQuery } from "@tanstack/react-query";

export function useDashboard(meta?: ApiQueryMeta) {
  const { request } = useLocalizerApi();
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: ({ signal }) => request<Dashboard>({ method: "GET", path: "dashboard", signal }),
    meta,
    staleTime: STALE_TIME,
  });
}
