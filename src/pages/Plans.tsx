import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Clock, CalendarRange, Check, Plus, Wand2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Plan, UserPlan } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loading } from "@/components/States";

export default function Plans() {
  const { repo } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!repo) return;
    void Promise.all([repo.listPlans(), repo.listUserPlans()]).then(([ps, ups]) => {
      setPlans(ps);
      setUserPlans(ups);
      setLoading(false);
    });
  }, [repo]);

  if (loading) return <Loading />;
  const joinedOf = (id: number) => userPlans.find((u) => u.planId === id);

  return (
    <div className="space-y-4">
      <header>
        <h1 className="font-display text-2xl font-bold">训练计划</h1>
        <p className="text-sm text-nook-inkSoft">徒手轻量，跟着 Nook 每天练一点</p>
      </header>

      <Link to="/plans/new">
        <Card className="flex items-center gap-3 border-dashed border-nook-coral/50 bg-nook-peach/40 p-3.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-nook-coral text-white shadow-clay-sm">
            <Plus size={20} />
          </span>
          <div className="flex-1">
            <p className="flex items-center gap-1.5 font-display font-semibold">自建训练计划 <Wand2 size={14} className="text-nook-coral" /></p>
            <p className="text-xs text-nook-inkSoft">从 16 个动作里挑，自由编排每天练什么</p>
          </div>
          <ChevronRight className="text-nook-inkSoft" size={20} />
        </Card>
      </Link>

      {plans.map((p) => {
        const joined = joinedOf(p.id);
        return (
          <Link key={p.id} to={`/plans/${p.id}`}>
            <Card className="flex items-center gap-4 p-3">
              <div
                className="grid h-20 w-20 shrink-0 place-items-center rounded-clay border-2 border-nook-ink/10 shadow-clay-sm"
                style={{ background: `linear-gradient(135deg, ${p.color}, #ffffff90)` }}
              >
                <span className="font-display text-2xl font-bold text-nook-ink/70">{p.daysTotal}<span className="text-xs">天</span></span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h2 className="truncate font-display text-lg font-semibold">{p.title}</h2>
                  {p.isCustom && <Badge tone="lavender">自建</Badge>}
                </div>
                <p className="mt-0.5 line-clamp-2 text-[13px] leading-5 text-nook-inkSoft">{p.description}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge tone="coral">{p.level}</Badge>
                  <Badge tone="mint"><Clock size={11} /> {p.minutesPerDay} 分钟/天</Badge>
                  <Badge tone="sunny"><CalendarRange size={11} /> {p.tag}</Badge>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1.5">
                {joined ? (
                  <Badge tone="mint"><Check size={11} /> {joined.status === "done" ? "已完成" : `第 ${joined.currentDay} 天`}</Badge>
                ) : null}
                <ChevronRight className="text-nook-inkSoft" size={20} />
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
