# -*- coding: utf-8 -*-
"""
单一数据源生成器：同时产出
  database/seed.sql     —— TCB PostgreSQL 种子数据
  src/lib/seedData.ts   —— 本地演示模式种子（保证与 SQL 完全一致）
动作 GIF 位于 public/gifs，由 Nook IP 双关键帧插值生成。
"""
import json, os, textwrap

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

# ---------------- 动作库（16 个，全部配 Nook GIF） ----------------
# id, slug, 名称, 部位, 类别, 难度, kcal/min, 计量(reps/duration), 默认次数, 默认秒, GIF, 步骤[], 贴士
EX = [
    (1,"squat","徒手深蹲","下肢","力量","入门",8.0,"reps",15,None,"squat",
     ["双脚与肩同宽，脚尖微外八，双臂前平举","臀部向后下方坐，膝盖跟随脚尖方向下蹲","大腿接近与地面平行后匀速站起，回到起始位"],
     "膝盖不要内扣，下蹲时保持腰背自然挺直"),
    (2,"jack","开合跳","全身","有氧","入门",9.5,"duration",None,40,"jack",
     ["双脚并拢站直，双手贴于身体两侧","轻跳同时双腿分开、双手在头顶击掌","再跳回并拢姿态，保持前脚掌着地、匀速呼吸"],
     "用前脚掌缓冲落地，全程保持核心微收紧"),
    (3,"pushup","俯卧撑","上肢","力量","初级",8.5,"reps",10,None,"pushup",
     ["双手略宽于肩撑地，身体从头到脚成一条直线","弯曲手臂下降身体，胸部接近地面","匀速推起回到起始位，手肘约成 45 度夹角"],
     "力量不足可改为膝盖着地的跪姿俯卧撑"),
    (4,"plank","平板支撑","核心","稳定","入门",6.5,"duration",None,30,"plank",
     ["前臂与脚尖撑地，手肘在肩膀正下方","收紧腹部与臀部，身体保持一条直线","均匀呼吸，保持到目标时长"],
     "不要塌腰或撅臀，颈部自然延伸、眼看地面"),
    (5,"lunge","交替弓步蹲","下肢","力量","初级",8.0,"reps",12,None,"lunge",
     ["站直，一脚向前迈出一大步","前脚全掌踩实，弯曲双膝下沉至前腿约 90 度","蹬前脚站回，左右交替进行"],
     "前膝始终对准脚尖，不要超过脚尖太多"),
    (6,"crunch","仰卧卷腹","核心","力量","入门",6.0,"reps",15,None,"crunch",
     ["仰卧屈膝，双脚踩地，双手轻扶耳侧","腹部发力卷起上背部，下背部贴地","在顶峰稍停后缓慢下落，不要用手抱头拉扯"],
     "动作放慢，用腹肌而不是惯性完成"),
    (7,"knees","原地高抬腿","全身","有氧","初级",10.0,"duration",None,30,"knees",
     ["站直，双臂弯曲约 90 度","左右交替快速抬膝至腰部高度","手臂配合自然摆动，前脚掌着地"],
     "保持上身挺直，落地越轻越好"),
    (8,"stretch","站立伸展","拉伸","柔韧","入门",3.0,"duration",None,60,"stretch",
     ["双脚交叉站稳，双手交叠举过头顶","吸气向上延展，呼气向一侧轻微侧弯","保持呼吸，换侧重复，结束后抖动手脚放松"],
     "拉伸到有牵拉感即可，不要弹震、不要憋气"),
    (9,"bridge","仰卧臀桥","下肢","力量","入门",5.5,"reps",16,None,"bridge",
     ["仰卧屈膝，双脚靠近臀部踩地","臀部发力向上顶起，至肩髋膝成一条直线","顶峰夹紧臀部一秒，缓慢下落"],
     "发力重点在臀部，不要过度顶腰"),
    (10,"climber","登山跑","全身","有氧","中级",10.5,"duration",None,30,"climber",
     ["俯撑姿势，双手在肩下方、身体成直线","交替快速向胸前提膝，像原地跑步","保持髋部稳定不上下晃动"],
     "核心始终收紧，速度以动作不变形为前提"),
    (11,"wallsit","靠墙静蹲","下肢","稳定","初级",6.0,"duration",None,30,"wallsit",
     ["背靠墙站立，向前迈出双脚","沿墙下滑至大腿接近水平，小腿垂直地面","保持静蹲到目标时长，均匀呼吸"],
     "膝盖不超过脚尖，大腿酸了就结束"),
    (12,"tap","平板触肩","核心","稳定","中级",7.5,"reps",14,None,"tap",
     ["高位平板姿势，双手在肩下方撑地","保持躯干不晃，一手轻触对侧肩膀","左右交替进行，动作匀速"],
     "髋部尽量不左右摇摆，核心收紧"),
    (13,"calf","站姿提踵","下肢","力量","入门",4.5,"reps",20,None,"calf",
     ["站直，双脚与髋同宽，双手前平举或扶墙保持平衡","脚跟抬到最高，前脚掌撑地停一秒","控制速度缓慢落下，脚跟轻触地面后重复"],
     "下落越慢越好，充分感受小腿后侧发力"),
    (14,"twist","俄罗斯转体","核心","力量","初级",7.0,"reps",16,None,"twist",
     ["坐于地面，双膝弯曲脚跟着地，上身略向后倾","双手在胸前合十，背部挺直、腹部收紧","上身左右转动，双手随转体摆到髋部两侧"],
     "转体来自胸椎，不要只甩手臂，全程稳住下盘"),
    (15,"birdog","鸟狗式","核心","稳定","初级",6.0,"reps",12,None,"birdog",
     ["四点跪姿，双手在肩下、双膝在髋下","伸出对侧手和脚，直到与背部成一条直线","顶峰停一秒后收回，换另一侧进行"],
     "保持骨盆水平不翻胯，眼睛看向地面保护颈椎"),
    (16,"superman","小燕飞","核心","力量","初级",5.5,"reps",12,None,"superman",
     ["俯卧，双臂向前伸直、双腿向后伸直","背部发力，手臂和双腿同时轻轻抬离地面","顶峰停一秒，缓慢落下回到放松位"],
     "颈部保持放松不要仰头，抬起高度不必勉强"),
]

