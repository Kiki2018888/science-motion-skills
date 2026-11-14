# 配置字段

输入 UTF-8 JSON；参考 `assets/examples/` 三个可运行示例。未填写字段使用默认值。长度以 1920×1080 设计画布的像素计，最终随分辨率整体缩放。时间均为视频起点后的秒，区间 `[at, until)`。数组按发生顺序填写。

## 画布、配色、文字与时间轴

| 字段 | 含义 / 默认值 |
|---|---|
| `width,height` | 1920,1080；偶数，360–3840，比例 16:9 |
| `fps,duration` | 24、28 秒；帧率 24/25/30/60，总时长 1–1800 秒 |
| `layout` | `dashboard`；或 `map/calendar/magnitude/cracks/wave` 独立构图 |
| `theme` | CSS 颜色：`bg,panel,line,ink,muted,accent,gold,signal,land,coast,dots,grid,calendar,calendarHeader,calendarInk,calendarMuted` |
| `timeline.fadeIn,fadeOut` | 开场/片尾淡变，默认 .7/.8 秒；0 可关闭 |
| `timeline.phases` | `[{"at":0,"text":"信号苏醒"},…]`；顶栏阶段文字，可空 |

`text` 所有字段为字符串，可用空串隐藏。可配：

- 顶栏 `title,subtitle,online,hold`。
- 地图 `mapTitle,mapSubtitle,waiting,detected`。
- 日历 `calendarTitle,calendarLabel,calendarFooter,calendarNote,calendarUnit`（角标默认 MONTH）。
- 波形 `waveTitle,waveSubtitle,waveLive,waveHold`。
- 页脚 `footerLeft,footerRight`、数值状态 `rising,locked`。

模块内事件、数值、徽章、裂缝各有自己的文字字段。画面没有自动翻译，也不会据主题自动修改这些文字。

## `wave` 波形

`show:true`、`noise:1`（0–10）、`speed:130`（20–1000 像素/秒）、`maxAmplitude:74`（1–75）、`lineWidth:2.5`、`glow:8`、`wake:.7`（苏醒时长，0 立即显示）。波形由确定性的基础噪声和脉冲叠加，振幅软限制在面板内。

`pulses:[{"at":7.1,"amplitude":52,"width":.22,"frequency":45}]`：每项控制发生时刻、振幅 0–500、包络宽度 .03–4 秒、振荡角频率 2–150。`at` 是脉冲中心到达波形右端的全局时刻；包络有渐入，不是硬触发开关。

`holds:[{"at":12.2,"until":15.3}]`：冻结波形滚动，结束后连续恢复。多个暂停段必须顺序且不重叠。脉冲中心不能设在冻结区间内。归一化时将全局 `at` 转换为内部 `clockAt`，使用者不要手填 `clockAt`。

## `map` 底图与事件

`show:true`；`kind:"schematic"` 默认原创世界轮廓，或 `kind:"image",src:"map.svg"`。图片支持 PNG/JPEG/WebP/SVG，相对 JSON 路径，按 1160×430 铺满；预先准备此比例可避免变形。SVG 应自包含，渲染时阻断 HTTP 请求。

`bounds:[-180,180,-63,82]` 表示西、东、南、北，使用等距经纬映射。自定义图片不需要地理含义，直接用归一化位置。`grid:true` 控制底网格；`scanAt:.5,scanDuration:5` 控制扫描，时长 0 关闭。

`events` 支持多项同时显示：

```json
{"id":"source-01","at":6.5,"until":20,"lon":15,"lat":49,
 "label":"信号源 01","subtitle":"EVENT DETECTED","color":"#ff654e",
 "rings":4,"ringInterval":0.43,"ringDuration":3.1,"radius":278,
 "pointSize":6,"offset":[80,-60]}
```

可用 `position:[x,y]` 替代 `lon,lat`，范围 0–1，原点在底图左上；二者同时出现时 position 优先。`until` 默认片尾。`rings` 为 0–12；`ringInterval` 是各圈启动间隔，`ringDuration` 是单圈扩散时间，`radius` 最大扩散量，`pointSize` 定位点半径。`offset` 是标签相对事件位置的偏移；靠边标签会自动限位，标签间仍需人工排布。稳定且唯一的 `id` 用于状态验收。

## `calendar` 月份

`show:true,year:2026,month:1,flipDuration:.62,markers:[1,2,3,4,5,6]`。
`changes:[{"at":4,"month":2},{"at":10,"month":1,"year":2027}]`。

允许前进、倒序、跳月、跨年。未填写 year 时继承前一项年份，不自动根据月份推断年份。月份 1–12，年份 1–9999；翻页不能重叠或超出片尾。`markers` 最多 12 个，空数组隐藏；仅高亮当前月。

## `magnitudes` 数值与震级

数组，每项 `at,value` 必填；其余：`from:0,rise:1.6,hold:3.2,fade:.4,decimals:1,unit:"级",title:"主震强度",subtitle:"DEMONSTRATION",color`。

从 `at` 开始递增或递减，经过 `rise` 秒锁定目标值，停留 `hold` 秒，再经 `fade` 秒淡出。数值 0–999999，小数位 0–3。显示精度与 value 要一致，例如震级 8.8 用一位小数、96% 用零位。内部 `lockAt,until` 自动生成。

多段数值不能重叠，不能与裂缝段重叠；独立 `magnitude` 构图也必须提供至少一项。

## `badges` 徽章

每项：`at` 必填，`until` 默认片尾；`duration:.42` 控制落印，`text,subtitle,color` 控制内容，`shape:"box"|"circle"`，`center:[1070,534]`，`angle:-7.5`（度，-25–25），`flash:.13`（0–.2，0 关闭闪光）。

独立于数值段，按自己的时间出现/退出。center 在主面板设计坐标内，x 400–1150、y 360–650；大幅进入时会超出静态轮廓，需检查邻近元素。方章文字建议不超过七个汉字，圆章建议四至六个。`calendar/wave` 独立构图不显示徽章。

## `cracks` 裂缝

`show:false`，开启后配置 `at,duration,until,fade,title,subtitle,color,coreColor,width,glow,grid`。默认生长时长 5.2 秒、淡变 .7 秒、描边宽度 3.1、辉光 20。`until >= at+duration`；建议完成后至少保留 1 秒再淡出。

`paths` 空数组使用原样片七条连通裂缝；自定义 1–60 条路径：

```json
[{"id":"main","points":[[0.5,0.95],[0.46,0.72],[0.52,0.5],[0.55,0.12]]},
 {"id":"branch","parent":"main","points":[[0.46,0.72],[0.3,0.65],[0.08,0.45]]}]
```

点为 0–1 归一化坐标，映射到主面板 x=120…1360、y=320…800。顶部邻近标题，编排时留出文字空间。父路径必须先出现，子路径首点必须等于父路径的某个顶点，不能在最后终点才分叉。每段至少两个不同点。引擎按长度绘制，在父路径抵达连接点后才启动子分支；`start,lengths` 是内部派生字段。

## 输出

`--check-only` 仍会生成可复现源包和检查图，但不编码视频；不代表成片已导出。编码不落地帧序列。`--overwrite` 只替换目标视频与源包同名文件，不清空其他目录。最终检查 `report.json` 的 `encoded` 与 `full_decode_pass`，勿把检查阶段的报告当成成片报告。
