import { Repo } from "./repo";
import { SEED_EXERCISES, SEED_PLANS } from "./seedData";
import type {
  AppUser, Checkin, Exercise, Goal, Plan, PlanDay, Profile, UserPlan,
} from "./types";

const delay = () => new Promise((r) => setTimeout(r, 180));
const uuid = () => (crypto as Crypto).randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const today = () => new Date().toISOString().slice(0, 10);

interface DemoStore {
  profile: Profile | null;
  userPlans: UserPlan[];
  checkins: Checkin[];
  goal: Goal | null;
}

/**
 * 本地演示模式：种子数据来自与 seed.sql 同源的 seedData，
 * 用户数据按 uid 隔离存于 localStorage，行为对齐 TcbRepo。
 */
export class DemoRepo implements Repo {
  private key: string;
  private store: DemoStore;

  constructor(private user: AppUser) {
    this.key = `nookfit-demo:${user.uid}`;
    this.store = this.load();
  }

  private load(): DemoStore {
    try {
      const raw = localStorage.getItem(this.key);
      if (raw) return JSON.parse(raw) as DemoStore;
    } catch { /* ignore */ }
    return { profile: null, userPlans: [], checkins: [], goal: null };
  }

  private save() {
    localStorage.setItem(this.key, JSON.stringify(this.store));
  }

  async listExercises(search?: string, muscle?: string): Promise<Exercise[]> {
    await delay();
    return SEED_EXERCISES.filter((e) => {
      const okMuscle = !muscle || muscle === "全部" || e.muscleGroup === muscle;
      const okSearch = !search || e.name.includes(search) || e.category.includes(search);
      return okMuscle && okSearch;
    });
  }

  async listPlans(): Promise<Plan[]> {
    await delay();
    return SEED_PLANS.map(({ days: _d, ...p }) => p);
  }

  async getPlanWithDays(planId: number) {
    await delay();
    const hit = SEED_PLANS.find((p) => p.id === planId)!;
    const { days: _d, ...plan } = hit;
    return { plan, days: hit.days as PlanDay[] };
  }

  async ensureProfile(user: AppUser): Promise<Profile> {
    await delay();
    if (!this.store.profile) {
      this.store.profile = {
        userId: user.uid,
        email: user.email,
        nickname: user.email.split("@")[0] || "Nook 小伙伴",
        avatarUrl: "/mascots/coach.png",
      };
      this.save();
    }
    return { ...this.store.profile };
  }

  async updateProfile(patch: Partial<Profile>): Promise<Profile> {
    await delay();
    this.store.profile = { ...(this.store.profile as Profile), ...patch };
    this.save();
    return { ...this.store.profile };
  }

  async listUserPlans(): Promise<UserPlan[]> {
    await delay();
    return this.store.userPlans.map((x) => ({ ...x }));
  }

  async joinPlan(planId: number): Promise<UserPlan> {
    await delay();
    const found = this.store.userPlans.find((x) => x.planId === planId);
    if (found) return { ...found };
    const up: UserPlan = {
      id: uuid(), userId: this.user.uid, planId, status: "active", currentDay: 1, startedOn: today(),
    };
    this.store.userPlans.push(up);
    this.save();
    return { ...up };
  }

  async updateUserPlan(planId: number, patch: Partial<Pick<UserPlan, "currentDay" | "status">>) {
    await delay();
    const idx = this.store.userPlans.findIndex((x) => x.planId === planId);
    this.store.userPlans[idx] = { ...this.store.userPlans[idx], ...patch };
    this.save();
    return { ...this.store.userPlans[idx] };
  }

  async listCheckins(): Promise<Checkin[]> {
    await delay();
    return [...this.store.checkins].sort((a, b) => b.workoutDate.localeCompare(a.workoutDate));
  }

  async addCheckin(c: Omit<Checkin, "id" | "userId">): Promise<Checkin> {
    await delay();
    const row: Checkin = { ...c, id: uuid(), userId: this.user.uid };
    this.store.checkins.push(row);
    this.save();
    return { ...row };
  }

  async getGoal(): Promise<Goal> {
    await delay();
    if (!this.store.goal) {
      this.store.goal = { userId: this.user.uid, workoutsPerWeek: 4, minutesPerWeek: 120 };
      this.save();
    }
    return { ...this.store.goal };
  }

  async saveGoal(goal: Pick<Goal, "workoutsPerWeek" | "minutesPerWeek">): Promise<Goal> {
    await delay();
    this.store.goal = { userId: this.user.uid, ...goal };
    this.save();
    return { ...this.store.goal };
  }
}
