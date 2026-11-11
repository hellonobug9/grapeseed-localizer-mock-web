import { Callout } from "@/components/callout";
import { Pill } from "@/components/pill";
import { Segmented } from "@/components/segmented";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { SOURCE_LANGUAGE } from "@/constants/language";
import {
  isHtmlTemplate,
  templateHasTitle,
  TemplateStatus,
  TemplateType,
  TRANSLATION_STATE_TONE,
  TranslationState,
} from "@/constants/template";
import { getTemplateLanguage } from "@/data/templates";
import { formatDay, plainText } from "@/lib/format";
import { canEditRow, checkSms, checkText, checkTitle } from "@/lib/template";
import { alignSegments, checkSegment, joinSegments, splitSegments } from "@/lib/template_segments";
import { HtmlEditor } from "@/pages/templates/components/html_editor";
import { releaseLabel } from "@/pages/templates/components/labels";
import { SegmentEditor } from "@/pages/templates/components/segment_editor";
import { TemplatePreview } from "@/pages/templates/components/template_preview";
import { TenantSync } from "@/pages/templates/components/tenant_sync";
import { TextField } from "@/pages/templates/components/text_field";
import type { TemplateContent, TemplateRow } from "@/types/template";
import {
  Archive,
  Clock,
  Eye,
  Info,
  Lock,
  PencilLine,
  Save,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import { Trans, useTranslation } from "react-i18next";
import { toast } from "sonner";

export type TranslationValues = { title: string | null; body: string };

type TemplateDialogProps = {
  row: TemplateRow;
  source: TemplateContent;
  lang: string;
  releaseId: number | null;
  onClose: () => void;
  onSave: (values: TranslationValues) => void;
};

type BodyMode = "segments" | "html";

type PreviewSide = "target" | "source";

type Note = { icon: LucideIcon; tone: "info" | "warn"; text: ReactNode };

type Draft = {
  title: string;
  mode: BodyMode;
  texts: string[];
  raw: string;
  body: string;
};

export function TemplateDialog({
  row,
  source,
  lang,
  releaseId,
  onClose,
  onSave,
}: TemplateDialogProps) {
  const { t } = useTranslation();
  const { template, target, base } = row;
  const language = getTemplateLanguage(lang);
  const hasTitle = templateHasTitle(template.type);
  const isHtml = isHtmlTemplate(template.type);
  const readOnly = !canEditRow(row, releaseId);
  const release = releaseLabel(releaseId, t);

  const sourceSegments = useMemo(
    () => (isHtml ? splitSegments(source.body) : null),
    [isHtml, source.body],
  );
  const emptyTexts = () =>
    sourceSegments?.map((segment) => (segment.fixed ? segment.text : "")) ?? [];

  const [saved, setSaved] = useState<Draft>(() => {
    const raw = target?.body ?? "";
    const aligned = sourceSegments ? alignSegments(source.body, raw) : null;
    return {
      title: target?.title ?? "",
      mode: aligned ? "segments" : "html",
      texts: aligned ?? emptyTexts(),
      raw,
      body: aligned ? joinSegments(source.body, aligned) : raw,
    };
  });
  const [title, setTitle] = useState(saved.title);
  const [mode, setMode] = useState(saved.mode);
  const [texts, setTexts] = useState(saved.texts);
  const [raw, setRaw] = useState(saved.raw);
  const [side, setSide] = useState<PreviewSide>("target");

  const bySegments = isHtml && mode === "segments" && sourceSegments !== null;
  const body = useMemo(
    () => (bySegments ? joinSegments(source.body, texts) : raw),
    [bySegments, source.body, texts, raw],
  );
  const untranslated = bySegments
    ? sourceSegments.filter((segment, index) => !segment.fixed && !texts[index]?.trim()).length
    : 0;
  // The preview shows the English for segments not translated yet.
  const previewBody = useMemo(
    () =>
      bySegments && untranslated > 0
        ? joinSegments(
            source.body,
            texts.map((text, index) => (text.trim() ? text : sourceSegments[index].text)),
          )
        : body,
    [bySegments, untranslated, source.body, sourceSegments, texts, body],
  );

  // English the translation was made from, for marking what changed since.
  const previous = useMemo(() => {
    const baseSegments = base && sourceSegments ? splitSegments(base.body) : null;
    if (!sourceSegments || baseSegments?.length !== sourceSegments.length) {
      return null;
    }
    return sourceSegments.map((segment, index) =>
      baseSegments[index].text !== segment.text ? baseSegments[index].text : null,
    );
  }, [base, sourceSegments]);
  const previousTitle =
    base && base.title !== source.title && title === saved.title ? (base.title ?? "") : undefined;
  const previousSms =
    base && !isHtml && base.body !== source.body && raw === saved.raw ? base.body : undefined;

  const htmlAligned = useMemo(
    () => !sourceSegments || bySegments || alignSegments(source.body, raw) !== null,
    [sourceSegments, bySegments, source.body, raw],
  );

  const titleIssues =
    hasTitle && !readOnly ? checkTitle(template.type, source.title ?? "", title) : [];
  const bodyIssues = readOnly
    ? []
    : !isHtml
      ? checkSms(source.body, raw)
      : bySegments
        ? sourceSegments.flatMap((segment, index) =>
            segment.fixed ? [] : checkSegment(segment, texts[index] ?? ""),
          )
        : checkText(source.body, raw);
  const errorCount = [...titleIssues, ...bodyIssues].filter(
    (issue) => issue.level === "error",
  ).length;

  const parts = [
    ...(hasTitle && source.title ? [title] : []),
    ...(bySegments
      ? sourceSegments.flatMap((segment, index) => (segment.fixed ? [] : [texts[index] ?? ""]))
      : [isHtml ? plainText(raw) : raw]),
  ];
  const progress = {
    translated: parts.filter((part) => part.trim()).length,
    total: parts.length,
  };

  const dirty = title !== saved.title || body !== saved.body;
  const hasBody = !!(isHtml ? plainText(body) : body.trim());
  const canSave = !readOnly && dirty && errorCount === 0 && hasBody;

  const changeMode = (next: BodyMode) => {
    if (next === mode) return;
    if (next === "html") {
      setRaw(body);
      setMode("html");
      return;
    }
    const aligned = alignSegments(source.body, raw);
    if (!aligned) {
      toast.error(t("templates.segments.switchFailed"));
      return;
    }
    setTexts(aligned);
    setMode("segments");
  };

  const startOver = () => {
    setTexts(emptyTexts());
    setMode("segments");
  };

  const discard = () => {
    setTitle(saved.title);
    setMode(saved.mode);
    setTexts(saved.texts);
    setRaw(saved.raw);
  };

  const save = () => {
    onSave({ title: hasTitle ? title : null, body });
    setSaved({ title, mode, texts, raw, body });
  };

  const notes: Note[] = [];
  if (readOnly && target?.status === TemplateStatus.Published) {
    notes.push({
      icon: Lock,
      tone: "info",
      text: t("templates.dialog.publishedHere", { release }),
    });
  } else if (readOnly && target?.status === TemplateStatus.Archived) {
    notes.push({
      icon: Archive,
      tone: "info",
      text: t("templates.dialog.archivedHere", { release }),
    });
  } else {
    const saveText = !target
      ? t("templates.dialog.saveCreates", { release })
      : target.releaseId === releaseId
        ? t("templates.dialog.saveUpdates", { release })
        : t("templates.dialog.saveFromLive", {
            release,
            live: releaseLabel(target.releaseId, t),
          });
    notes.push({
      icon: Info,
      tone: "info",
      text: `${saveText} ${t("templates.dialog.publishNote")}`,
    });
  }
  if (source.releaseId !== releaseId) {
    notes.push({
      icon: Info,
      tone: "info",
      text: t("templates.dialog.sourceFromLive", {
        release,
        source: releaseLabel(source.releaseId, t),
      }),
    });
  } else if (source.status === TemplateStatus.Draft) {
    notes.push({
      icon: PencilLine,
      tone: "warn",
      text: t("templates.dialog.sourceDraft", { release }),
    });
  }
  if (row.state === TranslationState.Outdated && target) {
    notes.push({
      icon: Clock,
      tone: "warn",
      text: t(
        previous || previousTitle !== undefined || previousSms !== undefined
          ? "templates.dialog.outdatedMarked"
          : "templates.dialog.outdated",
        {
          date: formatDay(source.updatedAt),
          translated: formatDay(target.updatedAt),
        },
      ),
    });
  }

  const titleField = template.type === TemplateType.Email ? "subject" : "title";
  const phoneCodes = (target ?? source).phoneCodes;
  const blockClose = (event: Event) => {
    if (dirty) event.preventDefault();
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        onInteractOutside={blockClose}
        onEscapeKeyDown={blockClose}
        className="grid h-[min(52rem,calc(100dvh-2rem))] w-[min(88rem,calc(100vw-2rem))] grid-rows-[auto_minmax(0,1fr)_auto] gap-0 p-0 sm:max-w-none"
      >
        <header className="flex flex-wrap items-center gap-x-3 gap-y-1.5 border-b px-4 py-3 pr-12">
          <DialogTitle>{template.name}</DialogTitle>
          <Pill>{t(`templates.type.${template.type}`)}</Pill>
          <Pill tone={TRANSLATION_STATE_TONE[row.state]}>{t(`templates.state.${row.state}`)}</Pill>
          {readOnly && (
            <Pill>
              <Eye /> {t("templates.dialog.viewOnly")}
            </Pill>
          )}
          <DialogDescription className="w-full text-xs">
            <span className="font-mono">{template.code}</span>
            {template.service && ` · ${template.service}`} · {language.name} · {release}
          </DialogDescription>
          {template.description && (
            <p className="w-full text-xs text-muted-foreground">{template.description}</p>
          )}
          {target?.status === TemplateStatus.Published && <TenantSync content={target} />}
        </header>

        <div className="grid min-h-0 grid-cols-1 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <div className="min-h-0 overflow-auto border-r">
            <div className="grid gap-2 border-b px-4 py-3">
              {notes.map((note, index) => (
                <Callout
                  key={index}
                  icon={note.icon}
                  tone={note.tone}
                  className="px-3 py-2 text-xs"
                >
                  {note.text}
                </Callout>
              ))}
            </div>

            {hasTitle && (
              <TextField
                label={t(`templates.fields.${titleField}`)}
                lang={lang}
                source={source.title ?? ""}
                value={title}
                issues={titleIssues}
                readOnly={readOnly}
                previous={previousTitle}
                onChange={setTitle}
              />
            )}

            {isHtml ? (
              <section className="px-4 py-3">
                <div className="flex items-center gap-2 pb-2">
                  <h4 className="text-sm font-medium">{t("templates.fields.body")}</h4>
                  {sourceSegments && !readOnly && (
                    <Segmented
                      size="sm"
                      className="ml-auto"
                      value={mode}
                      onChange={changeMode}
                      options={[
                        {
                          value: "segments",
                          label: t("templates.segments.mode.segments"),
                        },
                        {
                          value: "html",
                          label: t("templates.segments.mode.html"),
                        },
                      ]}
                    />
                  )}
                </div>

                {!sourceSegments && (
                  <Callout icon={TriangleAlert} tone="warn" className="mb-3 text-xs">
                    {t("templates.segments.cantSplitSource")}
                  </Callout>
                )}
                {!htmlAligned && (
                  <Callout icon={TriangleAlert} tone="warn" className="mb-3 text-xs">
                    {t("templates.segments.cantSplitTarget")}
                    {!readOnly && (
                      <Button variant="outline" size="xs" className="mt-2 flex" onClick={startOver}>
                        {t("templates.segments.startOver")}
                      </Button>
                    )}
                  </Callout>
                )}

                {bySegments ? (
                  <SegmentEditor
                    lang={lang}
                    segments={sourceSegments}
                    texts={texts}
                    initialTexts={saved.texts}
                    previous={previous}
                    readOnly={readOnly}
                    onChange={(index, text) =>
                      setTexts((current) => current.map((item, i) => (i === index ? text : item)))
                    }
                  />
                ) : (
                  <HtmlEditor
                    lang={lang}
                    source={source.body}
                    value={raw}
                    issues={bodyIssues}
                    readOnly={readOnly}
                    onChange={setRaw}
                  />
                )}
              </section>
            ) : (
              <TextField
                label={t("templates.fields.message")}
                lang={lang}
                source={source.body}
                value={raw}
                issues={bodyIssues}
                readOnly={readOnly}
                previous={previousSms}
                multiline
                sms
                onChange={setRaw}
              />
            )}

            {phoneCodes.length > 0 && (
              <section className="flex flex-wrap items-center gap-1.5 px-4 py-3 text-xs text-muted-foreground">
                {t("templates.dialog.phoneCodes")}
                {phoneCodes.map((code) => (
                  <Pill key={code} size="xs" className="font-mono">
                    {code}
                  </Pill>
                ))}
              </section>
            )}
          </div>

          <div className="min-h-0 overflow-auto bg-surface-2">
            <div className="sticky top-0 z-10 flex items-center gap-2 border-b bg-surface-2/90 px-4 py-2 backdrop-blur">
              <h4 className="text-sm font-medium">{t("templates.dialog.preview")}</h4>
              <Segmented
                className="ml-auto"
                size="sm"
                value={side}
                onChange={setSide}
                options={[
                  { value: "target", label: language.name },
                  {
                    value: "source",
                    label: getTemplateLanguage(SOURCE_LANGUAGE).name,
                  },
                ]}
              />
            </div>
            <div className="p-4">
              {side === "target" && untranslated > 0 && (
                <p className="mb-2 text-xs text-warn">
                  {t("templates.dialog.previewFallback", {
                    count: untranslated,
                  })}
                </p>
              )}
              <div lang={side === "source" ? SOURCE_LANGUAGE : lang}>
                <TemplatePreview
                  type={template.type}
                  title={side === "source" ? source.title : title}
                  body={side === "source" ? source.body : previewBody}
                />
              </div>
            </div>
          </div>
        </div>

        <footer className="flex flex-wrap items-center gap-3 border-t bg-surface-2 px-4 py-3">
          <span className="text-sm text-muted-foreground">
            <Trans
              i18nKey="templates.dialog.progress"
              values={progress}
              components={{ b: <b className="text-foreground" /> }}
            />
          </span>
          {errorCount > 0 && (
            <Pill tone="bad">
              <TriangleAlert />
              {t("templates.dialog.issues", { count: errorCount })}
            </Pill>
          )}
          {dirty && <Pill tone="blue">{t("templates.dialog.unsaved")}</Pill>}
          <div className="ml-auto flex gap-2">
            <Button variant="outline" onClick={dirty ? discard : onClose}>
              {dirty ? t("templates.dialog.discard") : t("templates.dialog.close")}
            </Button>
            {!readOnly && (
              <Button
                disabled={!canSave}
                title={
                  errorCount > 0
                    ? t("templates.dialog.fixToSave")
                    : dirty && !hasBody
                      ? t("templates.dialog.emptyBody")
                      : undefined
                }
                onClick={save}
              >
                <Save /> {t("templates.dialog.saveDraft")}
              </Button>
            )}
          </div>
        </footer>
      </DialogContent>
    </Dialog>
  );
}
