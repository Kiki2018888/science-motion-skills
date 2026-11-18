"""Portable frame-range rendering and verified H.264 or transparent VP9 export.

This file is distributed unchanged inside each skill to keep it self-contained.
"""
from pathlib import Path
import hashlib
import json
import math
import os
import re
import shutil
import subprocess
import tempfile
import uuid

VERSION = '2.1.0'


def add_arguments(parser):
    parser.add_argument('--frames', metavar='START:END', help='Original timeline frames, start inclusive and end exclusive')
    parser.add_argument('--preview-frames', metavar='N,N,...', default='', help='Original timeline frames to export as PNG')
    parser.add_argument('--profile', choices=['bt709', 'legacy'], default='bt709', help='BT.709 limited-range export (default), or previous JPEG-based encoding')
    parser.add_argument('--alpha', action='store_true', help='Export transparent WebM (VP9 + alpha) instead of opaque H.264')
    parser.add_argument('--alpha-clear', metavar='SELECTORS', default='', help='Extra comma-separated CSS selectors whose background is cleared in alpha mode')


def require(value, message):
    if not value:
        raise ValueError(message)


def digest(path):
    h = hashlib.sha256()
    with Path(path).open('rb') as f:
        for block in iter(lambda: f.read(1048576), b''):
            h.update(block)
    return h.hexdigest()


