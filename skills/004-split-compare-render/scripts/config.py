"""Validate configuration and build one shared comparison clock."""
import copy
import math


def require(ok, message):
    if not ok: raise ValueError(message)


def num(v, name, low=None):
    require(isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(v),name+' must be finite')
    require(low is None or v>=low,name+' is below minimum')
    return v


def points(data,name):
    require(isinstance(data,list) and len(data)>0,name+' needs points')
    last=-1
    for p in data:
        num(p.get('at'),name+'.at',0);num(p.get('value'),name+'.value')
        require(p['at']>last,name+' times must be strictly increasing');last=p['at']


def normalize(raw):
    c=copy.deepcopy(raw);c.setdefault('width',1920);c.setdefault('height',1080);c.setdefault('fps',24)
    for k in ['width','height']:require(isinstance(c[k],int) and c[k]>=320 and c[k]%2==0,k+' must be an even integer >= 320')
    require(abs(c['width']/c['height']-16/9)<.002,'This template uses a 16:9 side-by-side canvas')
    require(c['fps'] in [24,25,30,60],'fps must be 24,25,30,60')
    c['theme']={**dict(background='#f5f4ed',ink='#1c354a',muted='#78858d',rule='#dce0dd',panel='#fdfdf8',left='#3c7e97',right='#c68b3c',banner='#e8edf0',pause='#f0e7d7',summary='#e6ece7'),**c.get('theme',{})}
    c['text']={**dict(badge='对照实验双屏',kicker='',title='同一条件下，比较不同结果',subtitle='',note='示意演示',clock='共同时间轴',clockUnit='s',ready='准备',running='同步播放',paused='暂停对照',finished='播放结束',sync='两边使用同一时间轴',introTitle='先看共同起点',introSubtitle='',runTitle='同步观察两边的变化',runSubtitle='',summaryTitle='比较最终差异',summarySubtitle='',footer='',footerRight='同步开始 → 暂停对照 → 突出差异'),**c.get('text',{})}
    require(all(isinstance(v,str) for v in c['text'].values()),'text values must be strings')
    tl=c.setdefault('timeline',{});num(tl.get('duration'),'timeline.duration',.001)
    tl.setdefault('rate',1);num(tl['rate'],'timeline.rate',.001)
    for k,default in [('intro',2),('outro',3)]:tl.setdefault(k,default);num(tl[k],k,0)
    tl.setdefault('segments',[{'to':tl['duration'],'rate':tl['rate']}]);previous=0
    for seg in tl['segments']:
        num(seg.get('to'),'segment.to',0);num(seg.get('rate'),'segment.rate',.001)
        require(previous<seg['to']<=tl['duration'],'Segments must increase to duration');seg['from']=previous;previous=seg['to']
    require(abs(previous-tl['duration'])<1e-9,'Last segment.to must equal duration')
    tl.setdefault('pauses',[]);last=-1
    for i,p in enumerate(tl['pauses']):
        num(p.get('at'),'pause.at',0);num(p.get('hold'),'pause.hold',.001)
        require(last<p['at']<=tl['duration'],'Pauses must be unique, sorted, within duration');last=p['at']
        p.setdefault('title','同一时刻，暂停比较');p.setdefault('subtitle','');p['index']=i
    pauses={p['at']:p for p in tl['pauses']};boundaries=sorted(set([0,tl['duration']]+[s['to'] for s in tl['segments']]+list(pauses)))
    steps=[];out=0
    def add(phase,dur,start,end,pause=-1):
        nonlocal out
        if dur<=0:return
        steps.append(dict(phase=phase,start=out,end=out+dur,fromTime=start,toTime=end,pause=pause));out+=dur
    add('intro',tl['intro'],0,0)
    if 0 in pauses:add('pause',pauses[0]['hold'],0,0,pauses[0]['index'])
    for a,b in zip(boundaries,boundaries[1:]):
        rate=next(s['rate'] for s in tl['segments'] if s['from']<=a<s['to'])
        add('run',(b-a)/rate,a,b)
        if b in pauses:add('pause',pauses[b]['hold'],b,b,pauses[b]['index'])
    add('outro',tl['outro'],tl['duration'],tl['duration']);c['steps']=steps;c['duration']=out
    require(out<=1800,'Output exceeds 30 minutes; split the job')
    c['chart']={**dict(min=0,max=100,unit=''),**c.get('chart',{})}
    if 'min' in c['chart'] and 'max' in c['chart']:
        num(c['chart']['min'],'chart.min');num(c['chart']['max'],'chart.max');require(c['chart']['max']>c['chart']['min'],'Invalid chart range')
    for side in ['left','right']:
        p=c.get(side);require(isinstance(p,dict),side+' panel required')
        p.setdefault('label','A' if side=='left' else 'B');p.setdefault('title',side);p.setdefault('condition','');p.setdefault('footer','')
        m=p.get('media',{});kind=m.get('kind');require(kind in ['fall','image','video','sequence','chart'],'Unsupported '+side+' media.kind')
        m.setdefault('fit','contain');require(m['fit'] in ['contain','cover'],'fit must be contain or cover')
        m.setdefault('background',c['theme']['panel']);m.setdefault('start',0);m.setdefault('rate',1)
        num(m['start'],'media.start',0);num(m['rate'],'media.rate',.001)
        m.setdefault('end','error');require(m['end'] in ['error','hold'],'media.end must be error or hold')
        if kind in ['image','video']:require(isinstance(m.get('src'),str) and m['src'],'media.src required')
        if kind=='sequence':
            require(m.get('frames'),'sequence.frames required');last=-1
            for f in m['frames']:
                num(f.get('at'),'frame.at',0);require(f['at']>last,'Sequence times must increase');last=f['at'];require(isinstance(f.get('src'),str),'frame.src required')
            require(m['frames'][0]['at']==0,'Sequence starts at 0')
        if kind=='fall':
            for k,d in [('mass',1),('g',9.8),('height',20),('drag',0),('traceInterval',.25)]:m.setdefault(k,d);num(m[k],k,0 if k=='drag' else .000001)
            m.setdefault('ballColor','#e6a850');m.setdefault('releaseLabel','释放线');m.setdefault('landedLabel','已落地');m.setdefault('velocityPrefix','v = ')
            require(m['start']==0 and m['rate']==1,'Fall mode uses the shared clock directly')
        if kind=='chart':
            points(m.get('values'),side+'.chart');require(m['values'][0]['at']==0 and m['values'][-1]['at']>=tl['duration'],'Chart points must cover scenario duration')
            require(all(c['chart']['min']<=p['value']<=c['chart']['max'] for p in m['values']),'Chart value outside shared range')
        p.setdefault('metrics',[])
        for metric in p['metrics']:
            require(isinstance(metric.get('id'),str),'metric.id required');metric.setdefault('label',metric['id']);metric.setdefault('unit','');metric.setdefault('decimals',2)
            metric.setdefault('interpolation','linear');require(metric['interpolation'] in ['linear','step'],'metric.interpolation must be linear or step')
            require(isinstance(metric['decimals'],int) and 0<=metric['decimals']<=6,'decimals must be 0–6')
            if 'values' in metric:
                points(metric['values'],'metric');require(metric['values'][0]['at']==0 and metric['values'][-1]['at']>=tl['duration'],'Metric points must cover duration')
            else:require(kind=='fall' and metric.get('source') in ['distance','velocity','hit'],'Metrics need values or a fall source')
        require(len({m['id'] for m in p['metrics']})==len(p['metrics']),'Duplicate metric ids')
        require(len(p['metrics'])<=8,'At most 8 metric series per panel; first is shown in the header')
    if c['left']['media']['kind']==c['right']['media']['kind']=='fall':
        for k in ['mass','g','height','traceInterval']:require(c['left']['media'][k]==c['right']['media'][k],'Fall comparison must share '+k)
    c.setdefault('annotations',[])
    for a in c['annotations']:
        require(a.get('type') in ['label','box','circle','bracket','delta'],'Unknown annotation type')
        w=a.setdefault('when',{});w.setdefault('phase','all');require(w['phase'] in ['all','intro','run','pause','outro'],'Invalid annotation phase')
        w.setdefault('from',0);w.setdefault('to',tl['duration']);num(w['from'],'when.from',0);num(w['to'],'when.to',0);require(w['from']<=w['to']<=tl['duration'],'Invalid annotation range')
        if 'pause' in w:require(isinstance(w['pause'],int) and 0<=w['pause']<len(tl['pauses']),'Unknown pause index')
        a.setdefault('text','');a.setdefault('color',c['theme']['right'])
        if a['type']=='delta':
            a.setdefault('operation','absolute');require(a['operation'] in ['absolute','left-right','right-left'],'Invalid delta operation')
            a.setdefault('decimals',2);require(isinstance(a['decimals'],int) and 0<=a['decimals']<=6,'delta.decimals must be 0–6');a.setdefault('unit','');a.setdefault('prefix','')
            if 'value' in a:num(a['value'],'delta.value')
            else:
                for side in ['left','right']:require(a.get(side+'Metric') in [m['id'] for m in c[side]['metrics']],'delta needs existing '+side+'Metric')
        elif a['type']=='bracket':
            for side in ['left','right']:
                p=a.get(side)
                require(p=='object' and c[side]['media']['kind']=='fall' or isinstance(p,list) and len(p)==2,'bracket needs object anchor or [x,y]')
        else:
            require(a.get('side') in ['left','right','both'],'annotation.side required')
            for key in (['rect'] if a['type']=='box' else ['point']):
                v=a.get(key);require(isinstance(v,list) and len(v)==(4 if key=='rect' else 2),'Invalid annotation '+key)
                for n in v:num(n,key,0);require(n<=1,'Annotation coordinates are normalized 0–1')
                if key=='rect':require(v[0]+v[2]<=1 and v[1]+v[3]<=1 and v[2]>0 and v[3]>0,'Box outside panel')
            a.setdefault('radius',.06);num(a['radius'],'radius',.001)
            if a['type']=='circle':
                x,y=a['point'];r=a['radius'];require(r<=.5 and r<=y<=1-r and r*363/734<=x<=1-r*363/734,'Circle outside panel')
    return c
