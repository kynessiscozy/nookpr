-- ============================================================
-- NookFit · TCB 托管 PostgreSQL Schema
-- 七张表：exercises / plans / plan_days / profiles /
--         user_plans / checkins / goals
-- 行级安全(RLS)：公共内容只读，用户数据按 user_id 隔离
-- ============================================================

-- ---------- 0. 扩展与当前用户辅助函数 ----------
CREATE EXTENSION IF NOT EXISTS pgcrypto;        -- gen_random_uuid()

-- TCB Web SDK（app.rdb() / PostgREST 通道）会在请求中携带登录 JWT，
-- 下面的函数从 GUC 中取出当前登录用户 ID（即 auth.users 的 sub/uid）。
-- 若控制台版本使用的 claim 路径不同，只需调整这一个函数。
CREATE OR REPLACE FUNCTION current_user_id() RETURNS text
  LANGUAGE sql STABLE AS $$
    SELECT COALESCE(
      NULLIF(current_setting('request.jwt.claims', TRUE), '')::jsonb ->> 'sub',
      NULLIF(current_setting('request.jwt.claim.sub', TRUE), ''),
      NULLIF(current_setting('request.jwt.claim.user_id', TRUE), ''),
      ''
    );
  $$;

-- ============================================================
-- 1. exercises 动作库（公共只读，后台维护）
-- ============================================================
CREATE TABLE IF NOT EXISTS exercises (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug             TEXT NOT NULL UNIQUE,
  name             TEXT NOT NULL,
  muscle_group     TEXT NOT NULL DEFAULT '全身',   -- 下肢/上肢/核心/全身
  category         TEXT NOT NULL DEFAULT '力量',   -- 力量/有氧/稳定/柔韧
  level            TEXT NOT NULL DEFAULT '入门',
  equipment        TEXT NOT NULL DEFAULT '无器械',
  calories_per_min NUMERIC(4,1) NOT NULL DEFAULT 6,
  measure          TEXT NOT NULL DEFAULT 'reps' CHECK (measure IN ('reps','duration')),
  default_reps     INT,
  default_seconds  INT,
  gif_url          TEXT,                           -- Nook 动作演示 GIF
  steps            TEXT[] NOT NULL DEFAULT '{}',
  tips             TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. plans 课程（公共只读）
-- ============================================================
CREATE TABLE IF NOT EXISTS plans (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  slug            TEXT NOT NULL UNIQUE,
  title           TEXT NOT NULL,
  description     TEXT NOT NULL DEFAULT '',
  level           TEXT NOT NULL DEFAULT '入门',
  days_total      INT NOT NULL DEFAULT 7,
  minutes_per_day INT NOT NULL DEFAULT 10,
  color           TEXT NOT NULL DEFAULT '#8FE3C1',
  tag             TEXT NOT NULL DEFAULT '',
  is_published    BOOLEAN NOT NULL DEFAULT TRUE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 3. plan_days 课程日（公共只读；items 为当日动作编排 jsonb）
-- items 结构: [{ exercise_id, sets, reps?, seconds?, rest_seconds }]
-- ============================================================
CREATE TABLE IF NOT EXISTS plan_days (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  plan_id    BIGINT NOT NULL REFERENCES plans(id) ON DELETE CASCADE,
  day_number INT NOT NULL,
  title      TEXT NOT NULL DEFAULT '',
  minutes    INT NOT NULL DEFAULT 8,
  items      JSONB NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE (plan_id, day_number)
);
CREATE INDEX IF NOT EXISTS idx_plan_days_plan ON plan_days(plan_id);

-- ============================================================
-- 4. profiles 用户档案（用户私有）
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL UNIQUE,           -- = current_user_id()
  email      TEXT NOT NULL DEFAULT '',
  nickname   TEXT NOT NULL DEFAULT 'Nook 小伙伴',
  avatar_url TEXT NOT NULL DEFAULT '/mascots/coach.png',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. user_plans 我的课程（用户私有）
-- ============================================================
CREATE TABLE IF NOT EXISTS user_plans (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     TEXT NOT NULL,
  -- 正数=官方 plans 课程；负数=用户自建计划（编排存于 custom_plan），故不加外键
  plan_id     BIGINT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','paused','done')),
  current_day INT NOT NULL DEFAULT 1,
  started_on  DATE NOT NULL DEFAULT CURRENT_DATE,
  -- 用户自建计划完整定义：{title,level,color,tag,description,days:[{title,items:[...]}]}
  custom_plan JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, plan_id)
);
-- 兼容旧库：补齐列、移除阻碍自建计划负 ID 的外键
ALTER TABLE user_plans ADD COLUMN IF NOT EXISTS custom_plan JSONB;
ALTER TABLE user_plans DROP CONSTRAINT IF EXISTS user_plans_plan_id_fkey;
CREATE INDEX IF NOT EXISTS idx_user_plans_user ON user_plans(user_id);

-- ============================================================
-- 6. checkins 训练打卡（用户私有）
-- ============================================================
CREATE TABLE IF NOT EXISTS checkins (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      TEXT NOT NULL,
  plan_id      BIGINT REFERENCES plans(id) ON DELETE SET NULL,
  plan_day_id  BIGINT,
  workout_date DATE NOT NULL DEFAULT CURRENT_DATE,
  minutes      INT NOT NULL DEFAULT 0,
  kcal         INT NOT NULL DEFAULT 0,
  note         TEXT NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON checkins(user_id, workout_date DESC);

-- ============================================================
-- 7. goals 训练目标（用户私有，每人一行）
-- ============================================================
CREATE TABLE IF NOT EXISTS goals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           TEXT NOT NULL UNIQUE,
  workouts_per_week INT NOT NULL DEFAULT 4 CHECK (workouts_per_week BETWEEN 1 AND 14),
  minutes_per_week  INT NOT NULL DEFAULT 120 CHECK (minutes_per_week BETWEEN 10 AND 1500),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- RLS：全部启用
-- ============================================================
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE plans     ENABLE ROW LEVEL SECURITY;
ALTER TABLE plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles  ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE checkins  ENABLE ROW LEVEL SECURITY;
ALTER TABLE goals     ENABLE ROW LEVEL SECURITY;

-- 公共内容：任何登录用户可读；写入一律拒绝（仅后台/管理员可维护）
CREATE POLICY p_exercises_read ON exercises FOR SELECT USING (TRUE);
CREATE POLICY p_plans_read     ON plans     FOR SELECT USING (TRUE);
CREATE POLICY p_plan_days_read ON plan_days FOR SELECT USING (TRUE);

-- 私有表：仅能读写自己 user_id 的行
CREATE POLICY p_profiles_rw ON profiles
  FOR ALL USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

CREATE POLICY p_user_plans_rw ON user_plans
  FOR ALL USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

CREATE POLICY p_checkins_rw ON checkins
  FOR ALL USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

CREATE POLICY p_goals_rw ON goals
  FOR ALL USING (user_id = current_user_id())
  WITH CHECK (user_id = current_user_id());

-- updated_at 自动维护
CREATE OR REPLACE FUNCTION touch_updated_at() RETURNS trigger
  LANGUAGE plpgsql AS $$
  BEGIN NEW.updated_at = now(); RETURN NEW; END $$;

DROP TRIGGER IF EXISTS trg_profiles_touch ON profiles;
CREATE TRIGGER trg_profiles_touch BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS trg_user_plans_touch ON user_plans;
CREATE TRIGGER trg_user_plans_touch BEFORE UPDATE ON user_plans
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();
DROP TRIGGER IF EXISTS trg_goals_touch ON goals;
CREATE TRIGGER trg_goals_touch BEFORE UPDATE ON goals
  FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- ============================================================
-- 部署顺序：先执行本文件，再执行 seed.sql
-- ============================================================
