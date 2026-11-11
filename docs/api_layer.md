# API layer — fe_core network + React Query

> **In this mock repo** there is no fe_core and no backend: `hooks/use_localizer_api.ts` hands every request to `data/mock_api.ts`, and `lib/auth.ts` / `.env` are gone. The rest of this page describes upstream; React Query, error handling and the feature hooks work the same here.

How `grapeseed-localizer-web` talks to the Localizer API, for AI agents and developers.
**Status: everything (including the Languages list) still reads mocks** (`src/data/`).

- All endpoints live under `/api/...`.

## Decisions

- **HTTP client: fe_core `createApiService`** (native `fetch`). It already attaches the OIDC Bearer token, `x-gl-*` headers, retries a 401 after a silent token renew, and resolves the base URL through the tenant registry. No axios.
- **Server state: `@tanstack/react-query`.** `requestAsync` from fe_core is built for `queryFn` / `mutationFn`. Aborts reject with `AbortError`; React Query treats it as cancellation only when its own `signal` aborted. fe_core also aborts an in-flight request when the same hook sends one with the same method, path, params and body, and that `AbortError` reaches React Query as a normal error (the toast handler skips it).
- **Loading: `components/global_loading.tsx`** blocks the whole app (pointer + keyboard) while any mutation runs, spinner after 300 ms. A mutation opts out with `meta: { blocking: false }` (background saves, long uploads). Queries do not block; pages show their own loading on `isPending`.
- **Error UI: `sonner` toasts**, one global handler. Field errors show inline in forms.

## Layers

| File                            | Responsibility                                                                                                                                                  |
| ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.env` → `VITE_LOCALIZER_API`   | API host per environment                                                                                                                                        |
| `lib/auth.ts`                   | Registers service key `'localizer'` → `${VITE_LOCALIZER_API}/api` in `initTenantRegistry`                                                                       |
| `hooks/use_localizer_api.ts`    | `useLocalizerApi().request<T>()` on service `'localizer'`: adds `Accept-Language`, unwraps `Result<T>`, throws `LocalizerApiError`, rethrows `AbortError` as-is |
| `lib/api_error.ts`              | `LocalizerApiError { status, code, description, details, traceId, firstDetail }`, `normalizeRequestError`, `unwrapResult`, `isAbortError`, `getFieldErrors`     |
| `lib/query_client.ts`           | Query retry only on status `0` / 5xx (up to 2), mutations never retry, global `onError` unless `meta.silent`, passes `meta.errorMessage` on                     |
| `lib/handle_api_error.ts`       | Status → `errors.*` toast; 4xx shows the first `details` message or `description`; shows `traceId` with a copy button; deduped by `status:message`              |
| `types/api.ts`                  | `ApiErrorBody`, `ApiResult<T>`, typed `meta` (`silent`, `errorMessage`, `blocking`)                                                                             |
| `components/global_loading.tsx` | Overlay while a mutation without `meta.blocking: false` runs; Dialog / Sheet ignore clicks on it via `lib/overlay_events.ts`                                    |
| `constants/query_keys.ts`       | `queryKeys` — one entry per domain, e.g. `queryKeys.languages.all`                                                                                              |
| `hooks/use_<feature>.ts`        | `useQuery` / `useMutation` per endpoint, e.g. `hooks/use_languages.ts`                                                                                          |
| Pages / components              | Call feature hooks only — never `useLocalizerApi` or `fetch` directly                                                                                           |

React Query defaults are otherwise untouched (`staleTime` 0, refetch on window focus).

## Backend response shapes

- Most endpoints wrap the body in `Result<T>`: `{ isSuccess, isFailure, value }` (failures always come back as 4xx / 5xx). Some return the DTO directly (e.g. `GET /api/users/me`, `GET /api/projects/languages`). `unwrapResult` handles both, so feature code always gets `T`.
- Error body is always `{ code, description, details, traceId }`. `details` is `Record<field, string[]>` or `null`, e.g. `{ "code": ["A language with this code already exists."] }`.
- `401` has an empty body.

## Error mapping

| Case                                                             | `LocalizerApiError.status` | Toast                                                                  | Retry (queries) |
| ---------------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------- | --------------- |
| No response (offline, DNS, CORS)                                 | `0`                        | `errors.network`                                                       | up to 2         |
| HTTP 401 (renew failed → OIDC `onSessionLost` handles sign-in)   | `401`                      | none                                                                   | no              |
| HTTP 4xx                                                         | 4xx                        | first `details` message, else `description`, else the status key below | no              |
| HTTP 5xx                                                         | 5xx                        | `errors.server` (BE `description` unused)                              | up to 2         |
| Aborted (superseded by an identical request, e.g. double submit) | —                          | none                                                                   | no              |
| Not a `LocalizerApiError` (bad JSON, code bug…)                  | —                          | `errors.unknown`, not deduped                                          | no              |

Every `LocalizerApiError` toast with a `traceId` shows it under the message with a copy button, so users can send it to support.

4xx status keys: `400` / `422` → `errors.validation`, `403` → `errors.forbidden`, `404` → `errors.notFound`, `409` → `errors.conflict`, any other 4xx → `errors.unknown`.

The global handler also fires when a background refetch fails (e.g. on window focus), so a toast can show while the page still has its old data. Set `meta: { silent: true }` on queries where that is noise.

### Per-request message

Set `meta.errorMessage` on a query or mutation to override the toast. It is either an already-translated string, or a function `(err: LocalizerApiError) => string | undefined`. When the function returns `undefined`, the toast falls back to the table above. `LocalizerApiError` toasts are deduped by `status:message`.

```ts
useMutation({
  mutationFn: ...,
  meta: {
    errorMessage: (err) => (err.status === 409 ? t('languages.deleteConflict') : undefined),
  },
})
```

A function is only called for a `LocalizerApiError`. A string also replaces the toast for errors that are not a `LocalizerApiError`.

## Per-feature pattern

1. Types from Swagger / `docs/api/drafts/<screen>.md` into `types/<domain>.ts`.
2. Add the domain's keys to `queryKeys` in `constants/query_keys.ts`, e.g. `languages.all`, `projects.detail(id)`.
3. `hooks/use_<feature>.ts`:

```ts
export function useDashboard() {
  const { request } = useLocalizerApi();
  return useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: ({ signal }) => request<Dashboard>({ path: "dashboard", signal }),
  });
}

function useInvalidateLanguages() {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({ queryKey: queryKeys.languages.all });
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
```

Request types go in `types/<domain>.ts` next to the entity (e.g. `CreateLanguageRequest`, `UpdateLanguageRequest`). Path params go through `encodeURIComponent`.

4. In the page, replace the mock import with the hook; show a loading state on `isPending` and an `EmptyState` for empty lists.
5. A form that shows field errors itself sets `meta: { silent: true }` on its mutation and, in the `mutate` call's `onError`, maps `getFieldErrors(err)` (BE field names camel-cased, first message per field) onto its inputs; when none match a form field it falls back to `handleApiError(err)`. Disable the form buttons on `isPending`.
6. A `ConfirmDialog` action passes an async `onConfirm` that awaits `mutation.mutateAsync(...)`: the dialog shows its pending state until the promise settles and closes only on success (the error toast comes from the global handler).
7. Delete the mock from `src/data/` once no page uses it.
