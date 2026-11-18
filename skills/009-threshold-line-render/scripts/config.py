"""Validate threshold contact, deterministic shards and independent race timing."""
import sys as _sys
_sys.dont_write_bytecode = True  # avoid __pycache__
import copy, math, re
def require(ok,msg):
    if not ok: raise ValueError(msg)
def num(v,name,lo=0,hi=1800):
    require(type(v) in (int,float) and math.isfinite(v) and lo<=v<=hi,f'{name} must be in [{lo}, {hi}]')
def txt(v,name):require(isinstance(v,str) and '\n' not in v and '\r' not in v,name+' must be a single-line string')
def color(v):require(isinstance(v,str) and re.fullmatch(r'#[0-9a-fA-F]{6}',v),'Use #RRGGBB colors: '+str(v))
def normalize(raw):
    require(isinstance(raw,dict),'Config must be object');c=copy.deepcopy(raw)
    c.setdefault('mode','both');require(c['mode'] in ['both','threshold','race'],'mode: both/threshold/race')
    front=c['mode']!='race';race=c['mode']!='threshold'
    c.setdefault('width',1920);c.setdefault('height',1080);c.setdefault('fps',24)
    for k in ['width','height']:require(type(c[k]) is int and 360<=c[k]<=3840 and c[k]%2==0,k+' must be even, 360–3840')
    require(abs(c['width']/c['height']-16/9)<.002,'16:9 only');require(c['fps'] in [24,25,30,60],'Unsupported fps')
    c['theme']=dict({'bg':'#0c1119','panel':'#17212d','line':'#2b3b49','ink':'#ecece4','muted':'#8b9aaa','red':'#ff6257','gold':'#e6ba78','mint':'#95d8bd','grid':'#182430','ruler':'#c7d0ca','rulerInk':'#31454b','pinDark':'#252a30','pinLight':'#fff0c8','pinMid':'#bd955d','pinShade':'#635644','cardFill':'#dce3df','cardBorder':'#f4f5ed','cardInk':'#21353e','cardMuted':'#637a7d','trackEdge':'#586c76','trackGrid':'#30444f','raceFill':'#17252e'},**c.get('theme',{}))
    c.setdefault('appearance','default');require(c['appearance'] in ['default','amber-night'],'appearance: default/amber-night')
    if c['appearance']=='amber-night':
        c['theme'].update(dict(bg='#323232',panel='#383838',line='#505050',ink='#FFFFFF',muted='#A3A3A3',red='#E4893A',gold='#F3BB66',mint='#F3BB66',grid='#3D3D3D',trackEdge='#868686',trackGrid='#505050',raceFill='#383838',cardFill='#383838',cardBorder='#E4893A',cardInk='#FFFFFF',cardMuted='#A3A3A3'))
        c['theme'].update(raw.get('theme',{}))
    for v in c['theme'].values():color(v)
    c['text']=dict({'title':'斩杀线标尺','subtitle':'标准改变，优势重写','eyebrow':'THRESHOLD / MOTION','footerLeft':'THE RULES HAVE CHANGED','footerRight':'机制示意 · 非真实模型排名','beforeCards':'三项标准，重新定义竞争门槛','afterCards':'触线之后，原有优势不再完整','raceTitle':'斩杀线，变成起跑线','raceReady':'标准重写，新的参与者进入同一场竞争','raceGo':'新一轮竞争，开始加速','readyLabel':'新的门槛','startLabel':'起跑线','readyTag':'READY','goTag':'START','entrantReady':'READY','entrantGo':'IN MOTION'},**c.get('text',{}))
    for k,v in c['text'].items():txt(v,'text.'+k)
    tl=dict({'frontDuration':15.2 if c['mode']=='both' else 16,'transition':1,'fadeIn':.45,'fadeOut':.8,'shake':1,'noteAt':6.5,'noteChangeAt':8,'phases':[]},**c.get('timeline',{}));c['timeline']=tl
    for k in ['frontDuration','transition','fadeIn','fadeOut','noteAt','noteChangeAt']:num(tl[k],k,0,600)
    num(tl['shake'],'shake',0,2)
    r=dict({'show':True,'min':0,'max':100,'step':2,'labelEvery':20,'decimals':0,'unit':'','label':'示意刻度','x':109,'width':131,'top':260,'bottom':860,'at':.25,'enter':1},**c.get('ruler',{}));c['ruler']=r
    if front:
        num(r['min'],'ruler.min',-1e6,1e6);num(r['max'],'ruler.max',r['min']+.001,1e6);num(r['step'],'step',.001,1e6);num(r['labelEvery'],'labelEvery',r['step'],1e6);require((r['max']-r['min'])/r['step']<=200,'Too many ruler ticks')
        require(type(r['decimals']) is int and 0<=r['decimals']<=3,'decimals 0–3');num(r['x'],'ruler.x',88,200);num(r['width'],'ruler.width',100,150);num(r['top'],'top',240,340);num(r['bottom'],'bottom',800,890);num(r['at'],'ruler.at',0,tl['frontDuration']);num(r['enter'],'ruler.enter',.1,5);txt(r['unit'],'unit');txt(r['label'],'ruler.label')
    th=dict({'value':40,'at':1.25,'draw':1.2,'width':6,'glow':18,'color':c['theme']['red'],'label':'斩杀线','subtitle':'THRESHOLD','right':1816},**c.get('threshold',{}));c['threshold']=th
    color(th['color'])
    th['y']=r['bottom']-(th['value']-r['min'])/(r['max']-r['min'])*(r['bottom']-r['top']) if front else 620;th['left']=r['x'] if front else 109
    if front:
        num(th['value'],'threshold.value',r['min'],r['max']);num(th['y'],'derived threshold y',440,720);num(th['at'],'threshold.at',0,tl['frontDuration']);num(th['draw'],'threshold.draw',.1,10);num(th['width'],'threshold.width',1,12);num(th['glow'],'threshold.glow',0,40);num(th['right'],'threshold.right',1700,1832);color(th['color']);txt(th['label'],'threshold.label');txt(th['subtitle'],'threshold.subtitle')
    c.setdefault('pins',[dict(x=x,at=at,label=label,sub=sub) for x,at,label,sub in [(480,3,'性能','CAPABILITY'),(1000,4.2,'开源','OPEN SOURCE'),(1520,5.4,'价格','COST')]])
    c.setdefault('cards',[dict(x=x,hit=hit,label=label,sub=sub,tag=tag) for x,hit,label,sub,tag in [(650,9.8,'模型 A','旧的性能优势','MODEL / 01'),(1090,11.4,'模型 B','封闭的技术壁垒','MODEL / 02'),(1530,13,'模型 C','高价服务溢价','MODEL / 03')]])
    if front:
        require(len(c['pins'])<=5 and len(c['cards'])<=12,'At most 5 pins and 12 cards')
        for p in c['pins']:
            p.setdefault('sub','');p.setdefault('drop',.5);p.setdefault('radius',25);p.setdefault('color',c['theme']['gold']);num(p['x'],'pin.x',340,1690);num(p['at'],'pin.at',th['at']+th['draw'],tl['frontDuration']-.1);num(p['drop'],'pin.drop',.1,min(2,p['at']));num(p['radius'],'pin.radius',15,35);color(p['color']);txt(p['label'],'pin.label');txt(p['sub'],'pin.sub')
        for a in c['cards']:
            a.setdefault('sub','');a.setdefault('tag','MODEL');a.setdefault('width',242);a.setdefault('height',152);a.setdefault('fall',1.6);a.setdefault('fill',c['theme']['cardFill']);a.setdefault('ink',c['theme']['cardInk']);a.setdefault('muted',c['theme']['cardMuted']);a.setdefault('border',c['theme']['cardBorder']);a.setdefault('radius',12)
            require(type(a['width']) is int and type(a['height']) is int,'Card dimensions must be integers');num(a['width'],'card.width',160,340);num(a['height'],'card.height',110,190);num(a['x'],'card.x',280+a['width']/2,1800-a['width']/2);num(a['hit'],'card.hit',th['at']+th['draw'],tl['frontDuration']-.1);num(a['fall'],'card.fall',.2,min(8,a['hit']));a.setdefault('startBottom',max(235+a['height'],th['y']-210));num(a['startBottom'],'startBottom',215+a['height'],th['y']-20);num(a['radius'],'radius',0,25)
            for k in ['label','sub','tag']:txt(a[k],k)
            for k in ['fill','ink','muted','border']:color(a[k])
    f=dict({'enabled':True,'columns':3,'rows':2,'jitter':.22,'seed':0,'spread':1.7,'lift':190,'gravity':600,'spin':3.7,'lifetime':2.4,'fade':1.3,'sparks':10},**c.get('fracture',{}));c['fracture']=f
    require(type(f['enabled']) is bool,'fracture.enabled boolean')
    for k in ['columns','rows']:require(type(f[k]) is int and 1<=f[k]<=8,k+' 1–8')
    require(type(f['seed']) is int,'seed integer');require(type(f['sparks']) is int and 0<=f['sparks']<=40,'sparks 0–40')
    for k,lo,hi in [('jitter',0,.35),('spread',0,5),('lift',0,500),('gravity',0,1800),('spin',0,12),('lifetime',.2,10),('fade',.1,10)]:num(f[k],k,lo,hi)
    require(f['fade']<=f['lifetime'],'fade exceeds fragment lifetime')
    ra=dict({'duration':12.8,'moveAt':.95,'moveDuration':2.05,'gridAt':1.55,'gridDuration':1.6,'titleAt':1.9,'goAt':4.8,'goDuration':.6,'startY':800,'left':190,'right':1730,'farY':360,'depth':540,'farWidth':100,'spread':700,'readyZ':1.08,'finishZ':.12,'endScale':.32,'color':c['theme']['mint'],'width':6,'glow':18,'cardWidth':226,'cardHeight':112,'lanes':[-1,-.32,.32,1]},**c.get('race',{}));c['race']=ra;ra['start']=tl['frontDuration'] if c['mode']=='both' else 0
    c.setdefault('entrants',[dict(lane=x,entryAt=2.5+i*.22,launch=5.4+i*.25,name='新方案 '+chr(65+i),color=col) for i,(x,col) in enumerate([(-.64,'#95d8bd'),(0,'#9bc6eb'),(.64,'#e6ba78')])])
    if race:
        ra.setdefault('trackStyle','classic');require(ra['trackStyle'] in ['classic','detailed'],'trackStyle: classic/detailed')
        for k in ['duration','moveAt','gridAt','titleAt','goAt']:num(ra[k],'race.'+k,0,600)
        for k in ['moveDuration','gridDuration','goDuration']:num(ra[k],k,.1,10)
        require(all(ra[k]+ra[d]<=ra['duration'] for k,d in [('moveAt','moveDuration'),('gridAt','gridDuration'),('goAt','goDuration')]),'Race transition exceeds duration')
        for k,lo,hi in [('startY',700,820),('left',100,300),('right',1600,1830),('farY',350,420),('depth',440,550),('farWidth',80,200),('spread',500,720),('readyZ',.9,1.12),('finishZ',.02,.25),('endScale',.2,.6),('width',1,12),('glow',0,40),('cardWidth',140,280),('cardHeight',80,130)]:num(ra[k],k,lo,hi)
        color(ra['color']);require(2<=len(ra['lanes'])<=8,'Use 2–8 lane boundaries');require(ra['lanes']==sorted(set(ra['lanes'])),'Lane boundaries sorted and unique');[num(v,'lane boundary',-1,1) for v in ra['lanes']]
        require(1<=len(c['entrants'])<=5,'Use 1–5 entrants');require(ra['farY']+ra['depth']*ra['readyZ']<=965,'Ready entrants exceed frame')
        for i,e in enumerate(c['entrants']):
            e.setdefault('type','card');require(e['type'] in ['card','pixel'],'entrant.type: card/pixel')
            if e['type']=='pixel':
                px=dict(size=1.35,crouchDuration=.55,crouchDepth=.25,turnDuration=.28,strideRate=12,blinkPeriod=3.6,blinkDuration=.14,hop=8,labelSize=30,eyeColor='#292B28')
                require(isinstance(e.get('pixel',{}),dict),'pixel must be object');require(not set(e.get('pixel',{}))-set(px),'Unknown pixel option');px.update(e.get('pixel',{}));e['pixel']=px
                for k,lo,hi in [('size',.8,1.6),('crouchDuration',0,1.2),('crouchDepth',0,.45),('turnDuration',.15,1),('strideRate',1,30),('blinkPeriod',.5,10),('blinkDuration',0,.4),('hop',0,12),('labelSize',22,42)]:num(px[k],'pixel.'+k,lo,hi)
                require(px['blinkDuration']<px['blinkPeriod'],'Blink longer than period');color(px['eyeColor'])
            height=88*e['pixel']['size'] if e['type']=='pixel' else ra['cardHeight']
            readyFront=ra['farY']+ra['depth']*ra['readyZ']-height;endFront=ra['farY']+ra['depth']*ra['finishZ']-height*ra['endScale']
            require(readyFront>ra['startY'] and endFront<ra['startY'],'Entrants must wait behind and finish beyond start line')
            e.setdefault('entryAt',2.5+i*.22);e.setdefault('entryDuration',1.1);e.setdefault('launch',5.4+i*.25);e.setdefault('travel',4.1);e.setdefault('color',c['theme']['mint']);num(e['lane'],'entrant.lane',-.82,.82);num(e['entryAt'],'entryAt',0,ra['duration']);num(e['entryDuration'],'entryDuration',.2,5);num(e['launch'],'launch',e['entryAt']+e['entryDuration'],ra['duration']);num(e['travel'],'travel',.3,30);require(e['launch']+e['travel']<=ra['duration'],'Entrant travel exceeds duration');require(e['launch']>=ra['goAt']+ra['goDuration']-1e-8,'Launch before start signal completes');color(e['color']);txt(e['name'],'entrant.name');e['at']=ra['start']+e['launch'];e['entryGlobal']=ra['start']+e['entryAt']
    c['duration']=(ra['start']+ra['duration']) if race else tl['frontDuration'];require(1<=c['duration']<=1800,'Duration 1–1800 seconds');require(tl['fadeIn']+tl['fadeOut']<c['duration'],'Fades exceed duration')
    if front:require(r['at']+r['enter']<=tl['frontDuration'] and th['at']+th['draw']<=tl['frontDuration'],'Front entrance exceeds duration')
    previous=-1
    for ph in tl['phases']:num(ph['at'],'phase.at',0,c['duration']);require(ph['at']>=previous,'Phases sorted');previous=ph['at'];txt(ph['text'],'phase.text')
    return c
