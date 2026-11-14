"""Build a portable multiscale HTML preview and verified silent H.264 MP4."""
import argparse
import base64
import hashlib
import io
import json
import math
import os
from pathlib import Path
from runtime import default_chrome, default_ffmpeg
import shutil
import subprocess
import sys
sys.dont_write_bytecode = True
from config import normalize, require


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--config',type=Path,required=True);ap.add_argument('--output',type=Path,required=True)
    ap.add_argument('--check-only',action='store_true');ap.add_argument('--overwrite',action='store_true')
    ap.add_argument('--scale',type=int,choices=[1,2],default=2)
    ap.add_argument('--chrome',type=Path,default=default_chrome())
    ap.add_argument('--ffmpeg',type=Path,default=default_ffmpeg())
    args=ap.parse_args();raw=json.loads(args.config.read_text(encoding='utf-8-sig'));c=normalize(raw)
    skill=Path(__file__).resolve().parents[1];dest=args.output.resolve();source=dest.parent/(dest.stem+'_source')
    require(dest.suffix.lower()=='.mp4','Output must be .mp4')
    require(not dest.is_relative_to(skill) and not source.is_relative_to(skill),'Outputs must be outside skill directory')
    require(args.overwrite or not (dest.exists() or source.exists()),'Output/source exists; choose a new name or pass --overwrite')
    require(args.chrome.is_file(),'Chrome missing; pass --chrome')
    if not args.ffmpeg.is_file():
        found=shutil.which('ffmpeg');require(found,'FFmpeg missing; pass --ffmpeg');args.ffmpeg=Path(found)
    probe=args.ffmpeg.with_name('ffprobe'+args.ffmpeg.suffix);require(probe.is_file(),'ffprobe must be beside ffmpeg')
    manifest=[]
    if c['scene']['type']=='images':
        mime={'.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'}
        for l in c['scene']['layers']:
            p=(args.config.resolve().parent/l['src']).resolve()
            require(p.is_file(),f'Asset missing: {p}');require(p.suffix.lower() in mime,'Use PNG/JPEG/WebP/SVG assets')
            data=p.read_bytes();l['data']='data:'+mime[p.suffix.lower()]+';base64,'+base64.b64encode(data).decode('ascii')
            manifest.append(dict(path=str(p),sha256=hashlib.sha256(data).hexdigest(),bytes=len(data)))
    from playwright.sync_api import sync_playwright
    from PIL import Image,ImageDraw
    source.mkdir(parents=True,exist_ok=True)
    for name in ['index.html','engine.js','leaf.js','body.otf','OFL.txt']:
        shutil.copy2(skill/'assets/template'/name,source/name)
    for name,data in [('input.json',raw),('resolved.json',c),('assets.json',manifest)]:
        (source/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    (source/'config.js').write_text('window.ZOOM_CONFIG='+json.dumps(c,ensure_ascii=False)+';\n',encoding='utf-8')
    errors=[];frames=math.ceil(c['duration']*c['fps']);pending=source/'render.pending.mp4'
    report=dict(encoded=False,resolution=[c['width'],c['height']],fps=c['fps'],duration=frames/c['fps'],frames=frames,audio=False,scene=c['scene']['type'],supersampling=args.scale)
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=str(args.chrome),headless=True,args=['--allow-file-access-from-files'])
            try:
                page=browser.new_page(viewport=dict(width=c['width'],height=c['height']),device_scale_factor=args.scale)
                page.on('pageerror',lambda e:errors.append(str(e)))
                # Assets are local or embedded. Rendering needs no external services.
                page.route('http://**/*',lambda route:route.abort());page.route('https://**/*',lambda route:route.abort())
                page.goto((source/'index.html').as_uri()+'?cap=1');page.wait_for_function('window.__ready===true || window.__buildError',timeout=30000)
                require(not errors and not page.evaluate('window.__buildError'),str(errors or page.evaluate('window.__buildError')))
                times={0,max(0,c['duration']-.1)}
                for l in c['levels']:
                    times.add(l['arrive']+l['hold']*.5)
                    if l['transition']:times.add(l['start']+l['transition']*.5)
                times=sorted(times);tw,th=(270,480) if c['portrait'] else (480,270);cols=3
                sheet=Image.new('RGB',(cols*tw,math.ceil(len(times)/cols)*(th+24)),'#e8e9e3');pen=ImageDraw.Draw(sheet)
                for i,t in enumerate(times):
                    print(f'CHECK {t:.2f}',flush=True);page.evaluate('(t)=>window.__seek(t)',t)
                    im=Image.open(io.BytesIO(page.screenshot(type='jpeg',quality=94))).convert('RGB').resize((tw,th),Image.Resampling.LANCZOS)
                    x=i%cols*tw;y=i//cols*(th+24);sheet.paste(im,(x,y));pen.text((x+8,y+th+4),f'{t:.2f} s',fill='#183e33')
                sheet.save(source/'contact.jpg',quality=94)
                Image.open(io.BytesIO(page.screenshot(type='png'))).resize((c['width'],c['height']),Image.Resampling.LANCZOS).save(source/'poster.png')
                require(not page.evaluate('window.__issues'),str(page.evaluate('window.__issues')))
                for i,l in enumerate(c['levels']):
                    cam=page.evaluate('(t)=>window.__cameraAt(t)',l['arrive'])
                    require(abs(cam['width']/l['viewWidth']-1)<1e-9,'Target view width mismatch')
                    require(math.hypot(cam['cx']-l['center'][0],cam['cy']-l['center'][1])<max(1e-9,l['viewWidth']*1e-9),'Target center mismatch')
                    for t in [l['start'],l['arrive'],l['end']]:
                        a,b=page.evaluate('([t,d])=>[window.__cameraAt(Math.max(0,t-d)),window.__cameraAt(Math.min(window.__dur,t+d))]',[t,1e-6])
                        require(abs(math.log(a['width']/b['width']))<1e-5 and math.hypot(a['cx']-b['cx'],a['cy']-b['cy'])/a['width']<1e-5,'Camera discontinuity')
                # Repeat nonsequential seeks and compare actual pixels, not only reported state.
                for t in [times[len(times)//3],times[2*len(times)//3],times[-1]]:
                    page.evaluate('(t)=>window.__seek(t)',t);state=page.evaluate('window.__inspect()');digest=hashlib.sha256(page.screenshot()).hexdigest()
                    require(abs(state['scaleBar']['pixels']/state['scale']-state['scaleBar']['worldLength'])<max(1e-9,state['scaleBar']['worldLength']*1e-9),'Scale bar mismatch')
                    page.evaluate('window.__seek(0)');page.evaluate('window.__seek(window.__dur)');page.evaluate('(t)=>window.__seek(t)',t)
                    require(digest==hashlib.sha256(page.screenshot()).hexdigest(),'Seek pixel mismatch')
                report.update(camera_continuity_pass=True,scale_bar_pass=True,seek_pixels_pass=True,layout_pass=True,sample_times=times)
                if not args.check_only:
                    proc=subprocess.Popen([str(args.ffmpeg),'-y','-v','error','-f','image2pipe','-framerate',str(c['fps']),'-i','-','-vf',f'scale={c["width"]}:{c["height"]}:flags=lanczos,setsar=1','-an','-c:v','libx264','-threads','4','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(pending)],stdin=subprocess.PIPE)
                    try:
                        for f in range(frames):
                            page.evaluate('(t)=>window.__seek(t)',f/c['fps']);proc.stdin.write(page.screenshot(type='jpeg',quality=96))
                            if f%(c['fps']*3)==0:print(f'FRAME {f}/{frames}',flush=True)
                        proc.stdin.close();require(proc.wait(timeout=120)==0,'FFmpeg failed')
                    finally:
                        if proc.poll() is None:proc.kill();proc.wait()
                require(not page.evaluate('window.__issues'),str(page.evaluate('window.__issues')))
            finally:browser.close()
        require(not errors,str(errors))
        if not args.check_only:
            meta=json.loads(subprocess.run([str(probe),'-v','error','-show_streams','-of','json',str(pending)],capture_output=True,text=True,check=True).stdout)
            v=meta['streams'][0];require(len(meta['streams'])==1 and v['codec_name']=='h264' and v['width']==c['width'] and v['height']==c['height'] and int(v['nb_frames'])==frames,'Unexpected encoded format')
            decoded=subprocess.run([str(args.ffmpeg),'-v','error','-i',str(pending),'-f','null',os.devnull],capture_output=True,check=True);require(not decoded.stderr,'Video decode error')
            pending.replace(dest);report.update(encoded=True,full_decode_pass=True,file_bytes=dest.stat().st_size)
        report['page_errors']=errors
    except Exception as e:
        report.update(error=str(e),page_errors=errors);raise
    finally:(source/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(dict(source=str(source),output=str(dest) if report['encoded'] else None,verified=True),ensure_ascii=False),flush=True)


if __name__=='__main__':main()
