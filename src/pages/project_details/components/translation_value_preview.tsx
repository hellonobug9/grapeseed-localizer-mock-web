import { Highlight } from "@/components/highlight";
import { htmlPreviewText } from "@/lib/html_preview";
import { cn } from "@/lib/utils";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";

type TranslationValuePreviewProps = {
  value: string | null | undefined;
  lang: string;
  query?: string | null;
  html?: boolean;
};

export function TranslationValuePreview({
  value,
  lang,
  query,
  html = false,
}: TranslationValuePreviewProps) {
  const { t } = useTranslation();
  const text = useMemo(() => (html ? htmlPreviewText(value) : (value ?? "")), [html, value]);

  return (
    <div className="min-w-0" lang={lang} dir="auto">
      <div
        className={cn(
          "line-clamp-1 min-w-0 text-sm leading-relaxed wrap-anywhere",
          html && "text-text-2",
        )}
      >
        <Highlight
          text={text || (html ? t("projectDetails.translations.formattedContent") : "")}
          query={query}
        />
      </div>
    </div>
  );
}
