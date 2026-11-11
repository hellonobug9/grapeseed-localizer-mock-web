import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Panel } from "@/components/panel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Segmented } from "@/components/segmented";
import { TextView } from "@/constants/key_format";
import { SOURCE_LANGUAGE } from "@/constants/language";
import { compactHtml, formatHtml } from "@/lib/html_format";
import { cn } from "@/lib/utils";
import { HtmlCodeEditor } from "@/pages/project_details/components/html_code_editor";
import { TranslationContentPreview } from "@/pages/project_details/components/translation_content_preview";
import { TranslationPlaceholders } from "@/pages/project_details/components/translation_placeholders";
import { SmsMeter } from "@/pages/templates/components/text_field";
import type { TranslationKey } from "@/types/translation_key";
import { Eye, TriangleAlert } from "lucide-react";
import { useDeferredValue, useEffect, useId, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

const tagSignature = (html: string) =>
  Array.from(
    html.matchAll(/<\/?([a-z][\w:-]*)(?:\s[^>]*)?>/gi),
    ([tag, name]) => `${tag.startsWith("</") ? "/" : ""}${name.toLowerCase()}`,
  );

const linkTargets = (html: string) =>
  Array.from(html.matchAll(/<a\b[^>]*\bhref\s*=\s*(["'])(.*?)\1/gi), ([, , href]) => href);

const matchesSourceStructure = (source: string, target: string) => {
  const sourceTags = tagSignature(source);
  const targetTags = tagSignature(target);
  const sourceLinks = linkTargets(source);
  const targetLinks = linkTargets(target);
  return (
    sourceTags.length === targetTags.length &&
    sourceTags.every((tag, index) => tag === targetTags[index]) &&
    sourceLinks.length === targetLinks.length &&
    sourceLinks.every((href, index) => href === targetLinks[index])
  );
};

const PreviewPane = {
  Translation: "translation",
  Source: "source",
} as const;

type PreviewPane = (typeof PreviewPane)[keyof typeof PreviewPane];

type HtmlTranslationDialogProps = {
  translationKey: TranslationKey;
  language: { code: string; name: string };
  source: string;
  value: string | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (value: string) => void | Promise<void>;
  /** False for plain-text SMS templates: no HTML formatting or tag checks, and an SMS length meter. */
  html?: boolean;
};

export function HtmlTranslationDialog({
  translationKey,
  language,
  source,
  value,
  open,
  onOpenChange,
  onSave,
  html: isHtml = true,
}: HtmlTranslationDialogProps) {
  const { t } = useTranslation();
  const [initialDraft] = useState(() => {
    const text = value?.trim() ? value : source;
    return isHtml ? formatHtml(text) : text;
  });
  const [draft, setDraft] = useState(initialDraft);
  const [view, setView] = useState<TextView>(TextView.Write);
  const [previewPane, setPreviewPane] = useState<PreviewPane>(PreviewPane.Translation);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editorId = useId();
  const errorId = useId();
  const previewDraft = useDeferredValue(draft);
  const dirty = draft !== initialDraft;
  const paneHeight = isHtml ? "h-[min(55dvh,460px)] min-h-64" : "h-48";
  const hasTagMismatch = isHtml && !!draft.trim() && !matchesSourceStructure(source, draft);
  const title = t("keyForm.previewTitle", { language: language.name });
  const previewOptions = [
    {
      value: PreviewPane.Translation,
      label: (
        <>
          <Eye aria-hidden="true" /> {t("keyForm.view.preview")}
        </>
      ),
    },
    { value: PreviewPane.Source, label: t("keyForm.htmlEditor.englishSource") },
  ];

  useEffect(() => {
    if (!open || !dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [open, dirty]);

  const requestClose = (nextOpen: boolean) => {
    if (saving) return;
    if (!nextOpen && dirty) setConfirmDiscard(true);
    else onOpenChange(nextOpen);
  };

  const save = async () => {
    if (saving || hasTagMismatch) return;
    setSaving(true);
    setSaveError(undefined);
    try {
      await onSave(isHtml ? compactHtml(draft) : draft);
      onOpenChange(false);
    } catch {
      setSaveError(t("keyForm.htmlEditor.saveFailed"));
      setView(TextView.Write);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={requestClose}>
      <DialogContent className="flex max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-none flex-col gap-0 overflow-hidden p-0 sm:w-[calc(100vw-4rem)] sm:max-w-none xl:w-[1180px] 2xl:w-[1280px]">
        <DialogHeader className="shrink-0 border-b px-5 py-4 pr-12">
          <DialogTitle className="text-base leading-relaxed wrap-anywhere">
            {translationKey.key}
          </DialogTitle>
          <DialogDescription>{translationKey.description}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-5">
          <Segmented
            size="sm"
            stretch
            value={view === TextView.Write ? TextView.Write : previewPane}
            onChange={(next) => {
              if (next === TextView.Write) return setView(TextView.Write);
              setView(TextView.Preview);
              setPreviewPane(next);
            }}
            className="mb-3 lg:hidden"
            options={[
              { value: TextView.Write, label: t("keyForm.htmlEditor.editor") },
              ...previewOptions,
            ]}
          />

          <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-2">
            <div className={cn("min-w-0", view !== TextView.Write && "hidden lg:block")}>
              <div className="mb-2 flex h-7 items-center gap-2">
                <Label htmlFor={editorId}>{language.name}</Label>
                <span className="text-xs text-muted-foreground uppercase">{language.code}</span>
              </div>
              <HtmlCodeEditor
                ref={inputRef}
                id={editorId}
                lang={language.code}
                dir="auto"
                name="html-translation"
                autoComplete="off"
                value={draft}
                disabled={saving}
                wrap="soft"
                onChange={(event) => {
                  setDraft(event.target.value);
                  setSaveError(undefined);
                }}
                aria-label={language.name}
                aria-invalid={hasTagMismatch || !!saveError}
                aria-describedby={errorId}
                className={cn("field-sizing-fixed resize-y", paneHeight)}
              />
              {!isHtml && <SmsMeter text={draft} />}
              <TranslationPlaceholders source={source} value={draft} />
              <div id={errorId} role="alert" className="mt-1 flex flex-col gap-1">
                {[hasTagMismatch && t("keyForm.htmlTagError"), saveError]
                  .filter(Boolean)
                  .map((message) => (
                    <p key={message as string} className="flex items-center gap-1.5 text-xs text-bad">
                      <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" /> {message}
                    </p>
                  ))}
              </div>
            </div>
            <div className={cn("min-w-0", view !== TextView.Preview && "hidden lg:block")}>
              <div className="mb-2 flex h-7 items-center justify-between gap-2">
                <Segmented
                  size="sm"
                  value={previewPane}
                  onChange={setPreviewPane}
                  className="hidden lg:inline-flex"
                  options={previewOptions}
                />
                {isHtml && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {t("keyForm.htmlEditor.previewHint")}
                  </span>
                )}
              </div>
              <Panel className="overflow-hidden">
                {previewPane === PreviewPane.Source ? (
                  <TranslationContentPreview
                    value={source}
                    lang={SOURCE_LANGUAGE}
                    title={t("keyForm.htmlEditor.englishSource")}
                    html={isHtml}
                    className={cn("max-h-none bg-surface-2 p-4", paneHeight)}
                  />
                ) : (
                  <TranslationContentPreview
                    value={previewDraft}
                    lang={language.code}
                    title={title}
                    html={isHtml}
                    className={cn("max-h-none p-4", paneHeight)}
                  />
                )}
              </Panel>
            </div>
          </div>
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t bg-surface-2 px-5 py-4">
          <span className="mr-auto self-center text-xs text-muted-foreground" role="status">
            {dirty && t("keyForm.htmlEditor.unsaved")}
          </span>
          <Button
            type="button"
            variant="outline"
            disabled={saving}
            onClick={() => requestClose(false)}
          >
            {t("common.cancel")}
          </Button>
          <Button type="button" disabled={saving || hasTagMismatch} onClick={save}>
            {saving ? t("keyForm.htmlEditor.saving") : t("common.save")}
          </Button>
        </footer>
        <Dialog
          open={confirmDiscard}
          onOpenChange={(nextOpen) => {
            setConfirmDiscard(nextOpen);
            if (!nextOpen) setView(TextView.Write);
          }}
        >
          <DialogContent
            onCloseAutoFocus={(event) => {
              event.preventDefault();
              inputRef.current?.focus();
            }}
          >
            <DialogHeader>
              <DialogTitle>{t("keyForm.htmlEditor.discardTitle")}</DialogTitle>
              <DialogDescription>{t("keyForm.htmlEditor.discardDescription")}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setConfirmDiscard(false);
                  setView(TextView.Write);
                }}
              >
                {t("keyForm.htmlEditor.keepEditing")}
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => {
                  setConfirmDiscard(false);
                  onOpenChange(false);
                }}
              >
                {t("keyForm.htmlEditor.discard")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </DialogContent>
    </Dialog>
  );
}
