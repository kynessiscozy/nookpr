import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  ArrowLeft, Check, Minus, Plus, Search, Trash2, Dumbbell, Sparkles,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Exercise, PlanDayItem } from "@/lib/types";
import { CUSTOM_COLORS, CUSTOM_LEVELS, estimateDayMinutes } from "@/lib/customPlan";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { ExerciseGif } from "@/components/ExerciseGif";
import { Loading } from "@/components/States";
import { cn } from "@/lib/utils";

interface DayDraft { title: string; items: PlanDayItem[] }
const FILTERS = ["全部", "下肢", "上肢", "核心", "全身", "拉伸"];

export default function CreatePlan() {
  const { repo } = useAuth();
  const navigate = useNavigate();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [title, setTitle] = useState("");
  const [level, setLevel] = useState(CUSTOM_LEVELS[0]);
  const [color, setColor] = useState(CUSTOM_COLORS[0]);
  const [days, setDays] = useState<DayDraft[]>([{ title: "训练日", items: [] }]);
  const [pickerDay, setPickerDay] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!repo) return;
    void repo.listExercises().then(setExercises);
  }, [repo]);

  const avgMinutes = useMemo(() => {
    const mins = days.map((d) => estimateDayMinutes(d.items));
    return Math.round(mins.reduce((s, m) => s + m, 0) / Math.max(1, days.length));
  }, [days]);
  const totalItems = days.reduce((s, d) => s + d.items.length, 0);

  if (!exercises.length) return <Loading text="正在准备动作库…" />;

  function setDayCount(n: number) {
    setDays((prev) => {
      const next = [...prev];
      while (next.length < n) next.push({ title: "训练日", items: [] });
      return next.slice(0, n);
    });
  }

  function patchDayItem(dayIdx: number, itemIdx: number, patch: Partial<PlanDayItem>) {
    setDays((prev) => prev.map((d, di) => di !== dayIdx ? d : {
      ...d,
      items: d.items.map((it, ii) => (ii === itemIdx ? { ...it, ...patch } : it)),
    }));
  }

  function addExercise(ex: Exercise) {
    if (pickerDay === null) return;
    const item: PlanDayItem = {
      exerciseId: ex.id,
      sets: 1,
      restSeconds: 15,
      ...(ex.measure === "duration" ? { seconds: ex.defaultSeconds ?? 30 } : { reps: ex.defaultReps ?? 12 }),
    };
    setDays((prev) => prev.map((d, i) => (i === pickerDay ? { ...d, items: [...d.items, item] } : d)));
    setPickerDay(null);
  }

  async function save() {
    const t = title.trim();
    if (!t) return setError("先给计划起个名字吧");
    if (days.some((d) => d.items.length === 0)) return setError("每一天都至少要安排 1 个动作");
    if (!repo) return;
    setSaving(true);
    const up = await repo.createCustomPlan({
      title: t,
      level,
      color,
      tag: "我自建的",
      description: `${days.length} 天自定义计划 · 每天约 ${avgMinutes} 分钟 · 共 ${totalItems} 个动作编排`,
      days: days.map((d) => ({ title: d.title.trim() || "训练日", items: d.items })),
    });
    navigate(`/plans/${up.planId}`, { replace: true });
  }

  return (
    <div className="space-y-4 pb-28">
      <div className="flex items-center gap-2">
        <Link to="/plans" className="clay-sm grid h-10 w-10 place-items-center"><ArrowLeft size={18} /></Link>
        <h1 className="font-display text-xl font-bold">自建训练计划</h1>
      </div>

      {/* 基本信息 */}
      <Card className="space-y-3.5">
        <div>
          <p className="mb-1.5 text-sm font-semibold">计划名称</p>
          <Input value={title} maxLength={16} placeholder="例如：睡前舒缓 10 分钟" onChange={(e) => { setTitle(e.target.value); setError(""); }} />
        </div>
        <div>
          <p className="mb-1.5 text-sm font-semibold">难度</p>
          <div className="flex gap-2">
            {CUSTOM_LEVELS.map((l) => (
              <button key={l} onClick={() => setLevel(l)}
                className={cn("flex-1 rounded-full border-2 py-1.5 text-sm font-semibold",
                  level === l ? "border-nook-coral/40 bg-nook-coral text-white" : "border-nook-ink/10 bg-white text-nook-inkSoft")}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-1.5 text-sm font-semibold">主题色</p>
          <div className="flex gap-2.5">
            {CUSTOM_COLORS.map((c) => (
              <button key={c} onClick={() => setColor(c)}
                className={cn("h-9 w-9 rounded-full border-[3px] transition-transform", color === c ? "scale-110 border-nook-ink/40" : "border-white")}
                style={{ background: c }} />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold">训练天数</span>
          <div className="flex items-center gap-3">
            <button className="clay-sm grid h-9 w-9 place-items-center" onClick={() => setDayCount(Math.max(1, days.length - 1))}><Minus size={16} /></button>
            <span className="w-14 text-center font-display text-lg font-bold">{days.length} 天</span>
            <button className="clay-sm grid h-9 w-9 place-items-center" onClick={() => setDayCount(Math.min(21, days.length + 1))}><Plus size={16} /></button>
          </div>
        </div>
      </Card>

      {/* 每日编排 */}
      {days.map((day, di) => (
        <Card key={di} className="space-y-3">
          <div className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-2xl font-display font-bold text-white"
              style={{ background: color }}>{di + 1}</span>
            <Input value={day.title} maxLength={12} className="flex-1"
              onChange={(e) => setDays((p) => p.map((d, i) => i === di ? { ...d, title: e.target.value } : d))} />
            <span className="shrink-0 text-xs text-nook-inkSoft">约 {estimateDayMinutes(day.items)} 分钟</span>
          </div>

          {day.items.map((it, ii) => {
            const ex = exercises.find((e) => e.id === it.exerciseId);
            if (!ex) return null;
            return (
              <div key={ii} className="rounded-2xl border-2 border-nook-ink/10 bg-nook-cream/60 p-2.5">
                <div className="flex items-center gap-2.5">
                  <ExerciseGif src={ex.gifUrl} alt={ex.name} rounded="rounded-xl" className="h-11 w-11 shrink-0" />
                  <span className="flex-1 text-sm font-semibold">{ex.name}</span>
                  <button className="grid h-8 w-8 place-items-center rounded-xl text-red-400"
                    onClick={() => setDays((p) => p.map((d, i) => i === di ? { ...d, items: d.items.filter((_, j) => j !== ii) } : d))}>
                    <Trash2 size={15} />
                  </button>
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2 text-xs">
                  <Stepper label="组数" value={`${it.sets}`}
                    onMinus={() => patchDayItem(di, ii, { sets: Math.max(1, it.sets - 1) })}
                    onPlus={() => patchDayItem(di, ii, { sets: Math.min(6, it.sets + 1) })} />
                  {it.seconds !== undefined ? (
                    <Stepper label="秒数" value={`${it.seconds}s`}
                      onMinus={() => patchDayItem(di, ii, { seconds: Math.max(10, (it.seconds ?? 30) - 10) })}
                      onPlus={() => patchDayItem(di, ii, { seconds: Math.min(300, (it.seconds ?? 30) + 10) })} />
                  ) : (
                    <Stepper label="次数" value={`${it.reps}`}
                      onMinus={() => patchDayItem(di, ii, { reps: Math.max(2, (it.reps ?? 10) - 2) })}
                      onPlus={() => patchDayItem(di, ii, { reps: Math.min(60, (it.reps ?? 10) + 2) })} />
                  )}
                  <Stepper label="休息" value={`${it.restSeconds}s`}
                    onMinus={() => patchDayItem(di, ii, { restSeconds: Math.max(0, it.restSeconds - 5) })}
                    onPlus={() => patchDayItem(di, ii, { restSeconds: Math.min(120, it.restSeconds + 5) })} />
                </div>
              </div>
            );
          })}

          <button onClick={() => setPickerDay(di)}
            className="flex w-full items-center justify-center gap-1.5 rounded-2xl border-2 border-dashed border-nook-coral/40 py-2.5 text-sm font-semibold text-nook-coralDeep">
            <Plus size={15} /> 添加动作
          </button>
        </Card>
      ))}

      {error && <p className="text-center text-sm font-semibold text-red-500">{error}</p>}

      {/* 底部保存条 */}
      <div className="fixed inset-x-0 bottom-0 z-30 mx-auto max-w-md border-t-2 border-nook-ink/5 bg-nook-cream/95 p-3 backdrop-blur">
        <Button className="h-12 w-full text-base" disabled={saving} onClick={save}>
          {saving ? "保存中…" : <><Sparkles size={17} /> 保存计划 · {days.length} 天 / 日均 {avgMinutes} 分钟</>}
        </Button>
      </div>

      <ExercisePicker
        open={pickerDay !== null}
        exercises={exercises}
        onClose={() => setPickerDay(null)}
        onPick={addExercise}
        pickedIds={pickerDay !== null ? days[pickerDay]?.items.map((i) => i.exerciseId) ?? [] : []}
      />
    </div>
  );
}

function Stepper({ label, value, onMinus, onPlus }: {
  label: string; value: string; onMinus: () => void; onPlus: () => void;
}) {
  return (
    <div className="flex items-center gap-1">
      <span className="w-8 shrink-0 text-nook-inkSoft">{label}</span>
      <button onClick={onMinus} className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white shadow-clay-sm"><Minus size={11} /></button>
      <span className="w-8 shrink-0 text-center font-display text-sm font-bold">{value}</span>
      <button onClick={onPlus} className="grid h-6 w-6 shrink-0 place-items-center rounded-lg bg-white shadow-clay-sm"><Plus size={11} /></button>
    </div>
  );
}

function ExercisePicker({ open, exercises, pickedIds, onClose, onPick }: {
  open: boolean;
  exercises: Exercise[];
  pickedIds: number[];
  onClose: () => void;
  onPick: (e: Exercise) => void;
}) {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("全部");
  const list = useMemo(() => exercises.filter((e) => {
    const okF = filter === "全部" || e.muscleGroup === filter;
    const okS = !search || e.name.includes(search);
    return okF && okS;
  }), [exercises, search, filter]);

  return (
    <Modal open={open} onClose={onClose} title="选择动作">
      <div className="relative mb-2.5">
        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nook-inkSoft" />
        <Input className="pl-10" placeholder="搜索动作" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>
      <div className="mb-3 flex gap-1.5 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={cn("shrink-0 rounded-full border-2 px-3 py-1 text-xs font-semibold",
              filter === f ? "border-nook-coral/40 bg-nook-coral text-white" : "border-nook-ink/10 bg-white text-nook-inkSoft")}>
            {f}
          </button>
        ))}
      </div>
      <div className="max-h-[46vh] space-y-2 overflow-y-auto no-scrollbar">
        {list.map((e) => {
          const picked = pickedIds.includes(e.id);
          return (
            <button key={e.id} onClick={() => onPick(e)}
              className="flex w-full items-center gap-3 rounded-2xl border-2 border-nook-ink/10 bg-white p-2 text-left">
              <ExerciseGif src={e.gifUrl} alt={e.name} rounded="rounded-xl" className="h-12 w-12 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">{e.name}</p>
                <p className="text-xs text-nook-inkSoft">
                  {e.muscleGroup} · {e.measure === "duration" ? `${e.defaultSeconds}s` : `${e.defaultReps}次`}
                </p>
              </div>
              {picked && <Check size={16} className="mr-1 text-nook-mint" />}
              <Dumbbell size={15} className="text-nook-inkSoft" />
            </button>
          );
        })}
      </div>
    </Modal>
  );
}
