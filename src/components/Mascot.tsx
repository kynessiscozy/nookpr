import { cn } from "@/lib/utils";

export function Mascot({
  name = "coach", className, bounce = false,
}: { name?: "coach" | "celebrate" | "nook-hi"; className?: string; bounce?: boolean }) {
  return (
    <img
      src={`/mascots/${name}.png`}
      alt="Nook"
      draggable={false}
      className={cn("object-contain", bounce && "animate-soft-bounce", className)}
    />
  );
}
