# 手机界面动效配置

UTF-8 JSON（兼容 BOM）。文件路径以配置文件所在目录为基准；支持本地 PNG、JPEG、WebP、SVG。外部 HTTP(S) 请求在渲染时禁用，SVG 的外部依赖需预先内嵌。

## 最小例子

```json
{
  "theme":"claude",
  "display":{"mode":"phone"},
  "messages":[
    {"role":"user","text":"帮我把这个概念讲清楚。","inputAt":0.3,"at":2},
    {"role":"assistant","text":"可以。我们先看现象，再解释原因。","thinkingAt":2.6,"at":3.5,"typeDuration":3}
  ],
  "lock":{"at":8,"wakeAt":8.8,"time":"9:41","date":"星期五，11月13日"},
  "notifications":[
    {"at":9.5,"text":"我整理好了三个要点。"},
    {"at":12,"text":"还可以补一个生活中的例子。"}
  ]
}
```

所有时间都是**成片绝对秒数**。可省略 `duration`，程序按最后一段文字或通知计算结束时间；也可指定更长时长增加阅读停留。默认无声音。

## 六种界面风格

| theme | 模板特征 |
|---|---|
| `wechat` | 浅灰背景、联系人标题、头像、白色/绿色左右气泡、单行输入区 |
| `chatgpt` | 白色背景、左侧标题、圆角用户消息、开放回答区、浅灰输入框 |
| `gemini` | 蓝紫星形示意图标、淡蓝回答区、工具输入区 |
| `deepseek` | 蓝色鲸形示意图标、开放回答区、深度思考/联网功能区 |
| `kimi` | 深色模板、K 示意图标、薄荷绿强调色、深色输入区 |
| `claude` | 米白背景、橙色放射图标、衬线标题、灰米色用户消息 |

锁屏与通知卡片是共用的 iOS 风格模板，不随应用主题变成六种系统锁屏。内置图标为程序示意，精确品牌图可配置本地 `app.icon` 或逐条通知 `icon`。微信联系人头像和应用图标是不同参数。

## 画布与全屏/手机外框

- `width`, `height`：默认 1080×1920，均为不小于 320 的偶数；可用 1920×1080 横屏外框模式。
- `fps`：24 / 25 / 30 / 60，默认 30。
- `duration`：可省略，自动给最后事件留时间；显式值不可截断文字或通知。

`display`：

| 参数 | 默认 / 含义 |
|---|---|
| `mode` | `phone` 或 `fullscreen` |
| `center` | `[0.5,0.5]`，手机中心在整张画布上的归一化坐标，仅 phone 使用 |
| `phoneHeight` | 外框总高度（输出像素），缺省自动适配；宽度保持手机比例 |
| `notch` | true，状态栏中显示黑色岛形区域；全屏可设 false |
| `caption` | 默认为空；phone 模式可在画布底部放一行说明 |

全屏界面铺满竖屏画布并按其高度重排，不加金属外框；要求画布高宽比至少 1.4。手机外框保留固定屏幕比例，允许在横屏背景中放在左/右侧。位置超出画布会报错。外框模式底部说明要与手机留出距离，默认位置可容纳短说明。

## 三处背景

`background` 为手机外的画布背景；`wallpaper` 为锁屏壁纸；`chatBackground` 可覆盖聊天区背景，缺省使用应用主题。

```json
"background":{"type":"solid","color":"#eceee8"},
"wallpaper":{"type":"image","src":"assets/wallpaper.jpg"},
"chatBackground":{"type":"gradient","colors":["#faf8f2","#e9eee7"]}
```

类型为 `solid` / `gradient` / `image`；渐变至少两个颜色；图片按 cover 显示，重要主体需视觉核对。全屏没有外围空白，因此画布 background 不可见；聊天背景与锁屏壁纸仍生效。图片不会自动去除原有文字或水印。当前版本输出不透明 MP4，不提供透明视频。

## 状态栏、应用和文字

`status`：`show`（默认 true）、`time`（默认 `9:41`）、`battery`（0–1，默认 .85）。

`app`：

- `name`：默认应用名，供本应用通知使用。
- `title`：聊天页标题，微信默认“科普助手”，AI 默认应用名。
- `model`：输入区的小标签；空字符串使用主题默认。ChatGPT 模板不显示模型标签。
- `icon`：可选本地应用图标，用于聊天品牌位置；通知图标可逐条设置。
- `userName` / `assistantName`：微信头像文字，默认“我”/“助手”。
- `userAvatar` / `assistantAvatar`：可选本地头像图片，仅微信模板显示。

`labels` 可覆盖：`placeholder`（输入框提示）、`greeting`（AI 空白页欢迎语）、`thinking`、`unlock`（锁屏底部）、`send`（微信发送按钮）。微信不显示 AI 欢迎语。

`style`：`fontSize`（22–46，默认 32）、`lineHeight`（默认 1.6）、`accent`（强调色）、`chatBackground`（简单背景颜色，可改用顶层 chatBackground 配置图片）。字号使用统一的屏幕逻辑单位，输出会按尺寸缩放。超长内容应拆分而不是继续缩小。

## 对话 `messages`

```json
{
  "role":"user",
  "text":"这段内容应该怎样讲？",
  "inputAt":0.5,
  "at":2.5,
  "mode":"pop",
  "keyboard":true
}
```

