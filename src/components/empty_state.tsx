import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

type EmptyStateProps = {
  icon?: LucideIcon;
  iconClassName?: string;
  title: ReactNode;
  children?: ReactNode;
};

export function EmptyState({ icon: Icon, iconClassName, title, children }: EmptyStateProps) {
  return (
    <div className="px-4 py-12 text-center text-muted-foreground">
      {Icon && <Icon className={cn("mx-auto mb-3 size-9 text-brand-line", iconClassName)} />}
      <h3 className="text-base font-semibold text-foreground">{title}</h3>
      {children && <div className="mt-1">{children}</div>}
    </div>
  );
}
