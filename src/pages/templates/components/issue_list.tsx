import { cn } from "@/lib/utils";
import type { TemplateIssue } from "@/types/template";
import { Info, TriangleAlert } from "lucide-react";
import { useTranslation } from "react-i18next";

export function IssueList({ issues }: { issues: TemplateIssue[] }) {
  const { t } = useTranslation();
  if (issues.length === 0) return null;

  return (
    <div className="mt-1.5 flex flex-col gap-1">
      {issues.map((issue, index) => (
        <p
          key={`${issue.code}-${index}`}
          className={cn(
            "flex items-center gap-1.5 text-xs",
            issue.level === "error" ? "text-bad" : "text-muted-foreground",
          )}
        >
          {issue.level === "error" ? (
            <TriangleAlert className="size-3.5 shrink-0" />
          ) : (
            <Info className="size-3.5 shrink-0" />
          )}
          {t(`templates.issues.${issue.code}`, issue.params)}
        </p>
      ))}
    </div>
  );
}
