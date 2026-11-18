# 配置参数

UTF-8 JSON，可带 BOM。schemaVersion 为 1。未列出的字段会报错，避免拼写错误悄悄失效。时间单位为秒，尺寸为输出画布像素，颜色接受 #RGB 或 #RRGGBB。

目录：全局、布局、卡片、状态、节点事件、连线、光标与移动段、字幕、输出。

## 最小配置

```json
{
  "title": "把任务分成三步",
  "cursor": {"shape": "circle"},
  "nodes": [
    {"id": "input", "title": "输入", "icon": "evidence"},
    {"id": "process", "title": "处理", "icon": "analysis"},
    {"id": "output", "title": "输出", "icon": "check"}
  ],
  "edges": [
    {"from": "input", "to": "process"},
    {"from": "process", "to": "output"}
  ]
}
```

节点 ID 必须唯一，以英文字母开头，其余可含字母、数字、下划线、连字符。内容用 JSON 编码，不插入 shell 命令；渲染器使用 textContent，文字中的尖括号不会当作 HTML。

## 全局

| 字段 | 默认 / 取值 |
|---|---|
| aspect | landscape / portrait；默认 landscape |
| width、height | 横屏 1920×1080，竖屏 1080×1920；可覆盖为 480–3840 的偶数 |
| fps | 24；支持 24 / 30 |
| duration | 自动取最后一次事件结束加 tail；显式值须含全部事件及至少 0.4 秒收稳 |
| tail | 1.2 秒；用于自动总长，不再叠加到显式 duration |
| title | 主标题；默认“流程与因果链” |
| subtitle、eyebrow | 副标题、页眉小字，默认空 |
| badge | 页眉色块文字，默认“流程与因果链” |
| show | header / subtitle / caption / progress 四个布尔字段，默认均 true |

theme 的字段及默认值：

```json
{"bg":"#fbf9f3","fg":"#1d2f55","muted":"#7a8399","line":"#d9d4c6",
 "accent":"#1d2f55","warning":"#a46b1a","highlight":"#ffe066","card":"#ffffff"}
```

这些颜色初始化卡片、连线与状态。精细设置用 nodeDefaults、states、edgeDefaults 或单项覆盖。默认导出 H.264 MP4。需要透出宿主背景时，用 `--alpha` 导出 VP9 WebM。详见[共同渲染接口](rendering.md)。

## 布局 layout

| 字段 | 作用 |
|---|---|
| direction | horizontal / vertical；随画幅默认横排/竖排，可单独指定 |
| margin | 左右边距；横屏 108，竖屏 72 |
| header | 页眉底部分隔线 y；横屏 326，竖屏 300 |
| footer | 底部为字幕/进度保留的高度；横屏 160，竖屏 220 |
| gap | 主轴槽间距；默认 null，按可用空间计算，上限 140 |
| laneGap | 分支槽间距，默认 80 |
| offsetX、offsetY | 自动网格整体平移量，默认 0 |

节点 column 为主轴顺序（默认数组序号），row 为分支槽（默认 0）。竖排时 column 沿 y、row 沿 x。网格按最大卡片尺寸计算槽位，节点尺寸不同也能对齐。节点很多时宜分屏，不无限压缩。

节点 `position: {"x":1110,"y":470}` 是中心绝对坐标，优先于网格，不参与自动网格计算。换画幅时应重排显式坐标，它们不会自动旋转。

## 卡片 nodeDefaults 与 node.style

nodeDefaults 为全局默认，节点 style 逐字段覆盖。

| 字段 | 默认 / 含义 |
|---|---|
| shape | rounded；rect / rounded / pill / circle / diamond |
| width、height | 300、190；竖屏 520、200；圆形须相等 |
| radius | 28（暗场 26），用于 rounded；连续圆角按超椭圆计算，rect 为 0，pill 自动计算 |
| padding | 横屏 28，竖屏 32，矩形内部留白 |
| titleSize、descriptionSize | 40、22（竖屏 46、26）；自动换行但不自动缩小字号 |
| iconSize | 横屏 46，竖屏 52 |
| showIcon、showNumber、showState | 均 true，可独立关闭 |
| fill、border | 填充、边框，默认 theme.card / theme.line |
| text、descriptionColor | 标题、说明色，默认 theme.fg / theme.muted |
| accent、highlight | 图标和状态标签色、暗场标题辉光色 |
| strokeWidth、shadow | 浅色 2，暗场 1.5。默认启用阴影 |

圆形、菱形、胶囊的文字空间和编号位置按形状计算。超出时报错，增加尺寸或调整内容。图标：question / evidence / analysis / conclusion / experiment / check / warning / none；iconText 可放简短文字或符号，showIcon=false 会隐藏两种图标来源。

## 状态 states

五种状态：idle / waiting / running / blocked / completed。全局 states 或节点 states 可覆盖相应状态的部分属性：