def it(ex, sets, reps=None, sec=None, rest=15):
    d = {"e": ex, "sets": sets, "rest": rest}
    if reps: d["reps"] = reps
    if sec: d["sec"] = sec
    return d

# ---------------- 课程表 ----------------
PLANS = [
    dict(id=1, slug="morning-wake", title="晨间唤醒 7 天", level="入门", days_total=7,
         minutes=8, color="#8FE3C1", tag="起床 8 分钟",
         desc="每天 8 分钟，用低强度动作唤醒身体，适合完全没有运动习惯的新手。",
         days=[
            ("唤醒身体",[it(2,1,sec=40),it(1,1,reps=15),it(8,1,sec=60,rest=0)]),
            ("下肢激活",[it(7,1,sec=30),it(5,1,reps=12),it(8,1,sec=45,rest=0)]),
            ("核心初体验",[it(4,1,sec=20),it(6,1,reps=12),it(2,1,sec=30,rest=0)]),
            ("臀腿唤醒",[it(1,1,reps=15),it(9,1,reps=16),it(8,1,sec=60,rest=0)]),
            ("心肺小跳",[it(2,1,sec=40),it(7,2,sec=20),it(4,1,sec=20,rest=0)]),
            ("上肢入门",[it(3,1,reps=8),it(5,1,reps=12),it(6,1,reps=12),it(8,1,sec=40,rest=0)]),
            ("舒展恢复",[it(8,2,sec=45),it(2,1,sec=30),it(4,1,sec=25,rest=0)]),
         ]),
    dict(id=2, slug="full-burn", title="全身燃脂 14 天", level="初级", days_total=14,
         minutes=14, color="#F26A55", tag="每日 14 分钟",
         desc="有氧与力量交替编排，两周一轮，帮助建立稳定运动习惯、提升体能。",
         days=[
            ("启动燃脂",[it(2,2,sec=40),it(1,2,reps=15),it(4,2,sec=25),it(8,1,sec=45,rest=0)]),
            ("臀腿主导",[it(7,1,sec=30),it(5,2,reps=12),it(9,2,reps=16),it(8,1,sec=45,rest=0)]),
            ("核心循环",[it(2,1,sec=40),it(6,2,reps=15),it(4,2,sec=30),it(12,1,reps=14,rest=10)]),
            ("上肢推力",[it(7,1,sec=30),it(3,2,reps=10),it(1,2,reps=15),it(8,1,sec=45,rest=0)]),
            ("跳跃心肺",[it(2,3,sec=40),it(7,2,sec=30),it(11,1,sec=30),it(8,1,sec=40,rest=0)]),
            ("下肢耐力",[it(5,2,reps=14),it(11,2,sec=30),it(9,2,reps=16),it(8,1,sec=45,rest=0)]),
            ("主动恢复",[it(8,2,sec=60),it(4,2,sec=30),it(2,1,sec=30,rest=0)]),
            ("全身循环 A",[it(2,2,sec=40),it(1,2,reps=16),it(6,2,reps=15),it(4,2,sec=30,rest=10)]),
            ("全身循环 B",[it(7,2,sec=30),it(5,2,reps=14),it(3,2,reps=10),it(12,2,reps=14,rest=10)]),
            ("核心进阶",[it(2,1,sec=40),it(10,2,sec=30),it(6,3,reps=15),it(4,2,sec=35,rest=10)]),
            ("臀腿爆发",[it(1,3,reps=15),it(9,3,reps=16),it(11,2,sec=35),it(8,1,sec=45,rest=0)]),
            ("心肺挑战",[it(2,3,sec=45),it(7,3,sec=30),it(10,2,sec=30),it(8,1,sec=40,rest=0)]),
            ("力量整合",[it(3,2,reps=12),it(5,2,reps=14),it(12,2,reps=16),it(4,2,sec=35,rest=10)]),
            ("总结测试",[it(2,2,sec=60),it(1,2,reps=20),it(7,2,sec=40),it(8,2,sec=45,rest=0)]),
         ]),
]

