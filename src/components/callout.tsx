import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type CalloutProps = {
  icon: LucideIcon;
  tone?: "info" | "warn";
  className?: string;
  children: ReactNode;
};

export function Callout({ icon: Icon, tone = "info", className, children }: CalloutProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border px-4 py-3.5 text-sm text-text-2",
        tone === "warn" ? "border-warn-line bg-warn-bg" : "border-brand-muted bg-brand-soft",
        className,
      )}
    >
      <Icon
        className={cn("mt-0.5 size-4 shrink-0", tone === "warn" ? "text-warn" : "text-brand")}
      />
      <div>{children}</div>
    </div>
  );
}
