import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils/cn";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=size-])]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:opacity-95 hover:shadow-md active:scale-[0.98]",
        accent:
          "bg-accent text-accent-foreground shadow-sm hover:opacity-95 hover:shadow-md active:scale-[0.98]",
        secondary:
          "bg-muted text-foreground hover:bg-muted/80",
        outline:
          "text-foreground btn-gradient-border",
        ghost:
          "text-foreground hover:bg-muted",
        link:
          "text-primary underline-offset-4 hover:underline",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:opacity-95 active:scale-[0.98]",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        default: "h-11 px-5",
        lg: "h-12 px-7 text-base",
        icon: "h-10 w-10 p-0",
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

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
