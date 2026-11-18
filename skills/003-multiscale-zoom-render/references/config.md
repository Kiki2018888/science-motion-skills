# 配置与素材对齐

配置是 UTF-8 JSON（兼容 BOM）。示例可直接运行；相对素材路径以 JSON 所在目录为基准。尺寸、位置均使用统一的世界坐标，画面文字/标注偏移使用设计像素。

## 快速换主题

1. 复制 `assets/examples/circuit-portrait.json` 和同级 `circuit/` 到工作目录。
2. 将 `scene.layers[].src` 换成自己的图片；设置每幅图的世界范围 `bounds`。
3. 修改 `levels` 的名称、观察中心 `center`、视野宽度 `viewWidth`、`transition`、`hold` 和 `caption`。
4. 修改 `text` 和 `theme`。决定比例尺有无物理依据，设置 `units` 与 `scaleBar`。
5. `--check-only` 生成可拖动预览，重点核对过渡中目标有没有漂移、素材边缘有没有显露。

## 画布、文字与颜色

| 字段 | 默认 / 说明 |
|---|---|
| `width`, `height` | 1920×1080；支持 16:9 / 9:16，偶数像素尺寸。如 1080×1920、1280×720 |
| `fps` | 24；支持 24 / 25 / 30 / 60 |
| `showFocus` | true；下一层观察范围的四角提示 |
| `showLocator` | true；整体定位小图 |
| `text` | 覆盖界面文字，所有值均为普通文本，不解析 HTML |
| `theme` | 覆盖 UI 颜色，使用有效 CSS 颜色字符串；不对输入图片重新着色 |

`text` 可覆盖：`badge`（左上角）、`kicker`（副标签）、`title`、`subtitle`、`note`（示意说明）、`position`、`viewWidth`、`relative`、`locator`、`moving`、`holding`。留空字符串可清空对应文字。底部文案使用各层 `caption`。横屏标题建议 24 字以内，竖屏 18 字以内；引擎会适度缩小长文字，低于可读字号会报错，不静默裁切。

`theme` 可覆盖：`background`、`ink`、`muted`、`rule`、`accent`、`field`（视窗空白区域）、`panel`（比例尺/标注底色）、`locator`（小图视野框）。默认米白、深绿；示例电路板使用蓝色。

## 缩放层级和时间

`levels` 支持 2–8 项，顺序即播放顺序；视野可缩小或放大。

```json
{
  "name": "芯片",
  "description": "进入内部示意",
  "caption": "镜头推进，内部结构逐渐显现。",
  "center": [160, 80],
  "viewWidth": 160,
  "transition": 3,
  "hold": 1,
  "panEase": 2,
  "annotations": [
    {"text": "目标结构", "point": [160, 80], "offset": [160, -100]}
  ]
}
```

- `center`：本层最终观察中心，世界坐标 `[x,y]`，x 向右、y 向下。
- `viewWidth`：最终视野宽度（正数），不是物体宽度，也不是倍率；视野高度由视频视窗长宽比推算。
- `transition`：从上一层到本层的推进秒数；第一层必须是 0，后续必须大于 0。
- `hold`：到达本层后停留秒数，可为 0。总时长 = 所有推进与停留时间之和，成片向上取整到完整帧。
- `panEase`：正数，默认 1。位置和缩放默认同节奏；大于 1 可让位置较早靠近目标。叶片首段使用 3。
- `name`、`description`、`caption`：层级名称、当前层说明和底部文案。
- `annotations`：停留时淡入的标注。`point` 为所指对象的世界坐标；`offset` 为标签中心相对该点的设计像素偏移。横屏设计画布1920×1080、竖屏1080×1920，小分辨率按比例缩放；换画幅后需检查偏移。文字自动测宽，越出视窗报错。

相机在对数视野上做平滑缓入缓出，避免跨数量级时前段过快、后段近乎静止。每段到达时速度归零，以匹配停留。当前层名称在推进接近终点时切换。

## 素材层

```json
"scene": {
  "type": "images",
  "layers": [
    {"src": "assets/overall.jpg", "bounds": {"cx": 0, "cy": 0, "width": 1000}},
    {"src": "assets/detail.png", "bounds": {"cx": 100, "cy": 80, "width": 120},
     "revealWidth": 300, "fadeRatio": 2, "opacity": 1}
  ]
}
```

