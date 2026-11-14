"""Normalize multiscale scene configuration; no browser or network required."""
import copy
import math


def require(ok, message):
    if not ok:
        raise ValueError(message)


def number(value, name, minimum=None, positive=False):
    require(isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value), name + ' must be finite')
    require(not positive or value > 0, name + ' must be positive')
    require(minimum is None or value >= minimum, name + ' is below minimum')
    return value


def normalize(raw):
    c = copy.deepcopy(raw)
    c.setdefault('width', 1920); c.setdefault('height', 1080); c.setdefault('fps', 24)
    for k in ['width', 'height']:
        number(c[k], k, 320)
        require(isinstance(c[k], int) and c[k] % 2 == 0, k + ' must be an even integer')
    require(c['fps'] in [24, 25, 30, 60], 'fps must be 24, 25, 30 or 60')
    ratio = c['width'] / c['height']
    require(abs(ratio-16/9) < .002 or abs(ratio-9/16) < .002, 'Use a 16:9 or 9:16 canvas')
    c['portrait'] = ratio < 1
    c['designWidth'], c['designHeight'] = (1080, 1920) if c['portrait'] else (1920, 1080)
    c['viewport'] = dict(x=64,y=280,w=952,h=1010) if c['portrait'] else dict(x=96,y=270,w=1376,h=688)
    c['theme'] = {**dict(background='#f5f5ee', ink='#183e33', muted='#768b7b', rule='#d4ded1', accent='#327854', field='#e9eddf', panel='#fbfcf2', locator='#b88c35'), **c.get('theme', {})}
    c['text'] = {**dict(badge='多尺度连续缩放', kicker='', title='从整体，走进细节', subtitle='', note='结构示意', position='观察位置', viewWidth='当前视野宽度', relative='相对初始画面', locator='整体定位', moving='连续推进', holding='停留观察'), **c.get('text', {})}
    require(all(isinstance(v,str) for v in c['text'].values()), 'All text values must be strings')
    c['units'] = {**dict(name='μm',metresPerUnit=1e-6), **c.get('units', {})}
    if c['units']['metresPerUnit'] is not None:
        number(c['units']['metresPerUnit'], 'units.metresPerUnit', positive=True)
    c['scaleBar'] = {**dict(show=True,pixels=172,mode='continuous',unit='auto'), **c.get('scaleBar', {})}
    require(c['scaleBar']['mode'] in ['continuous','nice'], 'scaleBar.mode must be continuous or nice')
    require(c['scaleBar']['unit'] in ['auto','world'], 'scaleBar.unit must be auto or world')
    number(c['scaleBar']['pixels'],'scaleBar.pixels',positive=True)
    require(c['scaleBar']['pixels'] <= c['viewport']['w']*.4, 'Scale bar too long')
    c['showLocator'] = c.get('showLocator',True); c['showFocus'] = c.get('showFocus',True)
    levels = c.get('levels', [])
    require(2 <= len(levels) <= 8, 'Supply 2–8 levels')
    t = 0
    for i, level in enumerate(levels):
        require(isinstance(level.get('name'),str) and level['name'], f'levels[{i}].name is required')
        level.setdefault('description',''); level.setdefault('caption',''); level.setdefault('center',[0,0]); level.setdefault('hold',2)
        level.setdefault('transition',0 if i == 0 else 4); level.setdefault('panEase',1)
        number(level.get('viewWidth'), f'levels[{i}].viewWidth',positive=True)
        require(len(level['center'])==2,'center must be [x,y]')
        for v in level['center']: number(v,'center')
        number(level['hold'],'hold',0); number(level['transition'],'transition',0); number(level['panEase'],'panEase',positive=True)
        require(i == 0 or level['transition'] > 0, 'Transitions between levels must be positive (no cuts)')
        require(i != 0 or level['transition'] == 0, 'First transition must be 0')
        level['start'] = t
        t += level['transition']; level['arrive'] = t
        t += level['hold']; level['end'] = t
        level.setdefault('annotations', [])
        for a in level['annotations']:
            require(isinstance(a.get('text'),str),'annotation.text required')
            require(len(a.get('point',[]))==2 and len(a.get('offset',[]))==2,'annotation needs world point and design-pixel offset')
            for v in a['point']+a['offset']: number(v,'annotation coordinate')
    c['duration'] = t
    require(t>0,'Timeline is empty')
    scene=c.setdefault('scene',{'type':'leaf'})
    require(scene.get('type') in ['leaf','images'],'scene.type must be leaf or images')
    if scene['type']=='leaf':
        scene.setdefault('focus',[7000,6500])
        require(len(scene['focus'])==2,'scene.focus must be [x,y]')
        for v in scene['focus']:number(v,'scene.focus')
        require(c['units']['metresPerUnit']==1e-6,'Built-in leaf coordinates are micrometres; use 1e-6 metresPerUnit')
        require(min(l['viewWidth'] for l in levels)>=20 and max(l['viewWidth'] for l in levels)<=160000,'Leaf preset supports view widths 20–160000 μm')
    else:
        layers=scene.get('layers',[])
        require(layers,'images mode requires scene.layers')
        for i,layer in enumerate(layers):
            require(isinstance(layer.get('src'),str) and layer['src'],'layer.src is required')
            b=layer.get('bounds',{})
            for k in ['cx','cy']:number(b.get(k,0),'bounds.'+k);b.setdefault(k,0)
            number(b.get('width'),'bounds.width',positive=True)
            if 'height' in b:number(b['height'],'bounds.height',positive=True)
            layer.setdefault('opacity',1);number(layer['opacity'],'opacity',0);require(layer['opacity']<=1,'opacity > 1')
            layer.setdefault('fadeRatio',2);number(layer['fadeRatio'],'fadeRatio',positive=True);require(layer['fadeRatio']>1,'fadeRatio must be > 1')
            if i>0:require('revealWidth' in layer,'Detail layers need revealWidth')
            if 'revealWidth' in layer:number(layer['revealWidth'],'revealWidth',positive=True)
    return c
