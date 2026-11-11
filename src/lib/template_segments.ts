import { checkText } from "@/lib/template";
import type { Segment, SegmentToken, TemplateIssue } from "@/types/template";

// A body is translated block by block: every leaf block (p, h1, li…) becomes one segment whose inline
// tags are written as numbered tokens, e.g. `Hi <1>{TeacherName}</1>`. The translation is put back into
// a copy of the English markup, so tags, attributes and styles always come from the English.

export const BLOCK_TAGS = new Set([
  "address",
  "article",
  "aside",
  "blockquote",
  "caption",
  "dd",
  "div",
  "dl",
  "dt",
  "figcaption",
  "figure",
  "footer",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "header",
  "hr",
  "li",
  "main",
  "nav",
  "ol",
  "p",
  "pre",
  "section",
  "table",
  "tbody",
  "td",
  "tfoot",
  "th",
  "thead",
  "tr",
  "ul",
]);

const TEXT_BLOCK_TAGS = new Set([
  "address",
  "blockquote",
  "caption",
  "dd",
  "div",
  "dt",
  "figcaption",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "p",
  "pre",
  "td",
  "th",
]);

const VOID_TAGS = new Set(["img", "wbr"]);

const BLOCK_SELECTOR = [...BLOCK_TAGS].join(",");

export const TOKEN_PATTERN = /<(\/?)(\d+)(\/?)>|\n/g;

const tagOf = (element: Element) => element.tagName.toLowerCase();

const parse = (html: string) => new DOMParser().parseFromString(html, "text/html").body;

const containsBlock = (element: Element) =>
  BLOCK_TAGS.has(tagOf(element)) || element.querySelector(BLOCK_SELECTOR) !== null;

const hasContent = (node: Node) =>
  node.nodeType === Node.TEXT_NODE
    ? !!node.textContent?.trim()
    : node instanceof Element && tagOf(node) !== "br";

// Leaf blocks in reading order, or null when text sits next to blocks and can't be split.
const leafBlocks = (root: Element): Element[] | null => {
  const leaves: Element[] = [];
  const visit = (element: Element): boolean => {
    if (!element.querySelector(BLOCK_SELECTOR)) {
      if (element === root || TEXT_BLOCK_TAGS.has(tagOf(element)) || element.textContent?.trim())
        leaves.push(element);
      return true;
    }
    return [...element.childNodes].every((child) =>
      child instanceof Element && containsBlock(child) ? visit(child) : !hasContent(child),
    );
  };
  return visit(root) ? leaves : null;
};

const signature = (element: Element) =>
  [
    tagOf(element),
    ...[...element.attributes].map(({ name, value }) => `${name}=${value}`).sort(),
  ].join(" ");

const normalize = (text: string) =>
  text
    .replace(/[^\S\n]+/g, " ")
    .replace(/ *\n */g, "\n")
    .trim();

// Writes a leaf's content as token text; `idFor` gives the token of an inline element, or null if it has none.
const toText = (leaf: Element, idFor: (element: Element) => number | null): string | null => {
  let failed = false;
  const walk = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
    if (!(node instanceof Element)) return "";
    if (tagOf(node) === "br") return "\n";
    const id = idFor(node);
    if (id === null) {
      failed = true;
      return "";
    }
    if (VOID_TAGS.has(tagOf(node))) return `<${id}/>`;
    return `<${id}>${[...node.childNodes].map(walk).join("")}</${id}>`;
  };
  const text = normalize([...leaf.childNodes].map(walk).join(""));
  return failed ? null : text;
};

const analyze = (html: string) => {
  const root = parse(html);
  const leaves = leafBlocks(root);
  if (!leaves) return null;
  const shells: Element[][] = [];
  const segments = leaves.map((leaf): Segment => {
    const own: Element[] = [];
    const tokens: SegmentToken[] = [];
    const text = toText(leaf, (element) => {
      own.push(element.cloneNode(false) as Element);
      tokens.push({
        id: own.length,
        tag: tagOf(element),
        signature: signature(element),
        isVoid: VOID_TAGS.has(tagOf(element)),
        href: element.getAttribute("href"),
        style: element.getAttribute("style"),
      });
      return own.length;
    });
    shells.push(own);
    return { tag: tagOf(leaf), text: text ?? "", tokens, fixed: !leaf.textContent?.trim() };
  });
  return { root, leaves, segments, shells };
};

