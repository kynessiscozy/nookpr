import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export const Card = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...p }, ref) => (
    <div ref={ref} className={cn("clay p-4", className)} {...p} />
  ),
);
Card.displayName = "Card";

export const CardTitle = ({ className, ...p }: HTMLAttributes<HTMLDivElement>) => (
  <div className={cn("font-display font-semibold text-base", className)} {...p} />
);
