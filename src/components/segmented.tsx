import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type SegmentOption<T extends string> = {
  value: T;
  label: ReactNode;
  count?: number;
};

type SegmentedProps<T extends string> = {
  value: T;
  options: SegmentOption<T>[];
  onChange: (value: T) => void;
  size?: "default" | "sm";
  stretch?: boolean;
  className?: string;
};

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  size = "default",
  stretch,
  className,
}: SegmentedProps<T>) {
  return (
    <div
      role="radiogroup"
      className={cn(
        "inline-flex flex-wrap gap-0.5 rounded-[10px] bg-secondary p-[3px]",
        stretch && "flex w-full",
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "inline-flex items-center justify-center gap-1.5 rounded-lg font-medium whitespace-nowrap text-text-2 transition-colors hover:text-foreground [&_svg]:size-3.5",
            size === "sm" ? "px-2.5 py-1 text-xs" : "px-3 py-1.5 text-sm",
            stretch && "flex-1",
            value === option.value && "bg-card text-brand-strong shadow-sm hover:text-brand-strong",
          )}
        >
          {option.label}
          {option.count !== undefined && (
            <span className="text-xs text-muted-foreground">{option.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
