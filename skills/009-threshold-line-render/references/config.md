# 配置参考

输入 UTF-8 JSON；未填字段用默认值，数组整体替换。完整解析值保存在 `*_source/resolved.json`，复用时优先编辑 `input.json`，不手改派生字段 `duration`、`threshold.y/left`、`race.start`、`entrants.at/entryGlobal`。

所有时间为秒，所有坐标和尺寸按 1920×1080 设计；输出时等比例缩放。颜色仅支持 `#RRGGBB`。文字为单行字符串，可用空字符串隐藏。建议先改示例中的常用字段，再调整几何。

## 模式与时间

| 字段 | 默认值 / 含义 |
| --- | --- |
| `mode` | `both`；另有 `threshold`、`race` |
| `width` / `height` / `fps` | 1920 / 1080 / 24；16:9、偶数尺寸 360–3840，fps 为 24、25、30、60 |
| `timeline.frontDuration` | both 为 15.2；其他模式为 16；仅前段时也是总时长 |
| `timeline.transition` | 1；前景淡出时间，完整模式使用 |
| `timeline.fadeIn` / `fadeOut` | 0.45 / 0.8；整片首尾淡入淡出，可设 0 |
| `timeline.shake` | 1；落钉和碰撞震动强度，0–2，0 关闭 |
| `timeline.noteAt` / `noteChangeAt` | 6.5 / 8；前段底部提示出现、切换时刻 |
| `timeline.phases` | `[]`；右上角阶段文案，按 `at` 排序，例如 `[{"at":0,"text":"标准出现"},{"at":8,"text":"优势重写"}]` |
| `race.duration` | 12.8；起跑线段持续时间 |

`ruler.at`、`threshold.at`、`pins.at`、`cards.hit` 为前段秒数（也就是整片秒数）。**所有 `race` 和 `entrants` 时间均相对起跑线段起点**，完整模式自动加上 `frontDuration`，单独起跑线模式起点为 0。`timeline.phases` 始终按整片时间设置。

完整模式总时长 = `frontDuration + race.duration`。单段只取自身时长。调整持续时间时同步调整该段事件，给最后碎裂或冲线留出收尾时间；程序不会自动重排节奏。右上阶段文案没有配置时根据场景状态生成。

## 标尺与阈值线

| 对象 | 字段和默认值 |
| --- | --- |
| `ruler` 数值 | `show:true, min:0, max:100, step:2, labelEvery:20, decimals:0, unit:"", label:"示意刻度"` |
| `ruler` 几何/入场 | `x:109, width:131, top:260, bottom:860, at:0.25, enter:1` |
| `threshold` | `value:40, at:1.25, draw:1.2, width:6, glow:18, color:theme.red, label:"斩杀线", subtitle:"THRESHOLD", right:1816` |

线高度 = `bottom - (value-min)/(max-min)*(bottom-top)`；铆钉中心和卡片碰撞底边自动跟随。安全高度 440–720；超界会报错。可以修改数值范围，使业务阈值位于画面中部。最多 200 个刻度；标签以 min 为起点每 labelEvery 显示，labelEvery 宜为 step 的整数倍。decimals 为 0–3，单位宜短。

标尺 x 为 88–200，宽 100–150，top 为 240–340，bottom 为 800–890。阈值线右端 1700–1832、线宽 1–12、发光 0–40。`show:false` 只隐藏标尺，不改变阈值计算。

## 铆钉和下落卡片

`pins` 最多 5 个，可为空。每项：

```json
{"x":480,"at":3,"label":"性能","sub":"CAPABILITY","drop":0.5,"radius":25,"color":"#e6ba78"}
```

`at` 是钉落到线上的时刻；`drop` 为下落时长。x 340–1690，半径 15–35。标签位于线下。横向位置手动安排；多钉时缩短标签并留足间距。

`cards` 最多 12 个，可为空。每项：

```json
{"x":650,"hit":9.8,"label":"模型 A","sub":"旧的性能优势","tag":"MODEL / 01","width":242,"height":152,"fall":1.6,"radius":12,"fill":"#dce3df","ink":"#21353e","muted":"#637a7d","border":"#f4f5ed"}
```

`x` 为卡片中心；`hit` 为底边接触线、开始碎裂的精确时刻；`fall` 是下落时间。宽度为整数 160–340，高度为整数 110–190，圆角 0–25。`startBottom` 可选，默认取 `max(235+height, threshold.y-210)`，表示下落起点底边；须在 `215+height` 至 `threshold.y-20` 之间。卡片左右须位于 280–1800。文字按卡片宽度自动缩小，不支持换行或图片。

