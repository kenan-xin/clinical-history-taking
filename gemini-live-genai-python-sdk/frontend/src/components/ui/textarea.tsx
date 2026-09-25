import * as React from "react";
import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex w-full min-h-12 max-h-[120px] rounded-[24px] border-[1.5px] border-line bg-background px-4 py-3 text-fm leading-[1.4] resize-none transition-colors placeholder:text-ink-2/60",
        "focus-visible:outline-none focus-visible:border-primary focus-visible:ring-[3px] focus-visible:ring-primary-soft",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
