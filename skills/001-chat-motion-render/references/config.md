# 配置与导出

输入采用 UTF-8 JSON，兼容 BOM。最小示例：

```json
{
  "theme": "wechat",
  "mode": "pop",
  "title": "一个好问题",
  "messages": [
    {"side": "right", "name": "小林", "text": "为什么要先把问题拆开？"},
    {"side": "left", "name": "讲解员", "text": "因为每次只理解一个重点，会更清楚。", "mode": "type"}
  ]
}
```

| 字段 | 取值 / 默认 | 用途 |
|---|---|---|
| ui | 可省略，显式填写时仅接受 modern | 使用当前七套 UI |
| theme | apple / wechat / whatsapp / claude / chatgpt / x / gemini；默认 wechat | 界面 |
| appearance | light / dark；默认 light | 七套界面均支持浅深色 |
| aspect | portrait / landscape；默认 portrait | 1080×1920 或 1920×1080 |
| mode | type / pop；默认 pop | 无光标逐字输入或整条弹出 |
| title | 默认 对话记录 | 画面上方标题 |
| chatTitle | 可省略 | 聊天窗口顶部标题，默认依界面而定 |
| cps | 正数；默认 15 | 每秒字素数，标点另加停顿 |
| readHold | 非负秒数；默认 0.55 | 逐字结束后的停留 |
| popHold | 非负秒数；默认 1.45 | 弹出后的最短停留，自动与字数/8取较大值 |
| tail | 非负秒数；默认 1.2 | 末尾额外停留 |
| duration | 可省略 | 最短总时长，不截断消息或尾部停留 |
| dateLabel / timeLabel | 默认 今天 / 09:41 | 聊天界面的日期与时间示例文字 |
| userLabel | 默认 我 | Gemini 右上角用户标记 |
| modelLabel | 默认依界面而定 | Claude / Gemini 输入区的模型或模式标签 |
| eyebrow / showLabels | 默认空字符串 / false | 辅助标签，默认不显示 |
| messages | 非空数组 | 按顺序填写 |

每条消息：
- `side`（left/right）与非空 `text` 必需；`name`、`avatar`（文字）可选。
- `mode`、`cps` 可逐条覆盖；`hold` 指定该条阅读停留，`start` 指定绝对起始秒数。不指定时自动接续。
- `time` 可覆盖 WhatsApp 消息时间或 X 主帖时间。
- X 可配置 `handle`、`replyTo`、`age`；省略 replyTo 时回复上一条。`views`、`replies`、`reposts`、`likes` 可填写非负整数或展示文字，未给定时不编造互动数字。

显式 start 的入场间隔至少 0.5 秒，并且不能早于上一条逐字结束。长回答可拆为同一侧连续多条消息；长对话自动滚动。输入文本以文本节点或转义方式显示，不能注入 HTML。不得把界面中的示例日期、账号、状态与互动数当作真实记录。

七套示例：`assets/examples/apple.json`、`wechat.json`、`whatsapp.json`、`claude.json`、`chatgpt.json`、`x.json`、`gemini.json`。它们使用同一组四条对话和起始时间，便于切换 type/pop 对照。`basic.json` 演示逐条混用。

逐字输入不显示光标。消息内容、时间轴与界面风格可独立配置。

导出参数：
- `--config` 输入 JSON，`--output` 输出 MP4，输出必须在技能目录外。
- `--fps 24` 或 `--fps 30`。
- `--check-only` 只生成源文件、关键帧和检查报告。
- `--overwrite` 覆盖明确指定的输出及对应生成源文件；不递归删除其他内容。
- `--chrome`、`--ffmpeg` 显式指定本机程序，ffprobe 应位于 ffmpeg 同目录。
- `--frames`、`--preview-frames`、`--profile` 见 rendering.md。

输出旁 `_source/` 包含 HTML/CSS/JS、输入配置、字体、OFL.txt、contact.jpg 与 report.json，可离线预览。永久改动应编辑 JSON 并重新渲染。视频为无声音轨的 H.264 MP4，默认有限范围 BT.709；没有音效参数。
