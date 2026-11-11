import type { ReactNode } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";

type CheckTileProps = {
  checked: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
};

export function CheckTile({
  checked,
  onCheckedChange,
  disabled,
  className,
  children,
}: CheckTileProps) {
  return (
    <label
      className={cn(
        "flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors",
        checked && "border-brand-line bg-brand-soft",
        disabled && !checked && "cursor-not-allowed opacity-50",
        className,
      )}
    >
      <Checkbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={(v) => onCheckedChange?.(v === true)}
      />
      {children}
    </label>
  );
}

export function CheckGrid({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-1.5", className)}>
      {children}
    </div>
  );
}

type OptionTileProps = {
  value: string;
  checked: boolean;
  title: ReactNode;
  description?: ReactNode;
  className?: string;
};

export function OptionTile({ value, checked, title, description, className }: OptionTileProps) {
  return (
    <label
      className={cn(
        "mb-2 flex cursor-pointer gap-3 rounded-lg border px-4 py-3 transition-colors hover:border-brand-line",
        checked && "border-brand bg-brand-soft hover:border-brand",
        className,
      )}
    >
      <RadioGroupItem value={value} className="mt-0.5" />
      <span>
        <span className="block text-sm font-semibold">{title}</span>
        {description && <span className="text-xs text-muted-foreground">{description}</span>}
      </span>
    </label>
  );
}
