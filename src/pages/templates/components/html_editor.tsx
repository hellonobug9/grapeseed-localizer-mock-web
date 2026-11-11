import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { IssueList } from "@/pages/templates/components/issue_list";
import type { TemplateIssue } from "@/types/template";
import { useTranslation } from "react-i18next";

type HtmlEditorProps = {
  lang: string;
  source: string;
  value: string;
  issues: TemplateIssue[];
  readOnly: boolean;
  onChange: (value: string) => void;
};

// Fallback for bodies that can't be split into segments.
export function HtmlEditor({ lang, source, value, issues, readOnly, onChange }: HtmlEditorProps) {
  const { t } = useTranslation();
  const codeClass =
    "max-h-56 overflow-auto rounded-lg bg-surface-2 px-2.5 py-2 font-mono text-xs whitespace-pre-wrap text-text-2";

  return (
    <div>
      <p className="mb-1 text-xs font-medium text-muted-foreground">
        {t("templates.segments.englishHtml")}
      </p>
      <pre className={codeClass}>{source}</pre>
      {readOnly ? (
        <pre lang={lang} className={cn("mt-2", codeClass)}>
          {value}
        </pre>
      ) : (
        <Textarea
          lang={lang}
          dir="auto"
          value={value}
          placeholder={t("templates.field.placeholder")}
          aria-label={t("templates.field.translationLabel", {
            field: t("templates.fields.body"),
          })}
          aria-invalid={issues.some((issue) => issue.level === "error")}
          onChange={(event) => onChange(event.target.value)}
          className="mt-2 min-h-52 resize-y font-mono text-xs"
        />
      )}
      <IssueList issues={issues} />
    </div>
  );
}
