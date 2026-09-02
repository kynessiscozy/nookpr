import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl font-display font-semibold transition-all disabled:pointer-events-none disabled:opacity-50 select-none",
  {
    variants: {
      variant: {
        primary: "bg-nook-coral text-white shadow-clay-coral border-2 border-nook-coralDeep/40 hover:brightness-105",
        mint: "bg-nook-mint text-nook-ink shadow-clay-sm border-2 border-emerald-700/15 hover:brightness-105",
        sunny: "bg-nook-sunny text-nook-ink shadow-clay-sm border-2 border-amber-700/15 hover:brightness-105",
        ghost: "bg-white/80 text-nook-ink shadow-clay-sm border-2 border-nook-ink/10 hover:bg-white",
        soft: "bg-nook-peach/70 text-nook-coralDeep border-2 border-nook-coral/20",
      },
      size: {
        sm: "h-9 px-3.5 text-sm rounded-xl",
        md: "h-11 px-5 text-[15px]",
        lg: "h-13 px-6 py-3.5 text-base rounded-2xl",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  ),
);
Button.displayName = "Button";