钉落地和卡片碰撞必须在阈值线绘制完成后、前段结束前发生。多个卡片的位置和撞击时刻可不同；程序不自动防止彼此重叠。

## 碎裂

`fracture` 默认：

```json
{"enabled":true,"columns":3,"rows":2,"jitter":0.22,"seed":0,"spread":1.7,"lift":190,"gravity":600,"spin":3.7,"lifetime":2.4,"fade":1.3,"sparks":10}
```

- enabled 为 false 时，卡片触线后完整停留。
- columns / rows 各 1–8，每网格分成 2 个三角片；总片数 = columns × rows × 2。
- jitter 0–0.35 控制内部切点扰动；seed 为整数，固定种子保证重复渲染一致。
- spread 0–5 控制水平散开，lift 0–500 控制上抛，gravity 0–1800 控制下落，spin 0–12 控制旋转。
- lifetime 0.2–10 是碎片存活秒数；fade 0.1–10 是末尾淡出时间，不能超过 lifetime。
- sparks 0–40 为碰撞火花数。碎片在主体内容框内裁切，不会落入页脚。

## 起跑线和参与卡片

`race` 默认时间：`moveAt:0.95, moveDuration:2.05, gridAt:1.55, gridDuration:1.6, titleAt:1.9, goAt:4.8, goDuration:0.6`。move 是完整模式红线变成起跑线的位置过渡；单独模式从起跑线位置开始。grid 是透视赛道展开，title 是标题出现，go 是线变色的发令过程。

默认几何：`startY:800, left:190, right:1730, farY:360, depth:540, farWidth:100, spread:700, readyZ:1.08, finishZ:0.12, endScale:0.32, cardWidth:226, cardHeight:112, lanes:[-1,-0.32,0.32,1]`。

- startY 700–820，left 100–300，right 1600–1830。
- farY 350–420，depth 440–550，farWidth 80–200，spread 500–720。透视坐标：`x=960+lane*(farWidth+spread*z)`、`y=farY+depth*z`。
- readyZ 0.9–1.12，finishZ 0.02–0.25，endScale 0.2–0.6。
- cardWidth 140–280，cardHeight 80–130。等待时卡片顶边须在线下、底边不能超过 965；结束时顶边须在线上。验证失败应调整几何，不能让卡片提前越线。
- lanes 为 2–8 个排序、无重复的赛道边界，范围 -1 至 1。entrants.lane 为卡片轨道位置，两者独立配置。
- `color` 默认 theme.mint；`width:6, glow:18`，范围与阈值线一致。初始线色继承 `threshold.color`，独立起跑线模式也可设置该初始色。

`entrants` 支持 1–5 项，例如：

```json
{"lane":-0.64,"name":"新方案 A","color":"#95d8bd","entryAt":2.5,"entryDuration":1.1,"launch":5.4,"travel":4.1}
```

lane 为 -0.82 至 0.82；entryAt / entryDuration 是入场开始和时长，launch / travel 是出发时刻和行进时长。launch 必须晚于入场结束，且不早于 goAt+goDuration。launch+travel 不得超过 race.duration。越线脉冲按卡片顶边实际穿线时刻计算。手动保持卡片间距；四卡片示例采用宽度 200、轨道 -0.75/-0.25/0.25/0.75。

## 文案和配色

`text` 可覆盖：`title, subtitle, eyebrow, footerLeft, footerRight, beforeCards, afterCards, raceTitle, raceReady, raceGo, readyLabel, startLabel, readyTag, goTag, entrantReady, entrantGo`。具体默认文案见解析配置。阶段提示可用 timeline.phases 单独改写；卡片正文、铆钉标签和阈值标签在各自对象里。

`theme` 可覆盖：`bg, panel, line, ink, muted, red, gold, mint, grid, ruler, rulerInk, pinDark, pinLight, pinMid, pinShade, cardFill, cardBorder, cardInk, cardMuted, trackEdge, trackGrid, raceFill`。panel 为保留项，当前引擎未使用。bg 是背景，line 是页面分隔线，grid 是前段辅助线；pinLight/Mid/Shade 控制钉头金属渐变。单卡片、铆钉、阈值线及起跑线颜色优先于 theme 默认色。

## 输出与验证

输出 MP4 为无声 H.264；配套目录包含 input.json、resolved.json、config.js、engine.js、index.html、字体及许可、poster.png、report.json。浏览器打开 index.html 可播放、暂停和拖动时间。

`--check-only` 只生成源文件和关键帧，不编码视频；report.encoded 为 false。正式输出会逐帧渲染、核对帧数/分辨率并完整解码。report 中单段未使用的物理阶段检查为 null。随机跳转像素一致性只在本次浏览器环境内验证，不承诺跨 Chrome 版本逐像素相同。
