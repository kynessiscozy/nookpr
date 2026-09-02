import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function ymd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

/** 本周一为一周起点 */
export function startOfWeek(d = new Date()): Date {
  const x = new Date(d);
  const wd = (x.getDay() + 6) % 7; // 周一=0
  x.setHours(0, 0, 0, 0);
  return addDays(x, -wd);
}

export function currentWeekDates(): string[] {
  const mon = startOfWeek();
  return Array.from({ length: 7 }, (_, i) => ymd(addDays(mon, i)));
}

/** 连续打卡天数（今天未打卡则从昨天往前数） */
export function calcStreak(dates: string[]): number {
  const set = new Set(dates);
  let cursor = new Date();
  if (!set.has(ymd(cursor))) cursor = addDays(cursor, -1);
  let streak = 0;
  while (set.has(ymd(cursor))) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

export function weekOfCount(dates: string[]): number {
  const set = new Set(dates);
  return currentWeekDates().filter((d) => set.has(d)).length;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 6) return "夜深了";
  if (h < 11) return "早上好";
  if (h < 14) return "中午好";
  if (h < 18) return "下午好";
  return "晚上好";
}

export function minutesLabel(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const TIPS = [
  "先热身再上强度，Nook 陪你慢慢来",
  "动作做标准，比做更多更重要",
  "训练后记得拉伸，明天会更轻松",
  "少量多次也很棒，关键是每天都动一动",
  "发力时呼气、还原时吸气，别憋气",
  "补水要少量多次，把水杯放在视线内",
];
export function tipOfDay(): string {
  return TIPS[new Date().getDate() % TIPS.length];
}
