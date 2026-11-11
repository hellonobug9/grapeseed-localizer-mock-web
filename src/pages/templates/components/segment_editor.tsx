import { Pill } from "@/components/pill";
import { Segmented } from "@/components/segmented";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { placeholderList } from "@/lib/template";
import { checkSegment, tokenMarkup } from "@/lib/template_segments";
import { cn } from "@/lib/utils";
import { IssueList } from "@/pages/templates/components/issue_list";
import { describeToken } from "@/pages/templates/components/labels";
import { SegmentText } from "@/pages/templates/components/segment_text";
import type { Segment, SegmentToken, TemplateIssue } from "@/types/template";
import { ArrowDown, ClipboardPaste } from "lucide-react";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";

type SegmentFilter = "all" | "todo";

type SegmentEditorProps = {
  lang: string;
  segments: Segment[];
  texts: string[];
  initialTexts: string[];
  // English each segment had when it was translated, or null when it did not change
  previous: (string | null)[] | null;
  readOnly: boolean;
  onChange: (index: number, text: string) => void;
};

export function SegmentEditor({
  lang,
  segments,
  texts,
  initialTexts,
  previous,
  readOnly,
  onChange,
}: SegmentEditorProps) {
  const { t } = useTranslation();
  // Snapshot of the to-do segments, so a row doesn't vanish while it is being typed in.
  const [todoIndexes, setTodoIndexes] = useState<number[] | null>(null);
  const [active, setActive] = useState<number | null>(null);
  const inputs = useRef(new Map<number, HTMLTextAreaElement>());

  const rows = segments
    .map((segment, index) => {
      const text = texts[index] ?? "";
      const issues = readOnly ? [] : checkSegment(segment, text);
      const changedFrom =
        previous?.[index] != null && text === initialTexts[index] ? previous[index] : null;
      const todo =
        !text.trim() || changedFrom !== null || issues.some((issue) => issue.level === "error");
      return { segment, index, text, issues, changedFrom, todo };
    })
    .filter((row) => !row.segment.fixed)
    .map((row, position) => ({ ...row, number: position + 1 }));

  const translated = rows.filter((row) => row.text.trim()).length;
  const todoCount = rows.filter((row) => row.todo).length;
  const filter: SegmentFilter = todoIndexes ? "todo" : "all";
  const shown =
    todoIndexes && !readOnly ? rows.filter((row) => todoIndexes.includes(row.index)) : rows;

  const changeFilter = (value: SegmentFilter) =>
    setTodoIndexes(
      value === "todo" ? rows.filter((row) => row.todo).map((row) => row.index) : null,
    );

  const goToNext = () => {
    const pending = rows.filter((row) => row.todo);
    const next = pending.find((row) => active === null || row.index > active) ?? pending[0];
    if (!next) return;
    const input = inputs.current.get(next.index);
    input?.scrollIntoView({ block: "center", behavior: "smooth" });
    input?.focus({ preventScroll: true });
  };

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 pb-2">
        <span className="text-xs text-muted-foreground tabular-nums">
          {t("templates.segments.progress", {
            translated,
            total: rows.length,
          })}
        </span>
        {!readOnly && (
          <>
            <Segmented
              size="sm"
              className="ml-auto"
              value={filter}
              onChange={changeFilter}
              options={[
                {
                  value: "all",
                  label: t("templates.segments.filter.all"),
                  count: rows.length,
                },
                {
                  value: "todo",
                  label: t("templates.segments.filter.todo"),
                  count: todoCount,
                },
              ]}
            />
            <Button variant="outline" size="xs" disabled={todoCount === 0} onClick={goToNext}>
              <ArrowDown /> {t("templates.segments.next")}
            </Button>
          </>
        )}
      </div>

      {!readOnly && (
        <p className="pb-2 text-xs text-muted-foreground">{t("templates.segments.hint")}</p>
      )}

      {shown.length === 0 && (
        <p className="border-t py-4 text-center text-sm text-muted-foreground">
          {t("templates.segments.noTodo")}
        </p>
      )}

      {shown.map((row) => (
        <SegmentRow
          key={row.index}
          lang={lang}
          number={row.number}
          segment={row.segment}
          text={row.text}
          issues={row.issues}
          changedFrom={row.changedFrom}
          active={active === row.index}
          readOnly={readOnly}
          inputRef={(element) => {
            if (element) inputs.current.set(row.index, element);
            else inputs.current.delete(row.index);
          }}
          onFocus={() => setActive(row.index)}
          onChange={(text) => onChange(row.index, text)}
        />
      ))}
    </div>
  );
}

