import { NavLink } from "react-router-dom";
import { Home, Dumbbell, LayoutGrid, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/", icon: Home, label: "今日", end: true },
  { to: "/plans", icon: Dumbbell, label: "训练" },
  { to: "/exercises", icon: LayoutGrid, label: "动作库" },
  { to: "/me", icon: UserRound, label: "我的" },
];

export function BottomNav() {
  return (
    <nav className="sticky bottom-0 z-30 mt-4 border-t-2 border-nook-ink/10 bg-nook-cream/90 px-3 pb-[max(env(safe-area-inset-bottom),8px)] pt-2 backdrop-blur">
      <div className="mx-auto flex max-w-md items-stretch justify-between gap-1">
        {TABS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                "flex flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold",
                isActive ? "text-nook-coralDeep" : "text-nook-inkSoft",
              )
            }
          >
            {({ isActive }) => (
              <>
                <span className={cn(
                  "grid h-9 w-12 place-items-center rounded-xl transition-all",
                  isActive && "bg-nook-peach/80 shadow-clay-sm scale-105",
                )}>
                  <Icon size={20} strokeWidth={isActive ? 2.6 : 2.2} />
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
