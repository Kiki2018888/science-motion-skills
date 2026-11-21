# 渲染输出

在技能目录中运行下列命令可检查并导出代表帧。

```sh
python scripts/render_paper.py --config assets/examples/magnet.json --check-only --output review.mp4 --preview-frames 0,44,170
python scripts/render_paper.py --config assets/examples/magnet.json --output detail.mp4 --frames 96:156 --html full-film.html
```

第一条命令将 PNG 写到指定视频同目录，例如 `review_f000044.png`。第二条命令导出原时间轴第 96 至 155 帧，还会保存区间首帧和末帧。离线 HTML 始终包含完整时间轴。

默认编码为 30 fps 的 H.264 / yuv420p、BT.709 有限范围。渲染器在临时目录编码，核对帧数、色彩标记、PTS 连续性并完整解码通过后替换目标视频。同名覆盖需要 `--overwrite`。渲染结束会释放本次临时文件。

在其他机器使用时需要 Playwright 的 Python 包和 Chromium 或 Chrome。渲染 MP4 时将 FFmpeg 加入 PATH，或传 `--ffmpeg` 指定，ffprobe 放在其同目录。技能随附的字体采用 [SIL OFL 1.1](../assets/template/OFL.txt)，离线 HTML 内嵌相同许可。