type SegmentRowProps = {
  lang: string;
  number: number;
  segment: Segment;
  text: string;
  issues: TemplateIssue[];
  changedFrom: string | null;
  active: boolean;
  readOnly: boolean;
  inputRef: (element: HTMLTextAreaElement | null) => void;
  onFocus: () => void;
  onChange: (text: string) => void;
};

function SegmentRow({
  lang,
  number,
  segment,
  text,
  issues,
  changedFrom,
  active,
  readOnly,
  inputRef,
  onFocus,
  onChange,
}: SegmentRowProps) {
  const { t } = useTranslation();
  const input = useRef<HTMLTextAreaElement | null>(null);
  const hasError = issues.some((issue) => issue.level === "error");
  const placeholders = placeholderList(segment.text);

  // Wraps the selection with a tag pair, or inserts at the caret.
  const insert = (before: string, after = "") => {
    const element = input.current;
    if (!element) return;
    const { selectionStart: start, selectionEnd: end } = element;
    onChange(text.slice(0, start) + before + text.slice(start, end) + after + text.slice(end));
    requestAnimationFrame(() => {
      element.focus();
      element.setSelectionRange(start + before.length, end + before.length);
    });
  };

  const insertToken = (token: SegmentToken) =>
    token.isVoid ? insert(`<${token.id}/>`) : insert(`<${token.id}>`, `</${token.id}>`);

  return (
    <div
      className={cn(
        "grid grid-cols-[1.5rem_minmax(0,1fr)] gap-x-2 border-t py-2.5",
        hasError && "shadow-[inset_2px_0_0_var(--color-bad)]",
      )}
    >
      <span className="pt-0.5 text-right font-mono text-xs text-muted-foreground">{number}</span>
      <div className="min-w-0">
        <div className="flex items-start gap-2">
          <SegmentText
            text={segment.text}
            tokens={segment.tokens}
            className="min-w-0 flex-1 text-xs leading-relaxed text-text-2"
          />
          {changedFrom !== null && (
            <Pill tone="warn" size="xs">
              {t("templates.field.englishChanged")}
            </Pill>
          )}
          {!readOnly && (
            <Button
              variant="ghost"
              size="icon-xs"
              aria-label={t("templates.field.useSource")}
              title={t("templates.field.useSource")}
              onClick={() => onChange(segment.text)}
            >
              <ClipboardPaste />
            </Button>
          )}
        </div>
        {changedFrom !== null && (
          <SegmentText
            text={changedFrom}
            tokens={segment.tokens}
            className="mt-1 text-xs text-muted-foreground line-through"
          />
        )}

        {readOnly ? (
          <SegmentText text={text} tokens={segment.tokens} lang={lang} className="mt-1.5 text-sm" />
        ) : (
          <Textarea
            ref={(element) => {
              input.current = element;
              inputRef(element);
            }}
            lang={lang}
            dir="auto"
            rows={1}
            value={text}
            placeholder={t("templates.field.placeholder")}
            aria-label={t("templates.segments.label", { number })}
            aria-invalid={hasError}
            onFocus={onFocus}
            onChange={(event) => onChange(event.target.value)}
            className="mt-1.5 min-h-9 resize-none py-1.5"
          />
        )}

        {active && !readOnly && (segment.tokens.length > 0 || placeholders.length > 0) && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <span className="mr-0.5 text-xs text-muted-foreground">
              {t("templates.segments.insert")}
            </span>
            {segment.tokens.map((token) => (
              <Button
                key={token.id}
                variant="outline"
                size="xs"
                className="font-mono"
                title={describeToken(token, t)}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => insertToken(token)}
              >
                {tokenMarkup(token)}
              </Button>
            ))}
            {placeholders.map((placeholder) => (
              <Button
                key={placeholder}
                variant="outline"
                size="xs"
                className="font-mono text-brand-strong"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => insert(placeholder)}
              >
                {placeholder}
              </Button>
            ))}
          </div>
        )}

        <IssueList issues={issues} />
      </div>
    </div>
  );
}
