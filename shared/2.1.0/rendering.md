# 共同渲染接口

已有配置和场景时间轴保持原含义。渲染器增加以下可选参数：

- `--frames 120:240`：只导出原时间轴第120至239帧，右端不包含；输出为120帧，动画仍从原时间120/fps秒求值。不要为了导出局部而移动配置中的事件时刻。
- `--preview-frames 0,120,239`：在对应`_source`中导出指定原时间轴帧的PNG，可配合`--check-only`只检查和出图。指定帧段时自动保存区间首尾帧。
- `--profile bt709`：默认。以浏览器RGB PNG作为输入，真正转换为有限范围BT.709，输出H.264/yuv420p，MP4时间基1/90000。保留配置已有的分辨率和帧率，不把竖屏强制改成横屏。
- `--profile legacy`：保留此前JPEG输入的编码方式，适合需要对照旧输出的任务。可能输出全范围 yuvj420p，不保证统一色彩标记；默认 BT.709 仍严格限定 yuv420p 与有限范围。

在仓库根目录导出 002 的局部镜头并保存中间关键帧。

```powershell
python skills/002-flow-motion-render/scripts/render_flow.py --config skills/002-flow-motion-render/assets/examples/showcase-amber.json --output output/flow-review.mp4 --frames 120:240 --preview-frames 180
```

原有`--check-only`仍会检查完整场景逻辑，局部导出不会绕过场景验收。离线HTML保留完整时间轴，MP4只包含所选区间；报告明确区分`source_frames`、`frame_range`与导出`frames`，记录输入和视频SHA-256。

编码在独立任务缓存目录完成，检查尺寸、帧数、帧率、色彩标记、PTS连续性及完整解码后，再原子替换指定输出。失败不发布待编码文件。默认不覆盖已有输出；同名更新仍须显式`--overwrite`。失败缓存路径来自每次运行的独立任务，不要清理其他任务目录。

`scripts/motion_render.py`是随技能分发的共同运行模块，技能可独立复制使用，不依赖外部兄弟技能。不要单独改某个副本；维护时从公共源码分发并检查副本哈希。

局部MP4是审看/替换素材，不能假定任意边界都可无损接回旧片。拼接旧码流要另行核对关键帧、受影响转场、编码格式和PTS；需要重新编码时明确记录。合成后仍须完整解码并查看接缝。

## 透明通道 `--alpha`（2.1.0 起）

001 和 002 支持透明叠加。输出文件使用 `.webm` 并传 `--alpha`。浏览器清除铺满画布的背景后采集 RGBA，FFmpeg 以 `libvpx-vp9` 编码。宿主背景会透过聊天面板或流程卡片之间的空隙。普通导出使用 `.mp4`。

`--alpha-clear "#root,.stage"` 可指定额外的 CSS 背景容器。请选背景层，保留需要显示的聊天面板和卡片。`--preview-frames` 在透明模式下保存 RGBA PNG。

FFprobe 可将含透明通道的 VP9 报为 `yuv420p`。渲染器核对 `alpha_mode=1`、编码时长、帧数、时间戳和完整解码，并用 VP9 解码器读取导出片段的首帧透明度。`report.json` 记录 `alpha_min`、`alpha_max` 和 `alpha_effective`，其中 `alpha_effective: true` 表示该帧包含可透出底图的像素。
