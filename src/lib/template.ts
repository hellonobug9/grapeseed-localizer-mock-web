import { SOURCE_LANGUAGE } from "@/constants/language";
import {
  EMAIL_SUBJECT_VISIBLE,
  SMS_LIMITS,
  SmsEncoding,
  TEMPLATE_LONG_RATIO,
  TEMPLATE_SAMPLE_VALUES,
  TEMPLATE_TITLE_MAX,
  TemplateStatus,
  TemplateType,
  TranslationState,
} from "@/constants/template";
import type { Template, TemplateContent, TemplateIssue, TemplateRow } from "@/types/template";

export const PLACEHOLDER_PATTERN = /\{[A-Za-z][A-Za-z0-9_]*\}/g;

// Notification turns #[text](url) into a link when it sends an email.
const LINK_PATTERN = /#\[([^\]]*)\]\(([^)\s]+)\)/g;

export const placeholderList = (text: string) => [
  ...new Set(text.match(PLACEHOLDER_PATTERN) ?? []),
];

const linkUrls = (text: string) => [...text.matchAll(LINK_PATTERN)].map((match) => match[2]);

export const fillPlaceholders = (text: string) =>
  text.replace(
    PLACEHOLDER_PATTERN,
    (placeholder) => TEMPLATE_SAMPLE_VALUES[placeholder] ?? placeholder,
  );

const contentIn = (template: Template, language: string, releaseId: number | null) =>
  template.contents.find(
    (content) => content.language === language && content.releaseId === releaseId,
  );

const liveContent = (template: Template, language: string) =>
  template.contents.find(
    (content) => content.language === language && content.status === TemplateStatus.Published,
  );

const translationState = (source?: TemplateContent, target?: TemplateContent): TranslationState => {
  if (!source) return TranslationState.NoSource;
  if (!target) return TranslationState.Missing;
  if (target.status === TemplateStatus.Archived) return TranslationState.Archived;
  if (source.updatedAt > target.updatedAt) return TranslationState.Outdated;
  return target.status === TemplateStatus.Published
    ? TranslationState.Published
    : TranslationState.Draft;
};

// Each side is the content in the selected release, else the published (live) one.
export const templateRow = (
  template: Template,
  language: string,
  releaseId: number | null,
): TemplateRow => {
  const source =
    contentIn(template, SOURCE_LANGUAGE, releaseId) ?? liveContent(template, SOURCE_LANGUAGE);
  const target = contentIn(template, language, releaseId) ?? liveContent(template, language);
  const base =
    source && target && target.releaseId !== source.releaseId
      ? contentIn(template, SOURCE_LANGUAGE, target.releaseId)
      : undefined;
  return { template, source, target, base, state: translationState(source, target) };
};

// Published or archived content of the selected release is read-only; anything else saves as a draft.
export const canEditRow = (row: TemplateRow, releaseId: number | null) =>
  !!row.source &&
  (!row.target || row.target.releaseId !== releaseId || row.target.status === TemplateStatus.Draft);

const checkPlaceholders = (source: string, target: string): TemplateIssue[] => {
  const sourceKeys = placeholderList(source);
  const targetKeys = placeholderList(target);
  const sameKey = (a: string, b: string) => a.toLowerCase() === b.toLowerCase();
  const issues: TemplateIssue[] = [];
  for (const key of sourceKeys) {
    if (targetKeys.includes(key)) continue;
    const wrongCase = targetKeys.find((other) => sameKey(other, key));
    issues.push(
      wrongCase
        ? {
            code: "placeholderCase",
            level: "error",
            params: { placeholder: wrongCase, expected: key },
          }
        : { code: "missingPlaceholder", level: "error", params: { placeholder: key } },
    );
  }
  for (const key of targetKeys) {
    if (!sourceKeys.some((other) => sameKey(other, key))) {
      issues.push({ code: "unknownPlaceholder", level: "error", params: { placeholder: key } });
    }
  }
  return issues;
};

const checkLinks = (source: string, target: string): TemplateIssue[] => {
  const targetUrls = linkUrls(target);
  return linkUrls(source)
    .filter((url) => !targetUrls.includes(url))
    .map((url) => ({ code: "missingLink", level: "error", params: { url } }));
};

export const checkText = (source: string, target: string): TemplateIssue[] =>
  target.trim() ? [...checkPlaceholders(source, target), ...checkLinks(source, target)] : [];

