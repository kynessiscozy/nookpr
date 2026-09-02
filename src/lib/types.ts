// 与 database/schema.sql 对应的领域类型

export type Measure = "reps" | "duration";

export interface Exercise {
  id: number;
  slug: string;
  name: string;
  muscleGroup: string;
  category: string;
  level: string;
  equipment: string;
  caloriesPerMin: number;
  measure: Measure;
  defaultReps: number | null;
  defaultSeconds: number | null;
  gifUrl: string | null;
  steps: string[];
  tips: string;
}

export interface Plan {
  id: number;
  slug: string;
  title: string;
  description: string;
  level: string;
  daysTotal: number;
  minutesPerDay: number;
  color: string;
  tag: string;
  isPublished: boolean;
}

/** plan_days.items 中单个动作编排 */
export interface PlanDayItem {
  exerciseId: number;
  sets: number;
  reps?: number;
  seconds?: number;
  restSeconds: number;
}

export interface PlanDay {
  id: number;
  planId: number;
  dayNumber: number;
  title: string;
  minutes: number;
  items: PlanDayItem[];
}

export interface Profile {
  userId: string;
  email: string;
  nickname: string;
  avatarUrl: string;
}

export type UserPlanStatus = "active" | "paused" | "done";

export interface UserPlan {
  id: string;
  userId: string;
  planId: number;
  status: UserPlanStatus;
  currentDay: number;
  startedOn: string;
}

export interface Checkin {
  id: string;
  userId: string;
  planId: number | null;
  planDayId: number | null;
  workoutDate: string; // YYYY-MM-DD
  minutes: number;
  kcal: number;
  note: string;
}

export interface Goal {
  userId: string;
  workoutsPerWeek: number;
  minutesPerWeek: number;
}

export interface AppUser {
  uid: string;
  email: string;
}

/** 一个课程日 + 动作明细（联表后的视图模型） */
export interface PlanDayDetail extends PlanDay {
  exercises: Array<PlanDayItem & { exercise: Exercise }>;
}
