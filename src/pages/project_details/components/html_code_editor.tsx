import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useMemo, useRef, type ComponentProps } from "react";

// A textarea with a highlighted copy of its text drawn behind it: tags are
// muted and placeholders use the brand color, so the words to translate stand
// out. Both layers share the same box and text metrics, so only colors may
// differ between them (no font weight or size changes).
const HIGHLIGHT_PATTERN = /(<[^>]*>|\{[A-Za-z][A-Za-z0-9_]*\})/;

const TEXT_BOX =
  "p-4 text-sm leading-relaxed whitespace-pre-wrap wrap-break-word [scrollbar-gutter:stable]";

type HtmlCodeEditorProps = Omit<ComponentProps<"textarea">, "value"> & {
  value: string;
  wrapperClassName?: string;
};

export function HtmlCodeEditor({
  value,
  className,
  wrapperClassName,
  onScroll,
  ...props
}: HtmlCodeEditorProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const parts = useMemo(() => value.split(HIGHLIGHT_PATTERN), [value]);

  return (
    <div className={cn("relative", wrapperClassName)}>
      <div
        ref={backdropRef}
        aria-hidden="true"
        dir={props.dir}
        className={cn(
          TEXT_BOX,
          "pointer-events-none absolute inset-0 overflow-hidden rounded-lg border border-transparent",
        )}
      >
        {parts.map((part, index) =>
          index % 2 === 0 ? (
            part
          ) : (
            <span
              key={index}
              className={part.startsWith("<") ? "text-muted-foreground/80" : "text-brand"}
            >
              {part}
            </span>
          ),
        )}
        {/* Keeps a trailing empty line as tall as the textarea's. */}
        {value.endsWith("\n") && " "}
      </div>
      <Textarea
        {...props}
        value={value}
        spellCheck={false}
        onScroll={(event) => {
          if (backdropRef.current) {
            backdropRef.current.scrollTop = event.currentTarget.scrollTop;
            backdropRef.current.scrollLeft = event.currentTarget.scrollLeft;
          }
          onScroll?.(event);
        }}
        className={cn(TEXT_BOX, "relative text-transparent caret-foreground", className)}
      />
    </div>
  );
}
