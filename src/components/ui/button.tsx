import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Poster-style buttons: flat colour, 2px ink border, restrained radius,
 * no soft shadows. Arrows may be oversized inside the label.
 */
const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px] font-display text-sm font-bold tracking-tight cursor-pointer border-2 border-foreground transition-[transform,background-color,color] duration-200 ease-[cubic-bezier(0.2,0.7,0.2,1)] active:translate-y-px focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-40 disabled:cursor-not-allowed [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-foreground text-background hover:bg-foreground/90",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "bg-transparent text-foreground hover:bg-foreground hover:text-background",
        secondary: "bg-background text-foreground hover:bg-yellow",
        accent: "bg-yellow text-foreground hover:bg-lime",
        ghost: "border-transparent bg-transparent hover:bg-foreground/10",
        link: "border-transparent text-foreground underline underline-offset-4",
      },
      size: {
        default: "h-11 px-5 [&_svg]:size-4",
        sm: "h-9 px-3 text-xs [&_svg]:size-3.5",
        lg: "h-14 px-7 text-base [&_svg]:size-6",
        icon: "h-11 w-11 [&_svg]:size-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
