import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...p }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-12 w-full rounded-2xl border-2 border-nook-ink/10 bg-white/90 px-4 text-[15px] text-nook-ink placeholder:text-nook-inkSoft/60 outline-none transition-shadow focus:border-nook-coral/60 focus:ring-4 focus:ring-nook-coral/15",
        className,
      )}
      {...p}
    />
  ),
);
Input.displayName = "Input";
