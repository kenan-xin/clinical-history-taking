import * as React from "react";
import { cn } from "@/lib/utils";

function Badge({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="badge"
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full bg-primary-soft px-3 py-1 text-fxs font-semibold text-primary-strong whitespace-nowrap",
        className,
      )}
      {...props}
    />
  );
}

export { Badge };