| 字段 | 规则 |
|---|---|
| `role` | `user`（右侧）或 `assistant`（左侧/回答区） |
| `text` | 必填，支持换行、中文、英文及常见组合 emoji |
| `at` | 消息开始出现在对话区的时刻 |
| `mode` | `pop` 整条弹出 / `type` 逐字；默认 user 为 pop、assistant 为 type |
| `cps` | 逐字速度，默认 15，标点另有停顿 |
| `typeDuration` | 可选，覆盖逐字总时长，标点权重仍保留 |
| `inputAt` | 可选，仅 user + pop；从此时在输入框逐字输入，到 at 时发送。输入时长自动适配这段时间 |
| `keyboard` | inputAt 时是否显示键盘，默认 true |
| `thinkingAt` | 可选，仅 assistant；从此时显示思考提示，at 时开始回复 |

消息按 at 升序填写，下一条不应早于上一条文字完成；输入和思考也不能提前覆盖上一条。整条弹出按 .48 秒入场计算。阅读停留通过增大下一条 at、lock.at 或 duration 实现。

对话过长时自动滚动，滚动取决于时间而非上次播放位置。单条消息超过一屏会报错，按原句界拆成同角色连续消息。长输入框只显示末尾行，完整文字发送后保留在消息中。当前只绘制普通文本，不渲染 Markdown 表格、图片附件或代码高亮。

## 熄屏和锁屏

`lock: null` 或省略：全程聊天。`messages: []` 且 `lock:{"at":0,"wakeAt":0}`：直接从锁屏开始。

- `lock.at`：开始熄屏；不得截断最后一条对话。
- `lock.wakeAt`：亮起锁屏，默认 at + .8；可与 at 相同，表示直接切换。
- `lock.time`：锁屏大时钟，默认跟随 status.time。
- `lock.date`：日期字符串，可任意指定演示日期。
- `lock.textColor`：锁屏时钟/状态文字颜色，默认浅色；浅壁纸可改深色。

本版支持一次聊天→锁屏转换；不模拟真实后台状态或点击通知回到 App。

## 通知 `notifications`

```json
{
  "kind":"lock", "at":12,
  "theme":"wechat", "app":"微信",
  "text":"小林：资料已经发给你了。",
  "timeLabel":"刚刚"
}
```

- `kind: lock`（默认）：锁屏卡片，at 至少为 wakeAt + .3，按时间顺序堆叠。卡片根据文字自动增高；超出空间时旧卡片向上移出，最新通知保留。
- `kind: banner`：聊天界面顶部横幅，`hold` 为显示秒数，默认 3，最低 .6；不可跨过熄屏时刻。
- `at`：进入时刻，通知数组按 at 排序。
- `text`：消息正文，自动换行，超高卡片会报错。
- `theme`：通知图标风格，可与当前聊天应用不同。
- `app`：应用或发送方展示名称。
- `icon`：可选本地精确图标。
- `timeLabel`：默认“现在”，可改“刚刚”“1 分钟前”等。
- `until`：lock 通知可指定退出时刻；不填则保持到结束。banner 使用 at+hold。

顶部横幅同一时刻通常安排一条；重叠时后项覆盖前项。锁屏卡片支持多条，进入有轻微回弹，退出短淡出。给观众留阅读时间，不能用大量快速弹入替代信息表达。

## 输出与限制

源目录中的 `input.json` 保留原参数，`resolved.json` 含展开的文字时间表；`media/` 是本次本地素材副本，`assets.json` 记录源路径和 SHA-256。不要直接编辑展开的字符时间表，修改原始配置后重渲。

不调用六款应用的 API，不发送真实通知，不依赖账号登录。界面和示意图标不是最新 App 版本的精确声明。正式视频内是否标明“示意”按任务语境处理，不能冒充真实平台操作或真实实验记录。


## 上半部特写与硬件样式（v02）

`display.framing` 默认 `full`，完整机身须在安全区域内。`top` 允许机身底部出画，但机身顶部和左右边缘仍须在安全区域内；横竖位置继续使用原 `center` 和 `phoneHeight`。不支持把手机顶部、左右侧随意切掉。

`display.safeArea: [x,y,width,height]` 使用输出像素坐标，默认整个画面；设备和屏幕在这个区域内裁切，可为外部字幕条保留底部空间。特写按真正可见的屏幕高度计算聊天滚动，最新完整消息与操作区需落在范围内。聊天至少保留620个逻辑屏幕像素；锁屏至少710个，超高消息/通知仍会被拒绝。

`display.composer` 完整构图默认true、特写默认false。隐藏输入框时，不可使用 `inputAt`，可用用户消息的 `mode:type` 在气泡内输入。特写配合显式输入框时应设置 `keyboard:false`，不把全键盘塞进半截手机。

`display.hardware`：
- `finish`: `classic`（默认，保留旧样式）、`graphite`、`titanium`、`silver`。
- `buttons`: true（默认），false可隐藏侧键。
- `camera`: `pill`（默认）、`island`、`none`。原 `notch:false` 仍可整体关闭。

`style.appearance: amber-night` 提供深底、白字和琥珀强调色；若未显式设置画布背景，也切换为#323232。`style.palette` 可分别覆盖 `bg/ink/muted/accent/user/answer/input`，颜色用#RRGGBB，answer可为null。保留六种应用的界面结构，主题与硬件材质独立。

参见 `assets/examples/half-phone.json`。默认配置未开启上述能力时，旧完整手机的布局与外观保持。