`fill / border / text / descriptionColor / accent / highlight / opacity / strokeWidth / highlightOpacity / label`。

默认 idle 正常显示；waiting 透明度 0.35；running 强调标题、标签“进行中”；blocked 暖金强调、标签“暂缓”；completed 标签“已完成”。透明度取 0–1。竖向布局的状态标签自动向左错开，避开卡片顶部中央的主连线。

优先级：主题初始化 → nodeDefaults → node.style → 全局当前状态 → 节点当前状态。状态只覆盖明确指定的字段。事件 label 最后覆盖标签，空字符串可隐藏。单节点在运行时要保持专属边框色，应同时设置 states.running.border。

```json
"states": {
  "running": {"border":"#207567","highlight":"#c4e6d6","label":"处理中"},
  "blocked": {"fill":"#fff3e5","border":"#a26434","label":"等待复核"},
  "completed": {"label":"完成","highlightOpacity":0}
}
```

## 节点及事件

每个节点必需 id、title。其他字段：

- description：默认空，可含换行。
- icon、iconText、number：图标、文字图标、编号（默认 01、02…）。
- column、row、position：见布局；style、states：见卡片及状态。
- enter：入场开始，默认 `0.6 + column × 2`。
- enterDuration：默认 0.6 秒，淡入并从下方轻移就位。
- initialState：默认 idle；目标节点可用 waiting 预先显示。
- events：按 at 严格递增，不早于 enter；每项必需 at、state，可带 label、description。

不提供 events 时在 enter 进入 running，1.4 秒后 completed；空数组则保持初始状态。事件 description 保留到下一次明确修改；标签在每次状态事件重取默认，除非显式指定。

```json
{"id":"judge","title":"分析判断","icon":"analysis","enter":5.5,
 "events":[
   {"at":6,"state":"running","label":"检查中"},
   {"at":7.7,"state":"blocked","label":"证据不足","description":"补充证据后再判断"},
   {"at":16.7,"state":"running","label":"重新检查"},
   {"at":18.8,"state":"completed","label":"证据充分"}
 ]}
```

## 连线及连接点

每条边必需 from、to（节点 ID），id 可省略，图可分叉、汇合和循环。

- fromPort / toPort：`{"side":"left","offset":0}`。side 为 left/right/top/bottom；offset 为沿该侧宽或高的比例，−0.8 到 0.8。0 为该侧中心。端点按实际形状边界计算。
- 不设端口时按节点相对方向选择相向端口。回路通常显式指定两端都从左侧或右侧连接。自连线须明确指定两个不同端口。
- routing：curve（默认）、straight 或 lane（分道回程，详见下文）。
- via：中间折点，形成圆角折线，优先于 routing。点为 `{"x":900,"y":700}` 或相对节点中心的 `{"node":"judge","dx":-220,"dy":80}`。
- enter：底线淡入开始，默认首段 travel 的 start。
- style：覆盖 edgeDefaults；cursor：覆盖全局 cursor。

edgeDefaults / edge.style 控制主线颜色 color、底线颜色 baseColor、主线宽 width（5）、底线宽 baseWidth（4）、opacity（0.8）、bend（100，相向端口小间距自动限幅）、cornerRadius（24，via 圆角）、labelSize（25）和 labelColor。

边的 label 示例：

```json
{"text":"证据不足","at":10,"position":0.5,"dx":100,"dy":0}
```

position 为沿线弧长比例 0–1，dx/dy 为文字偏移。at 默认边的 enter；until 可指定开始淡出时间，否则一直保留。标签不会自动互相避让，需看关键帧。

## 光标与移动段 travels

全局 cursor：

```json
{"shape":"circle","size":6,"color":null,"haloOpacity":0.12,"haloScale":2.1}
```

shape 支持 circle / triangle。size 是圆半径，三角形按相近视觉面积换算。color=null 跟随当前线色。单边 cursor 优先。预览控件可强制所有光标切换，选择“按配置”恢复逐边设置。

每条边的 travels 是不重叠且按开始时间排列的移动段，可反复经过同一条线：

| 字段 | 含义 |
|---|---|
| start | 必需，绝对开始时间，不早于源节点入场 |
| duration | 推进时间，默认 1 秒 |
| from、to | 弧长比例，默认 0→1；to > from |
| hold | 到达后停留，默认 0 |
| returnDuration | 停留后退回 from 的时间；默认 0，不返回 |
| turnDuration | 默认 0.15 秒，占用 hold 尾部；无 hold 时直接转向 |
| color | 本段线色；光标单独指定颜色时仍用自己的颜色 |

移动按弧长及平滑缓入缓出计算。to<1 且 hold>0 时显示暂停标记。退回后收起已走的线；正常完成则保留线段、隐藏光标。多段不能重叠；底线 enter 不晚于首段移动。不同边可同时有光标来表示并行分支。

