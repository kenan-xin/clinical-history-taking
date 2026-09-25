import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-m font-display font-semibold text-fm transition-colors duration-200 ease-app-out disabled:pointer-events-none disabled:bg-disabled-bg disabled:text-disabled-ink disabled:cursor-not-allowed outline-none focus-visible:outline-[3px] focus-visible:outline-offset-2 focus-visible:outline-primary [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        primary:
          "bg-primary text-on-primary hover:bg-primary-strong active:bg-primary-strong",
        secondary:
          "bg-surface text-foreground border-[1.5px] border-line hover:border-primary hover:bg-primary-soft",
        danger: "bg-urgent text-on-primary hover:bg-urgent-strong",
        link: "bg-none text-primary-strong underline underline-offset-[3px] hover:text-foreground rounded-rs min-h-11 px-2 py-0 font-body font-normal text-fs w-auto",
        pill: "border-[1.5px] border-line bg-surface text-urgent-strong hover:border-urgent hover:bg-urgent-soft rounded-full font-body font-semibold text-fs",
      },
      size: {
        default: "min-h-[52px] w-full px-5 lg:min-h-11 lg:text-base",
        lg: "min-h-[52px] w-full px-5 text-fm lg:min-h-11",
        icon: "size-10",
        none: "",
        pill: "min-h-11 w-auto px-4",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
