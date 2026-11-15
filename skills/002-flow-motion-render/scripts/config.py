"""Validate and resolve the documented flow animation configuration."""
import copy
import math
import re


def require(ok, message):
    if not ok:
        raise ValueError(message)


def obj(value, keys, where):
    require(isinstance(value, dict), f'{where}: expected an object')
    require(not (set(value) - set(keys)), f'{where}: unknown fields {set(value) - set(keys)}')


def number(value, where, low=0, high=100000):
    require(type(value) in (int, float) and math.isfinite(value) and low <= value <= high,
            f'{where}: expected a finite number in [{low}, {high}]')


def string(value, where, empty=True):
    require(isinstance(value, str) and (empty or value.strip()), f'{where}: expected text')


def color(value, where):
    require(isinstance(value, str) and re.fullmatch(r'#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?', value),
            f'{where}: use #RGB or #RRGGBB')


def merge_style(base, patch, where):
    obj(patch, base, where)
    result = {**base, **patch}
    for key, value in patch.items():
        original = base[key]
        if isinstance(original, bool):
            require(type(value) is bool, f'{where}.{key}: expected boolean')
        elif key == 'shape':
            require(value in ['rect', 'rounded', 'pill', 'circle', 'diamond'], f'{where}: invalid shape')
        elif key == 'label':
            string(value, where + '.label')
        elif isinstance(original, str):
            color(value, where + '.' + key)
        else:
            number(value, where + '.' + key, 0, 3000)
    return result


def cursor(base, patch, where):
    obj(patch, base, where)
    out = {**base, **patch}
    require(out['shape'] in ['circle', 'triangle'], where + ': invalid cursor shape')
    number(out['size'], where + '.size', 2, 40)
    number(out['haloOpacity'], where + '.haloOpacity', 0, 1)
    number(out['haloScale'], where + '.haloScale', 1, 5)
    if out['color'] is not None:
        color(out['color'], where + '.color')
    return out


