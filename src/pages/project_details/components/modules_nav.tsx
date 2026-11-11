import { Folder, FolderOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { ModuleStat } from "@/types/stats";

type ModulesNavProps = {
  modules: ModuleStat[];
  active?: string;
  moduleLabelKeys?: Record<string, string>;
  onSelect: (module: string) => void;
};

export function ModulesNav({ modules, active, moduleLabelKeys, onSelect }: ModulesNavProps) {
  const { t } = useTranslation();
  const labelFor = (module: string) => {
    const labelKey = moduleLabelKeys?.[module];
    return labelKey ? (t(labelKey as never) as string) : module;
  };
  return (
    <nav
      aria-label={t("projectDetails.modules.title")}
      className="flex flex-row gap-1.5 overflow-x-auto border-b bg-surface-2 p-3 lg:flex-col lg:gap-0.5 lg:rounded-bl-xl lg:border-r lg:border-b-0"
    >
      <div className="hidden justify-between px-2.5 pt-1.5 pb-2 text-xs font-semibold tracking-widest text-muted-foreground uppercase lg:flex">
        {t("projectDetails.modules.title")} <span>{modules.length}</span>
      </div>
      {modules.map((m) => {
        const isActive = m.name === active;
        const Icon = isActive ? FolderOpen : Folder;
        return (
          <button
            key={m.name}
            type="button"
            onClick={() => onSelect(m.name)}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-none items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-text-2 hover:bg-white hover:text-foreground lg:items-start",
              isActive &&
                "bg-brand-soft text-brand-strong ring-1 ring-brand-muted ring-inset hover:bg-brand-soft hover:text-brand-strong",
            )}
          >
            <Icon
              className={cn(
                "mt-0.5 size-4 shrink-0 text-muted-foreground",
                isActive && "text-brand",
              )}
            />
            <span className="min-w-0">
              <span className="block truncate text-sm font-medium">{labelFor(m.name)}</span>
              <span className="hidden text-xs text-muted-foreground lg:block">
                {m.missing > 0 ? (
                  <span className="text-bad">
                    {t("projectDetails.modules.untranslated", { count: m.missing })}
                  </span>
                ) : (
                  t("projectDetails.modules.allTranslated")
                )}
                {m.newCount > 0 &&
                  ` · ${t("projectDetails.modules.newCount", { count: m.newCount })}`}
              </span>
            </span>
            <span
              className={cn(
                "ml-auto rounded-full bg-muted px-2 text-xs font-semibold text-text-2 tabular-nums",
                isActive && "bg-brand-muted text-brand-strong",
              )}
            >
              {m.total}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