- 按数组顺序绘制，后面的覆盖前面的。首层用于整体定位小图。
- 支持本地 PNG、JPEG、WebP、SVG（静态内容）。SVG 字体/图片等依赖应内嵌；渲染禁用 HTTP(S)，不接受远程图片 URL。
- `bounds.cx/cy`：图片中心的世界坐标；`bounds.width`：图片覆盖的世界宽度。`height` 缺省按原图比例计算；显式设置可用于已校正素材，但比例不同会拉伸图片。
- `revealWidth`：当前视野缩到此宽度时开始显示。达到 `revealWidth / fadeRatio` 时完全显示。`fadeRatio` 默认 2，必须大于 1。首层可省略 `revealWidth`（始终显示），细节层必须提供。该逻辑与时间解耦，缩回时也成立。
- `opacity`：0–1，默认 1。带透明通道的 PNG / WebP / SVG 可叠加到下层；不透明照片最好覆盖整个可见区域，或事先制作柔和边缘以避免贴片边界。
- 图片在加载阶段一次解码；缺失或不能解码会失败，不用空白素材继续输出。

### 对齐素材

所有层应描述同一个目标位置，不能仅把每张图片都放在画面正中。设一幅图宽 W 像素、世界宽度 B、世界中心 cx，则图中像素 x 对应：

`worldX = cx + (x / W - 0.5) * B`

y 同理。先在大图选出下一层要进入的目标，将这点映射为下一层的 `center`，再将局部素材的 `bounds` 对到该区域。高级细节至少在最终视野内具备足够分辨率；一张低分辨率图片放大后会模糊。

可将细节照片或示意图作为上一层指定区域的替换层；前提是轮廓、位置、朝向和光照有合理衔接。当前引擎做缩放、平移与透明度渐显，不做透视校正、形态变形或自动语义配准。需要旋转/透视对齐的素材先处理好。3D 模型应先导出对应角度的静帧。

## 比例尺和单位

```json
"units": {"name": "μm", "metresPerUnit": 0.000001},
"scaleBar": {"show": true, "pixels": 172, "mode": "continuous", "unit": "auto"}
```

- `metresPerUnit`：1 个世界单位相当于多少米；如 mm 为 0.001、μm 为 0.000001。需要真实来源支持，不能从任意示意图猜测。
- 不使用物理尺度：`{"name":"示意单位","metresPerUnit":null}`；也可用任意统一自定义单位。
- `scaleBar.show`：开关。即使关掉，右侧仍显示视野宽度（使用上述单位）；需要同时改变说明时修改 `text.viewWidth`。
- `pixels`：目标尺条长度，指设计像素，默认 172。
- `mode: continuous`：尺条像素长度固定，读数连续变化；`nice`：取不超过目标长度的 1 / 2 / 5 × 10ⁿ 整数尺值，便于阅读，切换档位时尺条长度会变化。
- `unit: auto`：按物理长度选择 km / m / mm / μm / nm / pm；`world`：始终使用配置的 `name` 和世界坐标数值。非物理单位始终显示 `name`。
- 尺长由相机投影计算，与文字倍率无关。相对倍率 = 第一层视野宽度 / 当前视野宽度。

## 叶片内置素材

`scene: {"type":"leaf", "focus":[7000,6500]}`，固定为 μm 坐标，`units.metresPerUnit` 必须为 1e-6。支持 20–160000 μm 视野；原示例为 80000 → 3200 → 400 → 80。`focus` 改变程序细胞区域及目标气孔的位置，相应调整相机中心和标注点。极端位置可能超出叶缘，需视觉检查。

内置叶片为原创程序结构示意，尺寸用于演示，非真实测量。层级关系参考 [OpenStax Biology 30.4 Leaves](https://openstax.org/books/biology/pages/30-4-leaves)，未复制图片。电路板示例同样是原创几何示意，不代表真实芯片结构。字体许可在模板 `OFL.txt`。

## 外观（3.0.0）

- `appearance: "default" | "amber-night"`。暗夜版把 background / ink / muted / rule / accent / field / panel / locator 整套换成深底米字琥珀强调；`theme` 里的单项覆盖仍然优先。
- 面板（规模条、定位图）统一走 `panel()`：接触阴影 + 顶亮渐变 + 底暗渐变 + 颗粒，四层叠加；渐变按外观分档，浅色不做强顶亮。
- 圆角统一走 `squirclePath()`（超椭圆 n=4.5，每角 16 段），不是 `ctx.roundRect`。
- 颗粒用固定种子的 LCG 生成 160×160 噪声图，逐帧可复现；`window.__noGrain = true` 可临时关闭。
