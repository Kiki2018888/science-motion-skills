"""Build a portable phone UI HTML preview and verified silent H.264 MP4."""
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
    ap.add_argument('--scale',type=int,choices=[1,2],default=1)
    ap.add_argument('--chrome',type=Path,default=default_chrome())
    ap.add_argument('--ffmpeg',type=Path,default=default_ffmpeg())
    add_arguments(ap);args=ap.parse_args();raw=json.loads(args.config.read_text(encoding='utf-8-sig'));c=normalize(raw)
    skill=Path(__file__).resolve().parents[1];dest=args.output.resolve();source=dest.parent/(dest.stem+'_source')
    required_suffix = '.webm' if args.alpha else '.mp4'
    require(dest.suffix.lower() == required_suffix, f'Output must end in {required_suffix} for the selected encoding')
    require(not dest.is_relative_to(skill) and not source.is_relative_to(skill),'Outputs must be outside skill directory')
    require(args.overwrite or not (dest.exists() or source.exists()),'Output/source exists; choose a new name or pass --overwrite')
    require(args.chrome.is_file(),'Chrome missing; pass --chrome')
    if not args.ffmpeg.is_file():
        found=shutil.which('ffmpeg');require(found,'FFmpeg missing; pass --ffmpeg');args.ffmpeg=Path(found)
    probe=args.ffmpeg.with_name('ffprobe'+args.ffmpeg.suffix);require(probe.is_file(),'ffprobe must be beside ffmpeg')
    manifest=[];prepared=[]
    holders=[c['background'],c['wallpaper']]+([c['chatBackground']] if c['chatBackground'] else [])
    holders += [{'holder':c['app'],'key':k} for k in ['icon','userAvatar','assistantAvatar']]
    holders += [{'holder':n,'key':'icon'} for n in c['notifications']]
    for entry in holders:
        holder=entry.get('holder',entry);key=entry.get('key','src')
        if not holder.get(key):continue
        p=(args.config.resolve().parent/holder[key]).resolve()
        require(p.is_file(),f'Asset missing: {p}');require(p.suffix.lower() in {'.png','.jpg','.jpeg','.webp','.svg'},'Use PNG/JPEG/WebP/SVG assets')
        digest=hashlib.sha256(p.read_bytes()).hexdigest();name=digest[:20]+p.suffix.lower();holder[key]='media/'+name
        prepared.append((p,name));manifest.append(dict(path=str(p),sha256=digest,bytes=p.stat().st_size))
    from playwright.sync_api import sync_playwright
    from PIL import Image,ImageDraw
    source.mkdir(parents=True,exist_ok=True)
    (source/'media').mkdir(exist_ok=True)
    for p,name in prepared:shutil.copy2(p,source/'media'/name)
    for name in ['index.html','engine.js','body.otf','OFL.txt']:
        shutil.copy2(skill/'assets/template'/name,source/name)
    for name,data in [('input.json',raw),('resolved.json',c),('assets.json',manifest)]:
        (source/name).write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    (source/'config.js').write_text('window.PHONE_CONFIG='+json.dumps(c,ensure_ascii=False)+';\n',encoding='utf-8')
    errors=[];plan=RenderPlan(args,c['duration'],c['fps'],c['width'],c['height'],source,args.config);frames=plan.count;pending=plan.pending
    report=dict(encoded=False,resolution=[c['width'],c['height']],fps=c['fps'],duration=frames/c['fps'],frames=frames,audio=False,theme=c['theme'],mode=c['display']['mode'],supersampling=args.scale)
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
                for m in c['messages']:
                    times.update([m['at']+.5,min(c['duration']-.1,m['end']+.35)])
                    if 'inputAt' in m:times.add((m['inputAt']+m['at'])/2)
                    if 'thinkingAt' in m:times.add((m['thinkingAt']+m['at'])/2)
                if c['lock']:times.update([c['lock']['at']+.3,c['lock']['wakeAt']+.65])
                for n in c['notifications']:times.add(n['at']+.75)
                times=sorted(t for t in times if 0<=t<c['duration'])
                selected=times if len(times)<=15 else [times[round(i*(len(times)-1)/14)] for i in range(15)]
                tw,th=(270,480) if c['height']>c['width'] else (480,270);cols=3
                sheet=Image.new('RGB',(cols*tw,math.ceil(len(selected)/cols)*(th+24)),'#e8e9e3');pen=ImageDraw.Draw(sheet)
                for i,t in enumerate(selected):
                    print(f'CHECK {t:.2f}',flush=True);page.evaluate('(t)=>window.__seek(t)',t)
                    im=Image.open(io.BytesIO(page.screenshot(type='jpeg',quality=94))).convert('RGB').resize((tw,th),Image.Resampling.LANCZOS)
                    x=i%cols*tw;y=i//cols*(th+24);sheet.paste(im,(x,y));pen.text((x+8,y+th+4),f'{t:.2f} s',fill='#183e33')
                sheet.save(source/'contact.jpg',quality=94)
                Image.open(io.BytesIO(page.screenshot(type='png'))).resize((c['width'],c['height']),Image.Resampling.LANCZOS).save(source/'poster.png')
                require(not page.evaluate('window.__issues'),str(page.evaluate('window.__issues')))
                for i,m in enumerate(c['messages']):
                    page.evaluate('(t)=>window.__seek(t)',m['end']+.1);st=page.evaluate('window.__inspect()')
                    require(st['messages'][i]['shown']==len(m['glyphs']),'Incomplete message '+str(i))
                for i,n in enumerate(c['notifications']):
                    page.evaluate('(t)=>window.__seek(t)',n['at']+.3);st=page.evaluate('window.__inspect()')
                    require(st['notifications'][i],'Missing notification '+str(i))
                    if n['kind']=='lock':require(st['phase']=='lock','Notification on wrong screen')
                if c['lock']:
                    page.evaluate('(t)=>window.__seek(t)',c['lock']['wakeAt']+.6)
                    require(page.evaluate('window.__inspect().phase')=='lock','Lock transition failed')
                checks=[selected[round(i*(len(selected)-1)/min(5,len(selected)-1))] for i in range(min(5,len(selected)-1)+1)]
                for t in checks:
                    page.evaluate('(t)=>window.__seek(t)',t);digest=hashlib.sha256(page.screenshot()).hexdigest()
                    page.evaluate('window.__seek(0)');page.evaluate('window.__seek(window.__dur)');page.evaluate('(t)=>window.__seek(t)',t)
                    require(digest==hashlib.sha256(page.screenshot()).hexdigest(),'Non-deterministic seek at '+str(t))
                require(not page.evaluate('window.__issues'),str(page.evaluate('window.__issues')))
                report.update(dialogue_complete=True,notifications_pass=True,lock_transition_pass=True,seek_pixels_pass=True,layout_pass=True,sample_times=selected)
                plan.export_previews(page);report.update(plan.metadata())
                if not args.check_only:
                    proc=subprocess.Popen(plan.command(args.ffmpeg,threads=4),stdin=subprocess.PIPE)
                    try:
                        for f in plan.indices:
                            page.evaluate('(t)=>window.__seek(t)',f/c['fps']);proc.stdin.write(plan.capture(page))
                            if f%(c['fps']*3)==0:print(f'FRAME {f}/{frames}',flush=True)
                        proc.stdin.close();require(proc.wait(timeout=120)==0,'FFmpeg failed')
                    finally:
                        if proc.poll() is None:proc.kill();proc.wait()
                require(not page.evaluate('window.__issues'),str(page.evaluate('window.__issues')))
            finally:browser.close()
        require(not errors,str(errors))
        if not args.check_only:
            plan.finish(args.ffmpeg,probe,dest,report)
        report['page_errors']=errors
    except Exception as e:
        report.update(error=str(e),page_errors=errors);raise
    finally:(source/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8')
    print(json.dumps(dict(source=str(source),output=str(dest) if report['encoded'] else None,verified=True),ensure_ascii=False),flush=True)


if __name__=='__main__':main()
