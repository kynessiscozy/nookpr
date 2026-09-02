# NookFit · 和 Nook 一起轻健身（DEMO）

以 52TOYS 的 Nook 形象为主题的轻量健身应用 Demo：动作演示全部是 Nook 亲自示范的**无缝循环 GIF**，Claymorphism 黏土软萌风、移动端优先（手机壳宽度）。

> 仅个人自用 Demo，Nook 形象版权归 52TOYS 所有，不做任何商业用途。

## 技术栈

- 前端：**React 18 + Vite 5 + TypeScript + Tailwind CSS + shadcn 风格组件**（自包含的轻量 UI 基元，无额外运行时依赖）
- 数据层：**腾讯云开发 TCB 托管 PostgreSQL**，前端 SDK（`@cloudbase/js-sdk`）直连，PostgREST 风格链式 API
- 认证：**TCB Auth 邮箱验证码登录**
- 数据库 7 张表：`exercises / plans / plan_days / profiles / user_plans / checkins / goals`，RLS 行级安全按用户隔离（见 `database/schema.sql`）
- **双数据实现**：未配置 TCB 时自动进入「本地演示模式」（localStorage，种子数据与 TCB 完全同源），开箱即跑

## 本地运行

```bash
npm install
npm run dev        # http://localhost:5173
```

演示模式登录：输入任意邮箱 → 点「获取验证码」→ 输入任意 6 位数字即可登录，数据保存在浏览器本地。

其他命令：

```bash
npm run build      # 类型检查 + 生产构建（输出 dist/）
npm run preview    # 预览生产构建
node scripts/e2e_check.mjs   # 无头浏览器端到端冒烟（需本机有 Chrome/Chromium）
```

## 接入腾讯云开发（TCB）

1. 在 [腾讯云开发控制台](https://console.cloud.tencent.com/tcb) 创建环境，开通 **PostgreSQL**，并在「身份验证 → 登录方式」里开启**邮箱验证码登录**。
2. 复制 `.env.example` 为 `.env.local`，填入环境 ID：

   ```bash
   VITE_TCB_ENV_ID=你的环境ID
   VITE_TCB_REGION=ap-shanghai
   ```

3. 在 PostgreSQL 中按顺序执行：

   ```bash
   # 先建表与 RLS 策略，再灌种子
   psql ... -f database/schema.sql
   psql ... -f database/seed.sql
   ```

   - `schema.sql`：7 张表、`current_user_id()` 辅助函数、`updated_at` 触发器，以及 RLS 策略
     - 公共内容表 `exercises / plans / plan_days`：所有登录用户只读
     - 用户数据表 `profiles / user_plans / checkins / goals`：只能读写自己的行
   - `seed.sql`：12 个动作、3 门课程（7/14/21 天）、42 个课程日
4. 重启 `npm run dev`，登录页不再显示「本地演示模式」即为真实 TCB 链路。

> 种子数据是**单一数据源**：`scripts/gen_seed.py` 同时生成 `database/seed.sql` 与 `src/lib/seedData.ts`，要改动作/课程只改这个 Python 脚本后重新运行，保证两条链路数据一致。

## 目录结构

```
nook-fit/
├─ database/
│  ├─ schema.sql            # 7 表 + RLS 行级安全 + 触发器
│  └─ seed.sql              # 动作/课程种子（gen_seed.py 生成，勿手改）
├─ scripts/
│  ├─ gen_seed.py           # 种子数据单一数据源生成器
│  └─ e2e_check.mjs         # 端到端冒烟脚本
├─ public/
│  ├─ gifs/                 # 8 个 Nook 动作循环 GIF（400×400，~300KB/个）
│  ├─ poses/                # GIF 关键帧 A/B 原图（重建 GIF 用）
│  └─ mascots/              # coach / celebrate / nook-hi 吉祥物
├─ build_gifs.sh            # ffmpeg 双关键帧 + 运动补偿生成无缝循环 GIF
└─ src/
   ├─ lib/
   │  ├─ tcb.ts             # TCB 初始化（app.rdb() / auth）
   │  ├─ repo.ts            # 数据仓库接口（页面只依赖它）
   │  ├─ tcbRepo.ts         # 真实 TCB 实现
   │  ├─ demoRepo.ts        # 本地演示实现（localStorage）
   │  ├─ auth.tsx           # AuthProvider / useAuth
   │  ├─ seedData.ts        # 本地演示种子（gen_seed.py 生成）
   │  └─ types.ts
   ├─ components/           # UI 基元 + 业务组件（ExerciseGif/BottomNav…）
   └─ pages/                # Login/Today/Plans/PlanDetail/Workout/Exercises/Checkin/Goals/Me
```

## 功能一览

- 邮箱验证码登录（TCB 真实链路 / 本地演示自动切换）
- 今日首页：本周目标环、连续打卡、周历、今日训练卡、Nook 小贴士
- 训练计划：3 门轻量课程、课程日列表、加入计划、进度推进
- 训练播放：计时/计次两类动作、组间休息可跳过、完成自动打卡并推进课程日
- 动作库：部位筛选 + 搜索，卡片播放 Nook GIF，详情弹窗含步骤与要点
- 打卡记录：连续天数/累计统计、月历、训练明细
- 目标设置：每周训练次数与分钟数
- 我的：昵称编辑、数据统计、菜单、退出登录

## 自动部署（GitHub Actions → TCB 静态托管）

仓库已内置 `.github/workflows/deploy.yml`：每次 push 到 `main`（或在 Actions 页手动 Run workflow）都会自动 `npm ci → 构建（注入 TCB 环境 ID）→ 部署到静态托管根目录`，带失败回滚、旧 hash 资源清理和发布校验。

一次性配置：

1. 在 TCB 控制台开通**静态网站托管**（地域需为上海）。
2. 到 [访问管理 → API 密钥管理](https://console.cloud.tencent.com/cam/capi) 创建 `SecretId / SecretKey`（建议用子账号，只授予云开发相关权限）。
3. 仓库 **Settings → Secrets and variables → Actions → New repository secret**，添加 3 个 Secret：
   - `TCB_SECRET_ID`：腾讯云 SecretId
   - `TCB_SECRET_KEY`：腾讯云 SecretKey
   - `TCB_ENV_ID`：云开发环境 ID（构建时通过 `VITE_TCB_ENV_ID` 打进产物）
4. **SPA 路由回退（必做一次）**：静态托管 → 设置 → 把「错误文档」也设为 `index.html`，否则刷新 `/plans` 这类前端路由会 404（首页文档默认已是 index.html）。
5. push 一次代码触发部署，完成后在静态托管概览页拿到默认域名 `*.tcloudbaseapp.com`；正式使用建议绑定自定义域名。

> 不配置这些 Secret 时工作流会在登录/部署步骤失败，但本地开发与演示模式不受影响。

## Nook 动作 GIF 是怎么做的

1. 以 Nook 原图为身份锚点，用图像编辑模型为每个动作生成 A/B 两个关键姿态（保持角色一致）；
2. `build_gifs.sh` 用 ffmpeg `minterpolate` 运动补偿在两帧间补间，关键姿态保持 0.32s、过渡 0.18s，再反向拼回形成 A→B→A 无缝循环；
3. `paletteuse` 调色板优化输出 400×400、20fps、约 300KB 的轻量 GIF。
新增动作时沿用同一流程，替换 `public/poses/<slug>_{a,b}.png` 后跑 `bash build_gifs.sh` 即可。
