import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Panel } from "@/components/panel";
import { cn } from "@/lib/utils";

const ICON_TONES = {
  blue: "bg-brand-soft text-brand",
  warn: "bg-warn-bg text-warn",
  good: "bg-good-bg text-good",
  bad: "bg-bad-bg text-bad",
};

type KpiCardProps = {
  label: string;
  value: ReactNode;
  footer?: ReactNode;
  icon?: LucideIcon;
  iconTone?: keyof typeof ICON_TONES;
  valueClassName?: string;
  valueTitle?: string;
};

export function KpiCard({
  label,
  value,
  footer,
  icon: Icon,
  iconTone = "blue",
  valueClassName,
  valueTitle,
}: KpiCardProps) {
  return (
    <Panel className="flex h-full flex-col gap-1.5 px-5 py-[1.15rem]">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-2">{label}</span>
        {Icon && (
          <span
            className={cn("grid size-9 place-items-center rounded-[10px]", ICON_TONES[iconTone])}
          >
            <Icon className="size-[1.1rem]" />
          </span>
        )}
      </div>
      <div
        className={cn(
          "text-3xl leading-tight font-bold tracking-tight tabular-nums",
          valueClassName,
        )}
        title={valueTitle}
      >
        {value}
      </div>
      {footer && <div className="text-xs text-muted-foreground">{footer}</div>}
    </Panel>
  );
}

export function MiniStat({
  value,
  label,
  valueClassName,
  title,
}: {
  value: ReactNode;
  label: ReactNode;
  valueClassName?: string;
  title?: string;
}) {
  return (
    <div className="rounded-lg border bg-surface-2 px-3 py-2" title={title}>
      <div className={cn("text-lg font-bold tabular-nums", valueClassName)}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
