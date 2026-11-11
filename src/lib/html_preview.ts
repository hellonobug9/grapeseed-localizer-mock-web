import { plainText } from "@/lib/format";

// Row excerpts need block boundaries without changing the shared text formatter's callers.
export const htmlPreviewText = (html: string | null | undefined) => {
  if (!html) return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  doc.querySelectorAll("script, style, template, noscript").forEach((node) => node.remove());
  doc.body
    .querySelectorAll("p, div, section, article, h1, h2, h3, h4, h5, h6, br, hr, li, td, th, tr")
    .forEach((node) => {
      node.before(" ");
      node.after(" ");
    });
  return plainText(doc.body.innerHTML);
};

const escapeHtml = (text: string) =>
  text.replace(
    /[&<>"]/g,
    (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[character]!,
  );

export const htmlPreviewDoc = (text: string, lang: string) => {
  const isHtml = /<[a-z][\s\S]*>/i.test(text);
  return `<!doctype html><html lang="${escapeHtml(lang)}" dir="auto"><meta charset="utf-8"><base target="_blank">
    <meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src https: data:; style-src 'unsafe-inline'">
    <style>body{font:14px/1.6 system-ui,-apple-system,"Segoe UI",sans-serif;color:#0f1b2d;margin:14px 16px;${isHtml ? "" : "white-space:pre-wrap;"}}h1,h2,h3{line-height:1.3}a{color:#2563eb}</style>${isHtml ? text : escapeHtml(text)}`;
};
