import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-[0_0_24px_hsl(var(--primary)/0.5)]",
        destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline: "border border-white/15 bg-white/[0.03] backdrop-blur-md hover:bg-white/[0.07] hover:border-primary/40",
        secondary: "bg-secondary text-secondary-foreground hover:bg-secondary/80 border border-white/5",
        ghost: "hover:bg-white/5 text-foreground",
        link: "text-primary underline-offset-4 hover:underline",
        hero: "bg-gradient-crimson text-white font-bold tracking-wide uppercase shadow-[0_8px_30px_hsl(0_80%_45%/0.5)] hover:shadow-[0_12px_40px_hsl(0_80%_55%/0.7)] hover:scale-[1.02] active:scale-[0.98] border border-white/10",
        vote: "bg-gradient-crimson text-white font-bold uppercase tracking-wider border border-white/15 shadow-[0_4px_20px_hsl(0_80%_45%/0.4)] hover:shadow-[0_6px_30px_hsl(0_85%_55%/0.7)] hover:brightness-110",
        glass: "glass glass-hover text-foreground",
        gold: "bg-gradient-gold text-black font-bold uppercase tracking-wide shadow-[0_4px_20px_hsl(45_95%_50%/0.4)] hover:shadow-[0_6px_30px_hsl(45_95%_60%/0.6)]",
      },
      size: {
        default: "h-10 px-5 py-2",
        sm: "h-9 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-lg px-10 text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
