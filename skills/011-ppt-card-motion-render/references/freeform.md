# v2 自由卡片配置

## 最小配置

坐标与尺寸以画布像素计；`x/y` 是左上角，旋转缩放绕元素中心。时间单位是秒，相对于所在场景；编组子元素也使用相同的场景时间。

```json
{
  "mode":"freeform", "style":"neon", "width":1920, "height":1080, "fps":30,
  "scenes":[{
    "dur":6,
    "elements":[
      {"id":"title", "type":"text", "x":120,"y":100,"w":1680,"h":120,
       "text":"一张卡片，也可以独立成章。", "fontSize":72},
      {"id":"main", "type":"card", "x":120,"y":310,"w":600,"h":530,
       "label":"FOCUS", "title":"把重点说清楚。", "body":"卡片大小与位置都能改变。",
       "appearance":{"tone":"black","padding":40,"bodySize":28},
       "enter":{"type":"slide","direction":"left","at":0.2,"duration":0.8},
       "keyframes":[{"t":2.8},{"t":4.2,"x":120,"y":270,"w":1680,"h":630,"fontSize":96}],
       "exit":{"type":"fade","at":5.5,"duration":0.5}}
    ]
  }]
}
```

`scenes` 按顺序连接；每个场景可设置 `style`、`background`。自由模式没有固定的总看板、标题区或进度条；示例中的标题和说明也是普通独立元素。

## 元素

| type | 内容字段与作用 |
|---|---|
| card | `label/title/body`，通用文字卡；也可只作底板，添加任意 `children` |
| text | `text`，透明底独立文字；用换行符分行 |
| metric | `label/title/value/body`；可加 `count` 让数字增长 |
| image | `src/title/body`，图片卡；`fit` 为 cover 或 contain；`position` 设置裁切焦点，如 `30% 50%` |
| chart | `title/label/body`、`chart:"bars"或"line"`、`values`；支持零值和负值；`highlight` 是强调柱索引，`barColors` 可逐柱配色 |
| list | `title`、`items:["文字",{"text":"事项","meta":"完成"}]` |
| pill | `text`，标签或胶囊卡；圆角可自定 |
| group | 无可见底板的编组，`children` 相对于组左上角布局 |
| path | `points:[[x,y],...]` 是元素局部折线路径；`appearance.stroke/strokeWidth` 控制线条，可动画绘制 |

每个元素须有场景内唯一 `id`，基础位置为 `x/y/w/h`；尺寸彼此独立。`z` 控制层级；重叠允许且不自动排开。`children` 不限于 group，也可放进其他卡片中。

默认内容按卡片内边距排版。需要精确布局时用独立文字/图片作为子元素，不要勉强依靠 label/title/body 的通用排版。改变 `w/h` 会真实重排内容；只希望等比放大而不重排时，动画 `scale`。

文字是纯文本，换行用 `\n`；没有执行 HTML 的入口。长内容拆分或改字号，由渲染检查发现溢出。`allowClip:true` 可明确允许有意的裁切（例如文字遮罩揭示），不是常规排版修复。

## 外观

`style` 可在项目、场景、元素上指定，后者优先：

| 名称 | 外观特点 |
|---|---|
| blocks / 01 | 强色块与深色卡片，可用 coral/aqua/purple/sage 色调 |
| photo / 02 | 暖白、暖色边框与图片承载 |
| glass / 03 | 半透明表面、柔和蓝紫背景、玻璃高光边缘 |
| dense / 04 | 浅紫、白卡、紫色强调、紧凑圆角 |
| neon / 05 | 黑白灰与青柠色，可选黑底或 lime 卡 |
| editorial / 06 | 蓝灰、留白、轻边框 |
| header / 07 | 奶油卡片；文字卡有深色题头 |
| console / 08 | 暗色表面与橙色强调 |

`appearance` 支持：`fill/color/muted/accent/border/shadow`（CSS 颜色/阴影），`radius/padding/gap/borderWidth/fontSize/bodySize/labelSize`（像素），`align`（left/center/right），`justify`（flex-start/center/flex-end），`fontWeight`。

快捷色调 `tone`：`coral/aqua/purple/sage/black/lime`。显式 `fill/color/muted` 优先于快捷色调。字体、边框和内边距可按单卡调节，不要求全画布一致。圆形卡可用相同宽高及足够大的 radius；长胶囊可用 radius=高度的一半。

## 自由关键帧

`keyframes` 按 `t` 严格递增，支持以下数值属性：

`x y w h z opacity scale scaleX scaleY rotate rotateX rotateY blur radius fontSize draw clip`

- 没写的字段沿用上一个关键帧的值。`{"t":3}` 是一个保持帧，表示直到 3 秒保持当前状态；后面的关键帧从这里开始变化。
- `ease` 控制到达该帧的插值，默认 `inOut`。可用 `linear / in / out / inOut / backOut / spring / step` 或三次贝塞尔 `[x1,y1,x2,y2]`。仅在有明确弹性意图时使用 backOut/spring。
- `rotate/rotateX/rotateY` 单位为度；`opacity` 和 `draw` 为 0–1；`clip` 为从右侧裁去的比例 0–1；`blur` 单位像素。`z` 按四舍五入后的层级生效。
- `draw` 控制柱状、折线、path 的显现。需生长动画时设置初值 0，然后关键帧到 1。

例如卡片先保持，再移动变形，然后保持：

```json
"keyframes":[
  {"t":2.8},
  {"t":4,"x":900,"y":300,"w":720,"h":500,"rotate":-4,"ease":[0.22,1,0.36,1]},
  {"t":5.2},
  {"t":6,"rotate":0,"opacity":0}
]
```

## 入场、退场与路径

`enter/exit` 的 `type`：`none/fade/slide/scale/flip/wipe/blur`。通用 `at/duration/ease`；slide 的 `direction` 指进入来源边或退出目标边（left/right/up/down），`distance` 是位移；scale 的 `scale` 是隐藏端缩放值；flip 使用 `axis:"x"或"y"`、`angle`；blur 使用 `amount`。

入场前透明度为零，退场后透明度为零。动作以关键帧状态为基础叠加，不会把已经移动的卡片拉回默认坐标。

```json
"motionPath":{
  "at":2.5,"duration":1.8,
  "points":[[120,300],[300,100],[1000,100],[1300,300]],
  "ease":"inOut","followAngle":false
}
```

四个点为起点、控制点 1、控制点 2、终点，坐标相对于父容器。路径从 `at` 开始覆盖位置轨道的 x/y，结束后停在终点；其他尺寸、旋转仍可用关键帧。起点应与运动开始时的实际位置一致，避免跳变。`followAngle:true` 时把路径切线角度加到旋转轨道。

数字增长配置：`count:{"from":0,"to":96,"at":0.8,"duration":1.2,"decimals":0,"suffix":"%"}`；可加 prefix、grouping、ease。数据仅用于显示，脚本不推断业务结论。

## 样片与验证

`assets/examples/freeform/` 中 01–08 为八个独立示例，`showcase.json` 把它们串成 50 秒。它展示八种外观和数种编排方式，不代表必须套用这些构图。

检查关键帧两侧和中途；特别留意尺寸变小时的换行、父组与子元素的坐标、出场前的有效阅读时间。离线预览可拖动到任意时间；状态只由时间和配置决定，可随机取帧重渲。
