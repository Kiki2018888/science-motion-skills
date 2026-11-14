"""Build a portable terminal-motion preview and verified silent H.264 MP4."""
import argparse
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
    ap.add_argument('--shared-font',type=Path)
    ap.add_argument('--scale',type=int,choices=[1,2],default=1)
    ap.add_argument('--chrome',type=Path,default=default_chrome())
    ap.add_argument('--ffmpeg',type=Path,default=default_ffmpeg())
    a=ap.parse_args();raw=json.loads(a.config.read_text(encoding='utf-8-sig'));c=normalize(raw)
    skill=Path(__file__).resolve().parents[1];dest=a.output.resolve();source=dest.parent/(dest.stem+'_source')
    require(dest.suffix.lower()=='.mp4','Output must be .mp4')
    require(not dest.is_relative_to(skill) and not source.is_relative_to(skill),'Outputs must be outside skill directory')
    require(a.overwrite or not (dest.exists() or source.exists()),'Output/source exists; choose a new name or pass --overwrite')
    require(a.chrome.is_file(),'Chrome missing; pass --chrome')
    if not a.ffmpeg.is_file():
        found=shutil.which('ffmpeg');require(found,'FFmpeg missing; pass --ffmpeg');a.ffmpeg=Path(found)
    probe=a.ffmpeg.with_name('ffprobe'+a.ffmpeg.suffix);require(probe.is_file(),'ffprobe must be beside ffmpeg')
    from playwright.sync_api import sync_playwright
    from PIL import Image,ImageDraw
    source.mkdir(parents=True,exist_ok=True)
    for name in ['index.html','engine.js','OFL.txt']+([] if a.shared_font else ['body.otf']):shutil.copy2(skill/'assets/template'/name,source/name)
    if a.shared_font:
        require(a.shared_font.is_file(),'Shared font missing')
        font_url=Path(os.path.relpath(a.shared_font.resolve(),source)).as_posix()
        h=source/'index.html';h.write_text(h.read_text(encoding='utf-8').replace('body.otf',font_url),encoding='utf-8')
    for name,data in [('input.json',raw),('resolved.json',c)]:
        (source/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    (source/'config.js').write_text('window.TERMINAL_CONFIG='+json.dumps(c,ensure_ascii=False)+';\n',encoding='utf-8')
    frames=math.ceil(c['duration']*c['fps']);pending=source/'render.pending.mp4';errors=[]
    report=dict(encoded=False,resolution=[c['width'],c['height']],fps=c['fps'],duration=frames/c['fps'],frames=frames,audio=False,segments=len(c['segments']),highlights=len(c['pauses']),supersampling=a.scale)
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=str(a.chrome),headless=True,args=['--allow-file-access-from-files'])
            try:
                page=browser.new_page(viewport=dict(width=c['width'],height=c['height']),device_scale_factor=a.scale)
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.route('http://**/*',lambda r:r.abort());page.route('https://**/*',lambda r:r.abort())
                page.goto((source/'index.html').as_uri()+'?cap=1');page.wait_for_function('window.__ready===true || window.__buildError',timeout=30000)
                require(not errors and not page.evaluate('window.__buildError'),str(errors or page.evaluate('window.__buildError')))
                times={0,min(1,c['duration']/2),max(0,c['duration']-1)}
                for seg in c['segments']:
                    times.update([seg['start']+.2,(seg['start']+seg['end'])/2,seg['end']-.1])
                for h in c['pauses']:times.add(h['wallAt']+h['enter']+h['hold']/2)
                selected=sorted(t for t in times if t<c['duration'])
                if len(selected)>18:selected=[selected[round(i*(len(selected)-1)/17)] for i in range(18)]
                sheet=Image.new('RGB',(1440,math.ceil(len(selected)/2)*432),'#e8e9e3');pen=ImageDraw.Draw(sheet)
                for i,t in enumerate(selected):
                    print(f'CHECK {t:.2f}',flush=True);page.evaluate('(t)=>window.__seek(t)',t)
                    im=Image.open(io.BytesIO(page.screenshot(type='jpeg',quality=95))).convert('RGB').resize((720,405),Image.Resampling.LANCZOS)
                    x=i%2*720;y=i//2*432;sheet.paste(im,(x,y));pen.text((x+10,y+410),f'{t:.2f} s',fill='#183e33')
                sheet.save(source/'contact.jpg',quality=95)
                page.evaluate('(t)=>window.__seek(t)',c['pauses'][0]['wallAt']+c['pauses'][0]['enter']+c['pauses'][0]['hold']/2 if c['pauses'] else c['duration']/2)
                Image.open(io.BytesIO(page.screenshot())).resize((c['width'],c['height']),Image.Resampling.LANCZOS).save(source/'poster.png')
                require(not page.evaluate('window.__issues'),str(page.evaluate('window.__issues')))
                def state(t):return page.evaluate('(t)=>window.__stateAt(t)',t)
                def wall_at(seg,local):return seg['start']+local+sum(h['length'] for h in seg['highlights'] if h['at']<local)
                for index,seg in enumerate(c['segments']):
                    for j,row in enumerate(seg.get('rows',[])):
                        if row['kind']=='command':require(state(wall_at(seg,min(seg['duration']-.00001,row['at']+row['duration'])))['typed'][j]>=len(row['text'])-1,'Typing failed')
                    for point in seg.get('progress',{}).get('points',[]):
                        if point['at']>=seg['duration']:continue
                        st=state(wall_at(seg,point['at']));require(st['index']==index and abs(st['progress']-point['value'])<1e-7,'Progress keyframe failed')
                for h in c['pauses']:
                    t0=h['wallAt']+h['enter']+h['hold']*.1;t1=h['wallAt']+h['enter']+h['hold']*.9
                    a0=state(t0);a1=state(t1);require(a0['freeze'] and a1['freeze'] and abs(a0['clock']-a1['clock'])<1e-7 and abs(a0['focus']-1)<1e-7,'Highlight freeze failed')
                    page.evaluate('(t)=>window.__seek(t)',t0);digest=hashlib.sha256(page.screenshot()).hexdigest()
                    page.evaluate('(t)=>window.__seek(t)',t1);require(digest==hashlib.sha256(page.screenshot()).hexdigest(),'Hold pixels changed')
                end=state(c['duration'])
                for i,n in enumerate(c['counters']):require(abs(end['counters'][i]['value']-round(n['to'],n['decimals']))<1e-7,'Counter endpoint failed')
                for t in selected:
                    page.evaluate('(t)=>window.__seek(t)',t);digest=hashlib.sha256(page.screenshot()).hexdigest()
                    page.evaluate('window.__seek(window.__dur)');page.evaluate('window.__seek(0)');page.evaluate('(t)=>window.__seek(t)',t)
                    require(digest==hashlib.sha256(page.screenshot()).hexdigest(),'Non-deterministic seek at '+str(t))
                report.update(timeline_pass=True,hold_pixels_pass=True,counters_pass=True,seek_pixels_pass=True,layout_pass=True,sample_times=selected)
                if not a.check_only:
                    proc=subprocess.Popen([str(a.ffmpeg),'-y','-v','error','-f','image2pipe','-framerate',str(c['fps']),'-i','-',
                         '-vf',f"scale={c['width']}:{c['height']}:flags=lanczos,setsar=1",'-an','-c:v','libx264','-threads','4',
                         '-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(pending)],stdin=subprocess.PIPE)
                    try:
                        for f in range(frames):
                            page.evaluate('(t)=>window.__seek(t)',f/c['fps']);proc.stdin.write(page.screenshot(type='jpeg',quality=96))
                            if f%96==0:print(f'FRAME {f}/{frames}',flush=True)
                        proc.stdin.close();require(proc.wait(timeout=120)==0,'FFmpeg failed')
                    finally:
                        if proc.poll() is None:proc.kill();proc.wait()
                    meta=json.loads(subprocess.run([str(probe),'-v','error','-show_streams','-of','json',str(pending)],capture_output=True,text=True,check=True).stdout)
                    v=meta['streams'][0];require(len(meta['streams'])==1 and v['codec_name']=='h264' and v['width']==c['width'] and v['height']==c['height'] and int(v['nb_frames'])==frames,'Encoded format/frame count mismatch')
                    decoded=subprocess.run([str(a.ffmpeg),'-v','error','-i',str(pending),'-f','null',os.devnull],capture_output=True,check=True);require(not decoded.stderr,str(decoded.stderr))
                    require(not errors and not page.evaluate('window.__issues'),str(errors or page.evaluate('window.__issues')))
                    pending.replace(dest);report.update(encoded=True,full_decode_pass=True,file_bytes=dest.stat().st_size)
                require(not errors,str(errors));report['page_errors']=errors
            finally:browser.close()
    except Exception as e:
        report['error']=str(e);raise
    finally:(source/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(dict(output=str(dest) if report['encoded'] else None,source=str(source),verified=True),ensure_ascii=False),flush=True)


if __name__=='__main__':main()
