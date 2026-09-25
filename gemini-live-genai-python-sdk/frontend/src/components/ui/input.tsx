import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex w-full min-h-[52px] rounded-rs border-[1.5px] border-line bg-surface px-4 py-3 text-fm transition-colors placeholder:text-ink-2/60 aria-invalid:border-urgent",
        "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary-soft",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
