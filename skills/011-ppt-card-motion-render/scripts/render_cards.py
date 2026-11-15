"""Render a local, reproducible card animation, with offline preview and verified MP4."""
import argparse
import hashlib
import io
import json
import math
import os
from pathlib import Path
from runtime import default_chrome,default_ffmpeg
import shutil
import subprocess
import sys
sys.dont_write_bytecode=True
from config import normalize,require
from motion_render import RenderPlan,add_arguments,digest


def run(cmd):
    p=subprocess.run([str(x) for x in cmd],capture_output=True)
    require(p.returncode==0,p.stderr.decode('utf-8',errors='replace')[-4000:])
    return p


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--config',type=Path,required=True)
    ap.add_argument('--output',type=Path,required=True)
    ap.add_argument('--chrome',type=Path)
    ap.add_argument('--ffmpeg',type=Path)
    ap.add_argument('--check-only',action='store_true')
    ap.add_argument('--overwrite',action='store_true')
    ap.add_argument('--audio',type=Path)
    ap.add_argument('--trim-audio',action='store_true',help='Explicitly allow cutting audio that is longer than the complete timeline')
    add_arguments(ap);a=ap.parse_args()
    raw=json.loads(a.config.read_text(encoding='utf-8-sig'));c=normalize(raw)
    skill=Path(__file__).resolve().parents[1];dest=a.output.resolve();source=dest.with_name(dest.stem+'_source')
    require(dest.suffix.lower()=='.mp4','Output must be .mp4')
    require(not dest.is_relative_to(skill),'Write outputs outside the installed skill')
    require(a.overwrite or not (dest.exists() or source.exists()),'Output/source exists; use a new name or --overwrite')
    chrome=a.chrome or default_chrome()
    ffmpeg=a.ffmpeg or default_ffmpeg();require(chrome and Path(chrome).is_file(),'Chrome missing; pass --chrome')
    require(ffmpeg and Path(ffmpeg).is_file(),'FFmpeg missing; pass --ffmpeg')
    ffmpeg=Path(ffmpeg);probe=ffmpeg.with_name('ffprobe'+ffmpeg.suffix);require(probe.is_file(),'ffprobe must be beside ffmpeg')
    duration=sum(s['dur'] for s in c['scenes']);fps=c['fps'];free=c.get('mode')=='freeform'
    width,height=c.get('width',1920),c.get('height',1080)
    audio_duration=None
    if a.audio:
        require(a.audio.is_file(),'Audio missing')
        ad=json.loads(run([probe,'-v','error','-show_streams','-show_format','-of','json',a.audio]).stdout)
        require(any(s['codec_type']=='audio' for s in ad['streams']),'No audio stream')
        audio_duration=float(ad['format']['duration'])
        require(audio_duration<=duration+.05 or a.trim_audio,'Audio is longer than the video. Extend scenes, or explicitly use --trim-audio.')
    prepared=[];manifest=[];images=[]
    def collect(nodes):
        for n in nodes:
            if n.get('type')=='image':images.append(n)
            collect(n.get('children',[]))
    for s in c['scenes']:
        if free:collect(s['elements'])
        elif isinstance(s.get('card'),dict):images.extend(s['card'].get('photos',[]))
    for photo in images:
            if not photo.get('src'):continue
            original=photo['src'];require('://' not in original,'Use local photo files, not remote URLs')
            p=(a.config.resolve().parent/original).resolve();require(p.is_file(),f'Image missing: {p}')
            require(p.suffix.lower() in ['.png','.jpg','.jpeg','.webp','.svg'],'Supported image formats: PNG/JPEG/WebP/SVG')
            if p.suffix.lower()=='.svg':
                svg=p.read_text(encoding='utf-8-sig').lower()
                require('<script' not in svg and 'http:' not in svg.replace('http://www.w3.org/2000/svg','') and 'https:' not in svg,'SVG must be self-contained')
            sha=digest(p);name=sha[:20]+p.suffix.lower();prepared.append((p,name));photo['src']='media/'+name
            manifest.append(dict(source=str(p),file=photo['src'],sha256=sha))
    source.mkdir(parents=True,exist_ok=True);(source/'media').mkdir(exist_ok=True)
    template_files=(['free.html','free.css','free.js'] if free else ['engine.html','adapter.js'])+['player.js','body.otf','OFL.txt']
    for name in template_files:shutil.copy2(skill/'assets/template'/name,source/('engine.html' if name=='free.html' else name))
    for p,name in prepared:shutil.copy2(p,source/'media'/name)
    for name,data in [('input.json',raw),('resolved.json',c),('assets.json',manifest)]:
        (source/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    (source/'config.js').write_text('window.CARD_CONFIG='+json.dumps(c,ensure_ascii=False).replace('</',r'<\/')+';\n',encoding='utf-8')
    plan=RenderPlan(a,duration,fps,width,height,source,a.config)
    report=dict(encoded=False,skill='011-ppt-card-motion-render',skill_version='2.0.0',mode='freeform' if free else 'dashboard',style=c['style'],audio=bool(a.audio),user_approved=False)
    from playwright.sync_api import sync_playwright
    from PIL import Image,ImageDraw
    errors=[];failed=[]
    try:
        with sync_playwright() as pw:
            browser_args=['--allow-file-access-from-files','--hide-scrollbars']
            if free:browser_args+=['--disable-gpu','--disable-gpu-compositing']
            browser=pw.chromium.launch(executable_path=str(chrome),headless=True,args=browser_args)
            try:
                page=browser.new_page(viewport={'width':width,'height':height},device_scale_factor=1)
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.on('requestfailed',lambda r:failed.append(r.url))
                page.route('http://**/*',lambda r:r.abort());page.route('https://**/*',lambda r:r.abort())
                page.goto((source/'engine.html').as_uri()+'?cap=1')
                page.wait_for_function('window.__ready===true||window.__buildError',timeout=30000)
                require(not page.evaluate('window.__buildError'),str(page.evaluate('window.__buildError')))
                require(not errors and not failed,str(errors+failed))
                times=[];t=0
                for s in c['scenes']:
                    times += [t+min(1.9,s['dur']*.6),t+s['dur']*.68,t+s['dur']-min(.5,s['dur']*.2)]
                    if free:
                        def moments(nodes):
                            found=[]
                            for n in nodes:
                                found.extend(k['t'] for k in n.get('keyframes',[]))
                                found.extend(moments(n.get('children',[])))
                            return found
                        times += [t+m for m in moments(s['elements']) if 0<m<s['dur']-.05]
                    t+=s['dur']
                times=sorted(set(times))
                if len(times)>60:times=[times[round(i*(len(times)-1)/59)] for i in range(60)]
                sheet=Image.new('RGB',(1440,math.ceil(len(times)/2)*432),'#ddd');pen=ImageDraw.Draw(sheet);inspections=[];seek_diffs=[];pixel_limit=512 if free else 64
                for i,t in enumerate(times):
                    page.evaluate('(t)=>window.__seek(t)',t)
                    state=page.evaluate('window.__inspect()');inspections.append(state)
                    require(state['fontsReady'],'Font failed to load');require(not state['problems'],str(state['problems']))
                    png=page.screenshot(type='png');sha=hashlib.sha256(png).hexdigest()
                    page.evaluate('window.__seek(window.__dur)');page.evaluate('window.__seek(0)');page.evaluate('(t)=>window.__seek(t)',t)
                    if free:require(page.evaluate('window.__inspect()')==state,f'Animation state changed after random seek at {t}')
                    repeat=page.screenshot(type='png')
                    if hashlib.sha256(repeat).hexdigest()!=sha:
                        # Chromium blur tails can round a few nearly transparent pixels by 1 LSB.
                        # Reject geometry/content changes; record the exact tolerance and measurement.
                        from PIL import ImageChops
                        delta=ImageChops.difference(Image.open(io.BytesIO(png)).convert('RGB'),Image.open(io.BytesIO(repeat)).convert('RGB'))
                        extrema=delta.getextrema();maximum=max(x[1] for x in extrema)
                        red,green,blue=delta.split();mask=ImageChops.lighter(ImageChops.lighter(red,green),blue)
                        changed=delta.width*delta.height-mask.histogram()[0]
                        require(maximum<=2 and changed<=pixel_limit,f'Non-deterministic seek at {t}: {maximum=}, {changed=}')
                        seek_diffs.append({'time':t,'max_channel_delta':maximum,'changed_pixels':changed})
                    im=Image.open(io.BytesIO(png)).convert('RGB').resize((720,405),Image.Resampling.LANCZOS)
                    x=i%2*720;y=i//2*432;sheet.paste(im,(x,y));pen.text((x+10,y+409),f'{t:.2f} s',fill='#333')
                    print(f'CHECK {t:.2f}',flush=True)
                sheet.save(source/'contact.jpg',quality=94)
                page.evaluate('(t)=>window.__seek(t)',min(c['scenes'][0]['dur']-.5,4.8));page.screenshot(path=str(source/'poster.png'))
                plan.export_previews(page)
                report.update(plan.metadata(),timeline_pass=True,seek_state_exact=free,seek_pixels_pass=True,seek_pixels_exact=not seek_diffs,seek_pixel_differences=seek_diffs,seek_tolerance={'max_channel_delta':2,'max_changed_pixels':pixel_limit,'total_pixels':width*height},layout_pass=True,inspections=inspections,asset_count=len(manifest))
                if not a.check_only:
                    proc=subprocess.Popen(plan.command(ffmpeg),stdin=subprocess.PIPE,stderr=subprocess.PIPE)
                    try:
                        for frame in plan.indices:
                            page.evaluate('(t)=>window.__seek(t)',frame/fps);proc.stdin.write(plan.capture(page))
                            if frame%90==0:print(f'FRAME {frame-plan.start}/{plan.count}',flush=True)
                        proc.stdin.close();err=proc.stderr.read().decode('utf-8',errors='replace');require(proc.wait(timeout=120)==0,err)
                    finally:
                        if proc.poll() is None:proc.kill();proc.wait()
                    if not a.audio:plan.finish(ffmpeg,probe,dest,report)
                    else:
                        silent=source/'silent.verified.mp4';plan.finish(ffmpeg,probe,silent,report);report['encoded']=False
                        pending=dest.with_name('.'+dest.stem+'.mux.pending.mp4')
                        audio_filter=f'[1:a]apad,atrim=start={plan.start/fps}:end={plan.end/fps},asetpts=PTS-STARTPTS[a]'
                        run([ffmpeg,'-v','error','-y','-i',silent,'-i',a.audio,'-filter_complex',audio_filter,'-map','0:v:0','-map','[a]','-c:v','copy','-c:a','aac','-ar','48000','-ac','2','-b:a','192k','-t',plan.count/fps,'-movflags','+faststart',pending])
                        vd=json.loads(run([probe,'-v','error','-show_streams','-of','json',pending]).stdout)['streams']
                        v=next(x for x in vd if x['codec_type']=='video');audio=next(x for x in vd if x['codec_type']=='audio')
                        require(int(v['nb_frames'])==plan.count and abs(float(v['duration'])-plan.count/fps)<.00002,'Mux changed video duration')
                        require(abs(float(audio['duration'])-plan.count/fps)<.05,'Audio/video durations differ')
                        require(not run([ffmpeg,'-v','error','-xerror','-i',pending,'-f','null',os.devnull]).stderr.strip(),'Mux decode failed')
                        os.replace(pending,dest);silent.unlink()
                        report.update(encoded=True,audio_padded=audio_duration<duration,audio_trim_allowed=a.trim_audio,audio_sha256=digest(a.audio),output=str(dest),output_sha256=digest(dest),file_bytes=dest.stat().st_size)
                require(not errors and not failed,str(errors+failed));report.update(page_errors=errors,failed_requests=failed)
            finally:browser.close()
    except Exception as e:
        report['error']=str(e);raise
    finally:
        report['source_sha256']={n:digest(source/n) for n in ['engine.html','player.js','config.js','body.otf']+(['free.js','free.css'] if free else ['adapter.js'])}
        (source/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(dict(output=str(dest) if report['encoded'] else None,source=str(source),verified=True),ensure_ascii=False),flush=True)


if __name__=='__main__':main()
