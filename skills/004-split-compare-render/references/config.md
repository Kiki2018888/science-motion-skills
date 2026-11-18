# 参数配置

JSON 使用 UTF-8（兼容 BOM）。相对素材路径以配置文件所在目录为基准。输出独立复制素材，所以预览不依赖原路径；修改原配置后需重新导出。

## 最小结构

```json
{
  "text": {"title":"两种操作方式对照", "note":"示意演示"},
  "timeline": {
    "duration": 4,
    "intro": 1,
    "outro": 2,
    "rate": 1,
    "pauses": [{"at":2,"hold":1.5,"title":"暂停比较","subtitle":"看同一时刻的位置"}]
  },
  "left": {"title":"方式 A","condition":"条件说明","media":{"kind":"video","src":"a.mp4"}},
  "right": {"title":"方式 B","condition":"条件说明","media":{"kind":"video","src":"b.mp4"}},
  "annotations": [{"type":"box","side":"right","rect":[0.1,0.2,0.3,0.4],"text":"注意这里","when":{"phase":"pause"}}]
}
```

上例的素材均需至少 4 秒。成片时长为 1 + 4 + 1.5 + 2 = 8.5 秒。框选坐标以面板素材视窗为基准，而不是整张视频画布。

## 画面与文字

- `width` / `height`：默认 1920 / 1080；支持其他 16:9 偶数像素分辨率，如 1280×720。
- `fps`：24（默认）、25、30、60。
- `theme`：覆盖 `background`、`ink`、`muted`、`rule`、`panel`、`left`、`right`、`banner`、`pause`、`summary`，值为 CSS 颜色。不会给图片/视频本身重新着色。
- `text`：`badge`、`kicker`、`title`、`subtitle`、`note`；时钟区 `clock`、`clockUnit`、`ready`、`running`、`paused`、`finished`、`sync`；底部区 `introTitle` / `introSubtitle`、`runTitle` / `runSubtitle`、`summaryTitle` / `summarySubtitle`；页脚 `footer` / `footerRight`。空字符串清空该项。
- 左右面板：`label`（默认 A/B）、`title`、`condition`、`footer`。小球预设里的释放/触地文字由其 media 参数控制。

主标题建议 26 字以内，面板标题 12 字以内，条件说明 28 字以内。引擎适度缩小过长文字，低于 16 设计像素则报错；仍需关键帧审看。

## 两个时间概念

**场景时间**指两侧要比较的共同时间，例如原实验的第 2 秒。**成片时间**包含开场停留、慢放、暂停和片尾。配置中的素材、指标点、暂停 `at` 和标注范围均使用场景时间；接口 `__seek(t)` 使用成片秒数。

`timeline`：

| 字段 | 含义 |
|---|---|
| `duration` | 场景结束时间，正数 |
| `rate` | 场景秒/成片秒，默认 1；0.25 表示四分之一速 |
| `intro`, `outro` | 开场保持第一帧和片尾保持最后一帧的成片秒数，默认 2 / 3，可为 0 |
| `pauses` | 按 `at` 升序排列，不可重复；每项含 `at`、`hold`（停留成片秒数）、`title`、`subtitle` |
| `segments` | 可选分段速度，提供时替代全局 `rate`；每项含 `to` 和 `rate`，连续递增且最后 `to` 等于 `duration` |

例如 `segments:[{"to":1,"rate":1},{"to":3,"rate":0.5}]`：场景 0–1 秒正常播放，1–3 秒半速播放。暂停可在任意段内；引擎自动切段并同时冻结两侧。支持在 0 或结束时暂停；片尾停留不会额外推进场景时间。总时长自动计算并向上取整到完整视频帧。

不要手工给左右各自加“暂停”来凑同步；统一配置 `timeline.pauses`。

## 左右素材 `media`

| kind | 输入 |
|---|---|
| `image` | `src` 指向本地 PNG / JPEG / WebP / SVG，保持静止 |
| `video` | `src` 指向本地 MP4 / WebM，需当前 Chrome 支持其编码；推荐 H.264 MP4 |
| `sequence` | `frames:[{"at":0,"src":"0.png"},{"at":1,"src":"1.png"}]`；时间严格递增且首项为 0，保持当前帧直到下一帧 |
| `chart` | `values:[{"at":0,"value":80},{"at":4,"value":20}]`，时间严格递增，覆盖整个场景时间 |
| `fall` | 内置相同小球平方阻力模型，见下方 |

通用素材参数：

- `fit: contain`（默认）完整显示，留出底色；`cover` 填满并裁切。视窗固定为 734×363 设计像素，最好先将两侧素材裁切到相同视野。
- `background`：留白底色。
- `start`：素材起始秒数，默认 0；`rate`：素材每场景秒推进的秒数，默认 1。素材时刻 = `start + 场景时间 × rate`，适用于 video / sequence；chart 的数据和所有指标仍按共同场景时间读取。若用独立偏移/倍速，必须同步准备对齐后的指标数据。
- `end: error`（默认）：视频不足以覆盖场景则报错；`hold`：明确允许超出后保持最后帧。不会自动循环较短视频制造同步假象。图片序列最后一帧一直保持。
- 素材仅从本地读取，HTTP(S) 渲染请求被禁用；SVG 外部依赖需内嵌。视频、图片本身的文字不会由配置自动改写。

