"""Validate the supported 1920x1080 card-video schema before opening a browser."""
import copy
import math
import re

STYLES={'blocks':'01','photo':'02','glass':'03','dense':'04','neon':'05','editorial':'06','header':'07','console':'08'}

def require(ok,message):
    if not ok: raise ValueError(message)

def numeric(n,lo,hi,path):
    require(isinstance(n,(int,float)) and not isinstance(n,bool) and math.isfinite(n) and lo<=n<=hi,f'{path}: expected finite number {lo}..{hi}')

def normalize(raw):
    require(isinstance(raw,dict),'Project must be an object')
    if raw.get('mode')=='freeform' or any('elements' in s for s in raw.get('scenes',[]) if isinstance(s,dict)):
        from free_config import normalize_free
        return normalize_free(raw)
    d=copy.deepcopy(raw)
    style=str(d.get('style','neon'));d['style']=STYLES.get(style,style.zfill(2))
    require(d['style'] in STYLES.values(),'Unknown style')
    fps=d.setdefault('fps',30);require(fps in [24,25,30,60],'fps must be 24,25,30,60')
    require(d.get('width',1920)==1920 and d.get('height',1080)==1080,'This template uses 1920x1080 (16:9)')
    scenes=d.get('scenes');require(isinstance(scenes,list) and 1<=len(scenes)<=60,'Use 1..60 scenes')
    chapters=d.get('chapters',[]);require(isinstance(chapters,list) and len(chapters)<=8,'Use up to 8 chapter labels')
    # Only intentional inline text markup is allowed; scripts/HTML attributes are not content.
    def text_check(v):
        if isinstance(v,str):
            require(len(v)<=1200,'Text field is too long')
            for tag in re.findall(r'<[^>]*>',v):require(bool(re.fullmatch(r'</?(?:em|b)>|<br\s*/?>',tag,re.I)),f'Unsupported markup: {tag}')
        elif isinstance(v,dict):
            for value in v.values():text_check(value)
        elif isinstance(v,list):
            for value in v:text_check(value)
    text_check(d)
    for i,s in enumerate(scenes):
        at=f'scenes[{i}]';require(isinstance(s,dict),at+' must be an object')
        typ=s.setdefault('type','point');require(typ in ['point','cover','section','quote','checklist','ending'],at+': unsupported scene type')
        numeric(s.setdefault('dur',6),2,60,at+'.dur');s['dur']=round(s['dur']*fps)/fps
        if chapters:require(isinstance(s.get('chapter',0),int) and 0<=s.get('chapter',0)<len(chapters),at+': invalid chapter')
        require(len(s.get('bullets',[]))<=4,at+': at most 4 bullets')
        require(len(s.get('swatches',[]))<=5,at+': at most 5 swatches')
        require(len(s.get('items',[]))<=4,at+': at most 4 checklist items')
        captions=s.get('caption',[]);captions=[captions] if isinstance(captions,str) else captions
        require(isinstance(captions,list) and len(captions)<=6,at+': at most 6 captions')
        effects=int(s.get('pop') is not None)+int(bool(s.get('scan')))+int(bool(s.get('wire') or s.get('focus')))
        require(effects<=1,at+': choose only one emphasis: pop, scan, or wire/focus')
        card=s.get('card',{})
        if card is False:
            require(effects==0,at+': card:false cannot use a card effect');continue
        require(isinstance(card,dict),at+'.card must be an object or false')
        kpis=card.get('kpis',[]);require(isinstance(kpis,list) and len(kpis)<=5,at+': at most 5 KPIs')
        for k in kpis:require(isinstance(k,dict) and isinstance(k.get('value'),(str,int,float)),at+': KPI needs value')
        for field,minimum in [('bars',1),('line',2)]:
            if field in card:
                values=card[field];require(isinstance(values,list) and minimum<=len(values)<=24,at+f': {field} length must be {minimum}..24')
                for v in values:numeric(v,0,1e12,at+'.'+field)
        for field,limit in [('photos',4),('list',5),('tabs',4)]:
            if field in card:require(isinstance(card[field],list) and 1<=len(card[field])<=limit,at+f': {field} length 1..{limit}')
        photos=card.get('photos',[{}]*4 if d['style']=='02' else [])
        count=len(kpis)+len(photos)+int('bars'in card or 'line'in card)+int('list'in card)+int('text'in card)
        if s.get('pop') is not None:
            require(isinstance(s['pop'],int) and not isinstance(s['pop'],bool) and 0<=s['pop']<count,at+': invalid pop tile index')
            numeric(s.setdefault('popAt',s['dur']*.45),.8,s['dur']-.8,at+'.popAt')
        if s.get('scan'):
            numeric(s.setdefault('scanAt',1.4),0,s['dur']-.4,at+'.scanAt')
            numeric(s.setdefault('scanDur',1.8),.2,s['dur']-s['scanAt']-.3,at+'.scanDur')
        if s.get('wire') or s.get('focus'):
            require(s.get('focus','kpis') in ['kpis','header','side','chart','list','photos','text'],at+': unknown focus region')
            if s.get('wire')!='hold':numeric(s.setdefault('revealAt',s['dur']*.6),.5,s['dur']-.6,at+'.revealAt')
    require(sum(s['dur'] for s in scenes)<=1200,'Maximum duration is 20 minutes')
    return d
