import { useIsMutating } from "@tanstack/react-query";
import { cn } from "cn";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const SPINNER_DELAY_MS = 300;
const BLOCKED_KEYS = new Set(["Enter", " ", "Escape", "Tab"]);

function blockKeyboard(event: KeyboardEvent) {
  if (!BLOCKED_KEYS.has(event.key)) return;
  event.preventDefault();
  event.stopPropagation();
}

export function GlobalLoading() {
  const { t } = useTranslation();
  const isMutating =
    useIsMutating({ predicate: (mutation) => mutation.meta?.blocking !== false }) > 0;
  const [showSpinner, setShowSpinner] = useState(false);

  useEffect(() => {
    if (!isMutating) return;
    window.addEventListener("keydown", blockKeyboard, true);
    const timer = setTimeout(() => setShowSpinner(true), SPINNER_DELAY_MS);
    return () => {
      window.removeEventListener("keydown", blockKeyboard, true);
      clearTimeout(timer);
      setShowSpinner(false);
    };
  }, [isMutating]);

  if (!isMutating) return null;

  return (
    <div
      data-global-loading
      className={cn(
        "pointer-events-auto fixed inset-0 z-60 grid cursor-progress place-items-center",
        showSpinner && "bg-black/10 animate-in fade-in-0",
      )}
    >
      {showSpinner && (
        <div role="status" className="rounded-xl bg-card p-3 shadow-md ring-1 ring-foreground/10">
          <Loader2 className="size-6 animate-spin text-brand" aria-label={t("common.loading")} />
        </div>
      )}
    </div>
  );
}
