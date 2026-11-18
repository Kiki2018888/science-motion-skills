"""Build a portable threshold-line preview and verified silent H.264 MP4."""
import argparse
import hashlib
import io
import json
import math
import os
from pathlib import Path
import sys

sys.dont_write_bytecode = True
from runtime import default_chrome, default_ffmpeg
from motion_render import add_arguments, RenderPlan
import shutil
import subprocess
from config import normalize, require


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--config',type=Path,required=True);ap.add_argument('--output',type=Path,required=True)
    ap.add_argument('--check-only',action='store_true');ap.add_argument('--overwrite',action='store_true')
    ap.add_argument('--shared-font',type=Path)
    ap.add_argument('--scale',type=int,choices=[1,2],default=1)
    ap.add_argument('--chrome',type=Path,default=default_chrome())
    ap.add_argument('--ffmpeg',type=Path,default=default_ffmpeg())
    add_arguments(ap);a=ap.parse_args();raw=json.loads(a.config.read_text(encoding='utf-8-sig'));c=normalize(raw)
    skill=Path(__file__).resolve().parents[1];dest=a.output.resolve();source=dest.parent/(dest.stem+'_source')
    required_suffix = '.webm' if a.alpha else '.mp4'
    require(dest.suffix.lower() == required_suffix, f'Output must end in {required_suffix} for the selected encoding')
    require(not dest.is_relative_to(skill) and not source.is_relative_to(skill),'Outputs must be outside skill directory')
    require(a.overwrite or not (dest.exists() or source.exists()),'Output/source exists; choose a new name or pass --overwrite')
    require(a.chrome.is_file(),'Chrome missing; pass --chrome')
    if not a.ffmpeg.is_file():
        found=shutil.which('ffmpeg');require(found,'FFmpeg missing; pass --ffmpeg');a.ffmpeg=Path(found)
    probe=a.ffmpeg.with_name('ffprobe'+a.ffmpeg.suffix);require(probe.is_file(),'ffprobe must be beside ffmpeg')
    from playwright.sync_api import sync_playwright
    from PIL import Image,ImageDraw
    source.mkdir(parents=True,exist_ok=True)
    for name in ['index.html','engine.js','pixel.js','OFL.txt']+([] if a.shared_font else ['body.otf']):shutil.copy2(skill/'assets/template'/name,source/name)
    if a.shared_font:
        require(a.shared_font.is_file(),'Shared font missing')
        font_url=Path(os.path.relpath(a.shared_font.resolve(),source)).as_posix()
        h=source/'index.html';h.write_text(h.read_text(encoding='utf-8').replace('./body.otf',font_url),encoding='utf-8')
    for name,data in [('input.json',raw),('resolved.json',c)]:
        (source/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    (source/'config.js').write_text('window.THRESHOLD_CONFIG='+json.dumps(c,ensure_ascii=False)+';\n',encoding='utf-8')
    plan=RenderPlan(a,c['duration'],c['fps'],c['width'],c['height'],source,a.config);frames=plan.count;pending=plan.pending;errors=[]
    report=dict(encoded=False,resolution=[c['width'],c['height']],fps=c['fps'],duration=frames/c['fps'],frames=frames,audio=False,mode=c['mode'],supersampling=a.scale)
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=str(a.chrome),headless=True,args=['--allow-file-access-from-files','--disable-gpu','--disable-skia-runtime-opts'])
            try:
                page=browser.new_page(viewport=dict(width=c['width'],height=c['height']),device_scale_factor=a.scale)
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.route('http://**/*',lambda r:r.abort());page.route('https://**/*',lambda r:r.abort())
                page.goto((source/'index.html').as_uri()+'?cap=1');page.wait_for_function('window.__ready===true || window.__buildError',timeout=30000)
                require(not errors and not page.evaluate('window.__buildError'),str(errors or page.evaluate('window.__buildError')))
                times={0,min(1,c['duration']/2),max(0,c['duration']-1)}
                if c['mode']!='race':
                    times.update(p['at']+.2 for p in c['pins'])
                    times.update(t for a in c['cards'] for t in [a['hit']-.1,a['hit']+.35])
                if c['mode']!='threshold':
                    times.update(e['entryGlobal']+e['entryDuration'] for e in c['entrants'])
                    times.update(e['at']+e['travel']*.4 for e in c['entrants'])
                selected=sorted(t for t in times if t<c['duration'])
                if len(selected)>18:selected=[selected[round(i*(len(selected)-1)/17)] for i in range(18)]
                sheet=Image.new('RGB',(1440,math.ceil(len(selected)/2)*432),'#e8e9e3');pen=ImageDraw.Draw(sheet)
                for i,t in enumerate(selected):
                    print(f'CHECK {t:.2f}',flush=True);page.evaluate('(t)=>window.__seek(t)',t)
                    im=Image.open(io.BytesIO(page.screenshot(type='jpeg',quality=95))).convert('RGB').resize((720,405),Image.Resampling.LANCZOS)
                    x=i%2*720;y=i//2*432;sheet.paste(im,(x,y));pen.text((x+10,y+410),f'{t:.2f} s',fill='#183e33')
                sheet.save(source/'contact.jpg',quality=95)
                page.evaluate('(t)=>window.__seek(t)',max(p['at'] for p in c['pins'])+.5 if c['mode']!='race' and c['pins'] else c['duration']/2)
                Image.open(io.BytesIO(page.screenshot())).resize((c['width'],c['height']),Image.Resampling.LANCZOS).save(source/'poster.png')
                require(not page.evaluate('window.__issues'),str(page.evaluate('window.__issues')))
                def state(t):return page.evaluate('(t)=>window.__stateAt(t)',t)
                if c['mode']!='race':
                    for i,card in enumerate(c['cards']):
                        before=state(card['hit']-.001)['cards'][i];at=state(card['hit'])['cards'][i]
                        require(not before['hit'] and before['bottom']<c['threshold']['y'] and at['hit'] and abs(at['bottom']-c['threshold']['y'])<1e-7,'Incorrect card contact')
                    areas=page.evaluate('fragments.map(fs=>fs.reduce((sum,f)=>sum+Math.abs(f.pts.reduce((a,p,i)=>{const q=f.pts[(i+1)%3];return a+p[0]*q[1]-q[0]*p[1]},0))/2,0))')
                    require(all(abs(v-a['width']*a['height'])<1e-5 for v,a in zip(areas,c['cards'])),'Fragment geometry has gaps')
                if c['mode']!='threshold':
                    require(page.evaluate('entrants.every((e,i)=>{return entrantBounds(e.entryGlobal+e.entryDuration,e,i).top>RA.startY})'),'Entrants crossed before launch')
                    require(page.evaluate('entrants.every((e,i)=>{return entrantBounds(e.cross-.00001,e,i).top>RA.startY && entrantBounds(e.cross+.00001,e,i).top<=RA.startY})'),'Crossing pulse mistimed')
                    require(all(abs(v-1)<1e-7 for v in state(c['duration'])['raceTravel']),'Entrants did not finish')
                for t in selected:
                    page.evaluate('(t)=>window.__seek(t)',t);digest=hashlib.sha256(page.screenshot()).hexdigest()
                    page.evaluate('window.__seek(window.__dur)');page.evaluate('window.__seek(0)');page.evaluate('(t)=>window.__seek(t)',t)
                    require(digest==hashlib.sha256(page.screenshot()).hexdigest(),'Non-deterministic seek at '+str(t))
                report['race_diagnostics']=page.evaluate('window.__raceDiagnostics')
                report.update(contact_pass=True if c['mode']!='race' else None,fragment_area_pass=True if c['mode']!='race' else None,race_pass=True if c['mode']!='threshold' else None,seek_pixels_pass=True,layout_pass=True,sample_times=selected)
                plan.export_previews(page);report.update(plan.metadata())
                if not a.check_only:
                    proc=subprocess.Popen(plan.command(a.ffmpeg,threads=4),stdin=subprocess.PIPE)
                    try:
                        for f in plan.indices:
                            page.evaluate('(t)=>window.__seek(t)',f/c['fps']);proc.stdin.write(plan.capture(page))
                            if f%96==0:print(f'FRAME {f}/{frames}',flush=True)
                        proc.stdin.close();require(proc.wait(timeout=120)==0,'FFmpeg failed')
                    finally:
                        if proc.poll() is None:proc.kill();proc.wait()
                    plan.finish(a.ffmpeg,probe,dest,report)
                require(not errors,str(errors));report['page_errors']=errors
            finally:browser.close()
    except Exception as e:
        report['error']=str(e);raise
    finally:(source/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(dict(output=str(dest) if report['encoded'] else None,source=str(source),verified=True),ensure_ascii=False),flush=True)


if __name__=='__main__':main()