### 小球预设

`{"kind":"fall","mass":1,"g":9.8,"height":20,"drag":0.12,"traceInterval":0.25,"ballColor":"#e6a850"}`。

左右均为 fall 时，质量、g、下落距离、轨迹采样间隔强制一致，仅 drag 可不同。`drag` 是 F阻=bv² 中的 b，单位 kg/m；其他单位为 kg、m、s。`start=0`、`rate=1`，用共同时间轴控制慢放。轨迹在触地后停止，不模拟弹跳。

可改 `releaseLabel`、`landedLabel`、`velocityPrefix`。默认示例由参数推导落地时刻；模型采用恒定 g、平方阻力并忽略浮力，是理想示意。物理关系参考 [NASA Glenn](https://www1.grc.nasa.gov/beginners-guide-to-aeronautics/falling-object-with-air-resistance/)，画面为原创程序绘制。

## 数据与差异数值

每个面板 `metrics` 可定义最多 8 个指标。第一个显示在面板右上角，其他供差值计算使用。

```json
"metrics": [{
  "id":"done", "label":"完成数量", "unit":"件", "decimals":0,
  "interpolation":"step",
  "values":[{"at":0,"value":0},{"at":1,"value":3},{"at":3,"value":8}]
}]
```

- `id` 在同一面板内唯一。`decimals` 为 0–6。
- `values` 从场景 0 开始，覆盖场景结束；默认 `interpolation: linear`（线性插值）。计数或阶跃结果用 `step`，与离散图片序列一致。
- fall 指标可用 `source: distance | velocity | hit` 替代 values，其中 hit 是计算的落地时间。
- chart 使用顶层 `chart:{"min":0,"max":100,"unit":"示意值"}` 统一两个面板的纵轴；横轴均为场景时间。数据不能超出共享范围。
- 指标来自用户提供的数据或明确的模型，不能从图片/视频自动读出真实数值。

## 差异标注 `annotations`

所有标注共享 `when`：

```json
"when": {"phase":"pause","pause":0,"from":0,"to":3}
```

`phase` 为 all（默认）/ intro / run / pause / outro；`pause` 可指定第几个暂停点（从 0 开始），不填则所有暂停都可显示；`from`/`to` 是闭区间场景时间，默认整个场景。进入一个阶段时标注短暂淡入。

支持类型：

- **label**：`side: left|right|both`、`point:[x,y]`、`text`、可选 `color`。point 是文字标签左下基线位置，留足文字空间。
- **box**：`side`、`rect:[x,y,w,h]`、可选 `text`、`color`。
- **circle**：`side`、`point:[x,y]`、`radius`（相对视窗短边，默认 .06）、可选 `text`、`color`。
- **bracket**：`left:[x,y]`、`right:[x,y]`，在两侧目标间绘制水平引线与中间高度差括号；fall 可用 `left:"object"`、`right:"object"` 自动跟随球体。无固定箭头。
- **delta**：`leftMetric`、`rightMetric`、`operation: absolute | left-right | right-left`，另设 `text`、`unit`、`decimals`、`prefix`、`color`，在底部大字显示计算结果。也可直接提供数值 `value`，其事实依据由任务给定。

坐标为 **素材视窗** 内的归一化 0–1，不是输入图片像素；contain 留白也属于该视窗。先用预览确定位置。一个时刻仅显示一个 delta，若多个同时满足，后项覆盖前项。

例：暂停显示数量差，结束显示用时差：

```json
[
  {"type":"delta","when":{"phase":"pause"},"leftMetric":"count","rightMetric":"count","operation":"absolute","text":"数量相差","unit":"件","decimals":0},
  {"type":"delta","when":{"phase":"outro"},"leftMetric":"finishTime","rightMetric":"finishTime","operation":"right-left","text":"用时相差","unit":"s","prefix":"+"}
]
```

`prefix` 是纯文本，不自动判断正负；只有保证非负时才设置 `+`。纯文字差异可直接用暂停标题/说明或 summaryTitle / summarySubtitle，无需编造数字。

## 外观（3.0.0）

- `appearance: "default" | "amber-night"`：整套换 background / ink / muted / rule / panel / left / right / banner / pause / summary；`theme` 单项覆盖仍优先。
- 双屏卡片走 `panelCard()`：接触阴影 + 顶亮渐变 + 底暗渐变 + 颗粒；渐变按外观分档（浅色强顶亮、暗场弱顶亮强底暗）。
- 圆角统一 `squirclePath()`（超椭圆 n=4.5，16 段/角），`box()` 内部已改用它。
- 媒体视口用 `squirclePath` 裁剪，并补 1px 内描边：暗场里内描边用 `rgba(255,255,255,.07)`，否则视口与卡片同色会糊成一片。
