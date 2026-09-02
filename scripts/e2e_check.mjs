// 端到端冒烟验证：登录 → 今日 → 加入计划 → 完整训练 → 打卡/动作库/我的
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

const shot = (n) => page.screenshot({ path: `${OUT}/${n}.png` });
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const assertText = async (t, label) => {
  const ok = await page.$eval("body", (el, s) => el.innerText.includes(s), t).catch(() => false);
  console.log(ok ? `PASS ${label} :: ${t}` : `FAIL ${label} :: 缺少「${t}」`);
  if (!ok) process.exitCode = 1;
};

// 1. 登录
await page.goto("http://localhost:4173/login", { waitUntil: "networkidle0" });
await shot("01-login");
await page.type('input[type=email]', "nook@demo.com");
const btns = await page.$$("button");
for (const b of btns) {
  const t = await b.evaluate((el) => el.innerText);
  if (t.includes("获取验证码")) await b.click();
}
await wait(900); // 演示模式发送后进入 60s 倒计时
await page.type('input[maxlength="6"]', "123456");
const allBtns = await page.$$("button");
for (const b of allBtns) {
  const t = await b.evaluate((el) => el.innerText);
  if (t.includes("登录")) await b.click();
}
await page.waitForFunction(() => location.pathname === "/", { timeout: 6000 });
await wait(1200);
await shot("02-today-empty");
await assertText("今天也要动一动", "今日页标题");
await assertText("去选计划", "未加入计划引导");

// 2. 计划列表 → 详情 → 加入
await page.goto("http://localhost:4173/plans", { waitUntil: "networkidle0" });
await wait(600);
await shot("03-plans");
await assertText("晨间唤醒 7 天", "计划列表种子");
await page.click('a[href="/plans/1"]');
await wait(800);
await shot("04-plan-detail");
const joinBtns = await page.$$("button");
for (const b of joinBtns) {
  const t = await b.evaluate((el) => el.innerText);
  if (t.includes("加入计划")) await b.click();
}
await page.waitForFunction(() => document.body.innerText.includes("进行到第 1 天"), { timeout: 5000 });
console.log("PASS 加入计划成功");

// 3. 进入训练并完整走完全部组
await page.$$eval("button", async (bs) => {
  const b = bs.find((x) => x.innerText.includes("开始"));
  b?.click();
});
await page.waitForFunction(() => location.pathname.startsWith("/workout"), { timeout: 5000 });
await wait(1000);
await shot("05-workout-ex1");
await assertText("完成本组", "训练播放页");

// 依次完成所有组（含跳过休息），直到完成页
for (let i = 0; i < 40; i++) {
  const done = await page.evaluate(() => document.body.innerText.includes("训练完成"));
  if (done) break;
  const rest = await page.evaluate(() => document.body.innerText.includes("组间休息"));
  await page.$$eval("button", (bs, isRest) => {
    const label = isRest ? "跳过休息" : "完成本组";
    const b = bs.find((x) => x.innerText.includes(label));
    b?.click();
  }, rest);
  await wait(350);
}
await page.waitForFunction(() => document.body.innerText.includes("训练完成"), { timeout: 8000 });
console.log("PASS 完整训练走通并打卡");
await shot("06-workout-done");

// 4. 今日页（已有计划/打卡）
await page.goto("http://localhost:4173/", { waitUntil: "networkidle0" });
await wait(800);
await shot("07-today-after");
await assertText("第 2 天", "今日推进到第2天");

// 5. 动作库
await page.goto("http://localhost:4173/exercises", { waitUntil: "networkidle0" });
await wait(600);
await shot("08-exercises");
await assertText("徒手深蹲", "动作库种子");
// 打开一个动作详情
await page.$$eval(".clay, .card, div", () => {});
const cards = await page.$$("article, .grid > *");
// 点第一张动作卡
const grid = await page.$(".grid");
if (grid) { await grid.click(); await wait(500); await shot("09-exercise-modal"); }

// 6. 打卡 & 我的
await page.goto("http://localhost:4173/checkin", { waitUntil: "networkidle0" });
await wait(600);
await shot("10-checkin");
await assertText("连续", "打卡统计");
await page.goto("http://localhost:4173/me", { waitUntil: "networkidle0" });
await wait(600);
await shot("11-me");
await assertText("nook@demo.com", "我的页邮箱");

// GIF 资源加载检查
const gifOk = await page.evaluate(async () => {
  const r = await fetch("/gifs/squat.gif");
  return r.ok && (r.headers.get("content-type") || "").includes("gif");
});
console.log(gifOk ? "PASS GIF 资源可访问" : "FAIL GIF 资源");

console.log("\n运行时错误：", errors.length ? errors : "无");
await browser.close();
process.exit(process.exitCode ?? 0);
