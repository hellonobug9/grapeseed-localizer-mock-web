import { BLOCK_TAGS } from "@/lib/template_segments";

// Pretty-printing for the HTML translation editor. Only the whitespace around
// block tags changes, so the rendered output stays the same: inline tags and
// text inside a block keep sharing one line.

const TOKEN_PATTERN = /(<[^>]*>)/;
const INDENT = "  ";

const blockTag = (token: string) => {
  const match = /^<(\/?)([a-z][\w-]*)/i.exec(token);
  if (!match || !BLOCK_TAGS.has(match[2].toLowerCase())) return null;
  return { closing: match[1] === "/", void: match[2].toLowerCase() === "hr" || token.endsWith("/>") };
};

const tokensOf = (html: string) => html.split(TOKEN_PATTERN).filter(Boolean);

export const formatHtml = (html: string) => {
  const tokens = tokensOf(compactHtml(html));
  const open: { hasBlockChild: boolean }[] = [];
  let out = "";
  let last: "open" | "close" | "inline" | null = null;
  const newLine = () => {
    if (out) out += "\n";
    out += INDENT.repeat(open.length);
  };

  for (const token of tokens) {
    const block = blockTag(token);
    if (block && !block.closing) {
      if (open.length) open[open.length - 1].hasBlockChild = true;
      newLine();
      out += token;
      if (block.void) last = "close";
      else {
        open.push({ hasBlockChild: false });
        last = "open";
      }
    } else if (block) {
      const frame = open.pop();
      if (frame?.hasBlockChild || last === "close") newLine();
      out += token;
      last = "close";
    } else {
      if (last === "close") newLine();
      out += token;
      last = "inline";
    }
  }
  return out;
};

// Reverses formatHtml: drops line breaks and indentation next to block tags.
export const compactHtml = (html: string) => {
  const tokens = tokensOf(html);
  return tokens
    .map((token, index) => {
      if (token.startsWith("<")) return token;
      let text = token;
      if (index > 0 && blockTag(tokens[index - 1])) text = text.replace(/^\s*\n\s*/, "");
      if (index < tokens.length - 1 && blockTag(tokens[index + 1]))
        text = text.replace(/\s*\n\s*$/, "");
      return text;
    })
    .join("");
};
