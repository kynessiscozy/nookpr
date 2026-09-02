import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mascot } from "@/components/Mascot";

export default function Login() {
  const { sendCode, login, demoMode } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [sent, setSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown]);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  async function handleSend() {
    setErr("");
    if (!emailValid) return setErr("请输入正确的邮箱地址");
    setBusy(true);
    try {
      await sendCode(email.trim());
      setSent(true);
      setCountdown(60);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function handleLogin() {
    setErr("");
    if (!emailValid) return setErr("请输入正确的邮箱地址");
    if (code.trim().length !== 6) return setErr("请输入 6 位验证码");
    setBusy(true);
    try {
      await login(email.trim(), code.trim());
      navigate("/", { replace: true });
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-full w-full max-w-md flex-col items-center justify-center px-6 py-10">
      <div className="mb-2 flex flex-col items-center">
        <Mascot name="coach" className="h-36 w-36 animate-soft-bounce" />
        <h1 className="mt-1 font-display text-3xl font-bold tracking-tight text-nook-ink">
          Nook<span className="text-nook-coral">Fit</span>
        </h1>
        <p className="mt-1 text-sm text-nook-inkSoft">和 Nook 一起，每天轻健身</p>
      </div>

      {demoMode && (
        <div className="mb-4 flex w-full items-start gap-2 rounded-2xl border-2 border-nook-sunny/50 bg-nook-sunny/20 p-3 text-[13px] text-amber-800">
          <Sparkles size={16} className="mt-0.5 shrink-0" />
          <span>
            当前为<b>本地演示模式</b>：点击「获取验证码」后，输入任意 6 位数字即可登录，数据保存在本机浏览器。
            配置 <code className="rounded bg-white/70 px-1">VITE_TCB_ENV_ID</code> 后自动接入腾讯云开发。
          </span>
        </div>
      )}

      <div className="clay w-full space-y-3 p-5">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-nook-ink">邮箱</span>
          <div className="relative">
            <Mail size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-nook-inkSoft" />
            <Input
              className="pl-10"
              type="email"
              inputMode="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </label>

        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-nook-ink">邮箱验证码</span>
          <div className="flex gap-2">
            <Input
              inputMode="numeric"
              maxLength={6}
              placeholder="6 位验证码"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            />
            <Button
              type="button"
              variant="ghost"
              className="shrink-0"
              disabled={busy || countdown > 0 || !emailValid}
              onClick={handleSend}
            >
              {countdown > 0 ? `${countdown}s` : sent ? "重新发送" : "获取验证码"}
            </Button>
          </div>
        </label>

        {err && <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{err}</p>}

        <Button className="h-12 w-full text-base" disabled={busy} onClick={handleLogin}>
          <ShieldCheck size={18} />
          {busy ? "请稍候…" : "登录 / 注册"}
        </Button>
        <p className="text-center text-xs text-nook-inkSoft">未注册的邮箱验证通过后将自动创建账号</p>
      </div>
    </div>
  );
}
