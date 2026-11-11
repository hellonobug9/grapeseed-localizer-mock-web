import { Fragment } from "react";

export function Highlight({
  text,
  query,
}: {
  text: string | null | undefined;
  query?: string | null;
}) {
  if (!text) return null;
  const q = query?.trim();
  if (!q) return <>{text}</>;

  const lower = text.toLowerCase();
  const needle = q.toLowerCase();
  const parts: { text: string; hit: boolean }[] = [];
  let i = 0;
  for (let hit = lower.indexOf(needle); hit >= 0; hit = lower.indexOf(needle, i)) {
    if (hit > i) parts.push({ text: text.slice(i, hit), hit: false });
    parts.push({ text: text.slice(hit, hit + q.length), hit: true });
    i = hit + q.length;
  }
  if (i < text.length) parts.push({ text: text.slice(i), hit: false });

  return (
    <>
      {parts.map((part, index) => (
        <Fragment key={index}>{part.hit ? <mark>{part.text}</mark> : part.text}</Fragment>
      ))}
    </>
  );
}
