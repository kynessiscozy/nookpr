import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CalendarDays, Clock, Flame, Trophy } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Checkin as Ci, Plan } from "@/lib/types";
import { calcStreak, ymd } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Loading, EmptyState } from "@/components/States";
import { Button } from "@/components/ui/button";

export default function Checkin() {
  const { repo } = useAuth();
  const [list, setList] = useState<Ci[]>([]);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => new Date());

  useEffect(() => {
    if (!repo) return;
    void Promise.all([repo.listCheckins(), repo.listPlans()]).then(([cs, ps]) => {
      setList(cs); setPlans(ps); setLoading(false);
    });
  }, [repo]);

  const dateSet = useMemo(() => new Set(list.map((c) => c.workoutDate)), [list]);
  const stats = useMemo(() => ({
    streak: calcStreak([...dateSet]),
    minutes: list.reduce((s, c) => s + c.minutes, 0),
    kcal: list.reduce((s, c) => s + c.kcal, 0),
  }), [list, dateSet]);

  const planMap = useMemo(() => new Map(plans.map((p) => [p.id, p])), [plans]);

  // 月历
  const year = cursor.getFullYear(), month = cursor.getMonth();
  const first = new Date(year, month, 1);
  const lead = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells: (number | null)[] = [
    ...Array.from({ length: lead }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  const today = ymd(new Date());

  if (loading) return <Loading />;

  return (
    <div className="space-y-4 pb-4">
      <div className="flex items-center gap-2">
        <Link to="/" className="clay-sm grid h-10 w-10 place-items-center"><ArrowLeft size={18} /></Link>
        <h1 className="font-display text-xl font-bold">打卡记录</h1>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <StatCard icon={<Trophy size={17} />} value={`${stats.streak}`} label="连续天数" tone="bg-nook-peach/70" />
        <StatCard icon={<Clock size={17} />} value={`${stats.minutes}`} label="累计分钟" tone="bg-nook-mint/50" />
        <StatCard icon={<Flame size={17} />} value={`${stats.kcal}`} label="累计千卡" tone="bg-nook-sunny/50" />
      </div>

      <Card>
        <div className="mb-3 flex items-center justify-between">
          <button className="rounded-lg px-2 py-1 text-sm font-bold" onClick={() => setCursor(new Date(year, month - 1, 1))}>‹</button>
          <span className="flex items-center gap-1.5 font-display font-semibold"><CalendarDays size={16} />{year} 年 {month + 1} 月</span>
          <button className="rounded-lg px-2 py-1 text-sm font-bold" onClick={() => setCursor(new Date(year, month + 1, 1))}>›</button>
        </div>
        <div className="mb-1 grid grid-cols-7 gap-1 text-center text-[11px] text-nook-inkSoft">
          {["一","二","三","四","五","六","日"].map((w) => <span key={w}>{w}</span>)}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {cells.map((d, i) => {
            if (!d) return <span key={i} />;
            const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
            const hit = dateSet.has(ds);
            return (
              <div key={i} className={`grid aspect-square place-items-center rounded-xl text-xs font-semibold ${
                hit ? "bg-nook-coral text-white shadow-clay-sm"
                  : ds === today ? "bg-nook-peach/70 text-nook-coralDeep"
                    : "bg-nook-cream/70 text-nook-inkSoft" }`}>
                {d}
              </div>
            );
          })}
        </div>
      </Card>

      <h2 className="font-display font-semibold">训练明细</h2>
      {list.length === 0 ? (
        <EmptyState title="还没有打卡记录" hint="完成一次训练就会自动打卡" action={<Link to="/plans"><Button>去训练</Button></Link>} />
      ) : (
        <div className="space-y-2.5">
          {list.map((c) => (
            <Card key={c.id} className="flex items-center gap-3 py-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-nook-mint/40 font-display text-sm font-bold leading-4 text-center">
                {Number(c.workoutDate.slice(8))}<br /><span className="text-[9px]">{c.workoutDate.slice(5, 7)}月</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">
                  {(c.planId && planMap.get(c.planId)?.title) || "自由训练"}
                </p>
                <p className="text-xs text-nook-inkSoft">{c.workoutDate} · {c.minutes} 分钟 · {c.kcal} kcal</p>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function StatCard({ icon, value, label, tone }: { icon: React.ReactNode; value: string; label: string; tone: string }) {
  return (
    <Card className="flex flex-col items-center gap-1 py-3.5">
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${tone} text-nook-coralDeep`}>{icon}</span>
      <span className="font-display text-xl font-bold">{value}</span>
      <span className="text-[11px] text-nook-inkSoft">{label}</span>
    </Card>
  );
}
