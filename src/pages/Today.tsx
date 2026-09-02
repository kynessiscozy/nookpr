import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Flame, Play, Target, CalendarCheck2, ChevronRight, Dumbbell, Quote } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Checkin, Goal, Plan, PlanDay, Profile, UserPlan } from "@/lib/types";
import { calcStreak, greeting, tipOfDay, weekOfCount, ymd } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { WeekStrip } from "@/components/WeekStrip";
import { GoalRing } from "@/components/GoalRing";
import { Mascot } from "@/components/Mascot";
import { Loading, EmptyState } from "@/components/States";

export default function Today() {
  const { repo, user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [goal, setGoal] = useState<Goal | null>(null);
  const [todayDay, setTodayDay] = useState<PlanDay | null>(null);
  const [activePlan, setActivePlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!repo || !user) return;
    void (async () => {
      const [p, ps, ups, cs, g] = await Promise.all([
        repo.ensureProfile(user),
        repo.listPlans(),
        repo.listUserPlans(),
        repo.listCheckins(),
        repo.getGoal(),
      ]);
      setProfile(p);
      setPlans(ps);
      setUserPlans(ups);
      setCheckins(cs);
      setGoal(g);
      const active = ups.find((x) => x.status === "active");
      if (active) {
        const plan = ps.find((x) => x.id === active.planId) ?? null;
        const { days } = await repo.getPlanWithDays(active.planId);
        setActivePlan(plan);
        setTodayDay(days.find((d) => d.dayNumber === active.currentDay) ?? days[0] ?? null);
      }
      setLoading(false);
    })();
  }, [repo, user]);

  const checkinDates = useMemo(() => [...new Set(checkins.map((c) => c.workoutDate))], [checkins]);
  const streak = useMemo(() => calcStreak(checkinDates), [checkinDates]);
  const weekCount = useMemo(() => weekOfCount(checkinDates), [checkinDates]);
  const weekMinutes = useMemo(() => {
    const set = new Set(checkinDates);
    return checkins.filter((c) => set.has(c.workoutDate) && c.workoutDate >= weekStartStr()).reduce((s, c) => s + c.minutes, 0);
  }, [checkins, checkinDates]);
  const doneToday = checkinDates.includes(ymd(new Date()));

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      {/* 顶部问候 */}
      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-nook-inkSoft">{greeting()}，{profile?.nickname ?? "小伙伴"}</p>
          <h1 className="font-display text-2xl font-bold">今天也要动一动</h1>
        </div>
        <Link to="/me" className="clay-sm grid h-12 w-12 place-items-center overflow-hidden bg-white">
          <Mascot name="coach" className="h-10 w-10" />
        </Link>
      </header>

      {/* 连续打卡 & 目标 */}
      <Card className="flex items-center gap-4">
        <GoalRing
          value={goal ? weekCount / goal.workoutsPerWeek : 0}
          label={
            <div className="leading-tight">
              <div className="font-display text-xl font-bold text-nook-coralDeep">{weekCount}<span className="text-xs">/{goal?.workoutsPerWeek ?? 4}</span></div>
              <div className="text-[10px] text-nook-inkSoft">本周次数</div>
            </div>
          }
        />
        <div className="flex-1 space-y-2.5">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Flame size={17} className="text-nook-coral" />
            连续打卡 <span className="font-display text-lg text-nook-coralDeep">{streak}</span> 天
          </div>
          <WeekStrip checkinDates={checkinDates} />
          <p className="text-xs text-nook-inkSoft">本周累计运动 {weekMinutes} 分钟 · 目标 {goal?.minutesPerWeek ?? 120} 分钟</p>
        </div>
      </Card>

      {/* 今日训练 */}
      {activePlan && todayDay ? (
        <Card className="relative overflow-hidden p-0">
          <div className="flex items-stretch">
            <div className="flex-1 p-4">
              <Badge tone="coral">{activePlan.title}</Badge>
              <h2 className="mt-2 font-display text-lg font-bold">
                第 {todayDay.dayNumber} 天 · {todayDay.title}
              </h2>
              <p className="mt-0.5 text-sm text-nook-inkSoft">
                {todayDay.items.length} 个动作 · 约 {todayDay.minutes} 分钟
              </p>
              <div className="mt-3">
                {doneToday ? (
                  <Button variant="mint" onClick={() => navigate("/checkin")}>
                    <CalendarCheck2 size={17} /> 今日已打卡，去看看
                  </Button>
                ) : (
                  <Button onClick={() => navigate(`/workout/${todayDay.id}`)}>
                    <Play size={17} /> 开始今日训练
                  </Button>
                )}
              </div>
            </div>
            <Mascot name={doneToday ? "celebrate" : "coach"} bounce className="mr-2 h-32 w-32 self-end" />
          </div>
        </Card>
      ) : (
        <Card className="flex flex-col items-center gap-3 py-6 text-center">
          <Mascot name="nook-hi" className="h-24 w-24" />
          <div>
            <p className="font-display font-semibold">还没有加入训练计划</p>
            <p className="mt-0.5 text-sm text-nook-inkSoft">选一个轻量课程，Nook 陪你开练</p>
          </div>
          <Button onClick={() => navigate("/plans")}>
            <Dumbbell size={17} /> 去选计划
          </Button>
        </Card>
      )}

      {/* 快捷入口 */}
      <div className="grid grid-cols-3 gap-3">
        <QuickLink to="/plans" icon={<Dumbbell size={20} />} label="训练计划" tone="bg-nook-mint/40" />
        <QuickLink to="/checkin" icon={<CalendarCheck2 size={20} />} label="打卡记录" tone="bg-nook-sunny/40" />
        <QuickLink to="/goals" icon={<Target size={20} />} label="我的目标" tone="bg-nook-lavender/40" />
      </div>

      {/* Nook 小贴士 */}
      <Card className="flex gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-nook-peach/70 text-nook-coralDeep">
          <Quote size={17} />
        </span>
        <div>
          <p className="text-sm font-semibold">Nook 的小贴士</p>
          <p className="text-sm text-nook-inkSoft">{tipOfDay()}</p>
        </div>
        <ChevronRight size={18} className="ml-auto self-center text-nook-inkSoft" />
      </Card>

      {plans.length > 0 && !userPlans.some((u) => u.status === "active") && (
        <Card>
          <p className="mb-2 text-sm font-semibold">为你推荐</p>
          {plans.slice(0, 1).map((p) => (
            <Link key={p.id} to={`/plans/${p.id}`} className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-2xl" style={{ background: p.color }} />
              <div className="flex-1">
                <p className="font-semibold">{p.title}</p>
                <p className="text-xs text-nook-inkSoft">{p.tag} · {p.level}</p>
              </div>
              <ChevronRight />
            </Link>
          ))}
        </Card>
      )}
    </div>
  );
}

function QuickLink({ to, icon, label, tone }: { to: string; icon: React.ReactNode; label: string; tone: string }) {
  return (
    <Link to={to} className="clay-sm flex flex-col items-center gap-1.5 py-3.5 text-xs font-semibold">
      <span className={`grid h-11 w-11 place-items-center rounded-2xl ${tone}`}>{icon}</span>
      {label}
    </Link>
  );
}

function weekStartStr() {
  const d = new Date();
  const wd = (d.getDay() + 6) % 7;
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - wd);
  return ymd(d);
}
