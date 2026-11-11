import type { ApiErrorBody, ApiResult } from "@/types/api";

export const NETWORK_ERROR_STATUS = 0;

export class LocalizerApiError extends Error {
  readonly status: number;
  readonly code: string | null;
  readonly description: string | null;
  readonly details: Record<string, string[]> | null;
  readonly traceId: string | null;

  constructor(status: number, body: ApiErrorBody = {}) {
    super(body.description ?? `Request failed with status ${status}`);
    this.name = "LocalizerApiError";
    this.status = status;
    this.code = body.code ?? null;
    this.description = body.description ?? null;
    this.details = body.details ?? null;
    this.traceId = body.traceId ?? null;
  }

  get firstDetail(): string | null {
    return Object.values(this.details ?? {}).flat()[0] ?? null;
  }
}

type FetchWrapperError = { status: number; raw: unknown };

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null;

const isFetchWrapperError = (err: unknown): err is FetchWrapperError =>
  isObject(err) && typeof err.status === "number" && "raw" in err;

const isApiResult = (value: unknown): value is ApiResult<unknown> =>
  isObject(value) && typeof value.isSuccess === "boolean" && typeof value.isFailure === "boolean";

export const isAbortError = (err: unknown) =>
  err instanceof DOMException && err.name === "AbortError";

export function normalizeRequestError(err: unknown): unknown {
  if (err instanceof LocalizerApiError) return err;
  if (isFetchWrapperError(err))
    return new LocalizerApiError(err.status, isObject(err.raw) ? err.raw : {});
  if (err instanceof TypeError) return new LocalizerApiError(NETWORK_ERROR_STATUS);
  return err;
}

export function unwrapResult<T>(data: unknown): T {
  return isApiResult(data) ? (data.value as T) : (data as T);
}

export function getFieldErrors(err: unknown): Record<string, string> {
  if (!(err instanceof LocalizerApiError) || !err.details) return {};
  return Object.fromEntries(
    Object.entries(err.details)
      .filter(([, messages]) => messages.length > 0)
      .map(([field, messages]) => [field.charAt(0).toLowerCase() + field.slice(1), messages[0]]),
  );
}
