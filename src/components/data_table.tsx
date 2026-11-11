import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function DataTable({ className, ...props }: ComponentProps<"table">) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={cn("w-full text-sm", className)} {...props} />
    </div>
  );
}

export function Th({ className, numeric, ...props }: ComponentProps<"th"> & { numeric?: boolean }) {
  return (
    <th
      className={cn(
        "border-b bg-surface-2 px-4 py-2.5 text-left text-xs font-semibold tracking-wider whitespace-nowrap text-muted-foreground uppercase",
        numeric && "text-right",
        className,
      )}
      {...props}
    />
  );
}

export function Tr({ className, ...props }: ComponentProps<"tr">) {
  return <tr className={cn("border-b last:border-b-0 hover:bg-[#fafcff]", className)} {...props} />;
}

export function Td({ className, numeric, ...props }: ComponentProps<"td"> & { numeric?: boolean }) {
  return (
    <td
      className={cn("px-4 py-3 align-middle", numeric && "text-right tabular-nums", className)}
      {...props}
    />
  );
}
