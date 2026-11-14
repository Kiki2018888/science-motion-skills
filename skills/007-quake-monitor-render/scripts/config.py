"""Validate configurable monitoring-screen modules and one global seconds timeline."""
import copy
import math


def require(ok, message):
    if not ok: raise ValueError(message)


def num(v, name, lo=0, hi=1800):
    require(isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(v) and lo<=v<=hi,
            f'{name} must be a finite number in [{lo}, {hi}]')
    return v


def normalize(raw):
    require(isinstance(raw,dict),'Config must be an object');c=copy.deepcopy(raw)
    c.setdefault('width',1920);c.setdefault('height',1080);c.setdefault('fps',24);c.setdefault('duration',28)
    for k in ['width','height']:require(type(c[k]) is int and 360<=c[k]<=3840 and c[k]%2==0,k+' must be even, 360–3840')
    require(abs(c['width']/c['height']-16/9)<.002,'Use a 16:9 canvas');require(c['fps'] in [24,25,30,60],'Invalid fps');num(c['duration'],'duration',1,1800);dur=c['duration']
    c.setdefault('layout','dashboard');require(c['layout'] in ['dashboard','map','calendar','magnitude','cracks','wave'],'Invalid layout')
    c['theme']=dict({'bg':'#090f16','panel':'#0d1922','line':'#233946','ink':'#e4edf0','muted':'#7d97a4','accent':'#ff654e','gold':'#e3be76','signal':'#79c6cd','land':'#203843','coast':'#486570','dots':'#54717b','grid':'#20333e','calendar':'#dfe8e7','calendarHeader':'#bf4c3c','calendarInk':'#18333d','calendarMuted':'#587278'},**c.get('theme',{}))
    c['text']=dict({'title':'事件监测中心','subtitle':'监测屏动效演示','online':'MONITOR ONLINE','hold':'PEAK HOLD','mapTitle':'全球事件监测','mapSubtitle':'WORLD / SCHEMATIC','waiting':'等待事件信号','detected':'已捕获事件脉冲','calendarTitle':'观察月份','calendarLabel':'月度观察','calendarFooter':'MONTHLY OBSERVATION','calendarNote':'月份翻页 / 连续推进','waveTitle':'事件脉冲','waveSubtitle':'DEMO SIGNAL','waveLive':'LIVE TRACE','waveHold':'PEAK HOLD','footerLeft':'EVENT OBSERVATORY','footerRight':'示意信号 · 非实测','rising':'强度上升','locked':'峰值锁定'},**c.get('text',{}))
    require(all(isinstance(v,str) for v in c['text'].values()),'Text fields must be strings')
    tl=dict({'fadeIn':.7,'fadeOut':.8,'phases':[]},**c.get('timeline',{}))
    num(tl['fadeIn'],'fadeIn',0,dur/2);num(tl['fadeOut'],'fadeOut',0,dur/2)
    prev=-1
    for p in tl['phases']:
        num(p['at'],'phase.at',0,dur);require(p['at']>=prev,'phases must be sorted');prev=p['at'];require(isinstance(p.get('text'),str),'phase.text required')
    c['timeline']=tl
    w=dict({'show':True,'noise':1,'speed':130,'maxAmplitude':74,'lineWidth':2.5,'glow':8,'wake':.7,'pulses':[],'holds':[]},**c.get('wave',{}))
    for k,lo,hi in [('noise',0,10),('speed',20,1000),('maxAmplitude',1,75),('lineWidth',.5,8),('glow',0,30),('wake',0,20)]:num(w[k],'wave.'+k,lo,hi)
    end=-1
    for h in w['holds']:
        num(h['at'],'hold.at',0,dur);num(h['until'],'hold.until',h['at']+.01,dur);require(h['at']>=end,'Wave holds must be sorted and disjoint');end=h['until']
    def clock(t):return t-sum(max(0,min(t,h['until'])-h['at']) for h in w['holds'])
    for p in w['pulses']:
        num(p['at'],'pulse.at',0,dur);require(not any(h['at']<=p['at']<h['until'] for h in w['holds']),'Pulse cannot start during a wave hold')
        p.setdefault('amplitude',50);p.setdefault('width',.22);p.setdefault('frequency',45)
        num(p['amplitude'],'pulse.amplitude',0,500);num(p['width'],'pulse.width',.03,4);num(p['frequency'],'pulse.frequency',2,150);p['clockAt']=clock(p['at'])
    c['wave']=w
    m=dict({'show':True,'kind':'schematic','grid':True,'scanAt':.5,'scanDuration':5,'bounds':[-180,180,-63,82],'events':[]},**c.get('map',{}))
    require(m['kind'] in ['schematic','image'],'map.kind must be schematic or image')
    if m['kind']=='image':require(isinstance(m.get('src'),str) and m['src'],'Image map needs src')
    b=m['bounds'];require(isinstance(b,list) and len(b)==4,'bounds=[west,east,south,north]')
    for v in b:num(v,'bounds',-360,360)
    require(b[0]<b[1] and b[2]<b[3],'Invalid map bounds')
    num(m['scanAt'],'scanAt',0,dur);num(m['scanDuration'],'scanDuration',0,120)
    ids=set()
    for i,e in enumerate(m['events']):
        e.setdefault('id',f'event-{i+1}');require(isinstance(e['id'],str) and e['id'] not in ids,'Event IDs must be unique');ids.add(e['id'])
        num(e['at'],'event.at',0,dur);e.setdefault('until',dur);num(e['until'],'event.until',e['at']+.2,dur)
        if 'position' in e:
            require(isinstance(e['position'],list) and len(e['position'])==2,'position=[x,y]');[num(v,'position',0,1) for v in e['position']]
        else:
            num(e.get('lon'),'event.lon',b[0],b[1]);num(e.get('lat'),'event.lat',b[2],b[3]);e['position']=[(e['lon']-b[0])/(b[1]-b[0]),(b[3]-e['lat'])/(b[3]-b[2])]
        e.setdefault('label',e['id']);e.setdefault('subtitle','EVENT DETECTED');e.setdefault('color',c['theme']['accent'])
        e.setdefault('rings',4);require(type(e['rings']) is int and 0<=e['rings']<=12,'rings must be 0–12')
        e.setdefault('ringInterval',.43);e.setdefault('ringDuration',3.1);e.setdefault('radius',278);e.setdefault('pointSize',6)
        for k,lo,hi in [('ringInterval',.05,10),('ringDuration',.2,30),('radius',10,800),('pointSize',2,20)]:num(e[k],'event.'+k,lo,hi)
        e.setdefault('offset',[-240,-60] if e['position'][0]>.72 else [80,-60]);require(len(e['offset'])==2,'offset=[dx,dy]');[num(v,'offset',-600,600) for v in e['offset']]
        require(isinstance(e['label'],str) and isinstance(e['subtitle'],str),'Event label/subtitle must be strings')
    c['map']=m
    cal=dict({'show':True,'year':2026,'month':1,'flipDuration':.62,'markers':[1,2,3,4,5,6],'changes':[]},**c.get('calendar',{}))
    require(type(cal['year']) is int and 1<=cal['year']<=9999,'year must be 1–9999');require(type(cal['month']) is int and 1<=cal['month']<=12,'month must be 1–12')
    num(cal['flipDuration'],'flipDuration',.1,5);require(0<=len(cal['markers'])<=12 and all(type(v) is int and 1<=v<=12 for v in cal['markers']),'markers must contain months 1–12')
    prev=-100
    year=cal['year']
    for change in cal['changes']:
        num(change['at'],'calendar.at',0,dur-cal['flipDuration']);require(change['at']-prev>=cal['flipDuration']-1e-7,'Calendar flips overlap');prev=change['at']
        require(type(change['month']) is int and 1<=change['month']<=12,'month must be 1–12');change.setdefault('year',year);year=change['year'];require(type(year) is int and 1<=year<=9999,'Invalid change year')
    c['calendar']=cal
    c.setdefault('magnitudes',[]);end=-1
    for r in c['magnitudes']:
        num(r['at'],'magnitude.at',0,dur);r.setdefault('rise',1.6);num(r['rise'],'rise',.1,60);r.setdefault('hold',3.2);num(r['hold'],'magnitude.hold',.2,120);r.setdefault('fade',.4);num(r['fade'],'magnitude.fade',.05,10)
        r['lockAt']=r['at']+r['rise'];r['until']=r['lockAt']+r['hold']+r['fade'];require(r['at']>=end and r['until']<=dur+1e-7,'Magnitude panels must be disjoint and within duration');end=r['until']
        num(r['value'],'magnitude.value',0,999999);r.setdefault('from',0);num(r['from'],'magnitude.from',0,999999);r.setdefault('decimals',1);require(type(r['decimals']) is int and 0<=r['decimals']<=3,'decimals 0–3')
        r.setdefault('unit','级');r.setdefault('title','主震强度');r.setdefault('subtitle','DEMONSTRATION');r.setdefault('color',c['theme']['accent'])
    c.setdefault('badges',[])
    for badge in c['badges']:
        num(badge['at'],'badge.at',0,dur);badge.setdefault('until',dur);num(badge['until'],'badge.until',badge['at']+.3,dur)
        badge.setdefault('duration',.42);num(badge['duration'],'badge.duration',.1,3);require(badge['at']+badge['duration']<=badge['until'],'Badge entrance exceeds visibility')
        badge.setdefault('text','本月最强震');badge.setdefault('subtitle','MONTHLY PEAK');badge.setdefault('color',c['theme']['accent']);badge.setdefault('shape','box');require(badge['shape'] in ['box','circle'],'badge.shape box or circle')
        badge.setdefault('center',[1070,534]);require(len(badge['center'])==2,'badge center=[x,y]');num(badge['center'][0],'badge.x',400,1150);num(badge['center'][1],'badge.y',360,650)
        badge.setdefault('angle',-7.5);num(badge['angle'],'badge.angle',-25,25);badge.setdefault('flash',.13);num(badge['flash'],'flash',0,.2)
    crack=dict({'show':False,'at':20,'duration':5.2,'until':dur,'fade':.7,'title':'引线，仍在延伸','subtitle':'GROWING FRACTURE','color':c['theme']['accent'],'coreColor':'#ffdcaa','width':3.1,'glow':20,'grid':True,'paths':[]},**c.get('cracks',{}))
    if crack['show']:
        num(crack['at'],'cracks.at',0,dur);num(crack['duration'],'cracks.duration',.2,120);num(crack['until'],'cracks.until',crack['at']+crack['duration'],dur);num(crack['fade'],'cracks.fade',.05,5)
        num(crack['width'],'cracks.width',.5,12);num(crack['glow'],'cracks.glow',0,50)
        paths=crack['paths']
        if not paths:
            coords=[[[765,790],[752,734],[783,680],[748,620],[784,570],[760,519],[797,467],[778,412],[813,354]],[[783,680],[700,660],[644,620],[575,610],[528,561],[461,545],[410,493]],[[784,570],[872,551],[928,511],[1011,500],[1064,445],[1144,422]],[[644,620],[630,680],[571,711],[540,771]],[[928,511],[964,564],[1032,580],[1095,635],[1161,642]],[[778,412],[710,391],[671,346],[597,323]],[[1064,445],[1055,398],[1085,357]]]
            parents=[None,'p0','p0','p1','p2','p0','p2']
            paths=[dict(id=f'p{i}',parent=parents[i],points=[[(x-120)/1240,(y-320)/480] for x,y in pts]) for i,pts in enumerate(coords)];crack['paths']=paths
        require(1<=len(paths)<=60,'Use 1–60 crack paths');seen={}
        for i,p in enumerate(paths):
            p.setdefault('id',f'path-{i}');require(p['id'] not in seen,'Duplicate crack ID');pts=p.get('points');require(isinstance(pts,list) and len(pts)>=2,'Crack needs at least two points')
            for point in pts:
                require(isinstance(point,list) and len(point)==2,'Crack point=[x,y]');[num(v,'crack point',0,1) for v in point]
            lengths=[math.hypot((b[0]-a[0])*1240,(b[1]-a[1])*480) for a,b in zip(pts,pts[1:])];require(all(v>0 for v in lengths),'Consecutive crack points must differ')
            p['start']=0
            if p.get('parent'):
                require(p['parent'] in seen,'Parent crack must appear before child');par=seen[p['parent']];require(pts[0] in par['points'],'Branch first point must equal a parent vertex');idx=par['points'].index(pts[0]);fraction=sum(par['lengths'][:idx])/sum(par['lengths']);p['start']=par['start']+(1-par['start'])*fraction+.012;require(p['start']<.99,'Branch joins too late; attach before parent endpoint')
            p['lengths']=lengths;seen[p['id']]=p
    c['cracks']=crack
    require(not any(crack['show'] and r['at']<crack['until'] and r['until']>crack['at'] for r in c['magnitudes']),'Magnitude and crack panels overlap; schedule them separately')
    require(c['layout']!='magnitude' or c['magnitudes'],'Magnitude layout needs a magnitude event')
    require(c['layout']!='cracks' or crack['show'],'Crack layout needs cracks.show=true')
    return c