class RenderPlan:
    def __init__(self, args, duration, fps, width, height, source, input_file):
        self.fps, self.width, self.height = fps, width, height
        self.total = math.ceil(duration * fps - 1e-9)
        require(self.total > 0, 'The source timeline must contain at least one frame')
        self.start, self.end = 0, self.total
        if args.frames:
            match = re.fullmatch(r'(\d+):(\d+)', args.frames)
            require(match, '--frames must be START:END, using nonnegative integers')
            self.start, self.end = map(int, match.groups())
            require(0 <= self.start < self.end <= self.total, f'Frame range must satisfy 0 <= START < END <= {self.total}')
        self.count = self.end - self.start
        self.indices = range(self.start, self.end)
        self.source = Path(source)
        self.profile = args.profile
        self.config_hash = digest(input_file)
        self.previews = []
        requested = args.preview_frames.split(',') if args.preview_frames else []
        require(all(re.fullmatch(r'\d+', f) for f in requested), '--preview-frames must contain comma-separated nonnegative integers')
        self.preview_frames = sorted(set(map(int, requested)))
        require(all(f < self.total for f in self.preview_frames), f'Preview frames must be less than {self.total}')
        if args.frames:
            self.preview_frames = sorted(set(self.preview_frames + [self.start, self.end - 1]))
        key = hashlib.sha256((str(self.source.resolve()) + self.config_hash).encode('utf-8')).hexdigest()[:14]
        # LOCALAPPDATA is stable across Windows shell invocations; uuid isolates simultaneous jobs.
        cache_base = Path(os.environ['LOCALAPPDATA']) / 'Temp' if os.environ.get('LOCALAPPDATA') else Path(tempfile.gettempdir())
        self.alpha = bool(getattr(args, 'alpha', False))
        self.alpha_clear = getattr(args, 'alpha_clear', '') or ''
        self._prepared = False
        self.cleared_backgrounds = []
        self.job = cache_base / 'science-motion' / (key + '-' + uuid.uuid4().hex[:10])
        self.pending = self.job / ('render.pending.webm' if self.alpha else 'render.pending.mp4')

    def metadata(self):
        return dict(render_runtime=VERSION, encoding_profile=self.profile,
                    alpha=self.alpha, alpha_suffix='vp9-yuva420p-webm' if self.alpha else 'h264-yuv420p-mp4',
                    alpha_cleared=list(getattr(self, 'cleared_backgrounds', [])),
                    source_frames=self.total, source_duration=self.total / self.fps,
                    frame_range={'start_inclusive': self.start, 'end_exclusive': self.end},
                    frames=self.count, duration=self.count / self.fps,
                    duration_seconds=self.count / self.fps, original_timeline_preserved=True,
                    input_sha256=self.config_hash, preview_frames=self.previews)

    CLEAR_BG_JS = """
    () => {
      const w = innerWidth, h = innerHeight, cleared = [];
      const kill = (el, name) => {
        el.style.setProperty('background-color', 'transparent', 'important');
        el.style.setProperty('background-image', 'none', 'important');
        cleared.push(name);
      };
      kill(document.documentElement, 'html');
      if (document.body) kill(document.body, 'body');
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect();
        if (r.width >= w * 0.98 && r.height >= h * 0.98) {
          kill(el, el.tagName.toLowerCase() + (el.id ? '#' + el.id : ''));
        }
      }
      return cleared;
    }
    """

    def prepare_page(self, page):
        """Alpha 模式：把铺满视口的元素底色全部清掉，截图才有真实透明。"""
        if not self.alpha or self._prepared:
            return
        cleared = list(page.evaluate(self.CLEAR_BG_JS))
        extra = [x.strip() for x in self.alpha_clear.split(',') if x.strip()]
        if extra:
            page.add_style_tag(content=','.join(extra) + '{background:transparent!important;background-image:none!important;}')
            cleared += extra
        self.cleared_backgrounds = cleared
        self._prepared = True

    def export_previews(self, page):
        from PIL import Image
        import io
        self.prepare_page(page)
        for frame in self.preview_frames:
            page.evaluate('(t)=>window.__seek(t)', frame / self.fps)
            path = self.source / f'preview-{frame:07d}.png'
            screenshot = page.screenshot(type='png', omit_background=self.alpha)
            im = Image.open(io.BytesIO(screenshot)).convert('RGBA' if self.alpha else 'RGB')
            if im.size != (self.width, self.height):
                im = im.resize((self.width, self.height), Image.Resampling.LANCZOS)
            im.save(path)
            self.previews.append(dict(frame=frame, source_time=frame / self.fps, file=path.name, sha256=digest(path)))

    def capture(self, page):
        # PNG keeps the browser's RGB data intact before one explicit RGB-to-YUV conversion.
        self.prepare_page(page)
        if self.alpha:
            return page.screenshot(type='png', omit_background=True)
        return page.screenshot(type='png') if self.profile == 'bt709' else page.screenshot(type='jpeg', quality=96)

    def command(self, ffmpeg, threads=4):
        self.job.mkdir(parents=True, exist_ok=False)
        (self.job / 'job.json').write_text(json.dumps(self.metadata(), indent=2), encoding='utf-8')
        vf = f'scale={self.width}:{self.height}:flags=lanczos'
        if self.alpha:
            return [str(ffmpeg), '-y', '-v', 'error', '-f', 'image2pipe', '-framerate', str(self.fps), '-i', '-',
                    '-vf', vf + ',format=yuva420p,setsar=1', '-an', '-c:v', 'libvpx-vp9',
                    '-pix_fmt', 'yuva420p', '-b:v', '0', '-crf', '28', '-auto-alt-ref', '0',
                    '-row-mt', '1', '-threads', str(threads), str(self.pending)]
        options = []
        if self.profile == 'bt709':
            vf += ':out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=range=limited:color_primaries=bt709:color_trc=bt709:colorspace=bt709'
            options = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv']
        return [str(ffmpeg), '-y', '-v', 'error', '-f', 'image2pipe', '-framerate', str(self.fps), '-i', '-',
                '-vf', vf + ',format=yuv420p,setsar=1', '-an', '-c:v', 'libx264', '-threads', str(threads),
                '-preset', 'fast', '-crf', '18', '-pix_fmt', 'yuv420p', *options,
                '-video_track_timescale', '90000', '-movflags', '+faststart', str(self.pending)]

    def finish(self, ffmpeg, probe, dest, report):
        def run(command):
            result = subprocess.run([str(x) for x in command], capture_output=True)
            require(result.returncode == 0, result.stderr.decode('utf-8', errors='replace')[-4000:])
            return result
        probe_cmd = [probe, '-v', 'error', '-show_streams', '-show_format', '-of', 'json']
        if self.alpha:
            probe_cmd = [probe, '-v', 'error', '-count_frames', '-show_streams', '-show_format', '-of', 'json']
        data = json.loads(run(probe_cmd + [self.pending]).stdout)
        streams = data['streams']; v = streams[0]
        expect_codec = 'vp9' if self.alpha else 'h264'
        require(len(streams) == 1 and v['codec_type'] == 'video' and v['codec_name'] == expect_codec,
                'Expected one silent %s stream' % expect_codec.upper())
        frames_seen = int(v.get('nb_frames') or v.get('nb_read_frames') or 0)
        require((v['width'], v['height'], frames_seen) == (self.width, self.height, self.count), 'Encoded dimensions/frame count mismatch')
        # Legacy JPEG input may preserve full-range YUV, reported as yuvj420p by FFprobe.
        if self.alpha:
            # VP9 把 alpha 存在独立的 alpha 层，ffprobe 的 pix_fmt 仍报 yuv420p；以 alpha_mode 标记为准。
            require(str((v.get('tags') or {}).get('alpha_mode', '0')) == '1', 'Alpha channel missing (alpha_mode tag)')
            pixel_formats = {'yuva420p', 'yuv420p'}
        else:
            pixel_formats = {'yuv420p'} if self.profile == 'bt709' else {'yuv420p', 'yuvj420p'}
        require(v['pix_fmt'] in pixel_formats and v['avg_frame_rate'] == f'{self.fps}/1', 'Pixel format or frame rate mismatch')
        dur = v.get('duration') or (data.get('format') or {}).get('duration')
        require(dur is not None, 'Encoded duration missing')
        tol = .05 if self.alpha else .00002
        require(abs(float(dur) - self.count / self.fps) < tol, 'Encoded duration mismatch')
        if self.profile == 'bt709' and not self.alpha:
            require(all(v.get(k) == 'bt709' for k in ['color_space', 'color_primaries', 'color_transfer']) and v.get('color_range') == 'tv', 'BT.709 limited-range metadata missing')
        pts = json.loads(run([probe, '-v', 'error', '-select_streams', 'v:0', '-show_packets', '-show_entries', 'packet=pts_time', '-of', 'json', self.pending]).stdout)['packets']
        times = sorted(float(p['pts_time']) for p in pts)
        require(len(times) == self.count, 'Missing encoded timestamps')
        error = max(abs(t - i / self.fps) for i, t in enumerate(times))
        pts_tol = .002 if self.alpha else .00002   # WebM 时基 1ms，允许半帧级舍入
        require(error < pts_tol, 'Presentation timestamps are discontinuous')
        decoded = run([ffmpeg, '-v', 'error', '-xerror', '-i', self.pending, '-f', 'null', os.devnull])
        require(not decoded.stderr.strip(), 'Encoded video has decode warnings/errors')
        if self.alpha:
            alpha = run([ffmpeg, '-v', 'error', '-xerror', '-c:v', 'libvpx-vp9', '-i', self.pending,
                         '-frames:v', '1', '-vf', 'alphaextract', '-pix_fmt', 'gray',
                         '-f', 'rawvideo', 'pipe:1']).stdout
            require(len(alpha) == self.width * self.height, 'Could not decode the first alpha plane')
            low, high = min(alpha), max(alpha)
            report.update(alpha_min=low, alpha_max=high, alpha_effective=low < 250)
            if low >= 250:
                report['alpha_warning'] = '首帧铺满整个画面，未检测到实际透明区域'
        dest = Path(dest)
        # Copy across drives, then atomically publish beside the destination.
        staged = dest.parent / ('.' + dest.stem + '-' + self.job.name[-10:] + self.pending.suffix)
        try:
            shutil.copyfile(self.pending, staged)
            os.replace(staged, dest)
        finally:
            if staged.exists():
                staged.unlink()
        self.pending.unlink()
        (self.job / 'job.json').unlink()
        self.job.rmdir()
        report.update(self.metadata(), encoded=True, full_decode_pass=True, max_pts_error_seconds=error,
                      color_metadata={k: v.get(k) for k in ['color_space', 'color_primaries', 'color_transfer', 'color_range']},
                      pixel_format=v['pix_fmt'], file_bytes=dest.stat().st_size, output=str(dest), output_sha256=digest(dest))
