import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TranslationPlaceholders } from "@/pages/project_details/components/translation_placeholders";
import { TranslationValuePreview } from "@/pages/project_details/components/translation_value_preview";
import { CircleAlert } from "lucide-react";
import type { KeyboardEvent } from "react";
import { useTranslation } from "react-i18next";

export function MissingText() {
  const { t } = useTranslation();
  return (
    <span className="inline-flex items-center gap-1 text-sm text-bad italic">
      <CircleAlert className="size-3.5" />
      {t("projectDetails.translationCell.notTranslated")}
    </span>
  );
}

type TranslationCellProps = {
  value: string | null | undefined;
  query?: string | null;
  lang: string;
  langName: string;
  source?: string;
  editing: boolean;
  onChange: (value: string) => void;
  onSave: (value: string) => void;
  onCancel: () => void;
};

function InlineEditor({
  value,
  lang,
  langName,
  source = "",
  onChange,
  onSave,
  onCancel,
}: Omit<TranslationCellProps, "editing" | "query">) {
  const { t } = useTranslation();
  const draft = value ?? "";

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault();
      onCancel();
    } else if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      e.preventDefault();
      onSave(draft);
    }
  };

  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <Input
        autoFocus
        lang={lang}
        dir="auto"
        value={draft}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={(e) => e.currentTarget.setSelectionRange(draft.length, draft.length)}
        placeholder={t("projectDetails.translationCell.placeholder", {
          language: langName,
        })}
        aria-label={t("projectDetails.translationCell.label", {
          language: langName,
        })}
        className="w-full border-brand text-sm ring-3 ring-brand/15"
      />
      <TranslationPlaceholders source={source} value={draft} />
      <div className="flex items-center justify-end gap-1">
        <Button type="button" variant="outline" size="xs" onClick={onCancel}>
          {t("common.cancel")}
        </Button>
        <Button type="button" size="xs" onClick={() => onSave(draft)}>
          {t("common.save")}
        </Button>
      </div>
    </div>
  );
}

export function TranslationCell({
  value,
  query,
  lang,
  langName,
  source,
  editing,
  onChange,
  onSave,
  onCancel,
}: TranslationCellProps) {
  if (editing)
    return (
      <InlineEditor
        value={value}
        lang={lang}
        langName={langName}
        source={source}
        onChange={onChange}
        onSave={onSave}
        onCancel={onCancel}
      />
    );
  return value ? (
    <TranslationValuePreview
      value={value}
      query={query}
      lang={lang}
    />
  ) : (
    <MissingText />
  );
}
