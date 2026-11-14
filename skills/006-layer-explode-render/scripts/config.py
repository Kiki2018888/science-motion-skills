"""Normalize the layered illustration configuration and its deterministic timeline."""
import copy
import math


def require(ok, message):
    if not ok:
        raise ValueError(message)


def num(v, name, lo=0, hi=10000):
    require(isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) and lo <= v <= hi,
            f'{name} must be a finite number in [{lo}, {hi}]')
    return v


def pair(v, name):
    require(isinstance(v, list) and len(v) == 2, f'{name} must be [x,y]')
    return [num(x, name, -10000, 10000) for x in v]


def normalize(raw):
    require(isinstance(raw, dict), 'Config must be an object')
    c = copy.deepcopy(raw)
    c['width'] = c.get('width', 1920); c['height'] = c.get('height', 1080)
    for k in ['width', 'height']:
        require(isinstance(c[k], int) and 360 <= c[k] <= 3840 and c[k] % 2 == 0, k+' must be an even integer, 360–3840')
    require(abs(c['width']/c['height']-16/9)<.002, 'Use a 16:9 canvas; this version uses the approved landscape layout')
    c['fps'] = c.get('fps', 24); require(c['fps'] in [24, 25, 30, 60], 'fps must be 24/25/30/60')
    c['title'] = str(c.get('title', '把内部层次，逐一展开'))
    c['eyebrow'] = str(c.get('eyebrow', '结构观察 / 分层拆解'))
    c['subject'] = str(c.get('subject', '多层结构'))
    c['note'] = str(c.get('note', '结构示意'))
    c['style'] = dict({'ink':'#203d36','muted':'#71837c','accent':'#258873','rule':'#cbd5ce',
                       'labelSize':30,'noteSize':21,'dimOthers':.36,'showPhase':True,'showProgress':True,
                       'phaseTitles':['完整装配','分层展开','逐层观察','按序复位','重新组装'],
                       'phaseNotes':['先看整体轮廓','部件错峰展开','标注跟随部件','回到装配位置','每层都有自己的位置']}, **c.get('style', {}))
    for k in ['phaseTitles','phaseNotes']:
        require(len(c['style'][k])==5 and all(isinstance(s,str) for s in c['style'][k]), 'style.'+k+' needs five strings')
    num(c['style']['labelSize'], 'labelSize', 18, 40); num(c['style']['noteSize'], 'noteSize', 14, 28)
    num(c['style']['dimOthers'], 'dimOthers', 0, .8)
    bg = c.get('background', {'type':'gradient','colors':['#ffffff','#e8ede7']})
    require(isinstance(bg, dict), 'background must be an object')
    bg.setdefault('type', 'solid'); bg.setdefault('color', '#edf0ec')
    require(bg['type'] in ['solid','gradient','image'], 'Unknown background type')
    if bg['type']=='gradient':
        bg.setdefault('colors',['#ffffff','#e8ede7']); require(2<=len(bg['colors'])<=8,'Use 2–8 gradient colors')
    if bg['type']=='image': require(isinstance(bg.get('src'),str) and bg['src'], 'background image needs src')
    c['background']=bg
    c['geometry']=dict({'u':[250,25],'v':[-125,50]}, **c.get('geometry',{}))
    u=pair(c['geometry']['u'],'geometry.u');v=pair(c['geometry']['v'],'geometry.v')
    require(u[0]>0 and v[0]<0 and u[1]>0 and v[1]>0, 'Use a top-facing projection: u=[positive,positive], v=[negative,positive]')
    c['layout']=dict({'artBox':[365,205,925,735],'labelX':1336,'labelTop':245,'labelBottom':860,
                      'labelWidth':450,'showGuides':True,'showShadow':True},**c.get('layout',{}))
    box=c['layout']['artBox'];require(isinstance(box,list) and len(box)==4,'artBox must be [x,y,width,height]')
    for val in box:num(val,'artBox')
    require(box[2]>100 and box[3]>100 and box[0]+box[2]<=1824 and box[1]>=175 and box[1]+box[3]<=970,'artBox must stay inside scene margins')
    for k in ['labelX','labelTop','labelBottom','labelWidth']:num(c['layout'][k],k,0,1920)
    require(c['layout']['labelTop']>=210 and c['layout']['labelBottom']<=925 and c['layout']['labelBottom']>=c['layout']['labelTop'],'Invalid label vertical range')
    require(c['layout']['labelX']+c['layout']['labelWidth']<=1830,'Labels exceed right safe edge')
    require(isinstance(c.get('layers'),list) and 2<=len(c['layers'])<=10,'Supply 2–10 layers, bottom to top')
    ids=set();n=len(c['layers'])
    palette=['#839c8c','#79ae99','#b59c6c','#5faaa2','#b7c8b6']
    for i,l in enumerate(c['layers']):
        require(isinstance(l,dict),'Each layer must be an object')
        l.setdefault('id',f'layer-{i+1}');require(isinstance(l['id'],str) and l['id'] and l['id'] not in ids,'Layer IDs must be unique strings');ids.add(l['id'])
        l['label']=str(l.get('label',f'第 {i+1} 层')); l['note']=str(l.get('note',''))
        l.setdefault('thickness',22);num(l['thickness'],'thickness',2,80)
        l.setdefault('size',[1,1]);pair(l['size'],'layer.size');require(all(.2<=x<=2 for x in l['size']),'layer.size values must be .2–2')
        l.setdefault('color',palette[i%len(palette)]);l.setdefault('showLabel',True)
        tex=l.get('texture',{'kind':'solid'});require(isinstance(tex,dict),'texture must be an object')
        tex.setdefault('kind','solid');require(tex['kind'] in ['solid','grid','pleats','granules','mesh','slots','image'],'Unknown texture kind')
        tex.setdefault('color',l['color']);tex.setdefault('detailColor','#e8eee0');tex.setdefault('frameColor',l['color'])
        tex.setdefault('density',1);num(tex['density'],'texture.density',.25,3)
        tex.setdefault('seed',i+1);require(isinstance(tex['seed'],int),'seed must be integer')
        tex.setdefault('frame',True);tex.setdefault('fit','cover');require(tex['fit'] in ['cover','contain'],'fit must be cover or contain')
        tex.setdefault('text','')
        if tex['kind']=='image':require(isinstance(tex.get('src'),str) and tex['src'],'Image layer needs texture.src')
        l['texture']=tex
        l.setdefault('edgeDark',None);l.setdefault('edgeLight',None)
    motion=dict({'direction':'up','gap':125,'spread':0,'assemblyGap':0},**c.get('motion',{}))
    directions={'up':[0,-1],'down':[0,1],'left':[-1,0],'right':[1,0],'up-right':[1,-1],'up-left':[-1,-1],'down-right':[1,1],'down-left':[-1,1]}
    d=motion['direction'];vector=directions.get(d) if isinstance(d,str) else pair(d,'motion.direction')
    require(vector is not None,'Unknown direction');length=math.hypot(*vector);require(length>0,'Direction cannot be zero')
    motion['vector']=[v/length for v in vector]
    num(motion['gap'],'motion.gap',0,3000);num(motion['spread'],'motion.spread',-1000,1000);num(motion['assemblyGap'],'assemblyGap',0,150)
    # Raw coordinates are fitted once, so changing direction never moves the camera during the animation.
    cy=0
    for i,l in enumerate(c['layers']):
        if i:cy-=l['thickness']+motion['assemblyGap']
        l['home']=[0,cy];k=i-(n-1)/2;dx,dy=motion['vector']
        l['open']=[dx*motion['gap']*k-dy*motion['spread']*k,cy+dy*motion['gap']*k+dx*motion['spread']*k]
    c['motion']=motion
    tl=dict({'intro':2.6,'explode':2.9,'stagger':.22,'explodeOrder':'top-first','hold':1.1,
             'focus':[],'afterFocus':1,'reassemble':True,'assemble':2.5,'assembleStagger':.18,
             'assembleOrder':'bottom-first','outro':1.7},**c.get('timeline',{}))
    for k in ['intro','stagger','hold','afterFocus','assembleStagger','outro']:num(tl[k],'timeline.'+k,0,120)
    for k in ['explode','assemble']:num(tl[k],'timeline.'+k,.2,60)
    require(isinstance(tl['reassemble'],bool),'reassemble must be boolean')
    for k in ['explodeOrder','assembleOrder']:require(tl[k] in ['top-first','bottom-first','together'],k+' must be top-first, bottom-first or together')
    def rank(i,order):return 0 if order=='together' else n-1-i if order=='top-first' else i
    for i,l in enumerate(c['layers']):l['openAt']=tl['intro']+rank(i,tl['explodeOrder'])*tl['stagger']
    tl['openEnd']=max(l['openAt'] for l in c['layers'])+tl['explode'];cursor=tl['openEnd']+tl['hold']
    require(isinstance(tl['focus'],list),'timeline.focus must be an array')
    for f in tl['focus']:
        require(isinstance(f,dict) and f.get('layer') in ids,'Each focus needs an existing layer ID')
        f.setdefault('duration',2.7);num(f['duration'],'focus.duration',.5,120);f.setdefault('pause',.3);num(f['pause'],'focus.pause',0,120)
        f['start']=cursor;f['end']=cursor+f['duration'];cursor=f['end']+f['pause']
    tl['closeAt']=cursor+tl['afterFocus']
    for i,l in enumerate(c['layers']):l['closeAt']=tl['closeAt']+rank(i,tl['assembleOrder'])*tl['assembleStagger']
    tl['closeEnd']=max(l['closeAt'] for l in c['layers'])+tl['assemble'] if tl['reassemble'] else tl['closeAt']
    c['duration']=tl['closeEnd']+tl['outro'];require(c['duration']<=1800,'Duration exceeds 30 minutes')
    c['timeline']=tl
    labels=dict({'show':True,'numbers':True,'fade':.6,'showAt':max(tl['intro'],tl['openEnd']-.8),
                 'hideAt':tl['closeAt'] if tl['reassemble'] else c['duration']+1},**c.get('labels',{}))
    num(labels['fade'],'labels.fade',.05,5);num(labels['showAt'],'labels.showAt',0,c['duration']);num(labels['hideAt'],'labels.hideAt',labels['showAt'],c['duration']+5)
    c['labels']=labels
    return c
