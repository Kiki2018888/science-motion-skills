(() => {
'use strict';
const cfg=window.FLOW_CONFIG,NS='http://www.w3.org/2000/svg',$=s=>document.querySelector(s),svg=$('#scene');
const capture=new URLSearchParams(location.search).has('cap');if(capture)document.body.classList.add('cap');
const W=cfg.width,H=cfg.height,T=cfg.theme,L=cfg.layout,clamp=x=>Math.max(0,Math.min(1,x));
const smooth=x=>{x=clamp(x);return x*x*(3-2*x)},ease=x=>1-(1-clamp(x))**3,ramp=(t,s,d=.4)=>smooth((t-s)/d);
const nodes=new Map(),edges=new Map(),issues=[],warnings=[],diagnostics=[];let playing=!capture,last=0,time=0,cursorOverride=null;
function el(tag,attrs={},parent=svg){const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);parent.append(n);return n}
function attr(n,values){for(const[k,v]of Object.entries(values))n.setAttribute(k,v)}
function opacity(n,x){n.setAttribute('opacity',clamp(x).toFixed(6))}
const ctx=document.createElement('canvas').getContext('2d');
function measure(text,size,weight=400){ctx.font=`${weight} ${size}px Body`;return ctx.measureText(text).width}
function wrap(text,width,size,weight=400){
 const result=[];for(const paragraph of String(text).split('\n')){let line='';for(const ch of Array.from(paragraph)){if(line&&measure(line+ch,size,weight)>width){result.push(line);line=ch}else line+=ch}result.push(line)}return result;
}
function textBlock(parent,text,size,width,weight,color){
 const lines=wrap(text,width,size,weight),g=el('g',{},parent);
 lines.forEach((line,i)=>{const t=el('text',{x:0,y:(i+.8)*size*1.22,'font-size':size,'font-weight':weight,fill:color,'text-anchor':'middle'},g);t.textContent=line});
 return {g,height:lines.length*size*1.22,width:Math.max(...lines.map(l=>measure(l,size,weight))),lines};
}
const icons={question:'<circle r="22"/><path d="M-7-8C-7-18 10-18 10-7C10 0 0 0 0 7M0 14v1"/>',
 evidence:'<path d="M-17-23H9L21-11V23H-17ZM9-23V-11H21M-8-2H12M-8 7H12M-8 16H3"/>',
 analysis:'<circle cx="-3" cy="-4" r="17"/><path d="M10 10L24 24M-13-3H-7L-3-10L3 3L9-3"/>',
 conclusion:'<path d="M-18-22H18V23H-18ZM-9 0L-1 8L11-7"/>',experiment:'<path d="M-9-23H9M-5-23V-7L-20 17Q-24 24-14 24H14Q24 24 20 17L5-7V-23M-12 8H12"/>',
 check:'<path d="M-19 0L-5 15L23-18"/>',warning:'<path d="M0-23L25 22H-25ZM0-8V6M0 14V15"/>'};
function shapePath(s){const w=s.width,h=s.height;if(s.shape==='diamond')return `M0 ${-h/2}L${w/2} 0L0 ${h/2}L${-w/2} 0Z`;return null}
function roundRadius(s){return s.shape==='rect'?0:s.shape==='pill'?Math.min(s.width,s.height)/2:Math.min(s.radius,s.width/2,s.height/2)}
function inside(n,x,y,inset=0){
 const s=n.data.style,rx=s.width/2-inset,ry=s.height/2-inset; x=Math.abs(x-n.x);y=Math.abs(y-n.y);
 if(rx<=0||ry<=0)return false;
 if(s.shape==='diamond')return x/rx+y/ry<1;
 if(s.shape==='circle')return (x/rx)**2+(y/ry)**2<1;
 const r=Math.max(0,roundRadius(s)-inset);return x<=rx&&y<=ry&&(x<=rx-r||y<=ry-r||(x-rx+r)**2+(y-ry+r)**2<=r*r);
}
function port(n,p){
 const s=n.data.style,rx=s.width/2,ry=s.height/2,vertical=['top','bottom'].includes(p.side),o=p.offset||0;
 const along=(vertical?rx:ry)*o;let outward=vertical?ry:rx;
 if(s.shape==='diamond')outward*=1-Math.abs(o);
 else if(s.shape==='circle')outward*=Math.sqrt(1-o*o);
 else {const r=roundRadius(s),limit=(vertical?rx:ry)-r;if(Math.abs(along)>limit)outward=outward-r+Math.sqrt(Math.max(0,r*r-(Math.abs(along)-limit)**2))}
 const sign=['right','bottom'].includes(p.side)?1:-1;
 return {x:n.x+(vertical?along:sign*outward),y:n.y+(vertical?sign*outward:along),nx:vertical?0:sign,ny:vertical?sign:0};
}
function layout(){
 const grid=cfg.nodes.filter(n=>!n.position),vertical=L.direction==='vertical';
 const cols=grid.length?Math.max(...grid.map(n=>n.column))+1:1,rows=grid.length?Math.max(...grid.map(n=>n.row))+1:1;
 const maxW=Math.max(...cfg.nodes.map(n=>n.style.width)),maxH=Math.max(...cfg.nodes.map(n=>n.style.height));
 const top=cfg.show.header?L.header+44:L.margin,bottom=H-(cfg.show.caption||cfg.show.progress?L.footer:L.margin),areaH=bottom-top,areaW=W-2*L.margin;
 const primarySize=vertical?maxH:maxW,primaryArea=vertical?areaH:areaW;
 const gap=L.gap===null?Math.min(140,(primaryArea-cols*primarySize)/Math.max(1,cols-1)):L.gap;
 if(grid.length&&cols>1&&gap<40)issues.push('自动布局过密：减少同屏节点、缩小卡片或改为分屏；不要缩小文字强塞。');
 const spanX=vertical?rows*maxW+(rows-1)*L.laneGap:cols*maxW+(cols-1)*gap;
 const spanY=vertical?cols*maxH+(cols-1)*gap:rows*maxH+(rows-1)*L.laneGap;
 for(const n of cfg.nodes){const x=n.position?.x??((W-spanX)/2+maxW/2+(vertical?n.row*(maxW+L.laneGap):n.column*(maxW+gap))+L.offsetX);
  const y=n.position?.y??(top+(areaH-spanY)/2+maxH/2+(vertical?n.column*(maxH+gap):n.row*(maxH+L.laneGap))+L.offsetY);
  nodes.set(n.id,{data:n,x,y});if(x-n.style.width/2<L.margin-1||x+n.style.width/2>W-L.margin+1||y-n.style.height/2<top-1||y+n.style.height/2>bottom+1)issues.push(`节点 ${n.id} 超出内容区；调整尺寸、位置或布局留白。`);
 }
 const list=[...nodes.values()];for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const a=list[i],b=list[j];if(Math.abs(a.x-b.x)<(a.data.style.width+b.data.style.width)/2+8&&Math.abs(a.y-b.y)<(a.data.style.height+b.data.style.height)/2+8)issues.push(`节点 ${a.data.id} 与 ${b.data.id} 太近或重叠。`)}
}
function buildNode(n,parent){
 const d=n.data,s=d.style,g=el('g',{'data-node':d.id},parent);n.g=g;
 n.shape=s.shape==='circle'?el('circle',{r:s.width/2},g):s.shape==='diamond'?el('path',{d:shapePath(s)},g):el('rect',{x:-s.width/2,y:-s.height/2,width:s.width,height:s.height,rx:roundRadius(s)},g);
 if(s.shadow)n.shape.setAttribute('filter','url(#shadow)');
 const safeW=s.shape==='diamond'?s.width*.52:s.shape==='circle'?s.width*.66:s.shape==='pill'?s.width-s.height*.4:s.width-2*s.padding;
 const safeH=s.shape==='diamond'?s.height*.45:s.shape==='circle'?s.height*.66:s.height-2*s.padding;
 n.content=el('g',{},g);n.mark=el('rect',{rx:4},n.content);
 const hasIcon=s.showIcon&&(d.icon!=='none'||d.iconText),iconW=hasIcon?s.iconSize+14:0;
 n.title=textBlock(n.content,d.title,s.titleSize,safeW-iconW,700,s.text);
 if(n.title.width>safeW-iconW+1)issues.push(`节点 ${d.id} 标题太宽。`);
 n.icon=el('g',{fill:'none',stroke:s.accent,'stroke-width':3,'stroke-linecap':'round','stroke-linejoin':'round'},n.content);
 if(hasIcon){if(d.iconText){const txt=el('text',{'text-anchor':'middle',y:9,'font-size':30,fill:s.accent,stroke:'none'},n.icon);txt.textContent=d.iconText}else n.icon.innerHTML=icons[d.icon]||''}
 n.descVariants=new Map();
 for(const desc of new Set([d.description,...d.events.filter(e=>'description'in e).map(e=>e.description)])){
  const b=textBlock(n.content,desc,s.descriptionSize,safeW,400,s.descriptionColor);n.descVariants.set(desc,b);
  const titleH=Math.max(n.title.height,hasIcon?s.iconSize:0),total=titleH+(desc?12+b.height:0);
  if(total>safeH+1)issues.push(`节点 ${d.id} 的文字超出 ${s.shape} 内部空间：增大卡片或缩短说明。`);
 }
 n.index=el('text',{'text-anchor':'middle','font-size':18,fill:s.descriptionColor},g);n.index.textContent=s.showNumber?d.number:'';
 attr(n.index,{x:['circle','diamond','pill'].includes(s.shape)||roundRadius(s)>s.height/4?0:s.width/2-26,y:-s.height/2+28});
 n.badge=el('g',{},g);n.badgeBox=el('rect',{height:32,rx:cfg.appearance==='amber-night'?4:16,y:-s.height/2-42},n.badge);
 n.badgeText=el('text',{x:0,y:-s.height/2-19,'text-anchor':'middle','font-size':19,fill:T.card},n.badge);
 n.safeW=safeW;n.iconW=iconW;
}
function roundedPath(points,r){
 let path=`M${points[0].x} ${points[0].y}`;
 for(let i=1;i<points.length-1;i++){const a=points[i-1],b=points[i],c=points[i+1],ab=Math.hypot(b.x-a.x,b.y-a.y),bc=Math.hypot(c.x-b.x,c.y-b.y),k=Math.min(r,ab/2,bc/2);if(!ab||!bc)continue;
  const p={x:b.x+(a.x-b.x)*k/ab,y:b.y+(a.y-b.y)*k/ab},q={x:b.x+(c.x-b.x)*k/bc,y:b.y+(c.y-b.y)*k/bc};path+=`L${p.x} ${p.y}Q${b.x} ${b.y} ${q.x} ${q.y}`;
 }const last=points.at(-1);return path+`L${last.x} ${last.y}`;
}
function buildEdge(e,parent){
 const a=nodes.get(e.from),b=nodes.get(e.to),dx=b.x-a.x,dy=b.y-a.y;
 const horizontal=Math.abs(dx)>Math.abs(dy),from=horizontal?(dx>=0?'right':'left'):(dy>=0?'bottom':'top'),opp={right:'left',left:'right',top:'bottom',bottom:'top'};
 const resolvePort=(spec,source)=>{if(spec?.offset!=='auto')return spec;const vertical=['left','right'].includes(spec.side),delta=vertical?a.y-b.y:a.x-b.x;return {...spec,offset:Math.sign(delta||1)*.15*e.lane.index*(source?1:-1)}};
 const p=port(a,resolvePort(e.fromPort,true)||{side:from}),q=port(b,resolvePort(e.toPort,false)||{side:opp[from]});let path;
 if(e.routing==='lane'){
  const ln=e.lane,all=[...nodes.values()],vertical=['left','right'].includes(ln.side),negative=['left','top'].includes(ln.side);
  const ext=all.map(n=>vertical?n.x+(negative?-1:1)*n.data.style.width/2:n.y+(negative?-1:1)*n.data.style.height/2);
  const axis=(negative?Math.min(...ext):Math.max(...ext))+(negative?-1:1)*(ln.clearance+ln.index*ln.gap);
  const via=vertical?[{x:axis,y:p.y},{x:axis,y:q.y}]:[{x:p.x,y:axis},{x:q.x,y:axis}];path=roundedPath([p,...via,q],e.style.cornerRadius);
 }
 else if(e.via.length){const via=e.via.map(v=>v.node?{x:nodes.get(v.node).x+v.dx,y:nodes.get(v.node).y+v.dy}:v);path=roundedPath([p,...via,q],e.style.cornerRadius)}
 else if(e.routing==='straight')path=`M${p.x} ${p.y}L${q.x} ${q.y}`;
 else {const opposite=p.nx*q.nx+p.ny*q.ny<-.9,bend=opposite?Math.min(e.style.bend,Math.hypot(q.x-p.x,q.y-p.y)*.45):e.style.bend;path=`M${p.x} ${p.y}C${p.x+p.nx*bend} ${p.y+p.ny*bend} ${q.x+q.nx*bend} ${q.y+q.ny*bend} ${q.x} ${q.y}`}
 const g=el('g',{'data-edge':e.id},parent),base=el('path',{d:path,fill:'none',stroke:e.style.baseColor,'stroke-width':e.style.baseWidth,'stroke-linecap':'round'},g),line=el('path',{d:path,fill:'none','stroke-width':e.style.width,'stroke-linecap':'round'},g);
 const cursor=el('g',{'data-cursor':e.id},g),shapes={};for(const shape of ['circle','triangle']){const group=el('g',{'data-shape':shape},cursor),size=e.cursor.size;
  for(const halo of [true,false]){const attrs={opacity:halo?e.cursor.haloOpacity:1,transform:`scale(${halo?e.cursor.haloScale:1})`};if(shape==='circle')el('circle',{...attrs,r:size},group);else el('path',{...attrs,d:`M${size*1.55} 0L${-size*1.05} ${size*1.05}L${-size*1.05} ${-size*1.05}Z`},group)}shapes[shape]=group;
 }
 const gate=el('path',{d:'M-5-14V14M5-14V14',fill:'none','stroke-width':4,'stroke-linecap':'round'},g),label=el('text',{'font-size':e.style.labelSize,'text-anchor':'middle',fill:e.style.labelColor},g);
 const len=base.getTotalLength();if(len<1)issues.push(`连线 ${e.id} 长度为零。`);
 if(e.label){const loc=base.getPointAtLength(len*e.label.position);attr(label,{x:loc.x+e.label.dx,y:loc.y+e.label.dy});label.textContent=e.label.text}
 const points=Array.from({length:Math.ceil(len/10)+1},(_,i)=>{const z=base.getPointAtLength(Math.min(len,i*10));return {x:z.x,y:z.y}});edges.set(e.id,{data:e,g,base,line,cursor,shapes,gate,label,len,p,q,points});
 for(let dist=10;dist<len-10;dist+=10){const pt=base.getPointAtLength(dist);for(const n of nodes.values()){if(inside(n,pt.x,pt.y,6)){issues.push(`连线 ${e.id} 穿入节点 ${n.data.id}；调整端口、bend 或 via。`);return}}}
}
function nodeState(n,t){const d=n.data;let state=d.initialState,description=d.description,label=null;for(const ev of d.events){if(ev.at>t)break;state=ev.state;label=ev.label??null;if('description'in ev)description=ev.description}const style={...d.style,opacity:1,highlightOpacity:0,...d.states[state]};return {state,description,label:label??style.label??'',style}}
function drawNode(n,t){
 const d=n.data,s=d.style,now=nodeState(n,t),v=now.style,enter=ease((t-d.enter)/d.enterDuration);
 attr(n.g,{transform:`translate(${n.x} ${n.y+24*(1-enter)})`});opacity(n.g,enter*v.opacity);
 attr(n.shape,{fill:v.fill,stroke:v.border,'stroke-width':v.strokeWidth});
 const titleW=n.title.width,groupW=n.iconW+titleW,titleH=Math.max(n.title.height,n.iconW?s.iconSize:0),desc=n.descVariants.get(now.description),total=titleH+(now.description?12+desc.height:0),top=-total/2;
 attr(n.title.g,{transform:`translate(${n.iconW/2} ${top+(titleH-n.title.height)/2})`});n.title.g.querySelectorAll('text').forEach(tx=>tx.setAttribute('fill',v.text));
 attr(n.mark,{x:n.iconW/2-titleW/2-7,y:top+3,width:titleW+14,height:n.title.height,fill:v.highlight});opacity(n.mark,v.highlightOpacity);
 attr(n.icon,{transform:`translate(${-groupW/2+s.iconSize/2} ${top+titleH/2}) scale(${s.iconSize/48})`,stroke:v.accent});n.icon.querySelectorAll('text').forEach(tx=>tx.setAttribute('fill',v.accent));
 for(const[text,b]of n.descVariants){opacity(b.g,text===now.description&&text?1:0);attr(b.g,{transform:`translate(0 ${top+titleH+12})`});b.g.querySelectorAll('text').forEach(tx=>tx.setAttribute('fill',v.descriptionColor))}
 const bw=measure(now.label,19)+28;attr(n.badge,{transform:`translate(${L.direction==='vertical'?-(bw/2+12):0} 0)`});attr(n.badgeBox,{x:-bw/2,width:bw,fill:cfg.appearance==='amber-night'?'none':v.accent,...(cfg.appearance==='amber-night'?{stroke:v.accent,'stroke-width':1}:{})});if(cfg.appearance==='amber-night')n.badgeText.setAttribute('fill',v.accent);n.badgeText.textContent=now.label;opacity(n.badge,s.showState&&now.label?1:0);
 n.current={state:now.state,label:now.label,description:now.description,opacity:enter*v.opacity};
}
function travelAt(e,t){
 let progress=0,visible=false,turn=0,color=e.style.color,gate=false;
 for(const tr of e.travels){if(t<tr.start)break;const age=t-tr.start,forward=tr.duration,stop=forward+tr.hold,end=stop+tr.returnDuration;
  color=tr.color||e.style.color;turn=0;gate=false;
  if(age<forward){progress=tr.from+(tr.to-tr.from)*smooth(age/forward);visible=true}
  else if(age<stop){progress=tr.to;visible=true;gate=tr.to<1;turn=tr.returnDuration?180*ramp(age,stop-Math.min(tr.turnDuration,tr.hold),Math.max(.001,Math.min(tr.turnDuration,tr.hold))):0}
  else if(tr.returnDuration&&age<end){progress=tr.to-(tr.to-tr.from)*smooth((age-stop)/tr.returnDuration);visible=true;turn=180}
  else {progress=tr.returnDuration?tr.from:tr.to;visible=false}
 }
 return {progress,visible,turn,color,gate};
}
function drawEdge(r,t){const e=r.data;if(e.animation.mode==='dashed'){
 const a=e.animation,period=a.dash+a.gap,elapsed=Math.max(0,t-e.enter),offset=((a.phase+(a.direction==='forward'?-1:1)*elapsed*a.speed)%period+period)%period;
 opacity(r.g,ramp(t,e.enter)*(a.until===undefined?1:1-ramp(t,a.until)));attr(r.line,{stroke:e.style.color,'stroke-dasharray':`${a.dash} ${a.gap}`,'stroke-dashoffset':offset});opacity(r.line,e.style.opacity);opacity(r.cursor,0);opacity(r.gate,0);
 opacity(r.label,e.label?ramp(t,e.label.at)*(e.label.until===undefined?1:1-ramp(t,e.label.until)):0);
 r.current={mode:'dashed',dashOffset:offset,period,pathLength:r.len,visible:t>=e.enter&&(a.until===undefined||t<a.until),progress:1,x:r.p.x,y:r.p.y,angle:0};return;
 }
 const v=travelAt(e,t),len=r.len;opacity(r.g,ramp(t,e.enter));attr(r.line,{stroke:v.color,'stroke-dasharray':`${len*clamp(v.progress)} ${len+1}`});opacity(r.line,e.style.opacity);
 const dist=len*clamp(v.progress),p=r.base.getPointAtLength(dist),a=r.base.getPointAtLength(Math.max(0,dist-1)),b=r.base.getPointAtLength(Math.min(len,dist+1)),angle=Math.atan2(b.y-a.y,b.x-a.x)*180/Math.PI+v.turn;
 attr(r.cursor,{transform:`translate(${p.x} ${p.y}) rotate(${angle})`,fill:e.cursor.color||v.color});opacity(r.cursor,v.visible?1:0);for(const[key,g]of Object.entries(r.shapes))g.setAttribute('display',key===(cursorOverride||e.cursor.shape)?'inline':'none');
 const ahead=r.base.getPointAtLength(Math.min(len,dist+18));attr(r.gate,{transform:`translate(${ahead.x} ${ahead.y}) rotate(${angle-v.turn})`,stroke:v.color});opacity(r.gate,v.gate?1:0);
 opacity(r.label,e.label?ramp(t,e.label.at)*(e.label.until===undefined?1:1-ramp(t,e.label.until)):0);
 r.current={...v,x:p.x,y:p.y,angle,shape:cursorOverride||e.cursor.shape};
}
function geometryChecks(){
 const list=[...edges.values()],G=FlowGeometry;
 const emit=(category,kind,ids,detail)=>{const item={kind,edges:ids,...detail};diagnostics.push(item);const mode=cfg.validation[category];if(mode==='error')issues.push(`${kind}: ${ids.join(' / ')}`);else if(mode==='warn')warnings.push(item);};
 const bounds={x:L.margin,y:cfg.show.header?L.header+44:L.margin,width:W-2*L.margin,height:0};bounds.height=H-(cfg.show.caption||cfg.show.progress?L.footer:L.margin)-bounds.y;
 for(let i=0;i<list.length;i++){
  const a=list[i],self=G.compare(a.points,a.points,true);
  if(self.overlap>24)emit('paths','path-self-overlap',[a.data.id],{length:self.overlap});
  if(self.intersections.length)emit('crossings','path-self-crossing',[a.data.id],{points:self.intersections});
  if(a.points.some(p=>!G.pointIn(p,bounds,1)))emit('paths','path-outside-content',[a.data.id],{});
  for(let j=i+1;j<list.length;j++){
   const b=list[j],d=G.compare(a.points,b.points);
   if(d.overlap>24)emit('paths','paths-overlap',[a.data.id,b.data.id],{length:d.overlap});
   if(d.intersections.length)emit('crossings','paths-cross',[a.data.id,b.data.id],{points:d.intersections});
  }
 }
 const labels=list.filter(e=>e.data.label&&e.data.label.text).map(e=>({edge:e,rect:e.label.getBBox()}));
 const active=(a,b)=>Math.max(a.at??0,b.at??0)<Math.min(a.until??cfg.duration,b.until??cfg.duration);
 for(let i=0;i<labels.length;i++){
  const a=labels[i];
  for(const n of nodes.values())if(active(a.edge.data.label,{at:n.data.enter})&&G.rectHit(a.rect,{x:n.x-n.data.style.width/2,y:n.y-n.data.style.height/2,width:n.data.style.width,height:n.data.style.height},3))emit('labels','label-over-node',[a.edge.data.id],{node:n.data.id});
  for(let j=i+1;j<labels.length;j++)if(active(a.edge.data.label,labels[j].edge.data.label)&&G.rectHit(a.rect,labels[j].rect,3))emit('labels','labels-overlap',[a.edge.data.id,labels[j].edge.data.id],{});
  for(const e of list)if(active(a.edge.data.label,{at:e.data.enter,until:e.data.animation.until})&&e.points.some(p=>G.pointIn(p,a.rect,3)))emit('labels','line-over-label',[e.data.id,a.edge.data.id],{});
 }
 window.__warnings=warnings;window.__pathDiagnostics=diagnostics;
}
let header,caption,phase,captionText,progress;
function build(){
 document.title=cfg.title;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);svg.style.background=T.bg;document.body.style.background=capture?T.bg:'#e8e6df';
 const defs=el('defs');defs.innerHTML='<filter id="shadow" x="-30%" y="-40%" width="160%" height="200%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="'+T.fg+'" flood-opacity=".06"/></filter>';
 header=el('g');const m=L.margin,headSize=W<1300?52:68;
 const badgeW=measure(cfg.badge,22)+36;el('rect',{x:m,y:70,width:badgeW,height:40,rx:cfg.appearance==='amber-night'?4:7,fill:cfg.appearance==='amber-night'?'none':T.accent,...(cfg.appearance==='amber-night'?{stroke:T.accent,'stroke-width':1}:{})},header);const badge=el('text',{x:m+badgeW/2,y:98,'text-anchor':'middle',fill:cfg.appearance==='amber-night'?T.accent:T.card,'font-size':22},header);badge.textContent=cfg.badge;
 const eyebrow=el('text',{x:m+badgeW+20,y:98,fill:T.muted,'font-size':22},header);eyebrow.textContent=cfg.eyebrow;
 const title=textBlock(header,cfg.title,headSize,W-2*m,700,T.fg);attr(title.g,{transform:`translate(${W/2} 158)`});title.g.querySelectorAll('text').forEach(tx=>{tx.setAttribute('text-anchor','start');tx.setAttribute('x',-W/2+m)});
 const subtitle=textBlock(header,cfg.subtitle,26,W-2*m,400,T.muted);attr(subtitle.g,{transform:`translate(${W/2} ${158+title.height+18})`});subtitle.g.querySelectorAll('text').forEach(tx=>{tx.setAttribute('text-anchor','start');tx.setAttribute('x',-W/2+m)});opacity(subtitle.g,cfg.show.subtitle&&cfg.subtitle?1:0);
 if(cfg.show.header&&158+title.height+(cfg.show.subtitle&&cfg.subtitle?subtitle.height+18:0)>L.header-12)issues.push('标题或副标题超出页眉；缩短标题或增加 layout.header。');
 el('path',{d:`M${m} ${L.header}H${W-m}`,stroke:T.line},header);phase=el('text',{x:W-m,y:98,'text-anchor':'end',fill:T.muted,'font-size':22},header);
 layout();const edgeLayer=el('g',{'data-layer':'edges'}),nodeLayer=el('g',{'data-layer':'nodes'});
 for(const n of nodes.values())buildNode(n,nodeLayer);for(const e of cfg.edges)buildEdge(e,edgeLayer);geometryChecks();
 caption=el('g');el('rect',{x:m,y:H-L.footer+54,width:5,height:45,rx:2,fill:T.accent},caption);captionText=el('g',{},caption);
 const captionSize=W<1300?30:34;
 for(const ca of cfg.captions){const block=textBlock(captionText,ca.text,captionSize,W-2*m-40,400,T.fg);attr(block.g,{transform:`translate(${W/2+20} ${H-L.footer+52})`});block.g.querySelectorAll('text').forEach(tx=>{tx.setAttribute('text-anchor','start');tx.setAttribute('x',-W/2+m)});ca.block=block.g;if(block.height>L.footer-95)issues.push('字幕过长；缩短文案或增加 layout.footer。')}
 el('path',{d:`M${m} ${H-56}H${W-m}`,stroke:T.line,'stroke-width':2,opacity:cfg.show.progress?1:0});progress=el('path',{d:`M${m} ${H-56}H${W-m}`,stroke:T.accent,'stroke-width':3});
 $('#scrub').max=cfg.duration;window.__dur=cfg.duration;window.__issues=issues;window.__size={width:W,height:H};fit();draw(0);
}
function draw(t){time=Math.max(0,Math.min(cfg.duration,t));window.__time=time;
 opacity(header,cfg.show.header?ramp(time,0,.6):0);for(const n of nodes.values())drawNode(n,time);for(const e of edges.values())drawEdge(e,time);
 const current=cfg.captions.findLast(c=>c.at<=time);for(const ca of cfg.captions)opacity(ca.block,ca===current?ramp(time,ca.at,.3):0);opacity(caption,cfg.show.caption&&current?1:0);phase.textContent=current?.phase||'';
 // Phase is omitted when it would collide with the badge / eyebrow.
 const left=L.margin+measure(cfg.badge,22)+56+measure(cfg.eyebrow,22);opacity(phase,W-L.margin-measure(phase.textContent,22)>left+30?1:0);
 attr(progress,{'stroke-dasharray':`${(W-2*L.margin)*clamp(time/Math.max(.1,cfg.duration-.4))} ${W}`});opacity(progress,cfg.show.progress?1:0);$('#scrub').value=time;$('#clock').textContent=`${time.toFixed(1)} / ${cfg.duration.toFixed(1)} s`;
}
function fit(){const s=capture?1:Math.min(innerWidth/W,Math.max(150,innerHeight-90)/H);$('#viewport').style.width=W*s+'px';$('#viewport').style.height=H*s+'px'}
window.__seek=async t=>{draw(t);await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame)};
window.__setCursor=shape=>{if(!['config','circle','triangle'].includes(shape))throw Error('Unknown cursor');cursorOverride=shape==='config'?null:shape;$('#cursor').value=shape;draw(time)};
window.__inspect=()=>({time,nodes:[...nodes.values()].map(n=>({id:n.data.id,x:n.x,y:n.y,shape:n.data.style.shape,...n.current})),edges:[...edges.values()].map(r=>({id:r.data.id,...r.current}))});
$('#cursor').onchange=e=>window.__setCursor(e.target.value);$('#scrub').oninput=e=>{playing=false;$('#play').textContent='播放';draw(+e.target.value)};
$('#play').onclick=()=>{if(time>=cfg.duration)draw(0);playing=!playing;$('#play').textContent=playing?'暂停':'播放'};$('#replay').onclick=()=>{draw(0);playing=true;$('#play').textContent='暂停'};addEventListener('resize',fit);
document.fonts.ready.then(()=>{try{build();window.__ready=true;if(issues.length)$('#error').textContent=issues.join('\n');requestAnimationFrame(function tick(ms){if(last&&playing){draw(time+(ms-last)/1000);if(time>=cfg.duration){playing=false;$('#play').textContent='重播'}}last=ms;requestAnimationFrame(tick)})}catch(e){window.__buildError=String(e);$('#error').textContent=String(e);throw e}});
})();
