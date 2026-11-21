"""Portable frame-range rendering and verified H.264 export for motion skills.

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

VERSION = '2.0.0'


def add_arguments(parser):
    parser.add_argument('--frames', metavar='START:END', help='Original timeline frames, start inclusive and end exclusive')
    parser.add_argument('--preview-frames', metavar='N,N,...', default='', help='Original timeline frames to export as PNG')
    parser.add_argument('--profile', choices=['bt709', 'legacy'], default='bt709', help='BT.709 limited-range export (default), or previous JPEG-based encoding')


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
        self.job = cache_base / 'science-motion' / (key + '-' + uuid.uuid4().hex[:10])
        self.pending = self.job / 'render.pending.mp4'

    def metadata(self):
        return dict(render_runtime=VERSION, encoding_profile=self.profile,
                    source_frames=self.total, source_duration=self.total / self.fps,
                    frame_range={'start_inclusive': self.start, 'end_exclusive': self.end},
                    frames=self.count, duration=self.count / self.fps,
                    duration_seconds=self.count / self.fps, original_timeline_preserved=True,
                    input_sha256=self.config_hash, preview_frames=self.previews)

    def export_previews(self, page):
        from PIL import Image
        import io
        for frame in self.preview_frames:
            page.evaluate('(t)=>window.__seek(t)', frame / self.fps)
            path = self.source / f'preview-{frame:07d}.png'
            im = Image.open(io.BytesIO(page.screenshot(type='png'))).convert('RGB')
            if im.size != (self.width, self.height):
                im = im.resize((self.width, self.height), Image.Resampling.LANCZOS)
            im.save(path)
            self.previews.append(dict(frame=frame, source_time=frame / self.fps, file=path.name, sha256=digest(path)))

    def capture(self, page):
        # PNG keeps the browser's RGB data intact before one explicit RGB-to-YUV conversion.
        return page.screenshot(type='png') if self.profile == 'bt709' else page.screenshot(type='jpeg', quality=96)

    def command(self, ffmpeg, threads=4):
        self.job.mkdir(parents=True, exist_ok=False)
        (self.job / 'job.json').write_text(json.dumps(self.metadata(), indent=2), encoding='utf-8')
        vf = f'scale={self.width}:{self.height}:flags=lanczos'
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
        data = json.loads(run([probe, '-v', 'error', '-show_streams', '-of', 'json', self.pending]).stdout)
        streams = data['streams']; v = streams[0]
        require(len(streams) == 1 and v['codec_type'] == 'video' and v['codec_name'] == 'h264', 'Expected one silent H.264 stream')
        require((v['width'], v['height'], int(v['nb_frames'])) == (self.width, self.height, self.count), 'Encoded dimensions/frame count mismatch')
        # Legacy JPEG input may preserve full-range YUV, reported as yuvj420p by FFprobe.
        pixel_formats = {'yuv420p'} if self.profile == 'bt709' else {'yuv420p', 'yuvj420p'}
        require(v['pix_fmt'] in pixel_formats and v['avg_frame_rate'] == f'{self.fps}/1', 'Pixel format or frame rate mismatch')
        require(abs(float(v['duration']) - self.count / self.fps) < .00002, 'Encoded duration mismatch')
        if self.profile == 'bt709':
            require(all(v.get(k) == 'bt709' for k in ['color_space', 'color_primaries', 'color_transfer']) and v.get('color_range') == 'tv', 'BT.709 limited-range metadata missing')
        pts = json.loads(run([probe, '-v', 'error', '-select_streams', 'v:0', '-show_packets', '-show_entries', 'packet=pts_time', '-of', 'json', self.pending]).stdout)['packets']
        times = sorted(float(p['pts_time']) for p in pts)
        require(len(times) == self.count, 'Missing encoded timestamps')
        error = max(abs(t - i / self.fps) for i, t in enumerate(times))
        require(error < .00002, 'Presentation timestamps are discontinuous')
        decoded = run([ffmpeg, '-v', 'error', '-xerror', '-i', self.pending, '-f', 'null', os.devnull])
        require(not decoded.stderr.strip(), 'Encoded video has decode warnings/errors')
        dest = Path(dest)
        # Copy across drives, then atomically publish beside the destination.
        staged = dest.parent / ('.' + dest.stem + '-' + self.job.name[-10:] + '.pending.mp4')
        try:
            shutil.copyfile(self.pending, staged)
            os.replace(staged, dest)
        finally:
            if staged.exists():
                staged.unlink()
        self.pending.unlink(); (self.job / 'job.json').unlink(); self.job.rmdir()
        report.update(self.metadata(), encoded=True, full_decode_pass=True, max_pts_error_seconds=error,
                      color_metadata={k: v.get(k) for k in ['color_space', 'color_primaries', 'color_transfer', 'color_range']},
                      pixel_format=v['pix_fmt'], file_bytes=dest.stat().st_size, output=str(dest), output_sha256=digest(dest))