def normalize(raw):
    root_keys = ('schemaVersion aspect width height fps duration tail title subtitle eyebrow badge theme layout '
                 'nodeDefaults states edgeDefaults cursor show captions nodes edges appearance validation').split()
    obj(raw, root_keys, 'config')
    c = copy.deepcopy(raw)
    require(c.get('schemaVersion', 1) == 1, 'Only schemaVersion 1 is supported')
    c['schemaVersion'] = 1
    c.setdefault('appearance','default');require(c['appearance'] in ['default','amber-night'],'Unknown appearance')
    validation=dict(paths='warn',labels='warn',crossings='warn')
    obj(c.get('validation',{}),validation,'validation');validation.update(c.get('validation',{}))
    require(all(v in ['off','warn','error'] for v in validation.values()),'validation values must be off, warn or error');c['validation']=validation
    c.setdefault('aspect', 'landscape')
    require(c['aspect'] in ['landscape', 'portrait'], 'Invalid aspect')
    portrait = c['aspect'] == 'portrait'
    c.setdefault('width', 1080 if portrait else 1920)
    c.setdefault('height', 1920 if portrait else 1080)
    for key in ['width', 'height']:
        require(type(c[key]) is int and 480 <= c[key] <= 3840 and c[key] % 2 == 0, key + ': even integer 480–3840 required')
    c.setdefault('fps', 24)
    require(c['fps'] in [24, 30], 'fps must be 24 or 30')
    c.setdefault('tail', 1.2); number(c['tail'], 'tail', .4, 30)
    for key, default in [('title', '流程与因果链'), ('subtitle', ''), ('eyebrow', ''), ('badge', '流程与因果链')]:
        c.setdefault(key, default); string(c[key], key)
    theme = dict(bg='#fbf9f3', fg='#1d2f55', muted='#7a8399', line='#d9d4c6', accent='#1d2f55',
                 warning='#a46b1a', highlight='#ffe066', card='#ffffff')
    if c['appearance']=='amber-night':theme.update(bg='#323232',fg='#FFFFFF',muted='#A3A3A3',line='#505050',accent='#E4893A',warning='#F3BB66',highlight='#F3BB66',card='#383838')
    obj(c.get('theme', {}), theme, 'theme'); theme.update(c.get('theme', {}))
    for key, value in theme.items(): color(value, 'theme.' + key)
    c['theme'] = theme
    layout = dict(direction='vertical' if portrait else 'horizontal', margin=72 if portrait else 108,
                  header=300 if portrait else 326, footer=220 if portrait else 160,
                  gap=None, laneGap=80, offsetX=0, offsetY=0)
    obj(c.get('layout', {}), layout, 'layout'); layout.update(c.get('layout', {}))
    require(layout['direction'] in ['horizontal', 'vertical'], 'layout.direction invalid')
    for k, v in layout.items():
        if k == 'direction' or (k == 'gap' and v is None): continue
        number(v, 'layout.' + k, -2000 if k.startswith('offset') else 0, 3840)
    c['layout'] = layout
    show = dict(header=True, subtitle=True, caption=True, progress=True)
    obj(c.get('show', {}), show, 'show'); show.update(c.get('show', {}))
    require(all(type(v) is bool for v in show.values()), 'show values must be booleans'); c['show'] = show
    base = dict(shape='rounded', width=300, height=180, radius=20, padding=24, titleSize=36,
                descriptionSize=24, iconSize=40, showIcon=True, showNumber=True, showState=True,
                fill=theme['card'], border=theme['line'], text=theme['fg'], descriptionColor=theme['muted'],
                accent=theme['accent'], highlight=theme['highlight'], strokeWidth=2, shadow=True)
    if c['appearance']=='amber-night':base.update(radius=8,shadow=False)
    base = merge_style(base, c.get('nodeDefaults', {}), 'nodeDefaults'); c['nodeDefaults'] = base
    # Sparse state styles preserve node-specific base colors unless explicitly overridden.
    state_base = dict(fill=base['fill'], border=base['border'], text=base['text'], descriptionColor=base['descriptionColor'],
                      accent=base['accent'], highlight=base['highlight'], opacity=1, strokeWidth=base['strokeWidth'],
                      highlightOpacity=0, label='')
    states = dict(idle={}, waiting={'opacity': .35}, running={'border': theme['accent'], 'highlightOpacity': .65, 'label': '进行中'},
                  blocked={'border': theme['warning'], 'accent': theme['warning'], 'highlight': '#ffe5b7', 'highlightOpacity': .65, 'label': '暂缓'},
                  completed={'border': theme['accent'], 'label': '已完成'})
    obj(c.get('states', {}), states, 'states')
    for name, patch in c.get('states', {}).items():
        merge_style(state_base, patch, 'states.' + name); states[name].update(patch)
    for name, patch in states.items():
        for k in ['opacity', 'highlightOpacity']:
            if k in patch: number(patch[k], f'states.{name}.{k}', 0, 1)
    c['states'] = states
    c['cursor'] = cursor(dict(shape='circle', size=6, color=None, haloOpacity=.12, haloScale=2.1), c.get('cursor', {}), 'cursor')
    edge_base = dict(color=theme['accent'], baseColor=theme['line'], width=4, baseWidth=3, opacity=.72,
                     bend=100, labelSize=25, labelColor=theme['fg'], cornerRadius=24)
    c['edgeDefaults'] = merge_style(edge_base, c.get('edgeDefaults', {}), 'edgeDefaults')
    require(isinstance(c.get('nodes'), list) and c['nodes'], 'nodes must be a nonempty array')
    ids = set(); end = 0
    node_keys = ('id title description icon iconText number column row position style states enter enterDuration initialState events').split()
    for i, n in enumerate(c['nodes']):
        obj(n, node_keys, f'nodes[{i}]'); string(n.get('id'), 'node.id', False)
        require(re.fullmatch(r'[A-Za-z][A-Za-z0-9_-]*', n['id']) and n['id'] not in ids, 'Node IDs must be unique ASCII names')
        ids.add(n['id']); string(n.get('title'), n['id'] + '.title', False)
        for k, default in [('description', ''), ('icon', 'none'), ('iconText', ''), ('number', str(i + 1).zfill(2))]:
            n.setdefault(k, default); string(n[k], n['id'] + '.' + k)
        require(n['icon'] in ['none', 'question', 'evidence', 'analysis', 'conclusion', 'experiment', 'check', 'warning'], 'Unknown icon')
        for k, default in [('column', i), ('row', 0)]:
            n.setdefault(k, default); require(type(n[k]) is int and 0 <= n[k] <= 30, 'column/row must be integer 0–30')
        if 'position' in n:
            obj(n['position'], ['x', 'y'], 'position')
            for k in ['x', 'y']: number(n['position'].get(k), 'position.' + k)
        n['style'] = merge_style(base, n.get('style', {}), n['id'] + '.style')
        st = n['style']; require(st['width'] >= 80 and st['height'] >= 60, 'Node size is too small')
        require(st['titleSize'] >= 16 and st['descriptionSize'] >= 14, 'Keep text readable; minimum title 16 / description 14')
        if st['shape'] == 'circle': require(st['width'] == st['height'], 'Circle requires equal width and height')
        obj(n.get('states', {}), states, n['id'] + '.states')
        for name, patch in n.get('states', {}).items():
            merge_style(state_base, patch, n['id'] + '.states.' + name)
            for k in ['opacity','highlightOpacity']:
                if k in patch: number(patch[k], n['id'] + '.' + k, 0, 1)
        n['states'] = {name: {**patch, **n.get('states', {}).get(name, {})} for name, patch in states.items()}
        n.setdefault('enter', .6 + n['column'] * 2); number(n['enter'], 'node.enter')
        n.setdefault('enterDuration', .6); number(n['enterDuration'], 'enterDuration', .05, 10)
        n.setdefault('initialState', 'idle'); require(n['initialState'] in states, 'Invalid initialState')
        n.setdefault('events', [{'at': n['enter'], 'state': 'running'}, {'at': n['enter'] + 1.4, 'state': 'completed'}])
        require(isinstance(n['events'], list), 'events must be an array'); last = -1
        for ev in n['events']:
            obj(ev, ['at', 'state', 'label', 'description'], 'node.event'); number(ev.get('at'), 'event.at')
            require(ev['at'] >= n['enter'] and ev['at'] > last, 'Events must be strictly ordered and not precede node.enter')
            require(ev.get('state') in states, 'Unknown node state'); last = ev['at']
            for k in ['label','description']:
                if k in ev: string(ev[k], 'event.' + k)
            end = max(end, ev['at'] + .3)
        end = max(end, n['enter'] + n['enterDuration'])
    by_id = {n['id']: n for n in c['nodes']}
    c.setdefault('edges', []); require(isinstance(c['edges'], list), 'edges must be an array'); edge_ids = set();lane_counts={}
    for i, e in enumerate(c['edges']):
        obj(e, ['id','from','to','fromPort','toPort','via','routing','style','cursor','enter','travels','label','lane','animation'], f'edges[{i}]')
        e.setdefault('id', 'edge' + str(i)); string(e['id'], 'edge.id', False)
        require(e['id'] not in edge_ids, 'Duplicate edge id'); edge_ids.add(e['id'])
        require(e.get('from') in ids and e.get('to') in ids, 'Edge references an unknown node')
        require(e['from'] != e['to'] or ('fromPort' in e and 'toPort' in e), 'Self-loop needs explicit distinct ports')
        for k in ['fromPort','toPort']:
            if k not in e: continue
            obj(e[k], ['side','offset'], k); require(e[k].get('side') in ['left','right','top','bottom'], 'Unknown port side')
            e[k].setdefault('offset', 0)
            if e[k]['offset']=='auto':require(e.get('routing')=='lane','Automatic ports require lane routing')
            else:number(e[k]['offset'], k + '.offset', -.8, .8)
        e.setdefault('routing', 'curve'); require(e['routing'] in ['curve','straight','lane'], 'Unknown routing')
        if e['routing']=='lane':
            lane=dict(side='bottom',clearance=64,gap=64);obj(e.get('lane',{}),['side','clearance','gap','index'],'lane');lane.update(e.get('lane',{}))
            require(lane['side'] in ['left','right','top','bottom'],'Unknown lane side')
            lane.setdefault('index',lane_counts.get(lane['side'],0));require(type(lane['index']) is int and 0<=lane['index']<=5,'lane.index must be integer 0–5')
            lane_counts[lane['side']]=max(lane_counts.get(lane['side'],0),lane['index']+1)
            number(lane['clearance'],'lane.clearance',32,700);number(lane['gap'],'lane.gap',24,300);e['lane']=lane
            for key in ['fromPort','toPort']:
                e.setdefault(key,{'side':lane['side'],'offset':'auto'})
                require(e[key]['side']==lane['side'],'Lane routing uses two ports on lane.side')
            require(not e.get('via'),'Use lane routing or explicit via, not both')
        else:require('lane' not in e,'lane requires routing:lane')
        animation=dict(mode='travel',dash=14,gap=12,speed=78,phase=0,direction='forward')
        obj(e.get('animation',{}),list(animation)+['until'],'animation');animation.update(e.get('animation',{}))
        require(animation['mode'] in ['travel','dashed'],'Unknown animation.mode');require(animation['direction'] in ['forward','reverse'],'Unknown dash direction')
        for key in ['dash','gap']:number(animation[key],'animation.'+key,2,120)
        number(animation['speed'],'animation.speed',1,1000);number(animation['phase'],'animation.phase',-100000,100000)
        if 'until' in animation:number(animation['until'],'animation.until')
        e['animation']=animation
        e.setdefault('via', []); require(isinstance(e['via'], list), 'via must be an array')
        for pt in e['via']:
            obj(pt, ['x','y','node','dx','dy'], 'via')
            if 'node' in pt:
                require(pt['node'] in ids and 'x' not in pt and 'y' not in pt, 'Relative via point needs valid node, dx, dy')
                for k in ['dx','dy']: pt.setdefault(k, 0); number(pt[k], 'via.' + k, -3840, 3840)
            else:
                for k in ['x','y']: number(pt.get(k), 'via.' + k, 0, 3840)
        e['style'] = merge_style(c['edgeDefaults'], e.get('style', {}), 'edge.style')
        e['cursor'] = cursor(c['cursor'], e.get('cursor', {}), 'edge.cursor')
        default_start = max(by_id[e['from']]['enter'] + .7, by_id[e['to']]['enter'] - .8)
        e.setdefault('travels', [] if animation['mode']=='dashed' else [{'start':default_start, 'duration':.8}]); require(isinstance(e['travels'], list), 'travels must be an array')
        require(animation['mode']!='dashed' or not e['travels'],'Continuous dashes use animation, not cursor travels')
        previous_end = -1
        for tr in e['travels']:
            obj(tr, ['start','duration','from','to','hold','returnDuration','turnDuration','color'], 'travel')
            for k, v in [('duration',1),('from',0),('to',1),('hold',0),('returnDuration',0),('turnDuration',.15)]: tr.setdefault(k,v)
            number(tr.get('start'),'travel.start'); number(tr['duration'],'travel.duration',.05,60)
            for k in ['from','to']: number(tr[k], 'travel.'+k, 0, 1)
            require(tr['to'] > tr['from'], 'Travel must advance; use returnDuration for retreat')
            for k in ['hold','returnDuration','turnDuration']: number(tr[k], 'travel.'+k, 0, 60)
            require(tr['start'] >= previous_end and tr['start'] >= by_id[e['from']]['enter'], 'Travels overlap or start before source appears')
            previous_end = tr['start'] + tr['duration'] + tr['hold'] + tr['returnDuration']
            if 'color' in tr: color(tr['color'], 'travel.color')
            end = max(end, previous_end)
        e.setdefault('enter', e['travels'][0]['start'] if e['travels'] else 0); number(e['enter'], 'edge.enter')
        if 'until' in animation:require(animation['until']>e['enter'],'animation.until must follow edge.enter');end=max(end,animation['until'])
        require(not e['travels'] or e['enter'] <= e['travels'][0]['start'], 'edge.enter cannot follow first travel')
        if 'label' in e:
            obj(e['label'], ['text','at','until','position','dx','dy'], 'edge.label')
            string(e['label'].get('text'), 'edge.label.text'); e['label'].setdefault('at', e['enter'])
            e['label'].setdefault('position', .5); e['label'].setdefault('dx',0); e['label'].setdefault('dy',-26)
            number(e['label']['position'],'label.position',0,1); number(e['label']['at'],'label.at')
            for k in ['dx','dy']: number(e['label'][k], 'label.'+k, -3840,3840)
            if 'until' in e['label']: number(e['label']['until'],'label.until',e['label']['at']+.1)
            end = max(end,e['label']['at']+.3)
    c.setdefault('captions', []); require(isinstance(c['captions'], list), 'captions must be an array'); last=-1
    for ca in c['captions']:
        obj(ca,['at','text','phase'],'caption'); number(ca.get('at'),'caption.at'); require(ca['at']>last,'Captions must be strictly ordered');last=ca['at']
        string(ca.get('text'),'caption.text');ca.setdefault('phase','');string(ca['phase'],'caption.phase');end=max(end,ca['at']+.4)
    c.setdefault('duration', end+c['tail']);number(c['duration'],'duration',.5,600)
    require(c['duration'] >= end+.4-1e-8, f'duration must be at least {end+.4:.2f}s to include all events and settle')
    return c