```json
"travels": [
  {"start":8.15,"duration":0.65,"to":0.44,"hold":1,"returnDuration":0.4,"color":"#a46b1a"},
  {"start":19,"duration":1}
]
```

省略 travels 时根据起止节点入场时间创建默认 0.8 秒移动。复杂叙事请写明时间，不依赖默认时序推断科学逻辑。

## 字幕 captions

按 at 严格递增：`{"at":3.1,"text":"收集证据，进入分析。","phase":"02 / 收集"}`。text 是底部字幕，phase 是可省略的阶段名。字幕自动换行，空间不足时报错。页眉空间不够时阶段名隐藏，避免盖住徽标和眉题。

## 输出及复用

每次输出伴随同名 _source 目录：input.json 是原始配置；resolved.json、config.js 含已补齐默认值的配置；HTML/CSS/JS、字体和 OFL.txt 支持离线预览；contact.jpg、poster.png、report.json 记录关键帧和检查。

永久修改 input.json 后作为下一次 --config 输入重渲。--check-only 不编码视频；通过后可用同名路径加 --overwrite 导出。失败保留报告和已生成的排版图供修正；完整验收后才把中间视频移动到最终路径。

网页接口：window.__dur、await window.__seek(seconds)、window.__setCursor('config'/'circle'/'triangle')、window.__inspect()。预览播放不改变导出的确定性，任意位置均由绝对时间计算。

## 连续虚线与分道回路（v02）

`appearance: "amber-night"` 启用 #323232 底色、琥珀色线条、白字、琥珀辉光阴影与 1.5px 细边；theme 与单个节点覆盖仍有效。省略时保持浅色默认外观（含极淡底部厚度，不做顶亮）。

连续虚线示例：

```json
{"id":"feedback","from":"result","to":"input","routing":"lane",
 "lane":{"side":"top","clearance":70,"gap":64},"enter":1.6,
 "animation":{"mode":"dashed","dash":14,"gap":12,"speed":90,"phase":0,"direction":"forward"},
 "label":{"text":"反馈","position":0.5,"dy":-24}}
```

- animation.mode 默认 travel，保留原 travels 和光标；dashed 模式不配置 travels，不显示光标。dash/gap 为 2–120 像素，speed 为像素/秒，phase 为起始像素相位。direction 可为 forward/reverse。until 可指定开始淡出时间。
- 虚线相位从边的 enter 起按绝对时间计算，任意跳转、局部导出不会重新起跑。不是“光标到终点后跳回起点”的循环。
- lane.side 支持 top/bottom/left/right。轨道在所有节点外包框之外，距离为 clearance + index × gap。clearance 为 32–700，gap 为 24–300 像素。index 为 0–5，同侧未指定时依出现顺序分配。
- lane 的两个端口必须在同一侧；省略端口时 offset 为 auto。自动端口按节点实际位置向两端外移，形成内外嵌套；指定数值 offset 可以手动调整。lane 不与 via 混用。轨道仍须放在内容安全区内；跨接不同节点组的复杂回路仍可能交叉。
- validation 的 paths/labels/crossings 分别设为 off/warn/error，默认 warn 兼容旧配置。paths 检查自折返、路径重合和越界，labels 检查标签压节点、标签互压及连线穿字，crossings 检查线间及自交。新布局建议全部设为 error；有意交叉可单独降为 warn 并人工检查。
- 几何检测约每 10 像素采样一次；接近共同端点的相交会忽略。它是排版诊断，不是精确碰撞仿真。长标签、动态入场和多个分支仍需检查关键帧。
- report.json 增加 layout_warnings / path_diagnostics；页面 window.__inspect() 的虚线状态包含 dashOffset、period、pathLength 和 visible。

## 视觉层（3.0.0）

默认圆角卡片的材质参数集中在 `engine.js`。

| 层 | 实现 | 说明 |
| --- | --- | --- |
| 形状 | `squircle(w,h,r,n=4.5,steps=18)` | 四角用超椭圆采样，角间以直边相连 |
| 顶亮 | `matTopDark` 渐变 | 白 .13 → .05 → 0；仅暗场 |
| 底暗 | `matBottomDark` / `matBottomLight` | 暗场黑 0 → .08 → .22；浅色藏青 0 → .06 |
| 接触阴影 | 形状副本下移 4px + `feGaussianBlur 3.5` | 黑 .55，画在卡片之前 |
| 颗粒 | `feTurbulence` → 去饱和 → 提 alpha → `feComposite in2=SourceAlpha` | 只落在卡片不透明区域 |
| 边缘 | `n.edge`(状态色) + `edgeHi`(白 .30→0) + `edgeLo`(黑 0→.22) | 三层同宽，左上来光 |
| 选中高亮 | 标题文字 `drop-shadow` | 暗场暖色外发光，浅色深色投影；`n.mark` 保留但永久透明 |

改这些参数时先跑 `--frames 0:24` 出一小段看单帧，不要整片重渲。
