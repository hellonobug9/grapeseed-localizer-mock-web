import { cn } from "@/lib/utils";
import type { Environment } from "@/types/publish";

export function EnvBadge({ env, className }: { env: Environment; className?: string }) {
  return (
    <span
      className={cn(
        "rounded-md px-2 py-0.5 text-xs font-bold tracking-wider",
        env === "LIVE" ? "bg-live text-white" : "bg-test-bg text-test",
        className,
      )}
    >
      {env}
    </span>
  );
}
