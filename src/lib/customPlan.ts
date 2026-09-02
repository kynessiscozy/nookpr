import type { CustomPlanDef, Plan, PlanDay, PlanDayItem } from "./types";

/** 自建计划使用负 planId，避免与官方种子（正整数）冲突；dayId = planId*100+dayNumber */
export function newCustomPlanId(existing: number[]): number {
  let cand = -(Math.floor(Date.now() / 1000) % 10_000_000) - 1;
  while (existing.includes(cand)) cand -= 1;
  return cand;
}

/** 与 scripts/gen_seed.py 的时长估算保持同口径 */
export function estimateDayMinutes(items: PlanDayItem[]): number {
  let sec = 0;
  for (const x of items) {
    const per = x.seconds ?? Math.round((x.reps ?? 10) * 1.4);
    sec += x.sets * per + (x.sets - 1) * x.restSeconds + 10;
  }
  return Math.max(1, Math.round(sec / 60));
}

export function customToPlan(def: CustomPlanDef, planId: number): Plan {
  const mins = def.days.map((d) => estimateDayMinutes(d.items));
  const avg = mins.length ? Math.round(mins.reduce((s, m) => s + m, 0) / mins.length) : 5;
  return {
    id: planId,
    slug: `custom-${Math.abs(planId)}`,
    title: def.title,
    description: def.description,
    level: def.level,
    daysTotal: def.days.length,
    minutesPerDay: avg,
    color: def.color,
    tag: def.tag || "我自建的",
    isPublished: false,
    isCustom: true,
  };
}

export function customToDays(def: CustomPlanDef, planId: number): PlanDay[] {
  // 负 planId 时 dayId 向负方向编号，保证 Math.trunc(dayId/100) 能反推 planId
  return def.days.map((d, i) => ({
    id: planId >= 0 ? planId * 100 + (i + 1) : planId * 100 - i,
    planId,
    dayNumber: i + 1,
    title: d.title || `第 ${i + 1} 天`,
    minutes: estimateDayMinutes(d.items),
    items: d.items,
  }));
}

export const CUSTOM_COLORS = ["#F26A55", "#8FE3C1", "#C9B8FF", "#FFD66B", "#A8D8FF"];
export const CUSTOM_LEVELS = ["入门", "初级", "中级"];
