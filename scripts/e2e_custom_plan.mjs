// 自建计划 E2E：登录 → /plans/new 编排 → 保存 → 详情 → 完成训练 → 计划列表显示
import puppeteer from "puppeteer-core";
import { mkdirSync } from "node:fs";
const OUT = "/tmp/nook-e2e";
mkdirSync(OUT, { recursive: true });
const errors = [];
const browser = await puppeteer.launch({
  executablePath: "/opt/browser/chrome",
  headless: "new",
  args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
});
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 2 });
page.on("console", (m) => { if (m.type() === "error") errors.push("CONSOLE: " + m.text()); });
page.on("pageerror", (e) => errors.push("PAGEERROR: " + e.message));
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const assertText = async (t, label) => {
  const ok = await page.$eval("body", (el, s) => el.innerText.includes(s), t).catch(() => false);
  console.log(ok ? `PASS ${label} :: ${t}` : `FAIL ${label} :: 缺少「${t}」`);
  if (!ok) process.exitCode = 1;
};
const clickByText = async (t) => page.$$eval("button", (bs, s) => bs.find((b) => b.innerText.includes(s))?.click(), t);

// 登录（独立邮箱 = 干净本地库）
await page.goto("http://localhost:4173/login", { waitUntil: "networkidle0" });
await page.type('input[type=email]', "custom@demo.com");
await clickByText("获取验证码");
await wait(900);
await page.type('input[maxlength="6"]', "123456");
await clickByText("登录");
await page.waitForFunction(() => location.pathname === "/", { timeout: 6000 });
await wait(1000);

// 进入建计划页
await page.goto("http://localhost:4173/plans/new", { waitUntil: "networkidle0" });
await wait(800);
await assertText("自建训练计划", "建计划页标题");
// 名称
await page.type('input[placeholder*="睡前"]', "我的核心小课");
// 第 1 天添加两个动作
await clickByText("添加动作");
await wait(500);
await assertText("选择动作", "动作选择弹窗");
await assertText("站姿提踵", "选择器含新增动作");
// 选第一个动作（徒手深蹲）
await page.evaluate(() => {
  const bs = [...document.querySelectorAll("button")];
  bs.find((b) => b.innerText.includes("徒手深蹲"))?.click();
});
await wait(500);
// 再添加第二个动作（平板支撑）
await clickByText("添加动作");
await wait(400);
await page.evaluate(() => {
  const bs = [...document.querySelectorAll("button")];
  bs.find((b) => b.innerText.includes("平板支撑"))?.click();
});
await wait(400);
await assertText("平板支撑", "已编排动作显示");
// 加到 2 天：精确定位“训练天数”标签所在行的 + 按钮
await page.evaluate(() => {
  const label = [...document.querySelectorAll("span")].find((s) => s.textContent.trim() === "训练天数");
  const row = label.closest("div");
  row.querySelectorAll("button")[1].click();
});
await wait(300);
await assertText("2 天", "天数增加到 2 天");
// 第 2 天加一个动作
await page.evaluate(() => {
  const cards = [...document.querySelectorAll("button")].filter((b) => b.innerText.includes("添加动作"));
  cards[cards.length - 1].click();
});
await wait(400);
await page.evaluate(() => {
  const bs = [...document.querySelectorAll("button")];
  bs.find((b) => b.innerText.includes("开合跳"))?.click();
});
await wait(400);
await page.screenshot({ path: `${OUT}/c1-create.png` });
// 保存
await clickByText("保存计划");
await page.waitForFunction(() => location.pathname.startsWith("/plans/-"), { timeout: 6000 });
await wait(800);
const planUrl = page.url();
console.log("PASS 保存后跳到负 ID 详情 ::", planUrl.split("/").pop());
await assertText("我的核心小课", "详情显示计划名");
await assertText("进行到第 1 天", "自建计划自动加入");
await assertText("删除这个自建计划", "自建删除入口");
await page.screenshot({ path: `${OUT}/c2-detail.png` });

// 开始训练并完成（第 1 天 2 个动作）
await clickByText("开始");
await page.waitForFunction(() => location.pathname.startsWith("/workout"), { timeout: 5000 });
await wait(600);
for (let i = 0; i < 30; i++) {
  const done = await page.evaluate(() => document.body.innerText.includes("训练完成"));
  if (done) break;
  const rest = await page.evaluate(() => document.body.innerText.includes("组间休息"));
  await page.$$eval("button", (bs, isRest) => {
    const b = bs.find((x) => x.innerText.includes(isRest ? "跳过休息" : "完成本组"));
    b?.click();
  }, rest);
  await wait(300);
}
await assertText("训练完成", "自建计划训练完成");
await wait(500);

// 计划列表应显示自建计划且带“自建”角标
await page.goto("http://localhost:4173/plans", { waitUntil: "networkidle0" });
await wait(700);
await assertText("我的核心小课", "列表含自建计划");
await assertText("自建", "自建角标");
await page.screenshot({ path: `${OUT}/c3-list.png` });

// 新 GIF 资源抽查
const gifs = ["calf.gif", "twist.gif", "birdog.gif", "superman.gif", "bridge.gif"];
for (const g of gifs) {
  const ok = await page.evaluate(async (name) => {
    const r = await fetch(`/gifs/${name}`);
    return r.ok && (r.headers.get("content-type") || "").includes("gif");
  }, g);
  console.log(ok ? `PASS 新 GIF 可访问 :: ${g}` : `FAIL 新 GIF :: ${g}`);
  if (!ok) process.exitCode = 1;
}
console.log("\n运行时错误：", errors.length ? errors : "无");
await browser.close();
process.exit(process.exitCode ?? 0);
