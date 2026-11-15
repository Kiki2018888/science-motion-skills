# v1 看板兼容模式配置

此页只用于复现旧看板。新自由卡片作品使用 [freeform.md](freeform.md)，不受这里的看板尺寸、左右栏和单一强调限制。

顶层：`style`、`fps`（默认 30）、`chapters`（可选，最多 8 个）、`fadeEnd`（末屏淡出）、`scenes`。
画布固定 1920×1080。场景 `dur` 以秒计，归一化到完整帧。每个项目 1–60 屏，最长 20 分钟。

| 别名 / 编号 | 视觉方向 | 示例 |
|---|---|---|
| blocks / 01 | 深色卡底、红青紫绿的大色块 | `assets/examples/01-blocks.json` |
| photo / 02 | 暖白底、图片先行、轻边框 | `assets/examples/02-photo.json` |
| glass / 03 | 蓝紫渐变、半透明卡片 | `assets/examples/03-glass.json` |
| dense / 04 | 浅紫背景、紧凑分区、紫色强调 | `assets/examples/04-dense.json` |
| neon / 05 | 黑白灰、青柠高亮、胶囊进度 | `assets/examples/05-neon.json` |
| editorial / 06 | 留白、较大标题、蓝灰底与暖色图表 | `assets/examples/06-editorial.json` |
| header / 07 | 奶油底、深色高页眉、铜色强调 | `assets/examples/07-header.json` |
| console / 08 | 暗色控制台、橙色强调、折线趋势 | `assets/examples/08-console.json` |

示例 JSON 路径相对于技能根目录；`photo` 自带四幅 SVG 风景插画，可替换为照片。未给 `src` 时使用渐变占位，不能称作真实照片。

## 场景

共同字段：`type`、`dur`、`chapter`（0 起始）、`caption`（字符串或数组）。字幕用 `[关键字]` 着色，建议每条不超过 16 个汉字。数组按该屏有效时长平均分配。

| type | 字段 |
|---|---|
| cover | `kicker`、`title`（可含 `<br>`）、`chips`、`card`；`card:false` 隐藏右侧扇形卡组 |
| section | `no`、`title`，可加 `card` |
| point | `no`、`tag`、`l1`、`l2`、`bullets`、`note`、`swatches`、`card`、`flip` 与强调动效 |
| quote | `text`（可用 `<em>` 或 `[词]` 强调）、`by` |
| checklist / ending | `title`、`items`（最多 4 条）、`brand`、`sub`、`card` |

`swatches` 是 `[颜色,比例文字,名称]` 的数组，例如 `[["#D8F26A","10%","强调色"]]`。不是自动统计配色占比。

## card 对象

```json
{
  "title": "工作台概览",
  "sub": "让信息各就其位",
  "kpis": [
    {"label":"本周完成","value":"24","delta":"+ 8"},
    {"label":"目标进度","value":"96%","delta":"+ 12%"}
  ],
  "bars": [4,7,5,8,6,9],
  "barHl": 5,
  "chartTitle": "六周进展",
  "list": [{"title":"视觉设计","meta":"完成"}],
  "listTitle": "当前任务",
  "hl": 1
}
```

还支持 `line`（存在时优先于 `bars`）、`photos:[{"src":"media/image.png","label":"标签"}]`、`text`、`tabs`、`button`、`side`、`kicker`。KPI 最多 5 个；图表最多 24 点；列表最多 5 行；顶部标签最多 4 个。数字字符串保留货币前后缀、百分号、小数位和千分位。

## 三种强调（每屏选一）

- `pop:1, popAt:3.4, popLabel:"当前重点"`：放大一张卡片，其他卡片变暗。索引按实际顺序：photo 风格的图片在 KPI 前，其他风格图片在末尾；接着依次是图表、列表、正文卡。
- `scan:true, scanAt:2.2, scanDur:2.0`：从灰阶扫描到完整颜色。
- `wire:true, focus:"kpis", focusLabel:"关键数字", revealAt:3.3`：先显示按真实 UI 区域计算的线框，再揭示内容。`wire:"hold"` 保持线框。可聚焦 `header / side / kpis / chart / list / photos / text`，需确实存在该区域。

给动效留出完成时间和至少半秒阅读停留。`pop` 若要强调不同卡片，应换屏，不在同一屏同时放大多张。

`assets/examples/validation-scenes.json` 是结构验证数据，包含封面、章节、翻转、独立卡片、金句、清单和零值图表；不作为业务文案。