# P3 核心强化 21 天：确定性渐进生成
def core_day(week, d):
    base = week  # 0/1/2
    warm = it(2, 1, sec=30 + 10*week)
    cool = it(8, 1, sec=45, rest=0)
    patterns = [
        [it(4, 2+base, sec=25+10*base), it(6, 2+base, reps=12+2*base), it(12, 1+base, reps=12+2*base)],
        [it(10, 1+base, sec=25+5*base), it(9, 2+base, reps=14+2*base), it(4, 2+base, sec=25+10*base)],
        [it(6, 2+base, reps=14+2*base), it(11, 1+base, sec=30+10*base), it(12, 2+base, reps=12+2*base)],
        [it(4, 3+base, sec=20+10*base), it(10, 2+base, sec=20+5*base), it(6, 2+base, reps=12+2*base)],
        [it(12, 2+base, reps=14+2*base), it(9, 2+base, reps=16), it(4, 2+base, sec=30+10*base)],
        [it(10, 2+base, sec=25+5*base), it(6, 3+base, reps=12+2*base), it(11, 2+base, sec=25+10*base)],
        [it(8, 2, sec=50, rest=0), it(4, 2+base, sec=30+10*base)],  # 周日恢复
    ]
    titles = ["平板基础","核心燃动","臀核协同","耐力递进","稳定挑战","腹部轰炸","舒展巩固"]
    items = [warm] + patterns[(d-1) % 7] + [cool]
    return (f"第 {week*7+d} 练 · {titles[(d-1)%7]}", items)

p3_days = []
for w in range(3):
    for d in range(1,8):
        p3_days.append(core_day(w,d))
PLANS.append(dict(id=3, slug="core-strong", title="核心强化 21 天", level="中级", days_total=21,
                  minutes=12, color="#C9B8FF", tag="稳核心 护腰背",
                  desc="三周周期化核心训练，从静态稳定到动态抗疲劳，适合想强化腰腹的人。",
                  days=p3_days))

# ---------------- 估算时长 ----------------
EXMAP = {e[0]: e for e in EX}
def day_minutes(items):
    sec = 0
    for x in items:
        ex = EXMAP[x["e"]]
        per = x.get("sec") or int(x.get("reps",0)*1.4)
        sec += x["sets"]*per + (x["sets"]-1)*x.get("rest",15) + 10
    return max(5, round(sec/60))

for p in PLANS:
    p["day_minutes"] = [day_minutes(items) for _, items in p["days"]]

# ---------------- 输出 seed.sql ----------------
def sq(s): return "'" + str(s).replace("'", "''") + "'"

lines = []
lines.append("-- ============================================================")
lines.append("-- NookFit 种子数据（由 scripts/gen_seed.py 生成，请勿手改）")
lines.append("-- 依赖 schema.sql 已创建的 7 张表")
lines.append("-- ============================================================")
lines.append("BEGIN;\n")
lines.append("TRUNCATE plan_days, plans, exercises RESTART IDENTITY CASCADE;\n")

lines.append("-- 1) 动作库 exercises")
for e in EX:
    (_id,slug,name,mg,cat,level,kcal,measure,reps,secs,gif,steps,tips)=e
    gif_sql = f"/gifs/{gif}.gif" if gif else None
    lines.append(
        "INSERT INTO exercises(id,slug,name,muscle_group,category,level,equipment,"
        "calories_per_min,measure,default_reps,default_seconds,gif_url,steps,tips) VALUES ("
        f"{_id},{sq(slug)},{sq(name)},{sq(mg)},{sq(cat)},{sq(level)},'无器械',{kcal},"
        f"{sq(measure)},{reps if reps is not None else 'NULL'},"
        f"{secs if secs is not None else 'NULL'},"
        f"{sq(gif_sql) if gif_sql else 'NULL'},"
        f"ARRAY[{','.join(sq(x) for x in steps)}],{sq(tips)});"
    )

