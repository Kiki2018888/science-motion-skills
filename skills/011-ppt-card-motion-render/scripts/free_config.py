"""Free-layout scene schema. Coordinates are local to a parent group, times local to a scene."""
import copy
import math

STYLES={'blocks':'01','photo':'02','glass':'03','dense':'04','neon':'05','editorial':'06','header':'07','console':'08'}
PROPS={'x','y','w','h','opacity','scale','scaleX','scaleY','rotate','rotateX','rotateY','blur','radius','fontSize','draw','z','clip'}
EASES={'linear','in','out','inOut','backOut','spring','step'}

def require(ok,msg):
    if not ok:raise ValueError(msg)

def number(n,path,lo=None,hi=None):
    require(isinstance(n,(int,float)) and not isinstance(n,bool) and math.isfinite(n),path+': finite number required')
    require((lo is None or n>=lo) and (hi is None or n<=hi),path+': out of range')

def ease(v,path):
    if isinstance(v,str):require(v in EASES,path+': unknown easing')
    else:
        require(isinstance(v,list) and len(v)==4,path+': use easing name or cubic-bezier [x1,y1,x2,y2]')
        for x in v:number(x,path)
        require(0<=v[0]<=1 and 0<=v[2]<=1,path+': bezier X controls must be 0..1')

def normalize_free(raw):
    d=copy.deepcopy(raw);d['mode']='freeform';d.setdefault('style','neon');d.setdefault('fps',30);d.setdefault('width',1920);d.setdefault('height',1080)
    require(str(d['style']) in STYLES or str(d['style']).zfill(2) in STYLES.values(),'Unknown freeform style')
    require(d['fps'] in [24,25,30,60],'fps must be 24,25,30,60')
    for key in ['width','height']:
        number(d[key],key,320,7680);require(int(d[key])==d[key] and d[key]%2==0,key+': even integer required')
    require(isinstance(d.get('scenes'),list) and 1<=len(d['scenes'])<=100,'Use 1..100 scenes')
    for si,s in enumerate(d['scenes']):
        number(s.get('dur'),f'scenes[{si}].dur',.2,600);s['dur']=round(s['dur']*d['fps'])/d['fps']
        if 'style' in s:require(str(s['style']) in STYLES or str(s['style']).zfill(2) in STYLES.values(),'Unknown scene style')
        require(isinstance(s.get('elements'),list),'Each freeform scene needs elements[]')
        ids=set()
        def visit(nodes,depth=0):
            require(depth<=12,'Group nesting exceeds 12 levels')
            for i,n in enumerate(nodes):
                require(isinstance(n,dict),'Element must be an object')
                ident=n.get('id');require(isinstance(ident,str) and ident and ident not in ids,'Element IDs must be unique in their scene');ids.add(ident)
                kind=n.setdefault('type','card');require(kind in ['card','text','metric','image','chart','list','pill','group','path'],'Unknown element type: '+kind)
                for k,default in [('x',0),('y',0),('w',400),('h',240)]:
                    n.setdefault(k,default);number(n[k],ident+'.'+k,1 if k in ['w','h'] else None)
                for key in PROPS & n.keys():number(n[key],ident+'.'+key)
                if 'style' in n:require(str(n['style']) in STYLES or str(n['style']).zfill(2) in STYLES.values(),ident+': unknown style')
                keyframes=n.get('keyframes',[]);require(isinstance(keyframes,list),ident+': keyframes must be an array')
                last=-1
                for kf in keyframes:
                    number(kf.get('t'),ident+'.keyframe.t',0,s['dur']);require(kf['t']>last,ident+': keyframe times must strictly increase');last=kf['t']
                    require(set(kf)-{'t','ease'}<=PROPS,ident+': unsupported keyframe property')
                    for prop in PROPS & kf.keys():number(kf[prop],ident+'.'+prop,1 if prop in ['w','h','fontSize'] else None)
                    ease(kf.get('ease','inOut'),ident+'.keyframe.ease')
                for action in ['enter','exit']:
                    if action not in n:continue
                    a=n[action];require(isinstance(a,dict),ident+'.'+action+': object required')
                    require(a.get('type','fade') in ['none','fade','slide','scale','flip','wipe','blur'],ident+': unsupported transition')
                    number(a.setdefault('at',0),ident+'.'+action+'.at',0,s['dur'])
                    number(a.setdefault('duration',.7),ident+'.'+action+'.duration',.001,s['dur'])
                    require(a['at']+a['duration']<=s['dur']+.00001,ident+': transition ends after scene')
                    require(a.get('direction','up') in ['up','down','left','right'],ident+': unknown direction')
                    ease(a.get('ease','out'),ident+'.'+action+'.ease')
                if 'motionPath' in n:
                    p=n['motionPath'];number(p.setdefault('at',0),ident+'.path.at',0,s['dur']);number(p.get('duration'),ident+'.path.duration',.001,s['dur'])
                    require(p.get('at',0)+p['duration']<=s['dur'],ident+': path ends after scene')
                    require(len(p.get('points',[]))==4,ident+': cubic path needs four [x,y] points')
                    for point in p['points']:
                        require(isinstance(point,list) and len(point)==2,ident+': invalid path point')
                        for v in point:number(v,ident+'.motionPath')
                    ease(p.get('ease','inOut'),ident+'.motionPath.ease')
                if 'count' in n:
                    c=n['count'];number(c.get('to'),ident+'.count.to');number(c.get('from',0),ident+'.count.from');number(c.setdefault('at',0),ident+'.count.at',0,s['dur']);number(c.setdefault('duration',1),ident+'.count.duration',.001,s['dur'])
                    require(isinstance(c.get('decimals',0),int) and 0<=c.get('decimals',0)<=6,ident+': decimals must be 0..6')
                if kind=='image':require(isinstance(n.get('src'),str) and n['src'],ident+': image requires local src')
                if kind=='chart':
                    require(n.get('chart','bars') in ['bars','line'],'Chart must be bars or line')
                    vals=n.get('values');require(isinstance(vals,list) and len(vals)>=(2 if n.get('chart')=='line' else 1),ident+': insufficient chart values')
                    for v in vals:number(v,ident+'.values')
                if kind=='path':
                    require(isinstance(n.get('points'),list) and len(n['points'])>=2,ident+': path requires points')
                    for p in n['points']:
                        require(isinstance(p,list) and len(p)==2,ident+': invalid point')
                        for v in p:number(v,ident+'.points')
                if kind=='list':require(isinstance(n.get('items'),list),ident+': list requires items[]')
                if 'children'in n:require(isinstance(n['children'],list),ident+': children must be an array');visit(n['children'],depth+1)
        visit(s['elements'])
        require(len(ids)<=500,'At most 500 elements per scene')
    require(sum(s['dur'] for s in d['scenes'])<=3600,'Maximum timeline is 1 hour')
    return d
