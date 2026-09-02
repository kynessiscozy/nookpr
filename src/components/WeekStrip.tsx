import { Check } from "lucide-react";
import { currentWeekDates, ymd } from "@/lib/utils";
import { cn } from "@/lib/utils";

const WD = ["一", "二", "三", "四", "五", "六", "日"];

/** 本周打卡条 */
export function WeekStrip({ checkinDates }: { checkinDates: string[] }) {
  const set = new Set(checkinDates);
  const today = ymd(new Date());
  return (
    <div className="flex justify-between gap-1.5">
      {currentWeekDates().map((d, i) => {
        const done = set.has(d);
        const isToday = d === today;
        return (
          <div key={d} className="flex flex-1 flex-col items-center gap-1">
            <span className="text-[11px] text-nook-inkSoft">{WD[i]}</span>
            <div
              className={cn(
                "grid h-9 w-full place-items-center rounded-xl border-2 text-xs font-bold",
                done
                  ? "border-nook-coral/40 bg-nook-coral text-white shadow-clay-sm"
                  : isToday
                    ? "border-nook-coral/50 bg-nook-peach/60 text-nook-coralDeep"
                    : "border-nook-ink/10 bg-white/70 text-nook-inkSoft",
              )}
            >
              {done ? <Check size={15} strokeWidth={3} /> : Number(d.slice(8))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
