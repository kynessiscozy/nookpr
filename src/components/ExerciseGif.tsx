import { useState } from "react";
import { cn } from "@/lib/utils";

/** Nook 动作演示 GIF；无 GIF 的动作回退到教练吉祥物静态图 */
export function ExerciseGif({
  src, alt, className, rounded = "rounded-2xl",
}: { src: string | null; alt: string; className?: string; rounded?: string }) {
  const [failed, setFailed] = useState(false);
  const finalSrc = !src || failed ? "/mascots/coach.png" : src;
  return (
    <div className={cn("overflow-hidden bg-nook-cream border-2 border-nook-ink/10", rounded, className)}>
      <img
        src={finalSrc}
        alt={alt}
        className="gif-render h-full w-full object-contain"
        loading="lazy"
        onError={() => setFailed(true)}
        draggable={false}
      />
    </div>
  );
}
