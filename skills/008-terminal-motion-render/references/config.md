# 参数说明

UTF-8 JSON；所有文字按单行填写，换行应拆成多个数组项。未填字段使用默认值。完整例子在 `assets/examples/`。

## 全局

| 字段 | 说明 |
|---|---|
| `width,height` | 1920×1080；16:9，偶数，单边 360–3840 |
| `fps` | 24，支持 24/25/30/60 |
| `font` | `Consolas`、`Courier New`、`monospace`；中文回退到随附字体 |
| `theme` | CSS 颜色：`bg,panel,bar,line,ink,muted,green,blue,gold,red,purple,focusFill` |
| `text` | `title,subtitle,eyebrow,session,footer,footerLabel,holdLabel`；空串隐藏 |
| `timeline` | `lead:0,tail:.8,fadeIn:.45,fadeOut:.8,entrance:.6`，单位秒，0 关闭相应淡变/进入 |
| `segments` | 1–20 个按顺序播放的段落 |
| `counters` | 0–3 个右侧计数器；空数组时终端自动加宽 |

`duration` 不在顶层手填，脚本自动计算：

**成片总时长 = lead + 各段 duration 之和 + 所有高亮 enter/hold/exit 之和 + tail。**

淡入/淡出包含在总时长内。`lead` 是内容开始前的空窗口时间；`tail` 保持最后内容。修改时长要同步考虑片尾淡出是否遮住结果。

## 段落公共字段

`id` 唯一，`kind` 为 `shell/code/logs`；`duration` 是本段正常推进的秒数（.2–600）。`label` 是顶部阶段与底部导航文字，`tab` 是窗口标签；`context` 默认 `~/workspace`，仅 shell 使用；`note` 是无进度条时的代码/日志底部说明。

`fontSize:25`（16–34）、`lineHeight:39`（34–50），均为 1920×1080 设计坐标像素。长文字在可用区内自动缩小，小于 14 像素时报错。段落可重复、单独使用，无需凑齐三个类型。底部最多显示四个相邻阶段。

所有段内 `at` 从本段内容开始算，不包含任何定格新增时间。内部 `start,end,contentStart` 由程序生成，不手填。

## 命令与输出：`kind: shell`

```json
{"id":"install","kind":"shell","label":"准备环境","duration":5,
 "rows":[
  {"at":0.2,"kind":"command","text":"demo install --local","duration":1.4,"prompt":"$"},
  {"at":1.8,"kind":"output","text":"[ok] installation complete","color":"#8ee3bb"}
 ]}
```

`rows` 按 at 排序，最多 500 行。`command` 按 `duration` 逐字输入（默认 1 秒），`prompt` 默认 `$`；`output` 整行淡入（默认 .2 秒）。后一行不能先于上一条命令输入完成；每行动画须在本段内完成，命令完成后至少留一帧再切段。溢出的旧行自动向上滚动，进度区域保持固定。

## 代码与日志：`kind: code/logs`

`lines` 为 1–10000 行，可直接填字符串或对象：

```json
{"text":"request completed","tag":"INFO","stamp":"00:03.250","color":"#8dbef3"}
```

代码仅使用 `text,color`，并用 `keywords` 数组、字符串、数字和 `//`/`#` 注释做轻量着色。默认关键词兼顾常见 JavaScript/Python；可替换列表。日志显示行号、原样时间戳、标签与内容；时间戳由配置提供，不自动宣称对应真实时间。日志 `color` 控制标签色，正文使用 `theme.ink`。

`scroll:[{"at":0,"value":0},{"at":5,"value":128}]` 使用线性插值。代码中 value 为顶部行的零基索引；日志中 value 为当前尾行的零基索引，之前的行从底部向上滚动。允许小数位置、停顿（相同 value）与倒序。最后一个关键帧之后保持位置。索引不得越界。

不写 scroll 时，代码在整段中推进至最后约 12 行，日志从首行滚到末行。关键行必须在强调时已经出现且完整位于可读区域；否则校验报错。修改行内容或删除行后应重新检查索引。

## 进度条：段落内 `progress`

```json
{"points":[{"at":0,"value":0},{"at":2,"value":0.65},{"at":4,"value":1}],
 "label":"INSTALLING","doneLabel":"COMPLETE","color":"#8ee3bb"}
```

三个类型都可选配。`value` 在 0–1，显示为百分比；关键帧按时间递增，支持阶段停顿或回退。最早关键帧前显示首值，末帧后保持末值。无 `progress` 时不画进度条。到达 1 显示 doneLabel，其余显示 label。

## 计数器：顶层 `counters`

```json
{"id":"accuracy","label":"ACCURACY","caption":"准确率",
 "from":12.5,"to":87.3,"at":4,"duration":5,"decimals":1,
 "prefix":"","suffix":"%","finalSuffix":"","grouping":true,"color":"#eac17a"}
```

`at` 使用全片**内容时间**（包含 lead、各段 duration，不包含定格）。在 duration 内缓入缓出，从 from 变化到 to；支持负数、下降和 0–3 位小数。目标值的小数位必须与 decimals 一致。最终停留原值，不继续增长。

`prefix/suffix` 常驻；`finalSuffix` 到达目标后追加，可用于 `100,000+`。`grouping` 控制千分位。数字范围 ±10¹²，过长的显示仍受可读字号限制。计数不会解析日志内容来自动修改值。

