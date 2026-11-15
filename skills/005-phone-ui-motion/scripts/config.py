"""Configuration and deterministic text timing for phone UI motion."""
import copy
import math
import unicodedata

THEMES=['wechat','chatgpt','gemini','deepseek','kimi','claude']
NAMES=dict(wechat='微信',chatgpt='ChatGPT',gemini='Gemini',deepseek='DeepSeek',kimi='Kimi',claude='Claude')

def require(ok,message):
    if not ok:raise ValueError(message)

def number(v,name,low=0):
    require(isinstance(v,(int,float)) and not isinstance(v,bool) and math.isfinite(v) and v>=low,name+' must be a finite number >= '+str(low));return v

def glyphs(s):
    """Keep common combining marks, emoji sequences and flag pairs together."""
    out=[]
    for ch in s:
        cp=ord(ch);mark=unicodedata.category(ch).startswith('M') or 0xFE00<=cp<=0xFE0F or 0x1F3FB<=cp<=0x1F3FF
        flag=0x1F1E6<=cp<=0x1F1FF
        if out and (mark or ch=='\u200d' or out[-1].endswith('\u200d') or flag and len(out[-1])==1 and 0x1F1E6<=ord(out[-1])<=0x1F1FF):out[-1]+=ch
        else:out.append(ch)
    return out

def reveal(s,cps,duration=None):
    chars=glyphs(s);weights=[1+(.20*cps if ch in '。！？!? ' and ch!=' ' else .10*cps if ch in '，、,；;' else .12*cps if ch=='\n' else 0) for ch in chars]
    times=[];t=0;factor=duration/sum(weights) if duration is not None else 1/cps
    for w in weights:t+=w*factor;times.append(t)
    return chars,times,t

def background(value,default):
    b={**default,**value};require(b['type'] in ['solid','gradient','image'],'background.type must be solid, gradient or image')
    if b['type']=='image':require(isinstance(b.get('src'),str) and b['src'],'Image background needs src')
    if b['type']=='gradient':require(isinstance(b.get('colors'),list) and len(b['colors'])>=2,'Gradient needs >= 2 colors')
    return b