lines.append("\n-- 2) 课程 plans / 3) 课程日 plan_days（items 为 jsonb 编排）")
for p in PLANS:
    lines.append(
        "INSERT INTO plans(id,slug,title,description,level,days_total,minutes_per_day,color,tag,is_published) VALUES ("
        f"{p['id']},{sq(p['slug'])},{sq(p['title'])},{sq(p['desc'])},{sq(p['level'])},"
        f"{p['days_total']},{p['minutes']},{sq(p['color'])},{sq(p['tag'])},true);"
    )
    for idx,(title,items) in enumerate(p["days"], start=1):
        payload=[{"exercise_id":x["e"],"sets":x["sets"],
                  **({"reps":x["reps"]} if "reps" in x else {}),
                  **({"seconds":x["sec"]} if "sec" in x else {}),
                  "rest_seconds":x["rest"]} for x in items]
        js = json.dumps(payload, ensure_ascii=False).replace("'", "''")
        lines.append(
            "INSERT INTO plan_days(plan_id,day_number,title,minutes,items) VALUES ("
            f"{p['id']},{idx},{sq(title)},{p['day_minutes'][idx-1]},'{js}'::jsonb);"
        )
lines.append("\nCOMMIT;\n")

os.makedirs(os.path.join(ROOT,"database"), exist_ok=True)
with open(os.path.join(ROOT,"database","seed.sql"),"w",encoding="utf-8") as f:
    f.write("\n".join(lines))

# ---------------- 输出 seedData.ts ----------------
def ts_ex(e):
    _id,slug,name,mg,cat,level,kcal,measure,reps,secs,gif,steps,tips=e
    return f"""  {{ id: {_id}, slug: {sq_ts(slug)}, name: {sq_ts(name)}, muscleGroup: {sq_ts(mg)}, category: {sq_ts(cat)}, level: {sq_ts(level)},
    equipment: "无器械", caloriesPerMin: {kcal}, measure: {sq_ts(measure)},
    defaultReps: {reps if reps is not None else 'null'}, defaultSeconds: {secs if secs is not None else 'null'},
    gifUrl: {sq_ts(f'/gifs/{gif}.gif') if gif else 'null'}, steps: [{','.join(sq_ts(s) for s in steps)}], tips: {sq_ts(tips)} }}"""
def sq_ts(s): return '"' + str(s).replace('"','\\"') + '"'

ts = ["// 由 scripts/gen_seed.py 生成，与 database/seed.sql 同源，请勿手改",
      "import type { Exercise, Plan, PlanDay } from './types';\n",
      "export const SEED_EXERCISES: Exercise[] = ["]
ts.append(",\n".join(ts_ex(e) for e in EX))
ts.append("];\n")

tp=[]
for p in PLANS:
    days=[]
    for idx,(title,items) in enumerate(p["days"], start=1):
        payload=[{"exerciseId":x["e"],"sets":x["sets"],
                  **({"reps":x["reps"]} if "reps" in x else {}),
                  **({"seconds":x["sec"]} if "sec" in x else {}),
                  "restSeconds":x["rest"]} for x in items]
        days.append(f"    {{ id: {p['id']*100+idx}, planId: {p['id']}, dayNumber: {idx}, title: {sq_ts(title)}, minutes: {p['day_minutes'][idx-1]}, items: {json.dumps(payload,ensure_ascii=False)} }}")
    tp.append(
        f"  {{ id: {p['id']}, slug: {sq_ts(p['slug'])}, title: {sq_ts(p['title'])}, description: {sq_ts(p['desc'])}, "
        f"level: {sq_ts(p['level'])}, daysTotal: {p['days_total']}, minutesPerDay: {p['minutes']}, "
        f"color: {sq_ts(p['color'])}, tag: {sq_ts(p['tag'])}, isPublished: true, days: [\n"
        + ",\n".join(days).replace('"exerciseId"','exerciseId').replace('"sets"','sets').replace('"reps"','reps').replace('"seconds"','seconds').replace('"restSeconds"','restSeconds')
        + " ] }"
    )
ts.append("export const SEED_PLANS: (Plan & { days: PlanDay[] })[] = [")
ts.append(",\n".join(tp))
ts.append("];\n")

with open(os.path.join(ROOT,"src/lib/seedData.ts"),"w",encoding="utf-8") as f:
    f.write("\n".join(ts))

# 统计
n_days=sum(len(p["days"]) for p in PLANS)
print(f"exercises={len(EX)} plans={len(PLANS)} plan_days={n_days}")
print("seed.sql lines:", len(lines))
