import { LocalizerApiError, NETWORK_ERROR_STATUS } from "@/lib/api_error";
import { handleApiError } from "@/lib/handle_api_error";
import type { ApiQueryMeta } from "@/types/api";
import { MutationCache, QueryCache, QueryClient } from "@tanstack/react-query";

const MAX_RETRIES = 2;

function shouldRetry(failureCount: number, err: unknown) {
  if (!(err instanceof LocalizerApiError)) return false;
  const isTransient = err.status === NETWORK_ERROR_STATUS || err.status >= 500;
  return isTransient && failureCount < MAX_RETRIES;
}

function reportError(err: unknown, meta: ApiQueryMeta | undefined) {
  if (!meta?.silent) handleApiError(err, meta?.errorMessage);
}

export const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (err, query) => reportError(err, query.meta),
  }),
  mutationCache: new MutationCache({
    onError: (err, _variables, _context, mutation) => reportError(err, mutation.meta),
  }),
  defaultOptions: {
    queries: {
      retry: shouldRetry,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: false,
    },
  },
});