## 关键行与暂停：段内 `highlights`

```json
{"at":5.2,"line":128,"style":"focus","enter":0.6,"hold":2,"exit":0.6,
 "color":"#ff786b","dim":0.79,"kicker":"0129 / ROUTE WARNING",
 "caption":"关键行，停下来才看得清。"}
```

仅 code/logs 可用；line 是零基索引（128 对应屏上第 129 行）。数组 at 严格递增，每次强调新增 enter+hold+exit 秒。`focus` 放大至中央，`inline` 保持原行；`dim` 控制 focus 时背景压暗，0–1。`kicker/caption` 只在 focus 模式显示，holdLabel 来自顶层 text。

整段强调（包括进入、停留、回位）冻结滚动和计数器。`hold` 是完全静止的阅读时间，不包含 enter/exit。例：本段 at=5.2、enter=.6、hold=2、exit=.6，则正常播放到第 5.2 秒后插入 3.2 秒强调，结束后继续第 5.2 秒的内容。后续时刻自动顺延；可以配置多次强调。

完全停留期间必须避开全片入场/淡入/淡出，校验会拒绝冲突。强调结束后该行保留底色，正常滚动可将其移出画面。需要最后一直保留重点，令末尾 scroll 停在该行，并预留本段 duration 或 tail。

## 检查和输出

`--check-only` 输出源包与预览图，不编码 MP4。`--overwrite` 更新同名目标，不清空其他目录。`report.json` 的 `encoded/full_decode_pass` 才表明视频成功导出。

输出 `_source/input.json` 是原始配置，`resolved.json` 包含默认值与最终时间轴。预览默认随附中文字体；使用 `--shared-font` 后须保留公共字体相对路径。Consolas/Courier New 来自系统，跨机器要检查字体回退。

## 可读折行模式（v02）

根配置 readability: wrap 启用可读标签，并使各段默认使用软折行；省略时为 legacy，保持旧默认。段内 overflow 可单独设 wrap/legacy。appearance: amber-night 独立控制暗夜配色。

- wrap段 fontSize 至少22，最高仍为34设计像素；lineHeight沿用34–50。超过显示空间时换行或报错，不缩成小字。
- `wrap:{"indent":2,"maxRows":6}`：续行缩进0–8个空格的显示宽度；每条原始行最多1–8个显示行。缩进只影响位置，不添加到源字符串。
- 每个row或line对象可加`breaks:[51,90]`。数值是原始字符串的Unicode码点偏移，严格递增，位于0和原文长度之间；到此处强制折行，之前仍可按容器自动折行。建议在完整参数或语义单元前指定，不在单词中间硬断。
- 软折行保留所有原始字符、空格和顺序；没有添加反斜线、换行符或命令续接语法。复制/复现仍使用input.json中的原文，不使用屏上排版拼成新命令。
- 日志时间戳与长tag显示在正文上方，正文可使用更宽的区域。日志行号、scroll与highlight.line始终指原始行；堆叠高度由真实字体测量决定。
- shell按真实显示行数滚动，命令光标跨行移动。新模式的长命令提示符最多180设计像素；超长应改短或分开显示上下文。

字段强调示例：

```json
{"stamp":"00:09.200","tag":"TOOL_EXECUTION_COMPLETED",
 "text":"status=complete latency_ms=320 records=1200",
 "emphasis":[{"text":"latency_ms=320","color":"#F3BB66"},{"text":"records=1200"}]}
```

emphasis精确匹配原文，默认取第0次出现；可用occurrence选取后续同名字段。匹配不到或区间重叠时报错。字段可以跨显示行，不截断或改写原文。颜色默认theme.gold。此能力及breaks仅在overflow:wrap时有效。

折行后的focus仍增加enter+hold+exit时长，并冻结计数与滚动。`highlights[].fontSize`为放大字号28–56，默认40；`maxRows`为放大后的最大行数1–5，默认5。过长应拆解叙述、调整容器或改用inline，不突破最小字号。inline描边覆盖整条原始行的全部显示行；focus完整放大该原始行。原始行任何一部分出界时拒绝强调，应调整scroll。

根readability:wrap还使阶段名、窗口标签和计数器标签在各自区域最多两行，至少22设计像素；计数器副标题保持一行，超限报错。大数字、标题与旧布局仍各按自己的容器检查，不表示任意文案都能放入模板。

输出增加display-lines.json：每段、原始行号、原文、显示片段start/end及text。start含、end不含，单位Unicode码点，不是UTF-16索引；拼接全部text必须等于原文。report中的source_mapping_pass、wrapped_segments记录验收结果。浏览器window.__displayMap提供同样映射。

## 材质与层级（3.0.0）

- `panelCard(x,y,w,h,r,fill,strength,glow)`：外投影（`blur 26×strength / offsetY 10×strength`，传 `glow` 时改为彩色发光）+ 顶亮 7% + 底暗 32% + 1.2px 内描边。
- 层级：终端窗口 `1.2`、首张统计卡 `0.95`、其余统计卡 `0.72`；关键行警示卡用 `glow=高亮色` 走发光分支。
- 进度条（安装进度、统计卡小条）都带 `shadowBlur`，端点亮斑让"正在推进"看得见。
- 阶段条是节点轨道：圆点 + 已过段描线 + 当前点发光 + 光环。
- 圆角统一 `squirclePath()`；`appearance` 只有深色系，**不要给这个技能配浅色**。
