import type {
  Checkin, CustomPlanDef, Exercise, Goal, Plan, PlanDay, Profile, UserPlan, AppUser,
} from "./types";

/** 数据仓库接口：TCB PostgreSQL 与本地演示模式各实现一份 */
export interface Repo {
  // 公共内容
  listExercises(search?: string, muscle?: string): Promise<Exercise[]>;
  listPlans(): Promise<Plan[]>;
  getPlanWithDays(planId: number): Promise<{ plan: Plan; days: PlanDay[] }>;
  // 档案
  ensureProfile(user: AppUser): Promise<Profile>;
  updateProfile(patch: Partial<Profile>): Promise<Profile>;
  // 我的课程
  listUserPlans(): Promise<UserPlan[]>;
  joinPlan(planId: number): Promise<UserPlan>;
  updateUserPlan(planId: number, patch: Partial<Pick<UserPlan, "currentDay" | "status">>): Promise<UserPlan>;
  /** 创建用户自建计划（同时加入、置为当前进行） */
  createCustomPlan(def: CustomPlanDef): Promise<UserPlan>;
  /** 删除一条我的计划（自建计划用） */
  removeUserPlan(planId: number): Promise<void>;
  // 打卡
  listCheckins(): Promise<Checkin[]>;
  addCheckin(c: Omit<Checkin, "id" | "userId">): Promise<Checkin>;
  // 目标
  getGoal(): Promise<Goal>;
  saveGoal(goal: Pick<Goal, "workoutsPerWeek" | "minutesPerWeek">): Promise<Goal>;
}

// ---------------- 行映射 snake_case -> camelCase ----------------
export function mapExercise(r: Record<string, unknown>): Exercise {
  return {
    id: Number(r.id),
    slug: String(r.slug),
    name: String(r.name),
    muscleGroup: String(r.muscle_group),
    category: String(r.category),
    level: String(r.level),
    equipment: String(r.equipment ?? "无器械"),
    caloriesPerMin: Number(r.calories_per_min ?? 0),
    measure: (r.measure as Exercise["measure"]) ?? "reps",
    defaultReps: r.default_reps == null ? null : Number(r.default_reps),
    defaultSeconds: r.default_seconds == null ? null : Number(r.default_seconds),
    gifUrl: (r.gif_url as string | null) ?? null,
    steps: Array.isArray(r.steps) ? (r.steps as string[]) : [],
    tips: String(r.tips ?? ""),
  };
}

export function mapPlan(r: Record<string, unknown>): Plan {
  return {
    id: Number(r.id),
    slug: String(r.slug),
    title: String(r.title),
    description: String(r.description ?? ""),
    level: String(r.level),
    daysTotal: Number(r.days_total),
    minutesPerDay: Number(r.minutes_per_day),
    color: String(r.color ?? "#8FE3C1"),
    tag: String(r.tag ?? ""),
    isPublished: Boolean(r.is_published ?? true),
  };
}

export function mapPlanDay(r: Record<string, unknown>): PlanDay {
  const rawItems = typeof r.items === "string" ? JSON.parse(r.items) : r.items;
  return {
    id: Number(r.id),
    planId: Number(r.plan_id),
    dayNumber: Number(r.day_number),
    title: String(r.title ?? ""),
    minutes: Number(r.minutes ?? 0),
    items: Array.isArray(rawItems)
      ? rawItems.map((x: Record<string, unknown>) => ({
          exerciseId: Number(x.exercise_id ?? x.exerciseId),
          sets: Number(x.sets ?? 1),
          reps: x.reps == null ? undefined : Number(x.reps),
          seconds: x.seconds == null ? undefined : Number(x.seconds),
          restSeconds: Number(x.rest_seconds ?? x.restSeconds ?? 15),
        }))
      : [],
  };
}

export function mapProfile(r: Record<string, unknown>): Profile {
  return {
    userId: String(r.user_id),
    email: String(r.email ?? ""),
    nickname: String(r.nickname ?? "Nook 小伙伴"),
    avatarUrl: String(r.avatar_url ?? "/mascots/coach.png"),
  };
}

export function mapUserPlan(r: Record<string, unknown>): UserPlan {
  let custom: CustomPlanDef | null = null;
  const cp = r.custom_plan;
  if (cp) {
    try { custom = (typeof cp === "string" ? JSON.parse(cp) : cp) as CustomPlanDef; } catch { custom = null; }
  }
  return {
    id: String(r.id),
    userId: String(r.user_id),
    planId: Number(r.plan_id),
    status: (r.status as UserPlan["status"]) ?? "active",
    currentDay: Number(r.current_day ?? 1),
    startedOn: String(r.started_on ?? new Date().toISOString().slice(0, 10)),
    customPlan: custom,
  };
}

export function mapCheckin(r: Record<string, unknown>): Checkin {
  const d = r.workout_date;
  return {
    id: String(r.id),
    userId: String(r.user_id),
    planId: r.plan_id == null ? null : Number(r.plan_id),
    planDayId: r.plan_day_id == null ? null : Number(r.plan_day_id),
    workoutDate: typeof d === "string" ? d.slice(0, 10) : new Date(d as string).toISOString().slice(0, 10),
    minutes: Number(r.minutes ?? 0),
    kcal: Number(r.kcal ?? 0),
    note: String(r.note ?? ""),
  };
}

export function mapGoal(r: Record<string, unknown>): Goal {
  return {
    userId: String(r.user_id),
    workoutsPerWeek: Number(r.workouts_per_week ?? 4),
    minutesPerWeek: Number(r.minutes_per_week ?? 120),
  };
}
