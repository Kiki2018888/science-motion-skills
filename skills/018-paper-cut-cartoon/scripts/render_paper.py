"""Render a seekable offline paper-cut cartoon from JSON."""
import argparse
import base64
from contextlib import ExitStack, contextmanager
import json
import os
from pathlib import Path
import shutil
import subprocess
import tempfile

from config import validate
from motion_render import RenderPlan, add_arguments

ASSETS=Path(__file__).resolve().parents[1]/"assets"
FPS=30


def make_html(film):
    folder=ASSETS/"template"
    source=(folder/"player.html").read_text(encoding="utf-8")
    for token,name in [("__PAPER__","paper.js"),("__PUPPETS__","puppets.js"),("__STAGE__","stage.js")]:
        source=source.replace(token,(folder/name).read_text(encoding="utf-8"))
    source=source.replace("__FONT__",base64.b64encode((folder/"body.otf").read_bytes()).decode("ascii"))
    license_text=(folder/"OFL.txt").read_text(encoding="utf-8-sig")
    source=source.replace("</html>",'<script type="text/plain" id="font-license">'+license_text+'</script></html>')
    safe_json=json.dumps(film,ensure_ascii=False,allow_nan=False,separators=(",",":")).replace("<","\\u003c")
    return source.replace("__FILM__",safe_json)


def find_ffmpeg(given, config):
    if given:
        cmd=given
    else:
        found=shutil.which("ffmpeg")
        if found:
            cmd=Path(found)
        else:
            candidates=(f for start in (config.parent,Path.cwd(),ASSETS) for root in (start,*start.parents)
                        for f in sorted((root/"通用工具").glob("ffmpeg-*/bin/ffmpeg.exe"),reverse=True))
            cmd=next(candidates,None)
    if not cmd or not cmd.is_file():
        raise ValueError("请通过 --ffmpeg 指定 FFmpeg，或将它加入 PATH")
    probe=cmd.with_name("ffprobe"+cmd.suffix)
    if not probe.is_file():
        raise ValueError("FFmpeg 同目录需要 ffprobe")
    return cmd.resolve(),probe.resolve()


@contextmanager
def output_lock(path,overwrite):
    path.parent.mkdir(parents=True,exist_ok=True)
    lock=path.with_name("."+path.name+".render-lock")
    with lock.open("x"):
        pass
    try:
        if path.exists() and not overwrite:
            raise FileExistsError(f"输出已存在 {path}，请换名或加 --overwrite")
        yield
    finally:
        lock.unlink(missing_ok=True)


def publish_file(src,destination):
    with tempfile.NamedTemporaryFile(dir=destination.parent,delete=False) as handle:
        staging=Path(handle.name)
    try:
        shutil.copyfile(src,staging)
        os.replace(staging,destination)
    finally:
        staging.unlink(missing_ok=True)


def render(args):
    config=args.config.resolve()
    film=json.loads(config.read_text(encoding="utf-8-sig"))
    if args.format:
        film["format"]=args.format
    frames=validate(film)
    vertical=film.get("format")=="portrait"
    width,height=(1080,1920) if vertical else (1920,1080)
    dest=args.output.resolve() if args.output else None
    html=args.html.resolve() if args.html else None
    if not args.check_only and dest is None:
        raise ValueError("渲染 MP4 时需要 --output")
    if (dest and dest.suffix.lower()!=".mp4") or (html and html.suffix.lower()!=".html"):
        raise ValueError("视频和离线预览分别使用 .mp4 和 .html")
    if (args.frames or args.preview_frames) and dest is None:
        raise ValueError("导出关键帧时需指定 --output 作为文件命名依据")
    checks=sorted({0,frames-1,*(sum(round(x["duration"]*FPS) for x in film["scenes"][:i]) for i in range(1,len(film["scenes"])))})
    if not args.check_only:
        ff,probe=find_ffmpeg(args.ffmpeg,config)
    from playwright.sync_api import sync_playwright
    with tempfile.TemporaryDirectory(prefix="paper-cut-") as temp, ExitStack() as stack:
        work=Path(temp)
        plan=RenderPlan(args,frames/FPS,FPS,width,height,work,config)
        plan.job=work/"encode"
        plan.pending=plan.job/"render.pending.mp4"
        preview_files=[(work/f"preview-{f:07d}.png",dest.with_name(f"{dest.stem}_f{f:06d}.png")) for f in plan.preview_frames]
        outputs=[p for p in [html,dest if not args.check_only else None,*[d for _,d in preview_files]] if p]
        for output in sorted(outputs):
            if output==config:
                raise ValueError("不能覆盖输入配置")
            stack.enter_context(output_lock(output,args.overwrite))
        page_path=work/"film.html"
        page_path.write_text(make_html(film),encoding="utf-8")
        with sync_playwright() as pw:
            chrome=args.chrome
            if chrome is None:
                chrome=next((Path(p) for p in (shutil.which("google-chrome"),shutil.which("chromium"),
                    str(Path(os.environ.get("ProgramFiles",""))/"Google/Chrome/Application/chrome.exe"))
                    if p and Path(p).is_file()),None)
            browser=pw.chromium.launch(executable_path=str(chrome) if chrome else None,headless=True)
            page=browser.new_page(viewport={"width":width,"height":height},device_scale_factor=1)
            errors=[]
            page.on("pageerror",lambda err:errors.append(str(err)))
            page.goto(page_path.as_uri()+"?cap=1",wait_until="load")
            page.evaluate("()=>window.__ready")
            if abs(page.evaluate("window.__dur")*FPS-frames)>1e-6:
                raise ValueError("浏览器镜头时长与配置不一致")
            for frame in checks:
                page.evaluate("(t)=>window.__seek(t)",frame/FPS)
            plan.export_previews(page)
            if not args.check_only:
                proc=subprocess.Popen(plan.command(ff),stdin=subprocess.PIPE)
                try:
                    last_key=None
                    for frame in plan.indices:
                        key=page.evaluate("(t)=>window.__seek(t)",frame/FPS)
                        if key!=last_key:
                            pixels=plan.capture(page)
                            last_key=key
                        proc.stdin.write(pixels)
                    proc.stdin.close()
                    if proc.wait()!=0:
                        raise RuntimeError("FFmpeg 编码失败")
                finally:
                    if proc.poll() is None:
                        proc.kill()
                        proc.wait()
            browser.close()
            if errors:
                raise ValueError("页面错误 "+" / ".join(errors))
        if not args.check_only:
            plan.finish(ff,probe,dest,{})
        if html:
            publish_file(page_path,html)
        for source,target in preview_files:
            publish_file(source,target)
    print(f"{width}×{height} · {frames} 帧 · {frames/FPS:.2f} 秒"+" · "+("检查通过" if args.check_only else str(dest)))


if __name__=="__main__":
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config",required=True,type=Path)
    parser.add_argument("--output",type=Path)
    parser.add_argument("--html",type=Path,help="导出可双击播放的独立 HTML")
    parser.add_argument("--format",choices=["landscape","portrait"])
    parser.add_argument("--ffmpeg",type=Path)
    parser.add_argument("--chrome",type=Path)
    parser.add_argument("--check-only",action="store_true")
    parser.add_argument("--overwrite",action="store_true")
    add_arguments(parser)
    try:
        render(parser.parse_args())
    except (ValueError,OSError,RuntimeError) as error:
        parser.exit(1,str(error)+"\n")
