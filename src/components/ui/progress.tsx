import { cn } from "@/lib/utils";

export function Progress({
  value, className, barClassName,
}: { value: number; className?: string; barClassName?: string }) {
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-3 w-full overflow-hidden rounded-full bg-nook-ink/10 border border-nook-ink/10", className)}>
      <div
        className={cn("h-full rounded-full bg-nook-coral transition-all duration-500", barClassName)}
        style={{ width: `${v}%` }}
      />
    </div>
  );
}
