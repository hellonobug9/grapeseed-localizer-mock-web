import { isAbortError, LocalizerApiError, NETWORK_ERROR_STATUS } from "@/lib/api_error";
import i18n from "@/locales/i18n";
import type { ApiErrorMessage } from "@/types/api";
import { toast } from "sonner";

const UNAUTHORIZED_STATUS = 401;

const ERROR_KEY_BY_STATUS = {
  [NETWORK_ERROR_STATUS]: "errors.network",
  400: "errors.validation",
  403: "errors.forbidden",
  404: "errors.notFound",
  409: "errors.conflict",
  422: "errors.validation",
} as const satisfies Record<number, string>;

function errorKey(status: number) {
  if (status in ERROR_KEY_BY_STATUS)
    return ERROR_KEY_BY_STATUS[status as keyof typeof ERROR_KEY_BY_STATUS];
  return status >= 500 ? "errors.server" : "errors.unknown";
}

function customMessage(err: LocalizerApiError, errorMessage: ApiErrorMessage | undefined) {
  return typeof errorMessage === "function" ? errorMessage(err) : errorMessage;
}

function serverMessage(err: LocalizerApiError) {
  const trustsServer = err.status !== NETWORK_ERROR_STATUS && err.status < 500;
  return trustsServer ? (err.firstDetail ?? err.description) : null;
}

function traceIdToast(traceId: string | null) {
  if (!traceId) return {};
  return {
    description: i18n.t("errors.traceId", { traceId }),
    action: {
      label: i18n.t("errors.copyTraceId"),
      onClick: () => void navigator.clipboard.writeText(traceId),
    },
  };
}

export function handleApiError(err: unknown, errorMessage?: ApiErrorMessage) {
  if (isAbortError(err)) return;
  if (!(err instanceof LocalizerApiError)) {
    toast.error(typeof errorMessage === "string" ? errorMessage : i18n.t("errors.unknown"));
    return;
  }
  //TODO: re-check when integrating api for user&role page
  if (err.status === UNAUTHORIZED_STATUS) return;
  const message =
    customMessage(err, errorMessage) ?? serverMessage(err) ?? i18n.t(errorKey(err.status));
  toast.error(message, { id: `${err.status}:${message}`, ...traceIdToast(err.traceId) });
}
