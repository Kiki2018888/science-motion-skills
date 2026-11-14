# 参数说明

所有参数通过 UTF-8 JSON 配置。示例文件可直接复制到工作目录修改；含相对素材路径时同时复制对应 `media` 目录，或改为素材绝对路径。Windows JSON 路径建议使用 `/`。

## 最小配置与坐标

```json
{
  "title": "看看里面的层次",
  "subject": "材料结构",
  "motion": {"direction":"up", "gap":140},
  "layers": [
    {"id":"base", "label":"底层", "texture":{"kind":"grid"}},
    {"id":"middle", "label":"中间层", "texture":{"kind":"pleats"}},
    {"id":"cover", "label":"表层", "texture":{"kind":"mesh"}}
  ],
  "timeline": {"focus":[{"layer":"middle", "duration":3}]}
}
```

`layers` 数组长度就是层数，支持 **2–10 层**，顺序为底→顶。画面上的默认编号从最顶层 01 向下递增，与强调 ID 无关。

当前布局使用逻辑 1920×1080 坐标；输出 `width`/`height` 可更改，但须保持 16:9、偶数尺寸，每边 360–3840。`fps` 为 24（默认）、25、30 或 60。素材/几何的原始坐标经固定比例缩放到主体区域；布局坐标仍按逻辑画布计。

## 每一层 `layers[]`

| 字段 | 含义 |
|---|---|
| id | 唯一字符串；省略时按数组位置生成。强调用 ID 定位，推荐显式写出 |
| label / note | 层名称与说明；note 可换行并自动折行 |
| showLabel | 是否显示该层右侧标注，默认 true |
| thickness | 投影前的可见厚度，2–80，默认 22 |
| size | `[宽度倍率, 深度倍率]`，每项 .2–2，默认 `[1,1]` |
| color | 层边缘基色，也作为纹理的默认颜色 |
| edgeDark / edgeLight | 可分别覆盖右侧面、前侧面颜色 |
| texture | 各层独立的程序纹理或图片配置，见下文 |

各层保持矩形平面和厚度。`size` 改变几何边界；图片透明部分不会自动变成模型镂空。

## 纹理与图片 `texture`

| kind | 呈现 |
|---|---|
| solid | 纯色层面 |
| grid | 较粗的支撑格纹 |
| pleats | 具有明暗面的连续折叠纹理 |
| granules | 固定随机种子生成的颗粒 |
| mesh | 细网纹与支撑条 |
| slots | 长条开槽的视觉示意 |
| image | 本地 PNG/JPEG/WebP/SVG 图片 |

通用字段：

- `color`：层面底色；`detailColor`：纹理细节色；`frameColor`：外框色。
- `density`：纹理密度倍率，.25–3，默认 1。对 grid、pleats、granules、mesh、slots 生效。
- `seed`：整数，控制颗粒分布；同种子可重复复现。
- `frame`：默认 true，绘制边框与角部固定点；false 可让图片铺满整层。
- `text`：可选层面短文字，投影随层面变化；用于标记而非长段说明。
- `src`：image 时必需，本地路径，相对配置 JSON 所在目录解析。
- `fit`：`cover` 默认覆盖裁切；`contain` 完整显示并保留底色余边。

```json
{
  "id":"circuit", "label":"电路层", "thickness":18,
  "texture": {
    "kind":"image", "src":"materials/circuit.png",
    "fit":"contain", "frame":false, "color":"#e8eee4"
  }
}
```

纹理是在平面上绘制的示意，不提供孔隙、褶皱、颗粒的真实三维拓扑。图像不拉伸变形后再裁切；随后整体随层面投影。可混用程序纹理和图片。

## 拆解方向与间距 `motion`

- `direction`：`up`（默认）、`down`、`left`、`right`、`up-right`、`up-left`、`down-right`、`down-left`，或非零 `[dx,dy]`。屏幕坐标 x 向右、y 向下；自定义向量自动归一化。
- `gap`：相邻层新增的展开距离，0–3000，默认 125。基于原始坐标；展开位置还保留装配厚度带来的偏移。
- `spread`：与展开向量垂直方向的附加错位，默认 0，可正可负。上向展开时正值使上层偏右。
- `assemblyGap`：装配状态保留的层间空隙，默认 0，范围 0–150。

展开以各层的平均位置为中心向两端分布。direction 表示从底层到顶层的新增偏移方向；不是所有部件同时朝同一边飞走。屏幕向下或横向的示意位移可能产生层面交叠，按预览调整 gap、spread 或投影角度。

