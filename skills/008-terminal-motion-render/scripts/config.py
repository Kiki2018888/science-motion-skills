"""Normalize a content-clock timeline; focus pauses add wall time automatically."""
import sys as _sys
_sys.dont_write_bytecode = True  # avoid __pycache__
import copy, math

def require(ok,message):
    if not ok: raise ValueError(message)

def number(x,name,lo=0,hi=3600):
    require(type(x) in (int,float) and math.isfinite(x) and lo<=x<=hi,f'{name}: expected finite number in [{lo}, {hi}]')

def string(x,name):
    require(isinstance(x,str) and '\n' not in x and '\r' not in x,f'{name}: expected single-line string')

def points(ps,duration,name,maximum):
    require(isinstance(ps,list) and len(ps)>=1,name+' needs points');previous=-1
    for p in ps:
        number(p['at'],name+'.at',0,duration);number(p['value'],name+'.value',0,maximum)
        require(p['at']>previous,name+' times must increase');previous=p['at']

def sample(ps,t):
    if t<=ps[0]['at']:return ps[0]['value']
    for a,b in zip(ps,ps[1:]):
        if t<b['at']:return a['value']+(b['value']-a['value'])*(t-a['at'])/(b['at']-a['at'])
    return ps[-1]['value']

def normalize(raw):
    require(isinstance(raw,dict),'Config must be an object');c=copy.deepcopy(raw)
    c.setdefault('width',1920);c.setdefault('height',1080);c.setdefault('fps',24)
    for k in ['width','height']:require(type(c[k]) is int and 360<=c[k]<=3840 and c[k]%2==0,k+' must be even, 360–3840')
    require(abs(c['width']/c['height']-16/9)<.002,'16:9 only');require(c['fps'] in [24,25,30,60],'fps: 24/25/30/60')
    c['theme']=dict({'bg':'#0a1018','panel':'#101b27','bar':'#192532','line':'#263747','ink':'#e1eaf0','muted':'#718596','green':'#8ee3bb','blue':'#8dbef3','gold':'#eac17a','red':'#ff786b','purple':'#b9a4f0','focusFill':'#2b2025'},**c.get('theme',{}))
    c.setdefault('appearance','default');require(c['appearance'] in ['default','amber-night'],'appearance default/amber-night')
    if c['appearance']=='amber-night':
        c['theme'].update(dict(bg='#323232',panel='#383838',bar='#414141',line='#5A5A5A',ink='#FFFFFF',muted='#A3A3A3',green='#E4893A',gold='#F3BB66',red='#E4893A',focusFill='#3F3832'))
        c['theme'].update(raw.get('theme',{}))
    c.setdefault('readability','legacy');require(c['readability'] in ['legacy','wrap'],'readability legacy/wrap')
    c['text']=dict({'title':'终端 / 代码','subtitle':'从执行过程，到关键证据','eyebrow':'TERMINAL / MOTION','session':'demo@local / workspace','footer':'演示日志 · 非真实服务记录','footerLabel':'DEMO SESSION','holdLabel':'HOLD'},**c.get('text',{}))
    for k,v in c['text'].items():string(v,'text.'+k)
    c.setdefault('font','Consolas');require(c['font'] in ['Consolas','Courier New','monospace'],'font must be Consolas, Courier New or monospace')
    tl=dict({'lead':0,'tail':.8,'fadeIn':.45,'fadeOut':.8,'entrance':.6},**c.get('timeline',{}));c['timeline']=tl
    for k in ['lead','tail','fadeIn','fadeOut','entrance']:number(tl[k],'timeline.'+k,0,60)
    require(isinstance(c.get('segments'),list) and 1<=len(c['segments'])<=20,'Use 1–20 segments')
    content=tl['lead'];wall=tl['lead'];ids=set();pauses=[]
    for i,s in enumerate(c['segments']):
        s.setdefault('id',f'segment-{i+1}');string(s['id'],'segment.id');require(s['id'] not in ids,'Duplicate segment ID');ids.add(s['id'])
        require(s.get('kind') in ['shell','code','logs'],'Segment kind: shell/code/logs');number(s['duration'],'segment.duration',.2,600);d=s['duration']
        s.setdefault('label',s['id']);s.setdefault('tab',dict(shell='shell',code='source.ts',logs='trace.log')[s['kind']]);s.setdefault('context','~/workspace');s.setdefault('note','')
        for k in ['label','tab','context','note']:string(s[k],k)
        s.setdefault('overflow','wrap' if c['readability']=='wrap' else 'legacy');require(s['overflow'] in ['legacy','wrap'],'overflow legacy/wrap')
        s['wrap']=dict(dict(indent=2,maxRows=6),**s.get('wrap',{}));require(set(s['wrap'])<=set(['indent','maxRows']),'Unknown wrap option')
        require(type(s['wrap']['indent']) is int and 0<=s['wrap']['indent']<=8,'wrap.indent 0–8');require(type(s['wrap']['maxRows']) is int and 1<=s['wrap']['maxRows']<=8,'wrap.maxRows 1–8')
        s.setdefault('fontSize',25);number(s['fontSize'],'fontSize',16,34)
        s.setdefault('lineHeight',39);number(s['lineHeight'],'lineHeight',34,50)
        if s['overflow']=='wrap':require(s['fontSize']>=22,'Wrapped text must be at least 22px')
        s['start']=wall;s['contentStart']=content
        if s['kind']=='shell':
            s.setdefault('rows',[]);require(len(s['rows'])<=500,'At most 500 shell rows');prev=-1;typing_end=-1
            for row in s['rows']:
                number(row['at'],'row.at',0,d);require(row['at']>=prev,'Rows must be sorted');prev=row['at'];string(row['text'],'row.text')
                row.setdefault('kind','output');require(row['kind'] in ['command','output'],'row.kind: command/output')
                row.setdefault('color',c['theme']['ink']);row.setdefault('prompt','$');string(row['prompt'],'prompt')
                row.setdefault('duration',1 if row['kind']=='command' else .2);number(row['duration'],'row.duration',.01,d);require(row['at']+row['duration']<=d,'Row animation exceeds segment')
                require(row['at']>=typing_end,'Row appears before previous command finishes')
                if row['kind']=='command':
                    typing_end=row['at']+row['duration'];require(typing_end<=d-1/c['fps']+1e-8,'Leave at least one frame after a command finishes')
        else:
            require(isinstance(s.get('lines'),list) and 1<=len(s['lines'])<=10000,'Use 1–10000 lines')
            for j,row in enumerate(s['lines']):
                if isinstance(row,str):row={'text':row};s['lines'][j]=row
                require(isinstance(row,dict),'Line must be string/object');string(row.get('text'),'line.text')
                row.setdefault('tag','INFO');row.setdefault('stamp','');row.setdefault('color',c['theme']['ink'])
                string(row['tag'],'line.tag');string(row['stamp'],'line.stamp')
            s.setdefault('keywords',['import','from','const','export','async','function','await','for','of','return','true','def','in','if','else','class','print'])
            require(isinstance(s['keywords'],list) and all(isinstance(v,str) for v in s['keywords']),'keywords must be strings')
            end=max(0,len(s['lines'])-12) if s['kind']=='code' else len(s['lines'])-1
            s.setdefault('scroll',[{'at':0,'value':0},{'at':d,'value':end}]);points(s['scroll'],d,'scroll',len(s['lines'])-1)
        for row in s.get('rows',s.get('lines',[])):
            row.setdefault('breaks',[]);require(isinstance(row['breaks'],list) and all(type(n) is int and 0<n<len(row['text']) for n in row['breaks']) and row['breaks']==sorted(set(row['breaks'])),'breaks must be sorted unique source code-point positions')
            row.setdefault('emphasis',[]);used=[]
            for mark in row['emphasis']:
                string(mark.get('text'),'emphasis.text');require(bool(mark['text']),'Emphasis cannot be empty');mark.setdefault('occurrence',0);require(type(mark['occurrence']) is int and mark['occurrence']>=0,'emphasis.occurrence nonnegative integer');mark.setdefault('color',c['theme']['gold']);start=-1
                for occurrence in range(mark['occurrence']+1):
                    start=row['text'].find(mark['text'],start+1);require(start>=0,'Emphasis text occurrence not found')
                mark['start']=start;mark['end']=start+len(mark['text']);require(not any(start<b and mark['end']>a for a,b in used),'Emphasis fields overlap');used.append((start,mark['end']))
            if s['overflow']=='legacy':require(not row['breaks'] and not row['emphasis'],'breaks/emphasis require overflow:wrap')
        if s.get('progress'):

            p=s['progress'];points(p['points'],d,'progress',1);p.setdefault('label','RUNNING');p.setdefault('doneLabel','COMPLETE');p.setdefault('color',c['theme']['green'])
            for k in ['label','doneLabel']:string(p[k],k)
        s.setdefault('highlights',[]);previous=-1;added=0
        for h in s['highlights']:
            require(s['kind']!='shell','Highlight code/log lines, not shell rows');number(h['at'],'highlight.at',0,d-.001);require(h['at']>previous,'Highlight times must increase');previous=h['at']
            require(type(h.get('line')) is int and 0<=h['line']<len(s['lines']),'highlight.line is zero-based valid line index')
            h.setdefault('enter',.6);h.setdefault('hold',2);h.setdefault('exit',.6)
            number(h['enter'],'highlight.enter',.1,5);number(h['hold'],'highlight.hold',.1,120);number(h['exit'],'highlight.exit',.1,5)
            h.setdefault('fontSize',40);number(h['fontSize'],'highlight.fontSize',28,56);h.setdefault('maxRows',5);require(type(h['maxRows']) is int and 1<=h['maxRows']<=5,'highlight.maxRows 1–5')
            h.setdefault('style','focus');require(h['style'] in ['focus','inline'],'style: focus/inline');h.setdefault('caption','关键行，停下来才看得清。');h.setdefault('kicker',f"LINE {h['line']+1:04d}");h.setdefault('color',c['theme']['red']);h.setdefault('dim',.79);number(h['dim'],'dim',0,1)
            for k in ['caption','kicker']:string(h[k],k)
            pos=sample(s['scroll'],h['at']);y=359+(h['line']-pos)*s['lineHeight'] if s['kind']=='code' else 810-(pos-h['line'])*s['lineHeight']
            if s['overflow']=='legacy':require(350<=y<=820 and (s['kind']=='code' or h['line']<=math.floor(pos+1e-8)),'Highlight target must be visible at its local time; adjust scroll keyframes')
            h['wallAt']=wall+h['at']+added;h['length']=h['enter']+h['hold']+h['exit'];h['contentAt']=content+h['at'];h['until']=h['wallAt']+h['length'];added+=h['length'];pauses.append(h)
        s['end']=wall+d+added;wall=s['end'];content+=d
    c['contentDuration']=content+tl['tail'];c['duration']=wall+tl['tail'];c['pauses']=pauses;require(c['duration']<=1800,'Video exceeds 1800 seconds')
    require(tl['fadeIn']+tl['fadeOut']<=c['duration'],'Fades exceed video duration')
    for h in pauses:
        require(h['wallAt']+h['enter']>=max(tl['fadeIn'],tl['entrance'])-1e-7 and h['until']-h['exit']<=c['duration']-tl['fadeOut']+1e-7,'Full highlight hold must lie outside entrance and fade transitions')
    c.setdefault('counters',[]);require(isinstance(c['counters'],list) and len(c['counters'])<=3,'Use 0–3 counters');ids=set()
    for i,n in enumerate(c['counters']):
        n.setdefault('id',f'counter-{i}');require(n['id'] not in ids,'Duplicate counter ID');ids.add(n['id']);n.setdefault('from',0);number(n['from'],'counter.from',-1e12,1e12);number(n['to'],'counter.to',-1e12,1e12)
        n.setdefault('at',0);n.setdefault('duration',5);number(n['at'],'counter.at',0,c['contentDuration']);number(n['duration'],'counter.duration',.1,600);require(n['at']+n['duration']<=c['contentDuration'],'Counter exceeds content timeline')
        n.setdefault('label',n['id']);n.setdefault('caption','');n.setdefault('prefix','');n.setdefault('suffix','');n.setdefault('finalSuffix','');n.setdefault('color',[c['theme']['gold'],c['theme']['blue'],c['theme']['green']][i]);n.setdefault('decimals',0);n.setdefault('grouping',True)
        require(type(n['decimals']) is int and 0<=n['decimals']<=3,'decimals: 0–3');require(type(n['grouping']) is bool,'grouping must be boolean')
        require(abs(n['to']-round(n['to'],n['decimals']))<1e-8,'Counter target exceeds decimal precision')
        for k in ['label','caption','prefix','suffix','finalSuffix']:string(n[k],k)
    return c
