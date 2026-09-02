import type { HTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold border",
  {
    variants: {
      tone: {
        coral: "bg-nook-peach/70 text-nook-coralDeep border-nook-coral/25",
        mint: "bg-emerald-50 text-emerald-700 border-emerald-200",
        sunny: "bg-amber-50 text-amber-700 border-amber-200",
        lavender: "bg-violet-50 text-violet-700 border-violet-200",
        neutral: "bg-stone-100 text-nook-inkSoft border-stone-200",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  className, tone, ...p
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...p} />;
}
