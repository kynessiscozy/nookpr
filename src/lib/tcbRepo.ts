import { getRdb, unwrap } from "./tcb";
import {
  Repo, mapCheckin, mapExercise, mapGoal, mapPlan, mapPlanDay, mapProfile, mapUserPlan,
} from "./repo";
import { customToDays, customToPlan, newCustomPlanId } from "./customPlan";
import type {
  AppUser, Checkin, CustomPlanDef, Exercise, Goal, Plan, PlanDay, Profile, UserPlan,
} from "./types";

/**
 * TCB 托管 PostgreSQL 实现：前端 SDK 直连（app.rdb()）
 * 行级隔离由数据库 RLS 策略保证，前端始终只下发自己的 user_id 条件。
 */
export class TcbRepo implements Repo {
  constructor(private uid: string, private email: string) {}

  private rows<T>(p: Promise<unknown>): Promise<T[]> {
    return p.then((r) => unwrap<T[]>(r as never) ?? []) as Promise<T[]>;
  }

  async listExercises(search?: string, muscle?: string): Promise<Exercise[]> {
    let q = getRdb().from("exercises").select().order("id");
    if (muscle && muscle !== "全部") q = q.eq("muscle_group", muscle);
    if (search) q = q.ilike("name", `%${search}%`);
    const rows = await this.rows<Record<string, unknown>>(q);
    return rows.map(mapExercise);
  }

  async listPlans(): Promise<Plan[]> {
    const rows = await this.rows<Record<string, unknown>>(
      getRdb().from("plans").select().eq("is_published", true).order("id"),
    );
    const official = rows.map(mapPlan);
    // 用户自建计划来自 user_plans.custom_plan
    const mine = await this.rows<Record<string, unknown>>(
      getRdb().from("user_plans").select().not("custom_plan", "is", null),
    );
    const customs = mine
      .map(mapUserPlan)
      .filter((u) => u.customPlan)
      .map((u) => customToPlan(u.customPlan as CustomPlanDef, u.planId));
    return [...customs, ...official];
  }

  async getPlanWithDays(planId: number) {
    const planRows = await this.rows<Record<string, unknown>>(
      getRdb().from("plans").select().eq("id", planId),
    );
    if (planRows.length) {
      const dayRows = await this.rows<Record<string, unknown>>(
        getRdb().from("plan_days").select().eq("plan_id", planId).order("day_number"),
      );
      return { plan: mapPlan(planRows[0]), days: dayRows.map(mapPlanDay) };
    }
    // 自建计划：从 user_plans.custom_plan 还原
    const mine = await this.rows<Record<string, unknown>>(
      getRdb().from("user_plans").select().eq("user_id", this.uid).eq("plan_id", planId),
    );
    const up = mapUserPlan(mine[0]);
    if (!up.customPlan) throw new Error("计划不存在");
    return { plan: customToPlan(up.customPlan, planId), days: customToDays(up.customPlan, planId) };
  }

  async ensureProfile(user: AppUser): Promise<Profile> {
    const exist = await this.rows<Record<string, unknown>>(
      getRdb().from("profiles").select().eq("user_id", user.uid),
    );
    if (exist.length) return mapProfile(exist[0]);
    const created = await this.rows<Record<string, unknown>>(
      getRdb()
        .from("profiles")
        .insert({ user_id: user.uid, email: user.email, nickname: user.email.split("@")[0] || "Nook 小伙伴" })
        .select(),
    );
    return mapProfile(created[0]);
  }

  async updateProfile(patch: Partial<Profile>): Promise<Profile> {
    const dbPatch: Record<string, unknown> = {};
    if (patch.nickname !== undefined) dbPatch.nickname = patch.nickname;
    if (patch.avatarUrl !== undefined) dbPatch.avatar_url = patch.avatarUrl;
    const rows = await this.rows<Record<string, unknown>>(
      getRdb().from("profiles").update(dbPatch).eq("user_id", this.uid).select(),
    );
    return mapProfile(rows[0]);
  }

