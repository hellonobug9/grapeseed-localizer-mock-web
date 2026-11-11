import { Pill } from "@/components/pill";
import { TENANTS } from "@/constants/template";
import { formatExact } from "@/lib/format";
import type { TemplateContent } from "@/types/template";
import { Check, Clock, Minus } from "lucide-react";
import { useTranslation } from "react-i18next";

// Read-only: copying to tenants is done in the Notification admin.
export function TenantSync({ content }: { content: TemplateContent }) {
  const { t } = useTranslation();

  return (
    <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
      {t("templates.dialog.tenants")}
      {TENANTS.map((tenant) => {
        const syncedAt = content.syncedAt?.[tenant];
        if (!syncedAt) {
          return (
            <Pill key={tenant} size="xs" title={t("templates.sync.notSynced")}>
              <Minus /> {tenant}
            </Pill>
          );
        }
        const outdated = syncedAt < content.updatedAt;
        return (
          <Pill
            key={tenant}
            size="xs"
            tone={outdated ? "warn" : "good"}
            title={
              outdated
                ? t("templates.sync.outdated", { date: formatExact(syncedAt) })
                : t("templates.sync.synced", { date: formatExact(syncedAt) })
            }
          >
            {outdated ? <Clock /> : <Check />} {tenant}
          </Pill>
        );
      })}
    </span>
  );
}
