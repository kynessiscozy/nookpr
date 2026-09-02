import { useEffect, useMemo, useState } from "react";
import { Search, Timer, Repeat, Flame } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Exercise } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { ExerciseGif } from "@/components/ExerciseGif";
import { Loading } from "@/components/States";
import { cn } from "@/lib/utils";

const FILTERS = ["全部", "下肢", "上肢", "核心", "全身"];

export default function Exercises() {
  const { repo } = useAuth();
  const [all, setAll] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("全部");
  const [search, setSearch] = useState("");
  const [current, setCurrent] = useState<Exercise | null>(null);

  useEffect(() => {
    if (!repo) return;
    void repo.listExercises().then((d) => { setAll(d); setLoading(false); });
  }, [repo]);

  const list = useMemo(() => all.filter((e) => {
    const okF = filter === "全部" || e.muscleGroup === filter;
    const okS = !search || e.name.includes(search) || e.category.includes(search);
    return okF && okS;
  }), [all, filter, search]);

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-2xl font-bold">动作库</h1>
        <p className="text-sm text-nook-inkSoft">每个动作都有 Nook 亲自示范</p>
      </header>

      <div className="relative">
        <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nook-inkSoft" />
        <Input className="pl-10" placeholder="搜索动作，如 深蹲" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              "shrink-0 rounded-full border-2 px-4 py-1.5 text-sm font-semibold transition-all",
              filter === f
                ? "border-nook-coral/40 bg-nook-coral text-white shadow-clay-sm"
                : "border-nook-ink/10 bg-white/80 text-nook-inkSoft",
            )}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {list.map((e) => (
          <Card key={e.id} className="cursor-pointer p-2.5" onClick={() => setCurrent(e)}>
            <ExerciseGif src={e.gifUrl} alt={e.name} className="aspect-square w-full" rounded="rounded-xl" />
            <p className="mt-2 px-1 font-display text-[15px] font-semibold leading-5">{e.name}</p>
            <div className="mt-1 flex flex-wrap gap-1 px-1">
              <Badge tone="coral">{e.category}</Badge>
              <span className="inline-flex items-center gap-0.5 text-[11px] text-nook-inkSoft">
                {e.measure === "duration" ? <Timer size={11} /> : <Repeat size={11} />}
                {e.measure === "duration" ? `${e.defaultSeconds}s` : `${e.defaultReps}次`}
              </span>
            </div>
          </Card>
        ))}
      </div>

      <Modal open={!!current} onClose={() => setCurrent(null)} title={current?.name}>
        {current && <ExerciseDetail e={current} onClose={() => setCurrent(null)} />}
      </Modal>
    </div>
  );
}

function ExerciseDetail({ e, onClose }: { e: Exercise; onClose: () => void }) {
  return (
    <div className="space-y-3">
      <ExerciseGif src={e.gifUrl} alt={e.name} className="mx-auto aspect-square w-64" rounded="rounded-clay" />
      <div className="flex flex-wrap gap-1.5">
        <Badge tone="coral">{e.category}</Badge>
        <Badge tone="mint">{e.muscleGroup}</Badge>
        <Badge tone="sunny">{e.level}</Badge>
        <Badge tone="lavender"><Flame size={11} /> {e.caloriesPerMin} kcal/分</Badge>
      </div>
      <div>
        <p className="mb-1.5 text-sm font-semibold">动作步骤</p>
        <ol className="space-y-2">
          {e.steps.map((s, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-6 text-nook-inkSoft">
              <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-nook-peach/70 text-xs font-bold text-nook-coralDeep">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </div>
      <p className="rounded-2xl bg-nook-sunny/25 px-3.5 py-2.5 text-[13px] text-amber-800">Nook 提示：{e.tips}</p>
      <Button variant="ghost" className="w-full" onClick={onClose}>知道啦</Button>
    </div>
  );
}