def normalize(raw):
    c=copy.deepcopy(raw);c.setdefault('theme','claude');require(c['theme'] in THEMES,'Unknown theme')
    c.setdefault('width',1080);c.setdefault('height',1920);c.setdefault('fps',30)
    for key in ['width','height']:require(isinstance(c[key],int) and c[key]>=320 and c[key]%2==0,key+' must be an even integer >= 320')
    require(c['fps'] in [24,25,30,60],'fps must be 24,25,30,60')
    d=c['display']={**dict(mode='phone',center=[.5,.5],phoneHeight=None,notch=True,caption='',framing='full'),**c.get('display',{})}
    require(d['mode'] in ['phone','fullscreen'],'display.mode must be phone or fullscreen')
    require(d['framing'] in ['full','top'],'display.framing must be full or top')
    require(d['mode']=='phone' or d['framing']=='full','Top framing needs phone mode')
    d.setdefault('composer',d['framing']=='full');require(type(d['composer']) is bool,'display.composer must be boolean')
    d['hardware']={**dict(finish='classic',buttons=True,camera='pill'),**d.get('hardware',{})}
    require(d['hardware']['finish'] in ['classic','graphite','titanium','silver'],'Unknown hardware finish')
    require(type(d['hardware']['buttons']) is bool,'hardware.buttons must be boolean')
    require(d['hardware']['camera'] in ['pill','island','none'],'Unknown camera style')
    safe=d.setdefault('safeArea',[0,0,c['width'],c['height']])
    require(isinstance(safe,list) and len(safe)==4,'safeArea needs [x,y,width,height]')
    for n in safe:number(n,'safeArea')
    require(safe[2]>0 and safe[3]>0 and safe[0]+safe[2]<=c['width'] and safe[1]+safe[3]<=c['height'],'safeArea outside output')
    require(len(d['center'])==2,'center needs [x,y]')
    for n in d['center']:number(n,'center');require(n<=1,'center uses 0–1 coordinates')
    if d['mode']=='phone':
        d['phoneHeight']=d['phoneHeight'] or min(c['height']*.88,c['width']*.80*1696/792);number(d['phoneHeight'],'phoneHeight',200)
        scale=d['phoneHeight']/1696;pw=792*scale;ph=d['phoneHeight'];x=c['width']*d['center'][0]-pw/2;y=c['height']*d['center'][1]-ph/2
        require(x>=safe[0] and y>=safe[1] and x+pw<=safe[0]+safe[2],'Phone top or horizontal frame outside safeArea')
        if d['framing']=='full':require(y+ph<=safe[1]+safe[3],'Phone frame outside output')
        c['screen']={'width':756,'height':1660,'x':x+18*scale,'y':y+18*scale,'scale':scale,'radius':95};c['phone']={'x':x,'y':y,'scale':scale}
    else:
        require(c['height']/c['width']>=1.4,'Fullscreen phone UI needs a portrait canvas; use embedded phone for landscape')
        c['screen']={'width':756,'height':c['height']/c['width']*756,'x':0,'y':0,'scale':c['width']/756,'radius':0}
    c['screen']['visibleHeight']=min(c['screen']['height'],(safe[1]+safe[3]-c['screen']['y'])/c['screen']['scale'])
    if d['framing']=='top':require(c['screen']['visibleHeight']>=620,'Top framing leaves too little readable screen; raise the phone or increase safeArea')
    c['background']=background(c.get('background',{}),dict(type='gradient',colors=['#f7f5ef','#d9dedc']))
    c['wallpaper']=background(c.get('wallpaper',{}),dict(type='gradient',colors=['#24354a','#3e6474','#142f3a']))
    c['chatBackground']=background(c['chatBackground'],dict(type='solid',color='#faf9f5')) if c.get('chatBackground') else None
    c['status']={**dict(show=True,time='9:41',battery=.85),**c.get('status',{})};number(c['status']['battery'],'battery');require(c['status']['battery']<=1,'battery must be 0–1')
    c['app']={**dict(name=NAMES[c['theme']],title='科普助手' if c['theme']=='wechat' else NAMES[c['theme']],model='',icon=None,userName='我',assistantName='助手',userAvatar=None,assistantAvatar=None),**c.get('app',{})}
    c['labels']={**dict(placeholder='输入消息' if c['theme']=='wechat' else '发送消息…',greeting='有什么想一起聊聊的？',thinking='正在思考',unlock='向上轻扫以解锁',send='发送'),**c.get('labels',{})}
    c['style']={**dict(fontSize=32,lineHeight=1.6,accent=None,chatBackground=None),**c.get('style',{})};number(c['style']['fontSize'],'fontSize',22);require(c['style']['fontSize']<=46,'fontSize must be <= 46');number(c['style']['lineHeight'],'lineHeight',1.2)
    require(c['style'].get('appearance','app') in ['app','amber-night'],'Unknown style.appearance')
    palette=dict(bg='#323232',ink='#FFFFFF',muted='#A3A3A3',accent='#E4893A',user='#414141',answer=None,input='#393939') if c['style'].get('appearance')=='amber-night' else {}
    palette.update(c['style'].get('palette',{}));require(set(palette)<=set(['bg','ink','muted','accent','user','answer','input']),'Unknown style.palette field')
    for k,v in palette.items():require((k=='answer' and v is None) or (isinstance(v,str) and len(v)==7 and v[0]=='#' and all(x in '0123456789abcdefABCDEF' for x in v[1:])), 'palette colors must be #RRGGBB (answer can be null)')
    c['style']['palette']=palette
    if c['style'].get('appearance')=='amber-night' and 'background' not in raw:c['background']={'type':'solid','color':'#323232'}
    c.setdefault('messages',[]);last_end=0
    for i,m in enumerate(c['messages']):
        require(m.get('role') in ['user','assistant'],'message.role must be user or assistant');require(isinstance(m.get('text'),str) and m['text'],'message.text required')
        number(m.get('at'),'message.at');require(m['at']>=last_end,'Messages cannot overlap prior typing')
        m.setdefault('mode','pop' if m['role']=='user' else 'type');require(m['mode'] in ['pop','type'],'message.mode must be pop or type')
        m.setdefault('cps',15);number(m['cps'],'message.cps',.1)
        if 'typeDuration' in m:number(m['typeDuration'],'typeDuration',.01)
        m['glyphs'],m['reveal'],dur=reveal(m['text'],m['cps'],m.get('typeDuration'))
        m['end']=m['at']+(dur if m['mode']=='type' else .48);last_end=m['end']
        m.setdefault('keyboard',True)
        if 'inputAt' in m:
            require(d['composer'],'inputAt needs a visible composer; use mode:type to type inside the chat bubble')
            require(d['framing']!='top' or not m['keyboard'],'Top framing does not have room for the full keyboard; set keyboard:false')
            require(m['role']=='user' and m['mode']=='pop','inputAt is for outgoing pop messages');number(m['inputAt'],'inputAt');require(m['inputAt']>= (c['messages'][i-1]['end'] if i else 0),'Input overlaps previous message')
            require(m['inputAt']+.3<m['at'],'Input needs >= 0.3s before send')
            _,m['inputReveal'],_=reveal(m['text'],m['cps'],m['at']-m['inputAt']-.2)
        if 'thinkingAt' in m:
            require(m['role']=='assistant','thinkingAt is for assistant');number(m['thinkingAt'],'thinkingAt');require((c['messages'][i-1]['end'] if i else 0)<=m['thinkingAt']<m['at'],'Invalid thinking interval')
    c.setdefault('lock',None)
    if c['lock'] is not None:
        if d['framing']=='top':require(c['screen']['visibleHeight']>=710,'Top lock screen needs at least 710 logical pixels for clock and notification')
        l=c['lock'];number(l.get('at'),'lock.at');l.setdefault('wakeAt',l['at']+.8);number(l['wakeAt'],'wakeAt');require(l['wakeAt']>=l['at'],'wakeAt before lock.at');require(l['at']>=last_end,'Lock interrupts conversation')
        l.setdefault('time',c['status']['time']);l.setdefault('date','星期五，11月13日');l.setdefault('textColor','#f1f6f4');last_end=max(last_end,l['wakeAt']+.6)
    c.setdefault('notifications',[]);last_at=-1
    for n in c['notifications']:
        require(isinstance(n.get('text'),str) and n['text'],'notification.text required');number(n.get('at'),'notification.at');require(n['at']>=last_at,'Sort notifications by at');last_at=n['at']
        n.setdefault('kind','lock');require(n['kind'] in ['lock','banner'],'notification.kind must be lock or banner');n.setdefault('theme',c['theme']);require(n['theme'] in THEMES,'Invalid notification theme')
        n.setdefault('app',c['app']['name'] if n['theme']==c['theme'] else NAMES[n['theme']]);n.setdefault('icon',None);n.setdefault('timeLabel','现在')
        n['glyphs']=glyphs(n['text'])
        if n['kind']=='lock':require(c['lock'] is not None and n['at']>=c['lock']['wakeAt']+.3,'Lock notification needs an awake lock screen')
        else:
            n.setdefault('hold',3);number(n['hold'],'notification.hold',.6);n['until']=n['at']+n['hold'];require(c['lock'] is None or n['until']<=c['lock']['at'],'Banner overlaps lock transition')
        if 'until' in n:number(n['until'],'notification.until');require(n['until']>n['at']+.5,'Notification needs >= .5s visibility')
        last_end=max(last_end,n.get('until',n['at']+3.5))
    require(c['messages'] or c['lock'] is not None,'Supply conversation or lock screen')
    c.setdefault('duration',last_end+1);number(c['duration'],'duration',.1);require(c['duration']>=last_end,'Duration cuts off messages/notifications');require(c['duration']<=1800,'Split outputs longer than 30 minutes')
    return c
