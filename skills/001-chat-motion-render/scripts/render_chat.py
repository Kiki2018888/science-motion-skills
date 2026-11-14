"""Single-job local chat renderer. Templates are read-only; no network API or credentials."""
from pathlib import Path
from runtime import default_chrome, default_ffmpeg
import argparse,concurrent.futures,functools,http.server,io,json,math,os,shutil,subprocess,threading

def require(ok,message):
 if not ok:raise ValueError(message)

def normalize(raw):
 require(isinstance(raw,dict),'Config must be an object')
 cfg={'aspect':'portrait','theme':'wechat','mode':'pop','title':'对话记录','cps':15,'readHold':.55,'popHold':1.45,'tail':1.2,**raw}
 for key,values in {'aspect':['portrait','landscape'],'theme':['wechat','claude','chatgpt','minimal'],'mode':['type','pop']}.items():require(cfg[key] in values,f'Invalid {key}')
 for key in ['cps','readHold','popHold','tail']:
  value=cfg[key];require(type(value) in (int,float) and math.isfinite(value) and (value>0 if key=='cps' else value>=0),f'Invalid {key}')
 for key in ['title','chatTitle','eyebrow']:
  if key in cfg:require(isinstance(cfg[key],str),f'{key} must be text')
 if 'showLabels' in cfg:require(type(cfg['showLabels']) is bool,'showLabels must be boolean')
 require(isinstance(cfg.get('messages'),list) and len(cfg['messages'])>0,'messages must be a nonempty array')
 for i,m in enumerate(cfg['messages']):
  require(isinstance(m,dict),f'message {i+1} must be object');require(m.get('side') in ['left','right'],f'message {i+1}: side must be left/right');require(isinstance(m.get('text'),str) and m['text'].strip(),f'message {i+1}: empty text')
  for key in ['name','avatar']:
   if key in m:require(isinstance(m[key],str),f'message {i+1}: {key} must be text')
  if 'mode' in m:require(m['mode'] in ['pop','type'],f'message {i+1}: invalid mode')
  for key in ['cps','hold','start']:
   if key in m:require(type(m[key]) in (int,float) and math.isfinite(m[key]) and (m[key]>0 if key=='cps' else m[key]>=0),f'message {i+1}: invalid {key}')
 cfg['longMessages']=cfg['messages'];return cfg

