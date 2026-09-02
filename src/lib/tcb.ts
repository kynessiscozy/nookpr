// 腾讯云开发 TCB 初始化与 Auth 封装
// 文档：
//  - 初始化/登录态 https://docs.cloudbase.net/api-reference/webv3/authentication
//  - 邮箱验证码   https://docs.cloudbase.net/authentication-v2/method/email-login
//  - PostgreSQL  https://docs.cloudbase.net/api-reference/webv3-pg/postgresql/fetch
// 为避免不同 SDK 版本类型差异，这里以最小接口约束运行时对象。
import cloudbase from "@cloudbase/js-sdk";
import type { AppUser } from "./types";

export const TCB_ENV_ID = import.meta.env.VITE_TCB_ENV_ID as string | undefined;
export const TCB_REGION = (import.meta.env.VITE_TCB_REGION as string | undefined) ?? "ap-shanghai";

/** 未配置环境 ID 时进入本地演示模式 */
export const IS_DEMO_MODE = !TCB_ENV_ID;

/* eslint-disable @typescript-eslint/no-explicit-any */
let app: any = null;
let auth: any = null;
let rdb: any = null;

export function getApp() {
  if (!app) {
    app = (cloudbase as any).init({
      env: TCB_ENV_ID,
      region: TCB_REGION,
      auth: { detectSessionInUrl: false },
    });
  }
  return app;
}

export function getAuth() {
  if (!auth) auth = getApp().auth();
  return auth;
}

/** PostgreSQL 前端直连入口（链式查询，风格同 PostgREST） */
export function getRdb() {
  if (!rdb) rdb = getApp().rdb();
  return rdb;
}

/** 统一解包 { data, error } 风格返回，出错直接抛异常 */
export function unwrap<T>(res: { data?: T; error?: unknown } | null | undefined): T {
  if (res && (res as any).error) {
    const e = (res as any).error;
    throw new Error(e?.message ?? "TCB 请求失败");
  }
  return (res?.data ?? ([] as unknown)) as T;
}

// ---------------- Auth ----------------

/** 第一步：发送邮箱验证码，返回 verificationInfo 供登录时回传 */
export async function sendEmailCode(email: string) {
  const a = getAuth();
  const res = await a.getVerification({ email });
  if (res?.error) throw new Error(res.error.message ?? "验证码发送失败");
  return res?.data?.verificationInfo ?? res?.verificationInfo ?? null;
}

/** 第二步：邮箱 + 验证码登录 */
export async function signInByEmailCode(email: string, code: string, verificationInfo: unknown) {
  const a = getAuth();
  const res = await a.signInWithEmail({ email, verificationCode: code, verificationInfo });
  if (res?.error) throw new Error(res.error.message ?? "登录失败");
  const user = res?.data?.user ?? res?.user;
  if (!user) throw new Error("登录失败：未返回用户");
  return toAppUser(user, email);
}

export async function getCurrentUser(): Promise<AppUser | null> {
  const a = getAuth();
  const res = await a.getSession();
  const session = res?.data?.session ?? res?.session;
  const user = session?.user;
  if (!user) return null;
  return toAppUser(user, user.email);
}

export async function signOutTcb() {
  const a = getAuth();
  try {
    await a.signOut();
  } catch {
    /* ignore */
  }
}

function toAppUser(u: any, fallbackEmail = ""): AppUser {
  return { uid: String(u.uid ?? u.id ?? u.uuid ?? ""), email: u.email ?? fallbackEmail ?? "" };
}
