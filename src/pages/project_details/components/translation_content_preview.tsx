import { safeHtml } from "@/lib/template";
import { cn } from "@/lib/utils";
import { memo, useMemo } from "react";
import { useTranslation } from "react-i18next";

type TranslationContentPreviewProps = {
  value: string;
  lang: string;
  title: string;
  html?: boolean;
  className?: string;
};

const CONTENT_CLASS =
  "wrap-anywhere text-sm leading-relaxed [&_*]:max-w-full [&_a]:text-brand [&_a]:underline [&_blockquote]:border-l [&_blockquote]:pl-3 [&_h1]:mb-3 [&_h1]:text-xl [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-3 [&_h3]:mb-2 [&_h3]:font-medium [&_hr]:my-4 [&_img]:h-auto [&_li]:mb-1 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_pre]:whitespace-pre-wrap [&_strong]:font-semibold [&_table]:w-full [&_table]:table-fixed [&_td]:border [&_td]:p-2 [&_th]:border [&_th]:p-2 [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&>:first-child]:mt-0";

export const TranslationContentPreview = memo(function TranslationContentPreview({
  value,
  lang,
  title,
  html = false,
  className,
}: TranslationContentPreviewProps) {
  const { t } = useTranslation();
  const markup = useMemo(() => (html ? safeHtml(value) : ""), [html, value]);

  return (
    <div
      role="region"
      aria-label={title}
      tabIndex={0}
      lang={lang}
      dir="auto"
      className={cn("max-h-72 min-w-0 overflow-auto overscroll-contain", className)}
      onClick={(event) => {
        if (event.target instanceof Element && event.target.closest("a")) event.preventDefault();
      }}
    >
      {!value.trim() ? (
        <p className="text-xs text-muted-foreground">{t("keyForm.htmlEditor.emptyPreview")}</p>
      ) : html ? (
        <div className={CONTENT_CLASS} dangerouslySetInnerHTML={{ __html: markup }} />
      ) : (
        <p className="text-sm leading-relaxed wrap-anywhere whitespace-pre-wrap">{value}</p>
      )}
    </div>
  );
});
