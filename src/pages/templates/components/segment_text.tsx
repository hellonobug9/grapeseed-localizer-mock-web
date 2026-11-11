import { Pill } from "@/components/pill";
import { cn } from "@/lib/utils";
import { describeToken } from "@/pages/templates/components/labels";
import type { SegmentToken } from "@/types/template";
import { useTranslation } from "react-i18next";

const PART_PATTERN = /(<\/?\d+\/?>|\{[A-Za-z][A-Za-z0-9_]*\})/;

type SegmentTextProps = {
  text: string;
  tokens?: SegmentToken[];
  className?: string;
  lang?: string;
};

// Text of a segment with its tag tokens and placeholders shown as chips.
export function SegmentText({ text, tokens = [], className, lang }: SegmentTextProps) {
  const { t } = useTranslation();

  return (
    <p lang={lang} className={cn("break-words whitespace-pre-wrap", className)}>
      {text.split(PART_PATTERN).map((part, index) => {
        if (index % 2 === 0) return part;
        if (part.startsWith("{")) {
          return (
            <Pill key={index} tone="blue" size="xs" className="mx-px font-mono font-medium">
              {part}
            </Pill>
          );
        }
        const token = tokens.find((item) => item.id === Number(part.replace(/\D/g, "")));
        return (
          <Pill
            key={index}
            size="xs"
            className="mx-px font-mono font-medium"
            title={token ? describeToken(token, t) : undefined}
          >
            {part}
          </Pill>
        );
      })}
    </p>
  );
}
