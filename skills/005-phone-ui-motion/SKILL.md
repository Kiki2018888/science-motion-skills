---
name: 005-phone-ui-motion
description: 将对话与通知制作成手机界面动效视频，支持微信、ChatGPT、Gemini、DeepSeek、Kimi、Claude 六种风格，全屏、完整手机或半截手机特写，可选金属边框、镜头岛和暗夜配色，支持逐字输入与回复、键盘、锁屏和通知堆叠。适用于手机聊天、AI 对话、锁屏消息和应用界面示意；不操作真实 App，不发送真实消息。
---

# 手机聊天与通知动效

使用随附的 Canvas 模板生成可离线预览 HTML 和静音 H.264 MP4。保留用户认可的手机外框、聊天→熄屏→锁屏→通知的结构，并支持聊天单独使用、锁屏单独使用及顶部通知。

**v3.0.0**　手机金属边框增加斜向反光，玻璃屏幕增加柔光反射。琥珀暗夜配色覆盖对话、键盘和型号标签。

代表样片配置　[琥珀暗夜竖屏](assets/examples/showcase-amber.json) · [浅色竖屏](assets/examples/showcase-light.json)

## 选模板与准备配置

先读 [参数说明](references/config.md)。按用户指定主题选择 `assets/examples/` 中的 `wechat.json`、`chatgpt.json`、`gemini.json`、`deepseek.json`、`kimi.json` 或 `claude.json`；另有全屏、横屏嵌入和自定义背景示例。

- `display.mode: fullscreen`：竖屏界面铺满画布。
- `display.mode: phone`：带手机外框，支持横竖画布，位置与尺寸可调。
- `display.framing: top`：上半部特写，允许机身下方出画；按实际可见区域滚动消息。参考 `half-phone.json`，重要文字仍须完整可读。
- `display.hardware` 可选机身材质、侧键与镜头岛；`style.appearance: amber-night` 是可选暗夜主题，默认仍沿用各应用原配色。
- 六套模板有各自标题栏、消息呈现、输入框和配色：微信为头像+气泡，AI 主题为各自风格的回答区和功能区；锁屏共用 iOS 风格结构。

这些是风格化重绘与示意图标，不声称是对应 App 最新版本的像素级复制。若用户要求特定版本的精确 UI，使用其截图校准模板，品牌图标可通过本地图片替换。不要仅改应用名称就声称完成新风格。

保留用户给出的对话措辞及角色。超长单条超过一屏时按原句界拆分为连续消息，不缩成不可读的小字，也不擅自删内容。依已有配音时长安排消息时刻，确保读完再锁屏或结束。未要求声音时保持静音，不调用外部模型或语音服务。

## 执行

依赖 Python 3.10+、Playwright Python、Pillow、本机 Chrome、FFmpeg / ffprobe；使用独立虚拟环境，不将依赖目录放入技能包或输出目录。

```powershell
python -B -X utf8 '<技能目录>\scripts\render_phone.py' --config '<工作目录>\config.json' --output '<工作目录>\phone.mp4' --check-only
```

检查 `phone_source/index.html`、`contact.jpg` 和 `poster.png`。正式导出去掉 `--check-only`；对同名输出及其生成源目录进行更新时显式加 `--overwrite`。可用 `--chrome <exe>`、`--ffmpeg <exe>` 覆盖当前机器的默认路径；`--scale 1|2` 控制采集倍率，默认原生分辨率。

全屏应使用竖屏画布；横屏视频选择手机外框嵌入。背景图按覆盖裁切，不变形；重要主体先在预览里确认位置。

## 验收和交付

脚本核验消息显示完整、锁屏与通知顺序、超高文字块、乱序跳帧像素一致性，以及视频尺寸/帧数和完整解码。视觉上还需检查：六种风格是否可辨、长对话最新消息有无被输入框遮住、头像/图标是否清楚、通知换行和堆叠是否合理、全屏模式的安全边距。

输出旁 `_source` 保存原始配置、展开配置、网页、字体及许可、复制素材与摘要清单、关键帧和报告。本项目输出统一放 `output/005-phone-ui-motion/`，技能安装目录保持只读。中间帧经管道编码，不生成海量 PNG 序列。

接口：`window.__dur`、`await window.__seek(t)`、`window.__inspect()`。字体显式预载；缓存静态背景与手机外框；每帧重置画布状态并使用固定渲染方式，保持任意定位一致。修改这些逻辑后要复查跳帧，不要只看顺序播放。


## 局部预览与统一编码

需要只改某一段、查看指定关键帧或对齐成片色彩时，读 [共同渲染接口](references/rendering.md)。支持 `--frames START:END`、`--preview-frames` 和 `--profile bt709|legacy`，默认统一BT.709；原配置中的时间仍为完整场景时间。


## Portable runtime

需要 Python 3.10+、Playwright、Pillow、Chrome/Chromium 与 FFmpeg/ffprobe。自动查找 PATH 和常见安装位置；也可传 `--chrome` / `--ffmpeg`，或设置 `CHROME_BIN` / `FFMPEG_BIN`。输出必须位于技能目录之外。

默认样片在 Canvas 内绘制整幅背景。`--alpha` 可导出 VP9 WebM，实际透明范围见导出报告的 `alpha_min` 和 `alpha_max`。
