import { Pill } from "@/components/pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { smsInfo } from "@/lib/template";
import { cn } from "@/lib/utils";
import { IssueList } from "@/pages/templates/components/issue_list";
import { SegmentText } from "@/pages/templates/components/segment_text";
import type { TemplateIssue } from "@/types/template";
import { ClipboardPaste } from "lucide-react";
import { useTranslation } from "react-i18next";

type TextFieldProps = {
  label: string;
  lang: string;
  source: string;
  value: string;
  issues: TemplateIssue[];
  readOnly: boolean;
  multiline?: boolean;
  sms?: boolean;
  // English the translation was made from, when it differs from the current English
  previous?: string;
  onChange: (value: string) => void;
};

export function TextField({
  label,
  lang,
  source,
  value,
  issues,
  readOnly,
  multiline,
  sms,
  previous,
  onChange,
}: TextFieldProps) {
  const { t } = useTranslation();
  const hasError = issues.some((issue) => issue.level === "error");
  const inputProps = {
    value,
    lang,
    dir: "auto",
    placeholder: t("templates.field.placeholder"),
    "aria-label": t("templates.field.translationLabel", { field: label }),
    "aria-invalid": hasError,
    onChange: (event: { target: { value: string } }) => onChange(event.target.value),
  };

  return (
    <section className={cn("border-b px-4 py-3", hasError && "border-l-2 border-l-bad")}>
      <div className="flex items-center gap-2">
        <h4 className="text-sm font-medium">{label}</h4>
        {!readOnly && !value.trim() && (
          <Pill tone="warn" size="xs">
            {t("templates.field.missing")}
          </Pill>
        )}
        {previous !== undefined && (
          <Pill tone="warn" size="xs">
            {t("templates.field.englishChanged")}
          </Pill>
        )}
        {!readOnly && (
          <Button
            variant="ghost"
            size="icon-xs"
            className="ml-auto"
            aria-label={t("templates.field.useSource")}
            title={t("templates.field.useSource")}
            onClick={() => onChange(source)}
          >
            <ClipboardPaste />
          </Button>
        )}
      </div>

      <div className="mt-2 rounded-lg bg-surface-2 px-2.5 py-2 text-xs text-text-2">
        <SegmentText text={source} />
        {previous !== undefined && (
          <SegmentText text={previous} className="mt-1 text-muted-foreground line-through" />
        )}
        {sms && <SmsMeter text={source} />}
      </div>

      {readOnly ? (
        <SegmentText text={value} lang={lang} className="mt-2 px-1 text-sm" />
      ) : multiline ? (
        <Textarea {...inputProps} className="mt-2 min-h-20 resize-y" />
      ) : (
        <Input {...inputProps} className="mt-2" />
      )}
      {sms && value && <SmsMeter text={value} />}

      <IssueList issues={issues} />
    </section>
  );
}

function SmsMeter({ text }: { text: string }) {
  const { t } = useTranslation();
  const info = smsInfo(text);

  return (
    <p
      className="mt-1.5 text-xs text-muted-foreground tabular-nums"
      title={t("templates.sms.hint")}
    >
      {t("templates.sms.meter", {
        encoding: t(`templates.sms.encoding.${info.encoding}`),
        length: info.length,
        count: info.parts,
      })}
    </p>
  );
}
