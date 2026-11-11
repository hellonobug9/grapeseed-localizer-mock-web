import { mockRequest } from "@/data/mock_api";

// This build has no backend: requests are served in memory by data/mock_api.
// The signature matches the real hook, so the query hooks stay unchanged.
const MOCK_LATENCY_MS = 250;

type RequestOptions<TBody> = {
  method: string;
  path: string;
  queryParams?: object;
  body?: TBody;
  headers?: Record<string, string>;
  signal?: AbortSignal;
};

const abortError = () => new DOMException("The operation was aborted.", "AbortError");

// Short delay so loading states show as they do against the real API.
function delay(signal: AbortSignal | undefined) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) return reject(abortError());
    const timer = setTimeout(resolve, MOCK_LATENCY_MS);
    signal?.addEventListener(
      "abort",
      () => {
        clearTimeout(timer);
        reject(abortError());
      },
      { once: true },
    );
  });
}

export function useLocalizerApi() {
  async function request<TResponse, TBody = unknown>({
    method,
    path,
    queryParams,
    body,
    signal,
  }: RequestOptions<TBody>): Promise<TResponse> {
    await delay(signal);
    return mockRequest({
      method,
      path,
      queryParams: queryParams as Record<string, unknown> | undefined,
      body,
    }) as TResponse;
  }

  return { request };
}
