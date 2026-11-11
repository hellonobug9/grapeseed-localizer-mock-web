import { STALE_TIME } from "@/constants/common";
import { queryKeys } from "@/constants/query_keys";
import { useLocalizerApi } from "@/hooks/use_localizer_api";
import type { ApiQueryMeta } from "@/types/api";
import type {
  CreateProjectRequest,
  CreateProjectResponse,
  ProjectLanguageProgress,
  ProjectListItem,
  ProjectListQuery,
  ProjectsSummary,
} from "@/types/project";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export function useProjects(query: ProjectListQuery = {}, meta?: ApiQueryMeta) {
  const { request } = useLocalizerApi();
  return useQuery({
    queryKey: queryKeys.projects.list(query),
    queryFn: ({ signal }) =>
      request<ProjectListItem[]>({
        method: "GET",
        path: "projects/list",
        queryParams: query,
        signal,
      }),
    meta,
    staleTime: STALE_TIME,
    placeholderData: keepPreviousData,
  });
}

export function useProjectsSummary(meta?: ApiQueryMeta) {
  const { request } = useLocalizerApi();
  return useQuery({
    queryKey: queryKeys.projects.summary,
    queryFn: ({ signal }) =>
      request<ProjectsSummary>({
        method: "GET",
        path: "projects/summary",
        signal,
      }),
    meta,
    staleTime: STALE_TIME,
  });
}

export function useProjectLanguages(projectId: number, meta?: ApiQueryMeta) {
  const { request } = useLocalizerApi();
  return useQuery({
    queryKey: queryKeys.projects.languages(projectId),
    queryFn: ({ signal }) =>
      request<ProjectLanguageProgress[]>({
        method: "GET",
        path: `projects/${projectId}/languages`,
        signal,
      }),
    meta,
    staleTime: STALE_TIME,
  });
}

export function useCreateProject() {
  const { request } = useLocalizerApi();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateProjectRequest) =>
      request<CreateProjectResponse, CreateProjectRequest>({
        method: "POST",
        path: "projects",
        body,
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.projects.all }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({
          queryKey: queryKeys.languages.overview,
        }),
      ]),
  });
}
