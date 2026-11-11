import { Pill } from "@/components/pill";
import { checkText, placeholderList } from "@/lib/template";
import { IssueList } from "@/pages/templates/components/issue_list";
import { useTranslation } from "react-i18next";

export function TranslationPlaceholders({
  source,
  value,
  id,
}: {
  source: string;
  value: string;
  id?: string;
}) {
  const { t } = useTranslation();
  const required = placeholderList(source);
  const issues = checkText(source, value).filter((issue) =>
    ["missingPlaceholder", "unknownPlaceholder", "placeholderCase"].includes(issue.code),
  );
  if (!required.length && !issues.length) return null;

  return (
    <div id={id} className="mt-2 space-y-1.5">
      {required.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <span>{t("keyForm.htmlEditor.placeholders")}</span>
          {required.map((token) => (
            <Pill
              key={token}
              size="xs"
              tone={value.trim() && !value.includes(token) ? "warn" : "gray"}
            >
              <code>{token}</code>
            </Pill>
          ))}
        </div>
      )}
      <div role="status" aria-live="polite">
        <IssueList issues={issues} />
      </div>
    </div>
  );
}
