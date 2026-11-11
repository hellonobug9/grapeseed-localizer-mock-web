import { TEMPLATE_SAMPLE_VALUES, TEMPLATE_SENDER, TemplateType } from "@/constants/template";
import { initials } from "@/lib/format";
import { collapseBlankLines, fillPlaceholders, previewHtml } from "@/lib/template";
import {
  ArrowUp,
  BatteryFull,
  ChevronLeft,
  ChevronRight,
  Mail,
  MoreVertical,
  Plus,
  Reply,
  Signal,
  Star,
  Wifi,
} from "lucide-react";
import { useTranslation } from "react-i18next";

type TemplatePreviewProps = {
  type: TemplateType;
  title: string | null;
  body: string;
};

type FieldName = "title" | "subject" | "body" | "message";

const HTML_CONTENT_CLASS =
  "text-sm leading-relaxed *:first:mt-0[&_a]:text-brand [&_a]:underline [&_a]:underline-offset-2 [&_blockquote]:border-l [&_blockquote]:pl-3 [&_em]:italic [&_h1]:mt-4 [&_h1]:mb-3 [&_h1]:text-lg [&_h1]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h2]:text-base [&_h2]:font-semibold [&_h3]:mt-4 [&_h3]:font-medium [&_hr]:my-4 [&_li]:mb-1 [&_li>p]:mb-0 [&_ol]:mb-3 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-3 [&_p:last-child]:mb-0 [&_s]:line-through [&_small]:text-xs [&_strong]:font-semibold [&_td]:border [&_td]:px-2 [&_td]:py-1 [&_u]:underline [&_ul]:mb-3 [&_ul]:list-disc [&_ul]:pl-5";

export function TemplatePreview({ type, title, body }: TemplatePreviewProps) {
  switch (type) {
    case TemplateType.Email:
      return <EmailPreview subject={title ?? ""} body={body} />;
    case TemplateType.Sms:
      return <SmsPreview message={body} />;
    case TemplateType.PrivacyPolicy:
    case TemplateType.TermsOfService:
      return <DocumentPreview body={body} />;
    default:
      return <MessagePreview title={title ?? ""} body={body} />;
  }
}

function Missing({ field }: { field: FieldName }) {
  const { t } = useTranslation();
  return (
    <span className="text-warn italic">
      {t("templates.preview.notTranslated", {
        field: t(`templates.fields.${field}`),
      })}
    </span>
  );
}

function PreviewLabel({ children }: { children: string }) {
  return (
    <p className="mb-1.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">
      {children}
    </p>
  );
}

function HtmlBody({ body }: { body: string }) {
  const html = previewHtml(body);
  if (!html.trim()) {
    return (
      <p className="text-sm">
        <Missing field="body" />
      </p>
    );
  }
  return (
    <div dir="auto" className={HTML_CONTENT_CLASS} dangerouslySetInnerHTML={{ __html: html }} />
  );
}

function EmailPreview({ subject, body }: { subject: string; body: string }) {
  const { t } = useTranslation();
  const filled = fillPlaceholders(subject);

  return (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border bg-card p-3">
        <PreviewLabel>{t("templates.preview.inbox")}</PreviewLabel>
        <div className="flex items-start gap-2">
          <Mail className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p dir="auto" className="min-w-0 truncate text-sm font-semibold">
            {filled || <Missing field="subject" />}
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="flex items-center gap-2 border-b bg-surface-2 px-3 py-2">
          <ChevronLeft className="size-4 text-muted-foreground" />
          <span className="grid size-6 place-items-center rounded-full bg-brand-soft text-[10px] font-semibold text-brand-strong">
            {initials(TEMPLATE_SENDER)}
          </span>
          <div className="min-w-0 flex-1 text-xs">
            <p className="truncate font-medium">{TEMPLATE_SENDER}</p>
            <p className="truncate text-muted-foreground">
              {t("templates.preview.to", {
                email: TEMPLATE_SAMPLE_VALUES["{Email}"],
              })}
            </p>
          </div>
          <Star className="size-3.5 text-muted-foreground" />
          <Reply className="size-3.5 text-muted-foreground" />
          <MoreVertical className="size-3.5 text-muted-foreground" />
        </div>
        <div className="p-5">
          <HtmlBody body={body} />
        </div>
      </div>
    </div>
  );
}

function DocumentPreview({ body }: { body: string }) {
  const { t } = useTranslation();
  return (
    <div>
      <PreviewLabel>{t("templates.preview.document")}</PreviewLabel>
      <div className="rounded-lg border bg-card px-6 py-5 shadow-sm">
        <HtmlBody body={body} />
      </div>
    </div>
  );
}

function MessagePreview({ title, body }: { title: string; body: string }) {
  const { t } = useTranslation();
  const filled = fillPlaceholders(title);

  return (
    <div>
      <PreviewLabel>{t("templates.preview.message")}</PreviewLabel>
      <div className="rounded-lg border bg-card p-4 shadow-sm">
        <p dir="auto" className="mb-2 font-semibold">
          {filled || <Missing field="title" />}
        </p>
        <HtmlBody body={body} />
      </div>
    </div>
  );
}

function SmsPreview({ message }: { message: string }) {
  const { t } = useTranslation();
  const text = collapseBlankLines(fillPlaceholders(message).trim());

  return (
    <div className="mx-auto flex w-full max-w-xs flex-col overflow-hidden rounded-[2rem] border-[6px] border-foreground/15 bg-card shadow-sm">
      <div className="flex items-center justify-between px-5 pt-2.5 pb-1 text-[11px] font-semibold tabular-nums">
        <span>9:41</span>
        <span className="flex items-center gap-1 text-foreground/70">
          <Signal className="size-3" />
          <Wifi className="size-3" />
          <BatteryFull className="size-3.5" />
        </span>
      </div>

      <div className="relative flex flex-col items-center gap-1 border-b bg-surface-2/60 px-4 pt-1 pb-2.5">
        <ChevronLeft className="absolute top-3 left-3 size-5 text-brand" />
        <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-sm font-semibold text-brand-strong">
          {initials(TEMPLATE_SENDER)}
        </span>
        <span className="flex max-w-full items-center gap-0.5 text-xs font-medium">
          <span className="truncate">{TEMPLATE_SENDER}</span>
          <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
        </span>
      </div>

      <div className="flex min-h-56 flex-col gap-2 px-3 py-4">
        <p className="text-center text-[10px] text-muted-foreground">
          <span className="font-medium">{t("templates.preview.textMessage")}</span>
          {" · "}
          {t("time.today")} 9:41
        </p>
        {text ? (
          <div
            dir="auto"
            className="max-h-52 max-w-[80%] overflow-y-auto rounded-[1.1rem] rounded-bl-sm bg-muted px-3 py-2 text-sm leading-snug wrap-break-word whitespace-pre-wrap"
          >
            {text}
          </div>
        ) : (
          <p className="mt-6 text-center text-xs">
            <Missing field="message" />
          </p>
        )}
      </div>

      <div className="flex items-center gap-2 border-t px-3 py-2.5">
        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground">
          <Plus className="size-4" />
        </span>
        <span className="flex flex-1 items-center justify-between rounded-full border px-3 py-1 text-xs text-muted-foreground">
          {t("templates.preview.textMessage")}
          <ArrowUp className="size-3.5" />
        </span>
      </div>
    </div>
  );
}
