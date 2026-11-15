"""Build a portable layer explosion preview and verified silent H.264 MP4."""
import argparse
import hashlib
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
    ap.add_argument('--scale',type=int,choices=[1,2],default=1)
    ap.add_argument('--chrome',type=Path,default=default_chrome())
    ap.add_argument('--ffmpeg',type=Path,default=default_ffmpeg())
    add_arguments(ap);a=ap.parse_args();raw=json.loads(a.config.read_text(encoding='utf-8-sig'));c=normalize(raw)
    skill=Path(__file__).resolve().parents[1];dest=a.output.resolve();source=dest.parent/(dest.stem+'_source')
    require(dest.suffix.lower()=='.mp4','Output must be .mp4')
    require(not dest.is_relative_to(skill) and not source.is_relative_to(skill),'Outputs must be outside skill directory')
    require(a.overwrite or not (dest.exists() or source.exists()),'Output/source exists; choose a new name or pass --overwrite')
    require(a.chrome.is_file(),'Chrome missing; pass --chrome')
    if not a.ffmpeg.is_file():
        found=shutil.which('ffmpeg');require(found,'FFmpeg missing; pass --ffmpeg');a.ffmpeg=Path(found)
    probe=a.ffmpeg.with_name('ffprobe'+a.ffmpeg.suffix);require(probe.is_file(),'ffprobe must be beside ffmpeg')
    manifest=[];prepared=[]
    for holder in [c['background']]+[l['texture'] for l in c['layers']]:
        if holder.get('type',holder.get('kind'))!='image':continue
        p=(a.config.resolve().parent/holder['src']).resolve()
        require(p.is_file(),f'Asset missing: {p}');require(p.suffix.lower() in {'.png','.jpg','.jpeg','.webp','.svg'},'Use PNG/JPEG/WebP/SVG images')
        digest=hashlib.sha256(p.read_bytes()).hexdigest();name=digest[:20]+p.suffix.lower();holder['src']='media/'+name
        prepared.append((p,name));manifest.append(dict(path=str(p),sha256=digest,bytes=p.stat().st_size))
    from playwright.sync_api import sync_playwright
    from PIL import Image,ImageDraw
    source.mkdir(parents=True,exist_ok=True);(source/'media').mkdir(exist_ok=True)
    for p,name in prepared:shutil.copy2(p,source/'media'/name)
    for name in ['index.html','engine.js','body.otf','OFL.txt']:shutil.copy2(skill/'assets/template'/name,source/name)
    for name,data in [('input.json',raw),('resolved.json',c),('assets.json',manifest)]:
        (source/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    (source/'config.js').write_text('window.LAYER_CONFIG='+json.dumps(c,ensure_ascii=False)+';\n',encoding='utf-8')
    plan=RenderPlan(a,c['duration'],c['fps'],c['width'],c['height'],source,a.config);frames=plan.count;pending=plan.pending;errors=[]
    report=dict(encoded=False,resolution=[c['width'],c['height']],fps=c['fps'],duration=frames/c['fps'],frames=frames,audio=False,layers=len(c['layers']),direction=c['motion']['direction'],supersampling=a.scale)
    try:
        with sync_playwright() as pw:
            browser=pw.chromium.launch(executable_path=str(a.chrome),headless=True,args=['--allow-file-access-from-files'])
            try:
                page=browser.new_page(viewport=dict(width=c['width'],height=c['height']),device_scale_factor=a.scale)
                page.on('pageerror',lambda e:errors.append(str(e)))
                page.route('http://**/*',lambda r:r.abort());page.route('https://**/*',lambda r:r.abort())
                page.goto((source/'index.html').as_uri()+'?cap=1');page.wait_for_function('window.__ready===true || window.__buildError',timeout=30000)
                require(not errors and not page.evaluate('window.__buildError'),str(errors or page.evaluate('window.__buildError')))
                tl=c['timeline'];times={0,tl['intro']+tl['explode']*.6,tl['openEnd']+.2,tl['closeAt'],max(0,c['duration']-.1)}
                times.update((f['start']+f['end'])/2 for f in tl['focus'])
                if tl['reassemble']:times.add(tl['closeAt']+tl['assemble']*.5)
                selected=sorted(t for t in times if t<c['duration'])
                if len(selected)>15:selected=[selected[round(i*(len(selected)-1)/14)] for i in range(15)]
                sheet=Image.new('RGB',(1440,math.ceil(len(selected)/2)*432),'#e8e9e3');pen=ImageDraw.Draw(sheet)
                for i,t in enumerate(selected):
                    print(f'CHECK {t:.2f}',flush=True);page.evaluate('(t)=>window.__seek(t)',t)
                    im=Image.open(io.BytesIO(page.screenshot(type='jpeg',quality=95))).convert('RGB').resize((720,405),Image.Resampling.LANCZOS)
                    x=i%2*720;y=i//2*432;sheet.paste(im,(x,y));pen.text((x+10,y+410),f'{t:.2f} s',fill='#183e33')
                sheet.save(source/'contact.jpg',quality=95)
                page.evaluate('(t)=>window.__seek(t)',tl['openEnd']+min(.6,tl['hold']))
                Image.open(io.BytesIO(page.screenshot())).resize((c['width'],c['height']),Image.Resampling.LANCZOS).save(source/'poster.png')
                require(not page.evaluate('window.__issues'),str(page.evaluate('window.__issues')))
                states=page.evaluate('[window.__stateAt(0),window.__stateAt(window.LAYER_CONFIG.timeline.openEnd),window.__stateAt(window.__dur)]')
                for i,l in enumerate(c['layers']):
                    require(all(abs(states[0]['layers'][i][k]-l['home'][j])<1e-7 for j,k in enumerate(['x','y'])),'Wrong home pose')
                    require(all(abs(states[1]['layers'][i][k]-l['open'][j])<1e-7 for j,k in enumerate(['x','y'])),'Wrong open pose')
                    end=l['home'] if tl['reassemble'] else l['open']
                    require(all(abs(states[2]['layers'][i][k]-end[j])<1e-7 for j,k in enumerate(['x','y'])),'Wrong final pose')
                for f in tl['focus']:
                    st=page.evaluate('(t)=>window.__stateAt(t)',(f['start']+f['end'])/2)
                    require(c['layers'][st['active']]['id']==f['layer'] and st['focus']>.9,'Wrong focus layer')
                for t in selected:
                    page.evaluate('(t)=>window.__seek(t)',t);digest=hashlib.sha256(page.screenshot()).hexdigest()
                    page.evaluate('window.__seek(window.__dur)');page.evaluate('window.__seek(0)');page.evaluate('(t)=>window.__seek(t)',t)
                    require(digest==hashlib.sha256(page.screenshot()).hexdigest(),'Non-deterministic seek at '+str(t))
                report.update(pose_pass=True,focus_pass=True,seek_pixels_pass=True,layout_pass=True,sample_times=selected)
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
