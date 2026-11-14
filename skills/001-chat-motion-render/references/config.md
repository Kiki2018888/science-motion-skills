# 配置与导出

配置采用 UTF-8 JSON；脚本兼容 BOM。最小可用示例：

```json
{
  "aspect": "portrait",
  "theme": "wechat",
  "mode": "pop",
  "title": "一个好问题",
  "messages": [
    {"side": "right", "name": "小林", "avatar": "林", "text": "为什么要先把问题拆开？"},
    {"side": "left", "name": "讲解员", "avatar": "答", "text": "因为每次只理解一个重点，会更清楚。", "mode": "type"}
  ]
}
```

全局字段：

| 字段 | 取值 / 默认 | 用途 |
|---|---|---|
| aspect | portrait / landscape；默认 portrait | 画幅 |
| theme | wechat / claude / chatgpt / minimal；默认 wechat | 界面 |
| mode | pop / type；默认 pop | 消息动作 |
| title | 短标题；默认 对话记录 | 视频上方标题 |
| chatTitle | 可省略 | 对话框顶部名称；默认各样式名称 |
| eyebrow | 可省略；默认空字符串 | 标题上方小字 |
| showLabels | 默认 false | true 时额外展示动效标签及示例说明；正式视频通常 false |
| cps | 正数；默认 15 | 逐字速度，每秒字素数，标点另加停顿 |
| readHold | 非负秒数；默认 0.55 | 打完后的阅读停留 |
| popHold | 非负秒数；默认 1.45 | 弹出后最短停留；自动取它与字数/8中的较大值 |
| tail | 非负秒数；默认 1.2 | 片尾额外停留 |
| messages | 非空数组 | 必需，按顺序填写 |

消息字段：`side`（left/right）、`text`（非空字符串）必需；`name`、`avatar`（文字）可选，头像暂不接受图片 URL。`mode`、`cps` 可逐条覆盖；`hold` 直接指定阅读停留秒数；`start` 为绝对起始秒数。

显式 start 不应使两条入场间隔小于 0.5 秒，也不应在上一条逐字输入结束前启动下一条；不设置时自动接续。增加 hold 可放慢快节奏对话，减少 hold 需保留可读性。同一侧连续多条消息可表达长回答，无须伪造角色轮换。

文本按 JSON 编码，不拼接到 shell 命令。可含换行、引号和中英文；文字使用 textContent 插入页面。

渲染器参数：
- `--config` 输入 JSON；`--output` 输出 MP4。
- `--fps 24` 或 `--fps 30`。
- `--check-only` 只生成源文件、排版截图和检查报告，不编码视频。
- `--overwrite` 允许覆盖明确指定的既有视频及其同名 source 目录中的生成文件，不递归删除。
- `--chrome` / `--ffmpeg` 用于指定本机程序；ffprobe 应与 ffmpeg 同目录。

每个输出旁边生成 `<文件名>_source/`，含 input.json、dialogue.js、HTML/CSS/JS、字体和 OFL.txt、contact.jpg、report.json。双击 index.html 可预览及临时改文案；永久修改应编辑输入 JSON 再重渲。渲染中间视频先写到 source 内，完整验收通过才移动到最终 MP4 路径。
