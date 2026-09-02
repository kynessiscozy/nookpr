import type { ReactNode } from "react";
import { Mascot } from "./Mascot";

export function Loading({ text = "Nook 正在准备…" }: { text?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16 text-nook-inkSoft">
      <Mascot name="coach" className="h-24 w-24 animate-soft-bounce" />
      <p className="text-sm font-semibold">{text}</p>
    </div>
  );
}

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-2 py-10 text-center">
      <Mascot name="nook-hi" className="h-28 w-28" />
      <p className="font-display text-base font-semibold">{title}</p>
      {hint && <p className="max-w-[16rem] text-sm text-nook-inkSoft">{hint}</p>}
      {action}
    </div>
  );
}
