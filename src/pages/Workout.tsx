import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Check, FastForward, Pause, Play, SkipForward, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Exercise, PlanDay, PlanDayDetail } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ExerciseGif } from "@/components/ExerciseGif";
import { Mascot } from "@/components/Mascot";
import { minutesLabel } from "@/lib/utils";

type Phase = "exercise" | "rest" | "done";

export default function Workout() {
  const { id } = useParams();
  const dayId = Number(id);
  const { repo } = useAuth();
  const navigate = useNavigate();

  const [detail, setDetail] = useState<PlanDayDetail | null>(null);
  const [phase, setPhase] = useState<Phase>("exercise");
  const [exIdx, setExIdx] = useState(0);
  const [setIdx, setSetIdx] = useState(0);
  const [leftSeconds, setLeftSeconds] = useState(0);
  const [restSeconds, setRestSeconds] = useState(0);
  const [running, setRunning] = useState(true);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!repo) return;
    void (async () => {
      // plan_days.id = planId*100+dayNumber（种子规则），反推 planId
      const planId = Math.floor(dayId / 100);
      const { days } = await repo.getPlanWithDays(planId);
      const all = await repo.listExercises();
      const map = new Map(all.map((e) => [e.id, e]));
      const day = days.find((d) => d.id === dayId) ?? days[0];
      const withEx: PlanDayDetail = {
        ...day,
        exercises: day.items.map((it) => ({ ...it, exercise: map.get(it.exerciseId) as Exercise })),
      };
      setDetail(withEx);
      const first = withEx.exercises[0];
      setLeftSeconds(first.seconds ?? first.exercise.defaultSeconds ?? 30);
    })();
  }, [repo, dayId]);

  const cur = detail?.exercises[exIdx];

  // 计时（有氧/休息）
  useEffect(() => {
    if (!running || phase === "done") return;
    timerRef.current = window.setInterval(() => {
      if (phase === "exercise" && cur?.seconds) {
        setLeftSeconds((s) => {
          if (s <= 1) { void finishSet(); return 0; }
          return s - 1;
        });
      } else if (phase === "rest") {
        setRestSeconds((s) => {
          if (s <= 1) { void endRest(); return 0; }
          return s - 1;
        });
      }
    }, 1000);
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, phase, exIdx, setIdx]);

  const totalSets = useMemo(
    () => detail?.exercises.reduce((s, x) => s + x.sets, 0) ?? 1,
    [detail],
  );
  const doneSets = useMemo(() => {
    const before = detail?.exercises.slice(0, exIdx).reduce((s, x) => s + x.sets, 0) ?? 0;
    return before + setIdx;
  }, [detail, exIdx, setIdx]);

  if (!detail || !cur) {
    return <div className="grid min-h-[60vh] place-items-center text-nook-inkSoft">加载中…</div>;
  }

  function finishSet() {
    if (!detail || !cur) return;
    const isLastSet = setIdx + 1 >= cur.sets;
    const isLastEx = exIdx + 1 >= detail.exercises.length;
    if (!isLastSet) {
      // 组间休息
      setPhase("rest");
      setRestSeconds(cur.restSeconds || 15);
    } else if (!isLastEx) {
      setPhase("rest");
      setRestSeconds(cur.restSeconds || 15);
    } else {
      void complete();
    }
  }

  function endRest() {
    if (!detail || !cur) return;
    const isLastSet = setIdx + 1 >= cur.sets;
    if (isLastSet) {
      const next = detail.exercises[exIdx + 1];
      setExIdx(exIdx + 1);
      setSetIdx(0);
      setLeftSeconds(next.seconds ?? next.exercise.defaultSeconds ?? 30);
    } else {
      setSetIdx(setIdx + 1);
      setLeftSeconds(cur.seconds ?? cur.exercise.defaultSeconds ?? 30);
    }
    setPhase("exercise");
  }

  async function complete() {
    if (!repo || !detail || saved) return;
    setSaved(true);
    setRunning(false);
    setSaving(true);
    const kcal = Math.round(detail.minutes * 7.5);
    // 先把打卡与课程进度全部落库，再进入完成页，避免跳转打断写入
    await repo.addCheckin({
      planId: detail.planId,
      planDayId: detail.id,
      workoutDate: new Date().toISOString().slice(0, 10),
      minutes: detail.minutes,
      kcal,
      note: "",
    });
    // 推进课程进度
    const ups = await repo.listUserPlans();
    const up = ups.find((u) => u.planId === detail.planId);
    if (up) {
      const { days } = await repo.getPlanWithDays(detail.planId);
      const nextDay = detail.dayNumber + 1;
      await repo.updateUserPlan(detail.planId, {
        currentDay: Math.min(nextDay, days.length),
        status: nextDay > days.length ? "done" : "active",
      });
    }
    setSaving(false);
    setPhase("done");
  }

  // ---------------- 落库中 ----------------
  if (saving) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Mascot name="coach" className="h-32 w-32 animate-soft-bounce" />
        <p className="font-display text-lg font-bold">Nook 正在记录你的努力…</p>
        <div className="h-2.5 w-48 overflow-hidden rounded-full bg-nook-peach/60">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-nook-coral" />
        </div>
      </div>
    );
  }

  // ---------------- 完成页 ----------------
  if (phase === "done") {
    return (
      <div className="mx-auto flex min-h-full max-w-md flex-col items-center justify-center px-6 py-10 text-center">
        <Mascot name="celebrate" bounce className="h-48 w-48 animate-pop-in" />
        <h1 className="mt-2 font-display text-2xl font-bold">训练完成，太棒了！</h1>
        <p className="mt-1 text-sm text-nook-inkSoft">Nook 给你点了个大大的赞</p>
        <div className="clay mt-5 grid w-full grid-cols-3 gap-2 p-4">
          <Stat label="时长" value={`${detail.minutes} 分`} />
          <Stat label="动作" value={`${detail.exercises.length} 个`} />
          <Stat label="约消耗" value={`${Math.round(detail.minutes * 7.5)} kcal`} />
        </div>
        <div className="mt-5 flex w-full gap-3">
          <Button variant="ghost" className="flex-1" onClick={() => navigate("/")}>回到首页</Button>
          <Button className="flex-1" onClick={() => navigate("/checkin")}>查看打卡</Button>
        </div>
      </div>
    );
  }

  const overall = (doneSets / totalSets) * 100;
  const isRest = phase === "rest";

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-4">
      {/* 顶栏 */}
      <div className="flex items-center gap-3">
        <button className="clay-sm grid h-10 w-10 place-items-center" onClick={() => navigate(-1)}>
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="mb-1 flex justify-between text-xs font-semibold text-nook-inkSoft">
            <span>第 {detail.dayNumber} 天 · {detail.title}</span>
            <span>{doneSets}/{totalSets} 组</span>
          </div>
          <Progress value={overall} />
        </div>
        <span className="font-display text-sm font-bold text-nook-coralDeep">
          {exIdx + 1}/{detail.exercises.length}
        </span>
      </div>

      {/* 主动作卡 */}
      <div className="clay relative overflow-hidden p-4">
        {isRest ? (
          <div className="flex flex-col items-center py-6 text-center">
            <p className="text-sm font-semibold text-nook-inkSoft">组间休息，调整呼吸</p>
            <p className="my-3 font-display text-6xl font-bold text-nook-coralDeep">{restSeconds}</p>
            <p className="mb-4 text-xs text-nook-inkSoft">下一个：{detail.exercises[setIdx + 1 >= cur.sets ? exIdx + 1 : exIdx]?.exercise.name}</p>
            <Button variant="ghost" onClick={endRest}><FastForward size={16} /> 跳过休息</Button>
          </div>
        ) : (
          <>
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h2 className="font-display text-xl font-bold">{cur.exercise.name}</h2>
                <p className="text-xs text-nook-inkSoft">{cur.exercise.muscleGroup} · {cur.exercise.category}</p>
              </div>
              <span className="rounded-full bg-nook-peach/70 px-3 py-1 text-sm font-bold text-nook-coralDeep">
                第 {setIdx + 1}/{cur.sets} 组
              </span>
            </div>
            <ExerciseGif src={cur.exercise.gifUrl} alt={cur.exercise.name} className="mx-auto h-64 w-64" rounded="rounded-clay" />
            {cur.seconds ? (
              <p className="mt-2 text-center font-display text-4xl font-bold text-nook-ink">
                {minutesLabel(leftSeconds)}
              </p>
            ) : (
              <p className="mt-2 text-center font-display text-3xl font-bold text-nook-ink">
                {cur.reps ?? cur.exercise.defaultReps} <span className="text-base font-semibold text-nook-inkSoft">次</span>
              </p>
            )}
            <div className="mt-3 flex items-center justify-center gap-3">
              <Button variant="ghost" size="icon" onClick={() => setRunning((r) => !r)}>
                {running ? <Pause size={18} /> : <Play size={18} />}
              </Button>
              <Button className="min-w-40" onClick={finishSet}>
                <Check size={18} /> 完成本组
              </Button>
              <Button variant="ghost" size="icon" onClick={finishSet} title="跳到下一组">
                <SkipForward size={18} />
              </Button>
            </div>
          </>
        )}
      </div>

      {/* 动作要点 */}
      {!isRest && (
        <div className="clay-sm p-4">
          <p className="mb-1.5 text-sm font-semibold">动作要点</p>
          <ol className="space-y-1.5">
            {cur.exercise.steps.map((s, i) => (
              <li key={i} className="flex gap-2 text-[13px] leading-5 text-nook-inkSoft">
                <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-nook-mint/50 text-[11px] font-bold text-emerald-800">{i + 1}</span>
                {s}
              </li>
            ))}
          </ol>
          <p className="mt-2 rounded-xl bg-nook-sunny/25 px-3 py-2 text-[12px] text-amber-800">Nook 提示：{cur.exercise.tips}</p>
        </div>
      )}

      <button
        className="mx-auto flex items-center gap-1 text-xs text-nook-inkSoft"
        onClick={() => { if (confirm("确定退出本次训练吗？进度不会记录")) navigate("/"); }}
      >
        <X size={13} /> 退出训练
      </button>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-display text-lg font-bold text-nook-coralDeep">{value}</p>
      <p className="text-xs text-nook-inkSoft">{label}</p>
    </div>
  );
}