export const splitSegments = (html: string) => analyze(html)?.segments ?? null;

// The translation's text per English segment, or null when its markup doesn't line up with the English.
export const alignSegments = (sourceHtml: string, targetHtml: string): string[] | null => {
  const source = splitSegments(sourceHtml);
  if (!source) return null;
  const emptyText = (segment: Segment) => (segment.fixed ? segment.text : "");
  const root = parse(targetHtml);
  if (!root.textContent?.trim() && !root.querySelector("img")) return source.map(emptyText);
  const leaves = leafBlocks(root);
  if (!leaves || leaves.length !== source.length) return null;
  const texts: string[] = [];
  for (const [index, leaf] of leaves.entries()) {
    const segment = source[index];
    if (tagOf(leaf) !== segment.tag) return null;
    if (segment.fixed) {
      if (leaf.textContent?.trim()) return null;
      texts.push(segment.text);
      continue;
    }
    const used = new Set<number>();
    const text = toText(leaf, (element) => {
      const token = segment.tokens.find(
        (item) => item.signature === signature(element) && !used.has(item.id),
      );
      if (!token) return null;
      used.add(token.id);
      return token.id;
    });
    if (text === null) return null;
    texts.push(text);
  }
  return texts;
};

// Lenient on purpose so the preview keeps working while a token is half typed; checkSegment reports the error.
const buildNodes = (text: string, shells: Element[], doc: Document) => {
  const container = doc.createElement("div");
  const stack: { id: number | null; node: Element }[] = [{ id: null, node: container }];
  const append = (node: Node) => stack[stack.length - 1].node.appendChild(node);
  let last = 0;
  for (const match of text.matchAll(TOKEN_PATTERN)) {
    if (match.index > last) append(doc.createTextNode(text.slice(last, match.index)));
    last = match.index + match[0].length;
    if (match[0] === "\n") {
      append(doc.createElement("br"));
      continue;
    }
    const [, closing, rawId, selfClosing] = match;
    const id = Number(rawId);
    const shell = shells[id - 1];
    if (!shell) continue;
    if (closing) {
      const at = stack.findLastIndex((entry) => entry.id === id);
      if (at > 0) stack.length = at;
      continue;
    }
    const node = shell.cloneNode(false) as Element;
    append(node);
    if (!selfClosing && !VOID_TAGS.has(tagOf(node))) stack.push({ id, node });
  }
  if (last < text.length) append(doc.createTextNode(text.slice(last)));
  return [...container.childNodes];
};

// Rebuilds the body from the English markup and the translated texts; '' when nothing is translated.
export const joinSegments = (sourceHtml: string, texts: string[]) => {
  const source = analyze(sourceHtml);
  if (!source) return "";
  if (source.segments.every((segment, index) => segment.fixed || !texts[index]?.trim())) return "";
  source.leaves.forEach((leaf, index) => {
    if (source.segments[index].fixed) return;
    leaf.replaceChildren(
      ...buildNodes(texts[index] ?? "", source.shells[index], leaf.ownerDocument),
    );
  });
  return source.root.innerHTML;
};

export const tokenMarkup = (token: SegmentToken) =>
  token.isVoid ? `<${token.id}/>` : `<${token.id}>…</${token.id}>`;

export const checkSegment = (segment: Segment, text: string): TemplateIssue[] => {
  if (!text.trim()) return [];
  const issues = checkText(segment.text, text);
  const open: number[] = [];
  const seen = new Set<number>();
  let broken = false;
  for (const match of text.matchAll(TOKEN_PATTERN)) {
    if (match[0] === "\n") continue;
    const [, closing, rawId, selfClosing] = match;
    const id = Number(rawId);
    const token = segment.tokens.find((item) => item.id === id);
    if (!token || token.isVoid !== !!selfClosing) {
      issues.push({ code: "unknownTag", level: "error", params: { tag: match[0] } });
      continue;
    }
    seen.add(id);
    if (selfClosing) continue;
    if (closing) {
      if (open.pop() !== id) broken = true;
    } else {
      open.push(id);
    }
  }
  if (broken || open.length > 0) issues.push({ code: "brokenTag", level: "error" });
  for (const token of segment.tokens) {
    if (!seen.has(token.id))
      issues.push({ code: "missingTag", level: "error", params: { tag: tokenMarkup(token) } });
  }
  return issues;
};
