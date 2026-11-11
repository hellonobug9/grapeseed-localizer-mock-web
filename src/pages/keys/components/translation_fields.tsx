import { Code, Copy, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { FieldError } from "@/components/field_error";
import { Pill } from "@/components/pill";
import { Segmented } from "@/components/segmented";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TEXT_VIEWS, TextView } from "@/constants/key_format";
import { SOURCE_LANGUAGE } from "@/constants/language";
import { formatNumber } from "@/lib/format";
import { htmlPreviewDoc } from "@/lib/html_preview";
import { cn } from "@/lib/utils";
import type { Language } from "@/types/language";

const VIEW_ICON = { [TextView.Write]: Code, [TextView.Preview]: Eye } satisfies Record<
  TextView,
  unknown
>;

type FieldProps = {
  language: Language;
  value: string;
  onChange: (value: string) => void;
  error?: string;
};

function LanguageName({ language }: { language: Language }) {
  const { t } = useTranslation();
  const isSource = language.code === SOURCE_LANGUAGE;
  return (
    <div className="text-sm leading-tight font-semibold">
      {language.name}
      {isSource && (
        <span aria-hidden className="ml-0.5 text-destructive">
          *
        </span>
      )}
      {isSource && (
        <Pill tone="blue" className="ml-1.5">
          {t("common.source")}
        </Pill>
      )}
    </div>
  );
}

export function LabelField({ language, value, onChange, error }: FieldProps) {
  const { t } = useTranslation();
  const isSource = language.code === SOURCE_LANGUAGE;
  return (
    <div
      className={cn(
        "grid gap-1.5 border-b py-3.5 last:border-b-0 md:grid-cols-[190px_1fr] md:gap-4",
        isSource && "-mx-5 border-brand-muted bg-brand-soft px-5",
      )}
    >
      <div className="md:pt-1.5">
        <LanguageName language={language} />
        <div className="font-mono text-xs text-muted-foreground">
          {language.code} · {language.nativeName}
        </div>
      </div>
      <div className="space-y-1.5">
        <Textarea
          rows={1}
          lang={language.code}
          dir="auto"
          required={isSource}
          aria-invalid={!!error}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            isSource
              ? t("keyForm.sourcePlaceholder")
              : t("keyForm.translationPlaceholder", { language: language.name })
          }
          className="field-sizing-content min-h-10 resize-y bg-card"
        />
        <FieldError>{error}</FieldError>
      </div>
    </div>
  );
}

type LongTextFieldProps = FieldProps & {
  source: string;
  view: TextView;
  onViewChange: (view: TextView) => void;
};

export function LongTextField({
  language,
  value,
  onChange,
  error,
  source,
  view,
  onViewChange,
}: LongTextFieldProps) {
  const { t } = useTranslation();
  const isSource = language.code === SOURCE_LANGUAGE;

  const copySource = () => {
    if (!source.trim()) {
      toast.info(t("keyForm.writeSourceFirst"));
      return;
    }
    if (value.trim() && !window.confirm(t("keyForm.replaceWithSource"))) return;
    onChange(source);
    onViewChange(TextView.Write);
  };

  return (
    <div className="grid grid-cols-1 items-center gap-3 pt-4 pb-5 md:grid-cols-[1fr_auto]">
      <div>
        <LanguageName language={language} />
        <div className="font-mono text-xs text-muted-foreground">
          {language.code} · {language.nativeName}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <span className="text-xs whitespace-nowrap text-muted-foreground">
          {t("keyForm.characterCount", {
            count: value.length,
            formatted: formatNumber(value.length),
          })}
        </span>
        {!isSource && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={copySource}
            title={t("keyForm.copySourceHint")}
          >
            <Copy /> {t("keyForm.copySource")}
          </Button>
        )}
        <Segmented
          size="sm"
          value={view}
          onChange={onViewChange}
          options={TEXT_VIEWS.map((v) => {
            const Icon = VIEW_ICON[v];
            return {
              value: v,
              label: (
                <>
                  <Icon /> {t(`keyForm.view.${v}`)}
                </>
              ),
            };
          })}
        />
      </div>
      {!isSource && (
        <details open className="rounded-lg border bg-surface-2 md:col-span-2">
          <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-text-2">
            {t("keyForm.englishSource")}
          </summary>
          <pre className="max-h-[200px] overflow-auto px-3 pb-3 text-xs whitespace-pre-wrap text-text-2">
            {source.trim() ? source : t("keyForm.noSource")}
          </pre>
        </details>
      )}
      {view === TextView.Write ? (
        <Textarea
          lang={language.code}
          dir="auto"
          required={isSource}
          aria-invalid={!!error}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={
            isSource
              ? t("keyForm.sourcePlaceholder")
              : t("keyForm.translationPlaceholder", { language: language.name })
          }
          className="min-h-[360px] bg-card font-mono text-sm leading-relaxed md:col-span-2"
        />
      ) : (
        <iframe
          title={t("keyForm.previewTitle", { language: language.name })}
          sandbox=""
          srcDoc={htmlPreviewDoc(value, language.code)}
          className="min-h-[360px] w-full rounded-lg border border-input bg-white md:col-span-2"
        />
      )}
      <FieldError className="-mt-1.5 md:col-span-2">{error}</FieldError>
    </div>
  );
}
