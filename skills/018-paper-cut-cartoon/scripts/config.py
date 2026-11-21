"""Validate portable cut-paper scene configurations before opening a browser."""
import math
import re

COLOR = re.compile(r"#[0-9a-fA-F]{6}")
CHANNELS = {"x","y","scale","angle","handX","handY","walk"}
TYPES = {"robot","person","prop","label","swap"}
NODE_KEYS = {"id","type","at","scale","angle","hand","facing","walk","color","start","end","enter",
             "attach","prop","text","fontSize","maxWidth","keys","portrait","before","after","impact","oldColor"}


def need(condition, message):
    if not condition:
        raise ValueError(message)


def number(value, where):
    need(type(value) in (int,float) and math.isfinite(value), where+" 需要有限数值")
    return value


def pair(value, where):
    need(isinstance(value,list) and len(value)==2,where+" 需要一对坐标")
    for v in value:
        number(v,where)


def color(v, where):
    need(isinstance(v,str) and COLOR.fullmatch(v),where+" 需要 #RRGGBB")


def validate_props(props):
    need(isinstance(props,dict),"props 需要是按名称索引的对象")
    for name,layers in props.items():
        need(isinstance(layers,list) and layers,"道具 "+name+" 缺少图层")
        for layer in layers:
            where="道具 "+name
            need(isinstance(layer,dict) and isinstance(layer.get("d"),str) and layer["d"].strip(),where+" 缺少路径 d")
            need("fill" in layer or "stroke" in layer,where+" 需要填色或描线")
            need(not set(layer)-{"d","fill","edge","outline","shadow","stroke","weight"},where+" 有未知图层字段")
            for k in ("fill","edge","stroke"):
                if k in layer:
                    color(layer[k],where+" "+k)
            for k in ("outline","shadow","weight"):
                if k in layer:
                    need(number(layer[k],where)>=0,where+" 线宽或投影应为非负数")


def validate_node(node, duration, props, anchors, where):
    need(isinstance(node,dict) and not set(node)-NODE_KEYS,where+" 有未知图层字段")
    kind=node.get("type")
    need(kind in TYPES,where+" 图层类型无效")
    if kind=="prop":
        need(node.get("prop") in props,where+" 道具未定义")
    if kind=="label":
        need(isinstance(node.get("text"),str) and node["text"].strip(),where+" 标签需要文字")
    if kind=="swap":
        need(all(isinstance(node.get(k),str) and node[k].strip() for k in ("before","after")),where+" 换签需要前后两份文字")
        impact=number(node.get("impact",1.55),where)
        need(node.get("start",0)<=impact-.66 and impact+.17<node.get("end",duration),where+" 拍贴点前需留撕签时间，后需留落定时间")
    for k in ("at","hand"):
        if k in node:
            pair(node[k],where+" "+k)
    for k in ("color","oldColor"):
        if k in node:
            color(node[k],where)
    if "attach" in node:
        attachment=node["attach"]
        need(isinstance(attachment,dict) and not set(attachment)-{"to","point","offset"},where+" 挂点格式有误")
        target=anchors.get(attachment.get("to"))
        point=attachment.get("point","origin")
        need(target and point in ("origin","hand"),where+" 挂点必须指向前面已有的图层")
        need(point!="hand" or target in ("robot","person"),where+" hand 只用于角色")
        if "offset" in attachment:
            pair(attachment["offset"],where+" offset")
        need("at" not in node,where+" 挂点图层的位置由父对象决定")
    if "id" in node:
        name=node["id"]
        need(isinstance(name,str) and name and name not in anchors,where+" id 为空或重复")
        anchors[name]=kind
    for k in ("scale","fontSize","maxWidth"):
        if k in node:
            need(number(node[k],where)>0,where+" "+k+" 必须大于零")
    for k in ("angle","walk"):
        if k in node:
            number(node[k],where)
    need(0<=number(node.get("start",0),where)<number(node.get("end",duration),where)<=duration,where+" 图层时间越界")
    need(node.get("facing","right") in ("right","left") and node.get("enter","none") in ("none","drop","stamp"),where+" 朝向或入场方式无效")
    keys=node.get("keys",[])
    need(isinstance(keys,list),where+" keys 应为数组")
    last=-1
    for key in keys:
        need(isinstance(key,dict) and len(key)>1 and set(key)<=(CHANNELS|{"t"}),where+" 关键帧字段有误")
        t=number(key.get("t"),where)
        need(last<t<=duration and t>=0,where+" 关键帧时间应递增且在镜内")
        last=t
        for k in set(key)-{"t"}:
            v=number(key[k],where)
            need(k!="scale" or v>0,where+" 关键帧比例必须大于零")
            need("attach" not in node or k not in ("x","y"),where+" 挂点层不能同时动画化 x/y")


def validate(film):
    need(isinstance(film,dict) and film.get("format","landscape") in ("landscape","portrait"),"format 须为 landscape 或 portrait")
    if "background" in film:
        color(film["background"],"背景")
    props=film.get("props",{})
    validate_props(props)
    scenes=film.get("scenes")
    need(isinstance(scenes,list) and scenes,"至少需要一个镜头")
    count=0
    for i,s in enumerate(scenes,1):
        where=f"镜头 {i}"
        need(isinstance(s,dict),where+" 需要对象")
        d=number(s.get("duration"),where+" duration")
        need(d>0 and abs(d*30-round(d*30))<.000001,where+" 时长应为整帧（30 fps）")
        count+=round(d*30)
        need(s.get("transition","cut") in ("cut","peel"),where+" 转场无效")
        if i>1 and s.get("transition")=="peel":
            need(round(d*30)>12,where+" 掀纸转场需要至少 13 帧")
        if "background" in s:
            color(s["background"],where)
        layers=s.get("layers")
        need(isinstance(layers,list) and layers,where+" 需要画面图层")
        for vertical in (False,True):
            anchors={}
            for j,node in enumerate(layers,1):
                detail=f"{where} 图层 {j}"
                need(isinstance(node,dict),detail+" 需要对象")
                override=node.get("portrait",{})
                need(isinstance(override,dict) and set(override)<={"at","scale","angle","keys","hand","maxWidth","fontSize","attach","walk"},detail+" 竖屏覆盖字段有误")
                validate_node({**node,**override} if vertical else node,d,props,anchors,detail)
        last=-1
        for cue in s.get("captions",[]):
            need(isinstance(cue,list) and len(cue)==2 and isinstance(cue[1],str),where+" 字幕格式应为 [起始秒,文字]")
            t=number(cue[0],where)
            need(0<=t<d and t>last,where+" 字幕时间应递增且在镜内")
            last=t
    return count
