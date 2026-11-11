import { coverageTone, type CoverageTone } from "@/lib/coverage";
import { cn } from "@/lib/utils";

type CoverageBarProps = {
  value: number;
  showValue?: boolean | "hover";
  className?: string;
};

const TRACK_TONES: Record<CoverageTone, string> = {
  bad: "bg-red-600",
  warn: "bg-amber-600",
  good: "bg-emerald-600",
};

export function CoverageTrack({ value, className }: { value: number; className?: string }) {
  return (
    <div
      className={cn("h-1.5 flex-1 overflow-hidden rounded-full bg-[#e8edf5]", className)}
      title={`${value.toFixed(1)}% translated`}
    >
      <div
        className={cn("h-full rounded-full", TRACK_TONES[coverageTone(value)])}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}

export function CoverageBar({ value, showValue = true, className }: CoverageBarProps) {
  return (
    <div className={cn("group/coverage flex min-w-35 items-center gap-2.5", className)}>
      <CoverageTrack value={value} />
      {showValue && (
        <span
          className={cn(
            "min-w-[3.2em] text-right text-sm font-semibold tabular-nums",
            showValue === "hover" &&
              "opacity-0 transition-opacity group-hover/coverage:opacity-100",
          )}
        >
          {value.toFixed(0)}%
        </span>
      )}
    </div>
  );
}
