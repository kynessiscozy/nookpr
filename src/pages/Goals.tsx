import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Check, Minus, Plus, Target, Timer } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Goal } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GoalRing } from "@/components/GoalRing";
import { Loading } from "@/components/States";

export default function Goals() {
  const { repo } = useAuth();
  const [goal, setGoal] = useState<Goal | null>(null);
  const [times, setTimes] = useState(4);
  const [minutes, setMinutes] = useState(120);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (!repo) return;
    void repo.getGoal().then((g) => { setGoal(g); setTimes(g.workoutsPerWeek); setMinutes(g.minutesPerWeek); });
  }, [repo]);

  if (!goal) return <Loading />;

  async function save() {
    if (!repo) return;
    const g = await repo.saveGoal({ workoutsPerWeek: times, minutesPerWeek: minutes });
    setGoal(g); setSaved(true); setTimeout(() => setSaved(false), 1600);
  }

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-2">
        <Link to="/me" className="clay-sm grid h-10 w-10 place-items-center"><ArrowLeft size={18} /></Link>
        <h1 className="font-display text-xl font-bold">我的目标</h1>
      </div>

      <Card className="flex flex-col items-center gap-2 py-6">
        <GoalRing value={times / 7} size={130} label={
          <div className="text-center">
            <p className="font-display text-2xl font-bold text-nook-coralDeep">{times}<span className="text-sm">次/周</span></p>
            <p className="text-[11px] text-nook-inkSoft">每周训练频率</p>
          </div>
        } />
        <p className="text-xs text-nook-inkSoft">建议新手每周 3-4 次，循序渐进</p>
      </Card>

      <Stepper
        icon={<Target size={17} />} title="每周训练次数" value={`${times} 次`}
        onMinus={() => setTimes((v) => Math.max(1, v - 1))}
        onPlus={() => setTimes((v) => Math.min(14, v + 1))}
      />
      <Stepper
        icon={<Timer size={17} />} title="每周运动时长" value={`${minutes} 分钟`}
        onMinus={() => setMinutes((v) => Math.max(30, v - 10))}
        onPlus={() => setMinutes((v) => Math.min(1500, v + 10))}
      />

      <Button className="h-12 w-full text-base" onClick={save}>
        {saved ? <><Check size={18} /> 已保存</> : "保存目标"}
      </Button>
    </div>
  );
}

function Stepper({ icon, title, value, onMinus, onPlus }: {
  icon: React.ReactNode; title: string; value: string; onMinus: () => void; onPlus: () => void;
}) {
  return (
    <Card className="flex items-center gap-3">
      <span className="grid h-10 w-10 place-items-center rounded-2xl bg-nook-lavender/40">{icon}</span>
      <span className="flex-1 font-semibold">{title}</span>
      <button onClick={onMinus} className="clay-sm grid h-9 w-9 place-items-center"><Minus size={16} /></button>
      <span className="w-20 text-center font-display font-bold">{value}</span>
      <button onClick={onPlus} className="clay-sm grid h-9 w-9 place-items-center"><Plus size={16} /></button>
    </Card>
  );
}
