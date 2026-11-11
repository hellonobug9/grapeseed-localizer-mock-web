import { Button } from "@/components/ui/button";
import { FieldError } from "@/components/field_error";
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
import { Textarea } from "@/components/ui/textarea";
import { Segmented } from "@/components/segmented";
import { TextView } from "@/constants/key_format";
import { SOURCE_LANGUAGE } from "@/constants/language";
import { cn } from "@/lib/utils";
import { TranslationContentPreview } from "@/pages/project_details/components/translation_content_preview";
import { TranslationPlaceholders } from "@/pages/project_details/components/translation_placeholders";
import type { TranslationKey } from "@/types/translation_key";
import { Code, Eye } from "lucide-react";
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

type HtmlTranslationDialogProps = {
  translationKey: TranslationKey;
  language: { code: string; name: string };
  source: string;
  value: string | null | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (value: string) => void | Promise<void>;
};

export function HtmlTranslationDialog({
  translationKey,
  language,
  source,
  value,
  open,
  onOpenChange,
  onSave,
}: HtmlTranslationDialogProps) {
  const { t } = useTranslation();
  const initialDraft = value?.trim() ? value : source;
  const [draft, setDraft] = useState(initialDraft);
  const [view, setView] = useState<TextView>(TextView.Write);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const editorId = useId();
  const errorId = useId();
  const previewDraft = useDeferredValue(draft);
  const dirty = draft !== initialDraft;
  const hasTagMismatch = !!draft.trim() && !matchesSourceStructure(source, draft);
  const title = t("keyForm.previewTitle", { language: language.name });

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
      await onSave(draft);
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
          <DialogTitle className="font-mono text-sm leading-relaxed wrap-anywhere">
            {translationKey.key}
          </DialogTitle>
          <DialogDescription>{translationKey.description}</DialogDescription>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain p-5">
          <details className="mb-4 rounded-lg border bg-surface-2">
            <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-text-2">
              {t("keyForm.englishSource")}
            </summary>
            <TranslationContentPreview
              value={source}
              lang={SOURCE_LANGUAGE}
              title={t("keyForm.englishSource")}
              html
              className="max-h-36 border-t px-3 py-2"
            />
          </details>

          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <div>
              <Label htmlFor={editorId}>{language.name}</Label>
              <div className="font-mono text-xs text-muted-foreground">{language.code}</div>
            </div>
            <Segmented
              size="sm"
              value={view}
              onChange={setView}
              className="lg:hidden"
              options={[
                {
                  value: TextView.Write,
                  label: (
                    <>
                      <Code aria-hidden="true" /> {t("keyForm.htmlEditor.editor")}
                    </>
                  ),
                },
                {
                  value: TextView.Preview,
                  label: (
                    <>
                      <Eye aria-hidden="true" /> {t("keyForm.view.preview")}
                    </>
                  ),
                },
              ]}
            />
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.08fr)_minmax(0,1fr)]">
            <div className={cn("min-w-0 space-y-2", view !== TextView.Write && "hidden lg:block")}>
              <p className="text-xs text-muted-foreground">{t("keyForm.htmlEditor.editor")}</p>
              <Textarea
                ref={inputRef}
                id={editorId}
                lang={language.code}
                dir="auto"
                name="html-translation"
                autoComplete="off"
                value={draft}
                disabled={saving}
                spellCheck={false}
                wrap="soft"
                onChange={(event) => {
                  setDraft(event.target.value);
                  setSaveError(undefined);
                }}
                aria-label={language.name}
                aria-invalid={hasTagMismatch || !!saveError}
                aria-describedby={errorId}
                className="field-sizing-fixed h-[min(50dvh,420px)] min-h-64 resize-y font-mono text-sm leading-relaxed"
              />
              <TranslationPlaceholders source={source} value={draft} />
            </div>
            <div
              className={cn("min-w-0 space-y-2", view !== TextView.Preview && "hidden lg:block")}
            >
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Eye className="size-3.5" aria-hidden="true" />{" "}
                  {t("keyForm.htmlEditor.contentPreview")}
                </span>
                <span>{t("keyForm.htmlEditor.live")}</span>
              </div>
              <Panel className="overflow-hidden">
                <TranslationContentPreview
                  value={previewDraft}
                  lang={language.code}
                  title={title}
                  html
                  className="h-[min(50dvh,420px)] max-h-none min-h-64 p-4"
                />
              </Panel>
              <p className="text-xs text-muted-foreground">{t("keyForm.htmlEditor.previewHint")}</p>
            </div>
          </div>
          <div id={errorId} role="alert" className="mt-2">
            <FieldError>{hasTagMismatch && t("keyForm.htmlTagError")}</FieldError>
            <FieldError>{saveError}</FieldError>
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
