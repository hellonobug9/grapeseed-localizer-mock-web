import type { LocalizerApiError } from "@/lib/api_error";

export type ApiErrorBody = {
  code?: string | null;
  description?: string | null;
  details?: Record<string, string[]> | null;
  traceId?: string | null;
};

export type ApiResult<T> = {
  isSuccess: boolean;
  isFailure: boolean;
  value: T;
};

export type ApiErrorMessage = string | ((err: LocalizerApiError) => string | undefined);

export type ApiQueryMeta = {
  silent?: boolean;
  errorMessage?: ApiErrorMessage;
  blocking?: boolean;
};

declare module "@tanstack/react-query" {
  interface Register {
    queryMeta: ApiQueryMeta;
    mutationMeta: ApiQueryMeta;
  }
}
