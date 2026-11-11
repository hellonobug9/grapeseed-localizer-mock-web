import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Panel({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card shadow-[0_1px_2px_rgba(16,38,84,.05),0_1px_3px_rgba(16,38,84,.04)]",
        className,
      )}
      {...props}
    />
  );
}

type PanelHeaderProps = {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
};

export function PanelHeader({ title, description, actions, className }: PanelHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 border-b px-5 py-4",
        className,
      )}
    >
      <div>
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <div className="mt-0.5 text-sm text-muted-foreground">{description}</div>}
      </div>
      {actions}
    </div>
  );
}

export function PanelToolbar({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex flex-wrap items-center gap-2.5 border-b px-5 py-4", className)}
      {...props}
    />
  );
}
