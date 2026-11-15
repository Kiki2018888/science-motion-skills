"""Create a local configurable SVG flow animation and verified H.264 MP4."""
import argparse
import io
import json
import math
import os
from pathlib import Path
from runtime import default_chrome, default_ffmpeg
from motion_render import add_arguments, RenderPlan
import shutil
import subprocess
import sys

sys.dont_write_bytecode = True
from config import normalize, require


def main():
    ap=argparse.ArgumentParser(description=__doc__)
    ap.add_argument('--config',type=Path,required=True);ap.add_argument('--output',type=Path,required=True)
    ap.add_argument('--check-only',action='store_true');ap.add_argument('--overwrite',action='store_true')
    ap.add_argument('--cursor',choices=['circle','triangle']);ap.add_argument('--fps',type=int,choices=[24,30])
    ap.add_argument('--chrome',type=Path,default=default_chrome())
    ap.add_argument('--ffmpeg',type=Path,default=default_ffmpeg())
    ap.add_argument('--scale',type=int,choices=[1,2],default=2,help='Capture multiplier; output resolution stays unchanged')
    add_arguments(ap);a=ap.parse_args();raw=json.loads(a.config.read_text(encoding='utf-8-sig'))
    if a.cursor:raw['cursor']={**raw.get('cursor',{}),'shape':a.cursor}
    if a.fps:raw['fps']=a.fps
    c=normalize(raw);skill=Path(__file__).resolve().parents[1];dest=a.output.resolve();source=dest.parent/(dest.stem+'_source')
    require(dest.suffix.lower()=='.mp4','Output must end in .mp4')
    require(not dest.is_relative_to(skill) and not source.is_relative_to(skill),'Keep generated outputs outside the skill directory')
    require(a.overwrite or not (dest.exists() or source.exists()),'Output/source exists; select another filename or explicitly pass --overwrite')
    require(a.chrome.is_file(),'Chrome missing; pass --chrome')
    if not a.ffmpeg.is_file():
        found=shutil.which('ffmpeg');require(found,'FFmpeg missing; pass --ffmpeg');a.ffmpeg=Path(found)
    probe=a.ffmpeg.with_name('ffprobe'+a.ffmpeg.suffix);require(probe.is_file(),'ffprobe must be beside ffmpeg')
    from playwright.sync_api import sync_playwright
    from PIL import Image,ImageDraw
    source.mkdir(parents=True,exist_ok=True)
    for name in ['index.html','style.css','geometry.js','engine.js','body.otf','OFL.txt']:
        shutil.copy2(skill/'assets/template'/name,source/name)
    (source/'input.json').write_text(json.dumps(raw,ensure_ascii=False,indent=2),encoding='utf-8')
    (source/'resolved.json').write_text(json.dumps(c,ensure_ascii=False,indent=2),encoding='utf-8')
    # External JS + JSON encoding: user text never enters HTML markup or a shell command.
    (source/'config.js').write_text('window.FLOW_CONFIG='+json.dumps(c,ensure_ascii=False)+';\n',encoding='utf-8')
    errors=[];plan=RenderPlan(a,c['duration'],c['fps'],c['width'],c['height'],source,a.config);frames=plan.count;pending=plan.pending
    report={'encoded':False,'layout_pass':False,'audio':False,'resolution':[c['width'],c['height']],'fps':c['fps'],'frames':frames,'duration_seconds':frames/c['fps'],'cursor':c['cursor'],'supersampling':a.scale}
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=str(a.chrome),headless=True,args=['--allow-file-access-from-files'])
            try:
                page=browser.new_page(viewport={'width':c['width'],'height':c['height']},device_scale_factor=a.scale)
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.goto((source/'index.html').as_uri()+'?cap=1');page.wait_for_function('window.__ready===true || window.__buildError',timeout=20000)
                require(not errors,str(errors));issues=page.evaluate('window.__issues||[]');report['layout_issues']=issues;report['layout_warnings']=page.evaluate('window.__warnings||[]');report['path_diagnostics']=page.evaluate('window.__pathDiagnostics||[]')
                # Save a final frame even on layout failure, so the configuration can be corrected visually.
                page.evaluate('(t)=>window.__seek(t)',c['duration']-.1)
                Image.open(io.BytesIO(page.screenshot(type='png'))).resize((c['width'],c['height']),Image.Resampling.LANCZOS).save(source/'poster.png')
                require(not issues,'Layout check failed: '+'; '.join(issues));report['layout_pass']=True
                times={max(.1,c['duration']-.5)}
                for n in c['nodes']:
                    times.add(n['enter']+n['enterDuration'])
                    times.update(e['at']+.35 for e in n['events'])
                for e in c['edges']:
                    for tr in e['travels']:
                        times.add(tr['start']+tr['duration']*.5)
                        if tr['hold']:times.add(tr['start']+tr['duration']+tr['hold']*.5)
                        if tr['returnDuration']:times.add(tr['start']+tr['duration']+tr['hold']+tr['returnDuration']*.5)
                times=sorted(t for t in times if 0<=t<c['duration']);selected=times if len(times)<=12 else [times[round(i*(len(times)-1)/11)] for i in range(12)]
                tw,th=(270,480) if c['height']>c['width'] else (480,270);cols=min(3,len(selected));sheet=Image.new('RGB',(cols*tw,math.ceil(len(selected)/cols)*(th+26)),'#e8e6df');pen=ImageDraw.Draw(sheet)
                for i,t in enumerate(selected):
                    page.evaluate('(t)=>window.__seek(t)',t);im=Image.open(io.BytesIO(page.screenshot(type='jpeg',quality=94))).convert('RGB');im.thumbnail((tw,th));x=i%cols*tw;y=i//cols*(th+26);sheet.paste(im,(x,y));pen.text((x+10,y+th+5),f'{t:.2f} s',fill='#1d2f55')
                sheet.save(source/'contact.jpg',quality=94);report['sample_times']=selected
                # Nonsequential seeking checks stateful cursor/timeline regressions.
                for t in selected:
                    page.evaluate('(t)=>window.__seek(t)',t);state=page.evaluate('window.__inspect()')
                    page.evaluate('(t)=>window.__seek(t)',c['duration']);page.evaluate('window.__seek(0)');page.evaluate('(t)=>window.__seek(t)',t)
                    require(state==page.evaluate('window.__inspect()'),'Non-deterministic seek at '+str(t))
                report['seek_pass']=True
                direction_checks=0
                for edge in c['edges']:
                    for tr in edge['travels']:
                        ts=[tr['start']+tr['duration']*f for f in [.2,.5,.8]]
                        if tr['returnDuration']:ts.append(tr['start']+tr['duration']+tr['hold']+tr['returnDuration']*.5)
                        for t in ts:
                            states=[]
                            for s in [t-.001,t,t+.001]:
                                page.evaluate('(t)=>window.__seek(t)',s);states.append(next(e for e in page.evaluate('window.__inspect().edges') if e['id']==edge['id']))
                            p,q,r=states;dx=r['x']-p['x'];dy=r['y']-p['y']
                            if math.hypot(dx,dy)<.00001:continue
                            diff=math.atan2(dy,dx)-math.radians(q['angle']);err=abs(math.atan2(math.sin(diff),math.cos(diff)))
                            require(err<.09,f'Cursor direction mismatch on {edge["id"]} at {t}');direction_checks+=1
                report['cursor_direction_checks']=direction_checks
                for shape in ['circle','triangle','config']:
                    page.evaluate('(s)=>window.__setCursor(s)',shape)
                plan.export_previews(page);report.update(plan.metadata())
                if not a.check_only:
                    proc=subprocess.Popen(plan.command(a.ffmpeg,threads=4),stdin=subprocess.PIPE)
                    try:
                        for f in plan.indices:
                            page.evaluate('(t)=>window.__seek(t)',f/c['fps']);proc.stdin.write(plan.capture(page))
                            if f%(c['fps']*3)==0:print(f'FRAME {f}/{frames}',flush=True)
                        proc.stdin.close();require(proc.wait(timeout=120)==0,'FFmpeg encoding failed')
                    finally:
                        if proc.poll() is None:proc.kill();proc.wait()
            finally:browser.close()
        require(not errors,str(errors))
        if not a.check_only:
            plan.finish(a.ffmpeg,probe,dest,report)
        report['page_errors']=errors
    except Exception as e:
        report.update(error=str(e),page_errors=errors);raise
    finally:
        (source/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps({'source':str(source),'output':str(dest) if report['encoded'] else None,'verified':True},ensure_ascii=False),flush=True)


if __name__=='__main__':main()
