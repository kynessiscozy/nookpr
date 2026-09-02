import { X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/** 轻量 Modal（shadcn Dialog 风格，无额外依赖） */
export function Modal({
  open, onClose, children, className, title,
}: { open: boolean; onClose: () => void; children: ReactNode; className?: string; title?: ReactNode }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-nook-ink/35 backdrop-blur-[2px]" onClick={onClose} />
      <div className={cn(
        "relative z-10 w-full max-w-md animate-pop-in rounded-t-clay-lg sm:rounded-clay-lg bg-nook-cream p-5 shadow-clay border-2 border-nook-ink/10 max-h-[88vh] overflow-y-auto no-scrollbar",
        className,
      )}>
        <div className="mb-3 flex items-center justify-between">
          <div className="font-display text-lg font-semibold">{title}</div>
          <button onClick={onClose} className="grid h-9 w-9 place-items-center rounded-xl bg-white shadow-clay-sm border-2 border-nook-ink/10">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
