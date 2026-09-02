import {
  createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode,
} from "react";
import { IS_DEMO_MODE, getCurrentUser, sendEmailCode, signInByEmailCode, signOutTcb } from "./tcb";
import { TcbRepo } from "./tcbRepo";
import { DemoRepo } from "./demoRepo";
import type { Repo } from "./repo";
import type { AppUser } from "./types";

interface AuthCtx {
  user: AppUser | null;
  repo: Repo | null;
  loading: boolean;
  demoMode: boolean;
  sendCode: (email: string) => Promise<void>;
  login: (email: string, code: string) => Promise<void>;
  logout: () => Promise<void>;
}

const Ctx = createContext<AuthCtx | null>(null);
const DEMO_SESSION_KEY = "nookfit-demo-session";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationInfo, setVerificationInfo] = useState<unknown>(null);

  useEffect(() => {
    (async () => {
      try {
        if (IS_DEMO_MODE) {
          const raw = localStorage.getItem(DEMO_SESSION_KEY);
          if (raw) setUser(JSON.parse(raw));
        } else {
          const u = await getCurrentUser();
          setUser(u);
        }
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const sendCode = useCallback(async (email: string) => {
    if (IS_DEMO_MODE) {
      // 演示模式不真正发信，模拟网络延迟
      await new Promise((r) => setTimeout(r, 600));
      setVerificationInfo({ demo: true, email });
      return;
    }
    const info = await sendEmailCode(email);
    setVerificationInfo(info);
  }, []);

  const login = useCallback(async (email: string, code: string) => {
    let u: AppUser;
    if (IS_DEMO_MODE) {
      if (!/^\d{6}$/.test(code)) throw new Error("演示模式请输入 6 位数字验证码（任意数字均可）");
      await new Promise((r) => setTimeout(r, 500));
      u = { uid: `demo-${btoa(email).replace(/=/g, "")}`, email };
      localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(u));
    } else {
      u = await signInByEmailCode(email, code, verificationInfo);
    }
    setUser(u);
  }, [verificationInfo]);

  const logout = useCallback(async () => {
    if (IS_DEMO_MODE) localStorage.removeItem(DEMO_SESSION_KEY);
    else await signOutTcb();
    setUser(null);
  }, []);

  const repo = useMemo<Repo | null>(() => {
    if (!user) return null;
    return IS_DEMO_MODE ? new DemoRepo(user) : new TcbRepo(user.uid, user.email);
  }, [user]);

  const value: AuthCtx = { user, repo, loading, demoMode: IS_DEMO_MODE, sendCode, login, logout };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  const v = useContext(Ctx);
  if (!v) throw new Error("useAuth 必须在 AuthProvider 内使用");
  return v;
}