## 时间轴 `timeline`

时间单位为秒。总时长根据以下阶段累加，无需手工填写 duration。

| 字段 | 默认 | 作用 |
|---|---:|---|
| intro | 2.6 | 初始整体停留 |
| explode | 2.9 | 每层展开运动时长 |
| stagger | .22 | 相邻启动的间隔 |
| explodeOrder | top-first | top-first、bottom-first、together |
| hold | 1.1 | 所有部件到位后停留 |
| focus | [] | 按顺序强调的层列表 |
| afterFocus | 1 | 所有强调完成后的停留 |
| reassemble | true | 是否复位；false 则结束在展开状态 |
| assemble | 2.5 | 每层复位运动时长 |
| assembleStagger | .18 | 复位错峰间隔 |
| assembleOrder | bottom-first | bottom-first、top-first、together |
| outro | 1.7 | 最终状态停留 |

`explode`、`assemble` 最低 .2 秒；其余阶段可为 0。`together` 忽略该阶段 stagger。重新组装开始前会等全部强调和停留完成。

```json
"focus": [
  {"layer":"mesh", "duration":2.7, "pause":0.3},
  {"layer":"grain", "duration":3, "pause":0.5},
  {"layer":"fold", "duration":2.7}
]
```

强调的 duration 默认 2.7、最低 .5 秒，pause 默认 .3；duration 包含淡入淡出。可以重复强调同一层，也可以只强调部分层。展开、复位、强调均由绝对时间求值，支持乱序跳帧。

## 标注、文字与风格

顶层：`title` 主标题、`eyebrow` 眉题、`subject` 右上主题、`note` 右上说明。应保持短句，过长会报布局错误。

`labels`：

- `show`：全部标注开关，默认 true。
- `numbers`：层面及标注编号开关，默认 true。
- `showAt`：开始淡入时刻，默认在最后一层到位前 .8 秒，但不早于展开开始。
- `hideAt`：开始淡出时刻，默认复位开始；不复位时保持到结束。
- `fade`：淡入淡出时长，默认 .6 秒。

`style`：`ink` 主文字色、`muted` 辅助色、`accent` 强调色、`rule` 线条色。`labelSize` 默认 30、范围 18–40；`noteSize` 默认 21、范围 14–28。`dimOthers` 为强调时其他层降低的不透明度，默认 .36、范围 0–.8。

`showPhase` / `showProgress` 分别控制左侧阶段说明与底部进度条。`phaseTitles` / `phaseNotes` 都是五个字符串，依次对应整体、展开、观察、复位、完成。多层场景优先减少说明行数，例如十层示例使用较小标签且不填 note。

## 背景 `background`

```json
{"type":"solid", "color":"#edf0ec"}
```
```json
{"type":"gradient", "colors":["#ffffff","#e8ede7"]}
```
```json
{"type":"image", "src":"materials/background.jpg"}
```

渐变为径向渐变，支持 2–8 色。图片背景保持比例覆盖画布并居中裁切。按背景亮度调整文字色；没有自动对比度校正。没有配置透明视频或声音混合功能。

## 投影与布局

`geometry.u` 默认 `[250,25]`，`geometry.v` 默认 `[-125,50]`，表示矩形层的两个半边向量。u 两项为正，v 的 x 为负、y 为正，保持从上方观察；改变它们可调整宽深比例和俯视角。它们不改变素材内容。

`layout` 默认：

```json
{
  "artBox":[365,205,925,735],
  "labelX":1336, "labelTop":245, "labelBottom":860, "labelWidth":450,
  "showGuides":true, "showShadow":true
}
```

artBox 是 `[x,y,宽,高]`；主体装配和展开的全部端点同时纳入自动适配，动画中保持固定比例。labelTop/Bottom 是最上/最下标签名称的基线。标签按展开位置排序，文字本身留在右侧列表，引线起点跟随部件。调整布局时保持主体与标注区分开。默认支持矩形层的二维半投影，不包含任意异形部件网格、相机绕行或真实三维剖切。

## 输出文件

`--check-only` 生成 `_source` 与检查报告，不生成新 MP4；已有视频不会因检查自动更新。正式导出完成验证后才替换目标视频。`input.json` 保留用户配置，`resolved.json` 含展开时间轴；修改 input 对应原配置再重渲，不直接编辑展开的坐标时间表。

`media/` 保存本次素材副本；`assets.json` 含来源、大小和 SHA-256。运行时禁止加载外部 HTTP(S) 资源。`report.json` 区分浏览器关键帧检查与实际视频编码/解码是否完成。