def main():
 parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--config',type=Path,required=True);parser.add_argument('--output',type=Path,required=True);parser.add_argument('--fps',type=int,choices=[24,30],default=24);parser.add_argument('--check-only',action='store_true');parser.add_argument('--overwrite',action='store_true');parser.add_argument('--chrome',type=Path);parser.add_argument('--ffmpeg',type=Path);args=parser.parse_args()
 cfg=normalize(json.loads(args.config.read_text(encoding='utf-8-sig')));dest=args.output.resolve();require(dest.suffix.lower()=='.mp4','Output must end in .mp4');source=dest.parent/(dest.stem+'_source');skill=Path(__file__).resolve().parents[1];template=skill/'assets/template'
 require(args.overwrite or not(dest.exists() or source.exists()),'Output or source directory exists; use a new version name or --overwrite')
 require(not dest.is_relative_to(skill) and not source.is_relative_to(skill),'Do not write output into the installed skill')
 chrome=args.chrome or default_chrome()
 ff=args.ffmpeg or default_ffmpeg()
 if not ff.exists():
  found=shutil.which('ffmpeg');require(found is not None,'FFmpeg missing; pass --ffmpeg');ff=Path(found)
 probe=ff.with_name('ffprobe'+ff.suffix);require(chrome.is_file(),'Chrome missing; pass --chrome');require(probe.is_file(),'ffprobe missing next to ffmpeg')
 from playwright.sync_api import sync_playwright
 from PIL import Image,ImageDraw,ImageFont
 dest.parent.mkdir(parents=True,exist_ok=True);source.mkdir(exist_ok=True)
 for name in ['index.html','engine.js','styles.css','body.otf','OFL.txt']:shutil.copy2(template/name,source/name)
 (source/'input.json').write_text(json.dumps(cfg,ensure_ascii=False,indent=2),encoding='utf-8');(source/'dialogue.js').write_text('window.CHAT_CONFIG='+json.dumps(cfg,ensure_ascii=False)+';\n',encoding='utf-8')
 class Handler(http.server.SimpleHTTPRequestHandler):
  def log_message(self,*a):pass
 server=http.server.ThreadingHTTPServer(('127.0.0.1',0),functools.partial(Handler,directory=str(source)));threading.Thread(target=server.serve_forever,daemon=True).start();url=f'http://127.0.0.1:{server.server_port}/index.html?cap=1'
 width,height=(1080,1920) if cfg['aspect']=='portrait' else (1920,1080);errors=[];pending=source/'render.pending.mp4';report={}
 try:
  with sync_playwright() as pw:
   browser=pw.chromium.launch(executable_path=str(chrome),headless=True,args=['--disable-gpu']);page=browser.new_page(viewport={'width':width,'height':height});page.on('pageerror',lambda e:errors.append(str(e)))
   try:
    page.goto(url);page.wait_for_function('window.__ready===true');require(not errors,str(errors));timeline=page.evaluate('window.CHAT_TIMELINE');duration=page.evaluate('window.__dur');require(math.isfinite(duration) and duration>0,'Invalid duration')
    for i,r in enumerate(timeline):
     if i:require(r['start']>=timeline[i-1]['end'],f'Message {i+1} begins before previous message finishes; adjust start')
    frames=math.ceil(duration*args.fps);shot_ids=sorted(set([0,len(timeline)-1]+[round(i*(len(timeline)-1)/5) for i in range(6)]));tw,th=(270,480) if width<height else (480,270);sheet=Image.new('RGB',(tw*min(3,len(shot_ids)),(th+28)*math.ceil(len(shot_ids)/3)),'#f0f0ee');draw=ImageDraw.Draw(sheet)
    bad=page.evaluate('''()=>[...document.querySelectorAll('.row')].map((r,i)=>{const e=r.querySelector('.reserve');return {index:i+1,tooWide:e.scrollWidth>e.clientWidth+1,tooTall:r.offsetHeight>document.querySelector('#clip').clientHeight-48}}).filter(x=>x.tooWide||x.tooTall)''');require(not bad,'Messages do not fit; split at sentence boundaries: '+json.dumps(bad))
    heading=page.evaluate('()=>{let a=document.querySelector("h1").getBoundingClientRect(),b=document.querySelector(".chat").getBoundingClientRect();return a.bottom<b.top&&a.right<=document.querySelector(".heading").getBoundingClientRect().right}');require(heading,'Title does not fit; use a shorter title')
    for si,i in enumerate(shot_ids):
     r=timeline[i];t=r['end']+min(r['hold'],.4);page.evaluate('(t)=>window.__seek(t)',t);state=page.evaluate('window.__inspect()');require(state['messages'][i]['text']==cfg['messages'][i]['text'],f'Message {i+1} lost text')
     bounds=page.locator('#clip').bounding_box();box=state['messages'][i]['box'];require(box['top']>=bounds['y']-1 and box['bottom']<=bounds['y']+bounds['height']+1,f'Message {i+1} clipped after entrance')
     im=Image.open(io.BytesIO(page.screenshot())).convert('RGB');im.thumbnail((tw,th));x=(si%3)*tw;y=(si//3)*(th+28);sheet.paste(im,(x,y));draw.text((x+8,y+th+5),f'{i+1:02d}  {t:.2f}s',fill='#333')
    sheet.save(source/'contact.jpg',quality=94)
    seek_at=timeline[-1]['end']+.01;page.evaluate('(t)=>window.__seek(t)',seek_at);state=page.evaluate('window.__inspect()');page.evaluate('(t)=>window.__seek(t)',0);page.evaluate('(t)=>window.__seek(t)',seek_at);require(state==page.evaluate('window.__inspect()'),'Seek is not deterministic')
    report={'aspect':cfg['aspect'],'theme':cfg['theme'],'mode':cfg['mode'],'resolution':[width,height],'fps':args.fps,'duration_seconds':frames/args.fps,'frames':frames,'messages':len(timeline),'timeline':timeline,'layout_pass':True,'seek_pass':True,'audio':False,'encoded':False}
    if not args.check_only:
     proc=subprocess.Popen([str(ff),'-y','-v','error','-f','image2pipe','-framerate',str(args.fps),'-i','-','-an','-c:v','libx264','-threads','2','-preset','fast','-crf','18','-pix_fmt','yuv420p','-movflags','+faststart',str(pending)],stdin=subprocess.PIPE)
     try:
      for f in range(frames):
       page.evaluate('(t)=>window.__seek(t)',f/args.fps);proc.stdin.write(page.screenshot(type='jpeg',quality=96))
       if f%(args.fps*5)==0:print(f'FRAME {f}/{frames}',flush=True)
      proc.stdin.close();require(proc.wait(timeout=120)==0,'FFmpeg failed')
     finally:
      if proc.poll() is None:proc.kill()
   finally:browser.close()
  require(not errors,str(errors));report['page_errors']=errors
  if not args.check_only:
   data=json.loads(subprocess.run([str(probe),'-v','error','-show_streams','-of','json',str(pending)],check=True,capture_output=True,text=True,encoding='utf-8').stdout);streams=data['streams'];v=streams[0];require(len(streams)==1 and v['codec_name']=='h264' and v['width']==width and v['height']==height and int(v['nb_frames'])==frames,'Unexpected output format')
   decoded=subprocess.run([str(ff),'-v','error','-i',str(pending),'-f','null',os.devnull],check=True,capture_output=True);require(not decoded.stderr,'Decode reported errors');pending.replace(dest);report.update(encoded=True,full_decode_pass=True,file_bytes=dest.stat().st_size,output=str(dest))
  (source/'report.json').write_text(json.dumps(report,ensure_ascii=False,indent=2),encoding='utf-8');print(json.dumps({'output':str(dest) if not args.check_only else None,'source':str(source),'duration':report['duration_seconds'],'verified':True},ensure_ascii=False),flush=True)
 finally:server.shutdown();server.server_close()

if __name__=='__main__':main()
