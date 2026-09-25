import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { cn } from "@/lib/utils";

function ToggleGroup({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return (
    <ToggleGroupPrimitive.Root
      data-slot="toggle-group"
      className={cn(
        "inline-flex flex-wrap items-center gap-0.5 rounded-rl border border-line bg-surface p-0.5",
        className,
      )}
      {...props}
    />
  );
}

function ToggleGroupItem({
  className,
  ...props
}: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        "inline-flex min-h-11 min-w-11 items-center justify-center rounded-m px-3 text-[15px] font-semibold text-ink-2 transition-colors",
        "data-[state=on]:bg-primary data-[state=on]:text-on-primary",
        "hover:data-[state=off]:bg-primary-soft hover:data-[state=off]:text-primary-strong",
        "focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-primary",
        className,
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