  async listUserPlans(): Promise<UserPlan[]> {
    const rows = await this.rows<Record<string, unknown>>(
      getRdb().from("user_plans").select().eq("user_id", this.uid).order("created_at"),
    );
    return rows.map(mapUserPlan);
  }

  async joinPlan(planId: number): Promise<UserPlan> {
    const rows = await this.rows<Record<string, unknown>>(
      getRdb()
        .from("user_plans")
        .upsert(
          { user_id: this.uid, plan_id: planId, status: "active", current_day: 1, started_on: new Date().toISOString().slice(0, 10) },
          { onConflict: "user_id,plan_id" },
        )
        .select(),
    );
    return mapUserPlan(rows[0]);
  }

  async updateUserPlan(planId: number, patch: Partial<Pick<UserPlan, "currentDay" | "status">>) {
    const dbPatch: Record<string, unknown> = {};
    if (patch.currentDay !== undefined) dbPatch.current_day = patch.currentDay;
    if (patch.status !== undefined) dbPatch.status = patch.status;
    const rows = await this.rows<Record<string, unknown>>(
      getRdb().from("user_plans").update(dbPatch).eq("user_id", this.uid).eq("plan_id", planId).select(),
    );
    return mapUserPlan(rows[0]);
  }
  async createCustomPlan(def: CustomPlanDef): Promise<UserPlan> {
    // 负 ID 避免与官方种子冲突；先取现有 plan_id 保证不撞号
    const existed = await this.rows<Record<string, unknown>>(
      getRdb().from("user_plans").select("plan_id").eq("user_id", this.uid),
    );
    const planId = newCustomPlanId(existed.map((r) => Number(r.plan_id)));
    // 暂停其他进行中的计划
    await getRdb().from("user_plans").update({ status: "paused" })
      .eq("user_id", this.uid).eq("status", "active");
    const rows = await this.rows<Record<string, unknown>>(
      getRdb()
        .from("user_plans")
        .insert({
          user_id: this.uid,
          plan_id: planId,
          status: "active",
          current_day: 1,
          started_on: new Date().toISOString().slice(0, 10),
          custom_plan: def,
        })
        .select(),
    );
    return mapUserPlan(rows[0]);
  }
  async removeUserPlan(planId: number): Promise<void> {
    await getRdb().from("user_plans").delete()
      .eq("user_id", this.uid).eq("plan_id", planId);
  }

  async listCheckins(): Promise<Checkin[]> {
    const rows = await this.rows<Record<string, unknown>>(
      getRdb().from("checkins").select().eq("user_id", this.uid).order("workout_date", { ascending: false }),
    );
    return rows.map(mapCheckin);
  }

  async addCheckin(c: Omit<Checkin, "id" | "userId">): Promise<Checkin> {
    const rows = await this.rows<Record<string, unknown>>(
      getRdb()
        .from("checkins")
        .insert({
          user_id: this.uid,
          plan_id: c.planId,
          plan_day_id: c.planDayId,
          workout_date: c.workoutDate,
          minutes: c.minutes,
          kcal: c.kcal,
          note: c.note,
        })
        .select(),
    );
    return mapCheckin(rows[0]);
  }

  async getGoal(): Promise<Goal> {
    const rows = await this.rows<Record<string, unknown>>(
      getRdb().from("goals").select().eq("user_id", this.uid),
    );
    if (rows.length) return mapGoal(rows[0]);
    const created = await this.rows<Record<string, unknown>>(
      getRdb().from("goals").insert({ user_id: this.uid, workouts_per_week: 4, minutes_per_week: 120 }).select(),
    );
    return mapGoal(created[0]);
  }

  async saveGoal(goal: Pick<Goal, "workoutsPerWeek" | "minutesPerWeek">): Promise<Goal> {
    const rows = await this.rows<Record<string, unknown>>(
      getRdb()
        .from("goals")
        .upsert(
          { user_id: this.uid, workouts_per_week: goal.workoutsPerWeek, minutes_per_week: goal.minutesPerWeek },
          { onConflict: "user_id" },
        )
        .select(),
    );
    return mapGoal(rows[0]);
  }
}
