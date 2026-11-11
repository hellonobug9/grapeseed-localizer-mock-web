import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const pillVariants = cva(
  "inline-flex items-center gap-1 rounded-full font-semibold whitespace-nowrap leading-tight [&_svg]:size-3 [&_svg]:shrink-0",
  {
    variants: {
      tone: {
        blue: "bg-brand-soft text-brand-strong",
        gray: "bg-muted text-text-2",
        good: "bg-good-bg text-good",
        warn: "bg-warn-bg text-warn",
        bad: "bg-bad-bg text-bad",
        new: "bg-brand text-white tracking-wide",
        dev: "bg-brand-soft text-brand-strong",
        comtor: "bg-comtor-bg text-comtor",
        admin: "bg-admin-bg text-admin",
      },
      size: {
        default: "px-2 py-0.5 text-xs",
        xs: "px-1.5 py-px text-xs",
      },
    },
    defaultVariants: { tone: "gray", size: "default" },
  },
);

type PillProps = ComponentProps<"span"> & VariantProps<typeof pillVariants>;

export function Pill({ className, tone, size, ...props }: PillProps) {
  return <span className={cn(pillVariants({ tone, size }), className)} {...props} />;
}
