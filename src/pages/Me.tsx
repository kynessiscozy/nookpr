import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  CalendarCheck2, ChevronRight, Clock, Dumbbell, Flame, LayoutGrid, LogOut,
  Pencil, Target, Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import type { Checkin, Profile } from "@/lib/types";
import { calcStreak } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Mascot } from "@/components/Mascot";
import { Loading } from "@/components/States";

export default function Me() {
  const { repo, user, logout, demoMode } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [checkins, setCheckins] = useState<Checkin[]>([]);
  const [editOpen, setEditOpen] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    if (!repo || !user) return;
    void (async () => {
      setProfile(await repo.ensureProfile(user));
      setCheckins(await repo.listCheckins());
    })();
  }, [repo, user]);

  const stats = useMemo(() => {
    const dates = [...new Set(checkins.map((c) => c.workoutDate))];
    return {
      streak: calcStreak(dates),
      total: dates.length,
      minutes: checkins.reduce((s, c) => s + c.minutes, 0),
      kcal: checkins.reduce((s, c) => s + c.kcal, 0),
    };
  }, [checkins]);

  if (!profile) return <Loading />;

  async function saveName() {
    if (!repo || !name.trim()) return setEditOpen(false);
    const p = await repo.updateProfile({ nickname: name.trim() });
    setProfile(p);
    setEditOpen(false);
  }

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  return (
    <div className="space-y-4 pb-4">
      <h1 className="font-display text-2xl font-bold">我的</h1>

      <Card className="flex items-center gap-4">
        <div className="clay-sm h-16 w-16 overflow-hidden bg-nook-cream p-1">
          <Mascot name="coach" className="h-full w-full" />
        </div>
        <div className="min-w-0 flex-1">
          <button className="flex items-center gap-1.5 font-display text-lg font-bold" onClick={() => { setName(profile.nickname); setEditOpen(true); }}>
            {profile.nickname} <Pencil size={14} className="text-nook-inkSoft" />
          </button>
          <p className="truncate text-sm text-nook-inkSoft">{profile.email}</p>
          {demoMode && <span className="mt-1 inline-block rounded-full bg-nook-sunny/40 px-2 py-0.5 text-[11px] font-semibold text-amber-800">本地演示模式</span>}
        </div>
      </Card>

      <div className="grid grid-cols-4 gap-2.5">
        <MiniStat value={stats.streak} label="连续天" />
        <MiniStat value={stats.total} label="总打卡" />
        <MiniStat value={stats.minutes} label="分钟" />
        <MiniStat value={stats.kcal} label="千卡" />
      </div>

      <Card className="divide-y divide-nook-ink/5 p-0">
        <Row icon={<Dumbbell size={18} />} to="/plans" label="训练计划" />
        <Row icon={<LayoutGrid size={18} />} to="/exercises" label="动作库" />
        <Row icon={<CalendarCheck2 size={18} />} to="/checkin" label="打卡记录" />
        <Row icon={<Target size={18} />} to="/goals" label="训练目标" />
      </Card>

      <Card className="flex items-center gap-3 p-3 text-sm text-nook-inkSoft">
        <Clock size={16} />
        轻量健身，重在坚持。Nook 会一直陪着你。
        <Flame size={16} className="ml-auto text-nook-coral" />
      </Card>

      <Button variant="ghost" className="w-full text-red-500" onClick={handleLogout}>
        <LogOut size={17} /> 退出登录
      </Button>

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="修改昵称">
        <Input value={name} maxLength={12} onChange={(e) => setName(e.target.value)} placeholder="给自己起个名字" />
        <div className="mt-3 flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={() => setEditOpen(false)}>取消</Button>
          <Button className="flex-1" onClick={saveName}><Check size={16} /> 保存</Button>
        </div>
      </Modal>
    </div>
  );
}

function MiniStat({ value, label }: { value: number; label: string }) {
  return (
    <div className="clay-sm flex flex-col items-center py-3">
      <span className="font-display text-lg font-bold text-nook-coralDeep">{value}</span>
      <span className="text-[11px] text-nook-inkSoft">{label}</span>
    </div>
  );
}

function Row({ icon, label, to }: { icon: React.ReactNode; label: string; to: string }) {
  return (
    <Link to={to} className="flex items-center gap-3 px-4 py-3.5">
      <span className="text-nook-coralDeep">{icon}</span>
      <span className="flex-1 text-[15px] font-semibold">{label}</span>
      <ChevronRight size={18} className="text-nook-inkSoft" />
    </Link>
  );
}
