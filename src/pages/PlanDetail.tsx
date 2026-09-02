import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { ArrowLeft, Check, Clock, Lock, Play, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Checkin, Exercise, Plan, PlanDay, UserPlan } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ExerciseGif } from "@/components/ExerciseGif";
import { Loading } from "@/components/States";

export default function PlanDetail() {
  const { id } = useParams();
  const planId = Number(id);
  const { repo } = useAuth();
  const navigate = useNavigate();

  const [plan, setPlan] = useState<Plan | null>(null);
  const [days, setDays] = useState<PlanDay[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [userPlan, setUserPlan] = useState<UserPlan | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!repo) return;
    void (async () => {
      const [pd, exs, ups, cs] = await Promise.all([
        repo.getPlanWithDays(planId),
        repo.listExercises(),
        repo.listUserPlans(),
        repo.listCheckins(),
      ]);
      setPlan(pd.plan);
      setDays(pd.days);
      setExercises(exs);
      setUserPlan(ups.find((u) => u.planId === planId) ?? null);
      setCheckins(cs);
      setLoading(false);
    })();
  }, [repo, planId]);

  const exMap = useMemo(() => new Map(exercises.map((e) => [e.id, e])), [exercises]);
  const doneDayIds = useMemo(() => new Set(checkins.filter((c) => c.planId === planId).map((c) => c.planDayId)), [checkins, planId]);

  if (loading || !plan) return <Loading />;

  async function join() {
    if (!repo) return;
    setBusy(true);
    const up = await repo.joinPlan(planId);
    setUserPlan(up);
    setBusy(false);
  }

  const progress = userPlan ? ((userPlan.currentDay - 1) / plan.daysTotal) * 100 : 0;
  async function removeCustom() {
    if (!repo || !plan || !plan.isCustom) return;
    if (!confirm("确定删除这个自建计划吗？训练打卡记录会保留。")) return;
    await repo.removeUserPlan(plan.id);
    navigate("/plans");
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-2">
        <Link to="/plans" className="clay-sm grid h-10 w-10 place-items-center">
          <ArrowLeft size={18} />
        </Link>
        <h1 className="font-display text-xl font-bold">计划详情</h1>
      </div>

      {/* 计划头卡 */}
      <Card className="overflow-hidden p-0">
        <div className="h-24" style={{ background: `linear-gradient(120deg, ${plan.color}, #ffffff)` }} />
        <div className="-mt-8 space-y-2 p-4 pt-0">
          <h2 className="font-display text-2xl font-bold">{plan.title}</h2>
          <p className="text-sm leading-6 text-nook-inkSoft">{plan.description}</p>
          <div className="flex flex-wrap gap-1.5">
            <Badge tone="coral">{plan.level}</Badge>
            <Badge tone="mint">{plan.daysTotal} 天</Badge>
            <Badge tone="sunny"><Clock size={11} /> {plan.minutesPerDay} 分钟/天</Badge>
            <Badge tone="lavender">无器械</Badge>
          </div>
          {userPlan ? (
            <div className="space-y-1.5 pt-1">
              <div className="flex justify-between text-xs font-semibold text-nook-inkSoft">
                <span>{userPlan.status === "done" ? "已全部完成" : `进行到第 ${userPlan.currentDay} 天`}</span>
                <span>{userPlan.currentDay - 1}/{plan.daysTotal}</span>
              </div>
              <Progress value={progress} />
              {plan.isCustom && (
                <button onClick={removeCustom} className="mt-1 flex items-center gap-1 text-xs font-semibold text-red-400">
                  <Trash2 size={13} /> 删除这个自建计划
                </button>
              )}
            </div>
          ) : (
            <Button className="w-full" disabled={busy} onClick={join}>
              {busy ? "加入中…" : "加入计划，今天开练"}
            </Button>
          )}
        </div>
      </Card>

      {/* 每日编排 */}
      <div className="space-y-3">
        {days.map((d) => {
          const done = doneDayIds.has(d.id);
          const locked = userPlan ? d.dayNumber > userPlan.currentDay : false;
          const isCurrent = userPlan && d.dayNumber === userPlan.currentDay && !done;
          return (
            <Card
              key={d.id}
              className={`p-3 ${isCurrent ? "ring-2 ring-nook-coral/50" : ""}`}
            >
              <div className="flex items-center gap-3">
                <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border-2 font-display text-lg font-bold ${
                  done ? "border-nook-coral/40 bg-nook-coral text-white" : "border-nook-ink/10 bg-white"
                }`}>
                  {done ? <Check size={18} strokeWidth={3} /> : d.dayNumber}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">第 {d.dayNumber} 天 · {d.title}</p>
                  <p className="text-xs text-nook-inkSoft">{d.items.length} 个动作 · 约 {d.minutes} 分钟</p>
                </div>
                {locked ? (
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-nook-ink/5 text-nook-inkSoft"><Lock size={16} /></span>
                ) : (
                  <Button size="sm" variant={isCurrent ? "primary" : "ghost"} onClick={() => navigate(`/workout/${d.id}`)}>
                    <Play size={14} /> {done ? "再练" : "开始"}
                  </Button>
                )}
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto no-scrollbar">
                {d.items.map((it, idx) => {
                  const ex = exMap.get(it.exerciseId);
                  if (!ex) return null;
                  return (
                    <div key={idx} className="flex shrink-0 items-center gap-2 rounded-2xl border-2 border-nook-ink/10 bg-nook-cream/70 py-1.5 pl-1.5 pr-3">
                      <ExerciseGif src={ex.gifUrl} alt={ex.name} rounded="rounded-xl" className="h-10 w-10" />
                      <div className="leading-tight">
                        <p className="text-xs font-semibold">{ex.name}</p>
                        <p className="text-[11px] text-nook-inkSoft">
                          {it.sets} 组 × {it.seconds ? `${it.seconds} 秒` : `${it.reps} 次`}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