export const checkTitle = (type: TemplateType, source: string, target: string): TemplateIssue[] => {
  if (!target.trim()) return [];
  const issues = checkText(source, target);
  if (target.length > TEMPLATE_TITLE_MAX) {
    issues.push({ code: "tooLong", level: "error", params: { limit: TEMPLATE_TITLE_MAX } });
  } else if (type === TemplateType.Email && target.length > EMAIL_SUBJECT_VISIBLE) {
    issues.push({ code: "subjectLong", level: "info", params: { limit: EMAIL_SUBJECT_VISIBLE } });
  }
  if (target.length > source.length * TEMPLATE_LONG_RATIO)
    issues.push({ code: "muchLonger", level: "info" });
  return issues;
};

const GSM_CHARS = new Set(
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà",
);

// Each of these takes two characters in a GSM-7 message.
const GSM_EXTENDED = new Set("^{}\\[~]|€");

// Encoding, length and number of messages, counted with sample values in place of placeholders.
export const smsInfo = (text: string) => {
  const chars = [...fillPlaceholders(text)];
  const isGsm = chars.every((char) => GSM_CHARS.has(char) || GSM_EXTENDED.has(char));
  const encoding = isGsm ? SmsEncoding.Gsm : SmsEncoding.Ucs2;
  const length = isGsm
    ? chars.reduce((sum, char) => sum + (GSM_EXTENDED.has(char) ? 2 : 1), 0)
    : chars.reduce((sum, char) => sum + char.length, 0);
  const limit = SMS_LIMITS[encoding];
  const parts = length === 0 ? 0 : length <= limit.single ? 1 : Math.ceil(length / limit.part);
  return { encoding, length, parts };
};

export const checkSms = (source: string, target: string): TemplateIssue[] => {
  if (!target.trim()) return [];
  const issues = checkText(source, target);
  const sourceParts = smsInfo(source).parts;
  const targetParts = smsInfo(target).parts;
  if (targetParts > sourceParts) {
    issues.push({
      code: "smsParts",
      level: "info",
      params: { count: targetParts, source: sourceParts },
    });
  }
  return issues;
};

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "hr",
  "div",
  "span",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "s",
  "del",
  "sub",
  "sup",
  "small",
  "code",
  "pre",
  "blockquote",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "ul",
  "ol",
  "li",
  "a",
  "img",
  "table",
  "thead",
  "tbody",
  "tfoot",
  "tr",
  "td",
  "th",
  "caption",
]);

const ALLOWED_ATTRIBUTES = new Set([
  "href",
  "target",
  "src",
  "alt",
  "width",
  "height",
  "colspan",
  "rowspan",
  "align",
]);

const ALLOWED_STYLES = new Set([
  "color",
  "background-color",
  "text-align",
  "font-weight",
  "font-style",
  "text-decoration",
  "font-size",
]);

const ESCAPES: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#39;",
};

const escapeHtml = (text: string) => text.replace(/[&<>"']/g, (c) => ESCAPES[c]);

const isSafeUrl = (name: string, url: string) =>
  name === "src" ? /^(https:|data:image\/)/i.test(url) : /^(https?:|mailto:|\/|#)/i.test(url);

const attributesOf = (element: HTMLElement) => {
  const attributes = [...element.attributes]
    .filter(
      ({ name, value }) =>
        ALLOWED_ATTRIBUTES.has(name) && (!["href", "src"].includes(name) || isSafeUrl(name, value)),
    )
    .map(({ name, value }) => ` ${name}="${escapeHtml(value)}"`);
  const style = [...element.style]
    .filter((property) => ALLOWED_STYLES.has(property))
    .map((property) => `${property}: ${element.style.getPropertyValue(property)}`)
    .join("; ");
  return attributes.join("") + (style ? ` style="${escapeHtml(style)}"` : "");
};

const serialize = (node: Node): string => {
  if (node.nodeType === Node.TEXT_NODE) return escapeHtml(node.textContent ?? "");
  if (!(node instanceof HTMLElement)) return "";
  const children = [...node.childNodes].map(serialize).join("");
  const tag = node.tagName.toLowerCase();
  if (!ALLOWED_TAGS.has(tag)) return children;
  if (["br", "hr", "img"].includes(tag)) return `<${tag}${attributesOf(node)}>`;
  return `<${tag}${attributesOf(node)}>${children}</${tag}>`;
};

// Keeps the formatting the Notification editor produces (colors, alignment, tables) and drops anything executable.
export const safeHtml = (html: string) => {
  const doc = new DOMParser().parseFromString(html, "text/html");
  return [...doc.body.childNodes].map(serialize).join("");
};

export const previewHtml = (html: string) =>
  safeHtml(
    fillPlaceholders(
      html.replace(LINK_PATTERN, (_, text: string, url: string) => `<a href="${url}">${text}</a>`),
    ),
  );

const BLANK_LINES = /(?:[^\S\n]*\n){3,}/g;

export const collapseBlankLines = (text: string) => text.replace(BLANK_LINES, "\n\n");
