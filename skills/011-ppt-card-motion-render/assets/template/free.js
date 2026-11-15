/* 011 v2: each element owns its geometry, appearance and deterministic timeline. */
const THEMES={
 blocks:{name:'blocks',bg:'#f3f2ef',panel:'#151617',ink:'#f9f8f4',muted:'#ffffffac',accent:'#f36655',border:'#333',radius:30,shadow:'0 22px 50px #25272914',stageInk:'#1c2022',stageMuted:'#757a78'},
 photo:{name:'photo',bg:'#fbf5ec',panel:'#fffdf8',ink:'#29231e',muted:'#928477',accent:'#db663d',border:'#e9ded0',radius:24,shadow:'0 24px 45px #70563e17',stageInk:'#29231e',stageMuted:'#928477'},
 glass:{name:'glass',bg:'radial-gradient(ellipse at 80% 25%,#d7ddfc,transparent 60%),radial-gradient(ellipse at 20% 90%,#e6dafa,transparent 60%),#f0f2fc',panel:'#ffffffa3',ink:'#202442',muted:'#71799e',accent:'#6673ef',border:'#ffffffde',radius:32,shadow:'0 24px 50px #6973af1c',stageInk:'#202442',stageMuted:'#71799e'},
 dense:{name:'dense',bg:'#f2f0f9',panel:'#fff',ink:'#24213a',muted:'#8d88a3',accent:'#7653ea',border:'#e6e2f1',radius:22,shadow:'0 16px 35px #66529512',stageInk:'#24213a',stageMuted:'#8d88a3'},
 neon:{name:'neon',bg:'#f0f0eb',panel:'#fbfbf8',ink:'#181a18',muted:'#868b7f',accent:'#bddb39',border:'#e1e3da',radius:30,shadow:'0 20px 35px #242a1a0e',stageInk:'#171a15',stageMuted:'#858a7c'},
 editorial:{name:'editorial',bg:'#f7f8fa',panel:'#edf1f5',ink:'#16202d',muted:'#85909d',accent:'#377cc3',border:'#e3e8ee',radius:24,shadow:'0 18px 38px #17314a0f',stageInk:'#16202d',stageMuted:'#85909d'},
 header:{name:'header',bg:'#f5eee2',panel:'#fffaf2',ink:'#32251e',muted:'#a18d7a',accent:'#b97540',border:'#e8daca',radius:26,shadow:'0 24px 45px #4b2e1714',stageInk:'#32251e',stageMuted:'#a18d7a'},
 console:{name:'console',bg:'radial-gradient(ellipse at 80% 5%,#242025,transparent 65%),#121215',panel:'#202024',ink:'#f5f3f0',muted:'#8b898e',accent:'#fc7d3e',border:'#353239',radius:22,shadow:'0 24px 44px #0005',stageInk:'#f5f3f0',stageMuted:'#8b898e'}
};
const ORDER=Object.keys(THEMES),clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),lerp=(a,b,p)=>a+(b-a)*p;
const themeOf=s=>THEMES[s]||THEMES[ORDER[Number(s)-1]]||THEMES.neon;
const E={linear:p=>p,in:p=>p*p*p,out:p=>1-(1-p)**3,inOut:p=>p<.5?4*p*p*p:1-(-2*p+2)**3/2,backOut:p=>1+2.4*(p-1)**3+1.4*(p-1)**2,spring:p=>p===1?1:1-Math.exp(-7*p)*Math.cos(10*p),step:p=>p<1?0:1};
function easing(spec,p){p=clamp(p);if(!Array.isArray(spec))return (E[spec]||E.inOut)(p);const [x1,y1,x2,y2]=spec;const c=(u,a,b)=>3*(1-u)**2*u*a+3*(1-u)*u*u*b+u**3;let a=0,b=1;for(let i=0;i<24;i++){const m=(a+b)/2;if(c(m,x1,x2)<p)a=m;else b=m;}return c((a+b)/2,y1,y2);}
const make=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!=null)e.textContent=String(text);return e;};
const NS='http://www.w3.org/2000/svg';function svg(tag,attrs={}){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,String(v));return e;}
let SCENES=[],NODES=[],TOTAL=0,CFG,ROOT,ISSUES=[];
const DEFAULTS={x:0,y:0,w:400,h:240,opacity:1,scale:1,scaleX:1,scaleY:1,rotate:0,rotateX:0,rotateY:0,blur:0,radius:28,fontSize:52,draw:1,z:1,clip:0};
function baseState(n,th){return {...DEFAULTS,radius:n.appearance?.radius??th.radius,fontSize:n.appearance?.fontSize??(n.type==='metric'?110:n.type==='pill'?30:n.type==='text'?64:52),...Object.fromEntries(Object.keys(DEFAULTS).filter(k=>n[k]!=null).map(k=>[k,n[k]]))};}
function compile(n,th){const b=baseState(n,th),tracks={},held={...b};for(const k of Object.keys(DEFAULTS))tracks[k]=[{t:0,v:b[k],ease:'linear'}];for(const f of n.keyframes||[]){for(const k of Object.keys(DEFAULTS)){if(f[k]!=null)held[k]=f[k];if(f.t===0)tracks[k]=[];tracks[k].push({t:f.t,v:held[k],ease:f.ease||'inOut'});}}return tracks;}
function keyState(tracks,t){const s={};for(const [k,tr] of Object.entries(tracks)){let v=tr[0].v;for(let i=1;i<tr.length;i++){const a=tr[i-1],b=tr[i];if(t>=b.t)v=b.v;else{v=lerp(a.v,b.v,easing(b.ease,(t-a.t)/(b.t-a.t)));break;}}s[k]=v;}return s;}
function transition(s,a,t,isExit){if(!a||a.type==='none')return;const q=easing(a.ease||'out',(t-a.at)/a.duration),r=isExit?q:1-q;const raw=clamp((t-a.at)/a.duration);s.opacity*=isExit?1-raw:raw;const type=a.type||'fade',direction=a.direction||'up',distance=a.distance??160;
 if(type==='slide'){const vector={up:[0,-1],down:[0,1],left:[-1,0],right:[1,0]}[direction];s.x+=vector[0]*distance*r;s.y+=vector[1]*distance*r;}
 if(type==='scale')s.scale*=lerp(1,a.scale??.7,r);
 if(type==='flip'){const k=a.axis==='x'?'rotateX':'rotateY';s[k]+=(a.angle??75)*r;}
 if(type==='wipe')s.clip=Math.max(s.clip,r);
 if(type==='blur')s.blur+=(a.amount??18)*r;
}
function evaluate(node,t){const n=node.spec,s=keyState(node.tracks,t);const p=n.motionPath;if(p&&t>=p.at){const q=easing(p.ease||'inOut',(t-p.at)/p.duration),u=1-q,pts=p.points;s.x=u**3*pts[0][0]+3*u*u*q*pts[1][0]+3*u*q*q*pts[2][0]+q**3*pts[3][0];s.y=u**3*pts[0][1]+3*u*u*q*pts[1][1]+3*u*q*q*pts[2][1]+q**3*pts[3][1];if(p.followAngle){const dx=3*u*u*(pts[1][0]-pts[0][0])+6*u*q*(pts[2][0]-pts[1][0])+3*q*q*(pts[3][0]-pts[2][0]);const dy=3*u*u*(pts[1][1]-pts[0][1])+6*u*q*(pts[2][1]-pts[1][1])+3*q*q*(pts[3][1]-pts[2][1]);s.rotate+=Math.atan2(dy,dx)*180/Math.PI;}}
 transition(s,n.enter,t,false);transition(s,n.exit,t,true);s.opacity=clamp(s.opacity);s.w=Math.max(1,s.w);s.h=Math.max(1,s.h);s.clip=clamp(s.clip);return s;
}
function paintTheme(el,n,th,sceneTheme){let ink=th.ink,muted=th.muted;const a=n.appearance||{};const tones={coral:['#ef775e','#fffaf4','#ffe1d4'],aqua:['#b4dadd','#163d42','#51787d'],purple:['#8274d8','#fff','#e3ddff'],sage:['#c8d2b3','#283c2b','#667c60'],black:['#191b1b','#fffef7','#969b94'],lime:['#d9ed70','#242d15','#697a3d']};
 if(n.type==='text'||n.type==='group'||n.type==='path'){ink=sceneTheme.stageInk;muted=sceneTheme.stageMuted;}
 let panel=th.panel;if(tones[a.tone]){[panel,ink,muted]=tones[a.tone];}
 const map={panel:a.fill??panel,ink:a.color??ink,muted:a.muted??muted,accent:a.accent??th.accent,border:a.border??th.border,shadow:a.shadow??th.shadow,radius:(a.radius??th.radius)+'px',pad:(a.padding??36)+'px',gap:(a.gap??22)+'px',labelSize:(a.labelSize??20)+'px',bodySize:(a.bodySize??26)+'px',borderWidth:(a.borderWidth??1)+'px',justify:a.justify??'center'};
 for(const [k,v] of Object.entries(map))el.style.setProperty('--'+k,v);
 if(a.align)el.style.textAlign=a.align;if(a.fontWeight)el.style.fontWeight=a.fontWeight;
 if(n.type==='text'){el.style.setProperty('--justify',a.justify??'flex-start');el.style.fontWeight=a.fontWeight??800;}
 return map;
}
function buildNode(n,parent,scene,sceneTheme){const th=themeOf(n.style||scene.style||CFG.style),el=make('div','element theme-'+th.name);el.dataset.id=n.id;el.dataset.type=n.type;parent.appendChild(el);const colors=paintTheme(el,n,th,sceneTheme);const node={spec:n,el,tracks:compile(n,th),scene,colors};NODES.push(node);
 let inner,content;
 const surface=()=>{const v=make('div','surface');el.appendChild(v);return v;};
 if(n.type==='group'){inner=make('div','group-surface');el.appendChild(inner);}
 else if(n.type==='text'){content=make('div','free-text',n.text??n.title??'');el.appendChild(content);content.style.fontWeight=n.appearance?.fontWeight??800;node.fit=content;}
 else if(n.type==='path'){const box=svg('svg',{viewBox:`0 0 ${n.w} ${n.h}`,preserveAspectRatio:'none'});const path=svg('path',{d:n.points.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' '),fill:'none',stroke:n.appearance?.stroke??colors.accent,'stroke-width':n.appearance?.strokeWidth??4,'stroke-linecap':'round','stroke-linejoin':'round','vector-effect':'non-scaling-stroke'});box.appendChild(path);el.appendChild(box);node.path=path;}
 else if(n.type==='pill'){inner=surface();content=make('div','pill-content',n.text||n.title||'');inner.appendChild(content);node.fit=content;}
 else if(n.type==='image'){inner=surface();const img=make('img','picture');img.src=n.src;img.alt=n.title||'';img.style.objectFit=n.fit||'cover';img.style.objectPosition=n.position||'50% 50%';inner.appendChild(img);if(n.title||n.body){const caption=make('div','image-caption');if(n.title)caption.appendChild(make('div','heading',n.title));if(n.body)caption.appendChild(make('p','body-copy',n.body));inner.appendChild(caption);node.fit=caption;}}
 else{
   const surf=surface();
   if(th.name==='header'&&n.type==='card'&&n.title){const band=make('div','header-band');if(n.label)band.appendChild(make('div','eyebrow',n.label));band.appendChild(make('div','heading',n.title));surf.appendChild(band);}
   inner=make('div','inner');surf.appendChild(inner);
   if(n.label&&!(th.name==='header'&&n.type==='card'))inner.appendChild(make('div','eyebrow',n.label));
   if(n.type==='metric'){if(n.title)inner.appendChild(make('div','body-copy',n.title));node.count=make('div','stat',n.value??'0');inner.appendChild(node.count);}
   else if(n.title&&!(th.name==='header'&&n.type==='card'))inner.appendChild(make('div','heading',n.title));
   if(n.type==='chart')buildChart(node,inner);
   if(n.type==='list'){const list=make('div','free-list');for(const it of n.items){const row=make('div','list-item');row.appendChild(make('span','list-dot'));row.appendChild(make('span','',typeof it==='string'?it:it.text));if(it.meta)row.appendChild(make('span','list-meta',it.meta));list.appendChild(row);}inner.appendChild(list);}
   if(n.body)inner.appendChild(make('p','body-copy',n.body));node.fit=inner;
 }
 if(n.children){const layer=make('div','child-layer');el.appendChild(layer);for(const child of n.children)buildNode(child,layer,scene,sceneTheme);}
 return node;
}
function buildChart(node,inner){const n=node.spec,W=1000,H=400,pad=10,vals=n.values,hi=Math.max(1,...vals),lo=Math.min(0,...vals),y=v=>H-pad-(v-lo)/(hi-lo)*(H-pad*2),base=y(0),box=make('div','chart-box'),v=svg('svg',{viewBox:`0 0 ${W} ${H}`,preserveAspectRatio:'none',class:'chart-svg'});box.appendChild(v);inner.appendChild(box);
 if(n.chart==='line'){const pts=vals.map((num,i)=>[pad+i/(vals.length-1)*(W-2*pad),y(num)]),d=pts.map((p,i)=>(i?'L':'M')+p.join(' ')).join(' ');const area=svg('path',{d:d+`L${W-pad} ${base}L${pad} ${base}Z`,fill:node.colors.accent,opacity:.1});const line=svg('path',{d,fill:'none',stroke:node.colors.accent,'stroke-width':n.lineWidth||5,'stroke-linejoin':'round','stroke-linecap':'round','vector-effect':'non-scaling-stroke'});v.appendChild(area);v.appendChild(line);node.path=line;node.area=area;}
 else{node.bars=[];const slot=W/vals.length;vals.forEach((num,i)=>{const yv=y(num),rect=svg('rect',{x:i*slot+slot*.12,y:Math.min(yv,base),width:slot*.76,height:Math.abs(base-yv),rx:node.spec.appearance?.barRadius??10,fill:n.barColors?.[i]??(i===(n.highlight??vals.length-1)?node.colors.accent:node.colors.muted)});v.appendChild(rect);node.bars.push({rect,y:Math.min(yv,base),h:Math.abs(base-yv),base,negative:num<0});});}
}
function applyNode(node,t){const s=evaluate(node,t),el=node.el,n=node.spec;node.state=s;el.style.left=s.x+'px';el.style.top=s.y+'px';el.style.width=s.w+'px';el.style.height=s.h+'px';el.style.opacity=s.opacity;el.style.zIndex=Math.round(s.z);const depth=Math.abs(s.rotateX)+Math.abs(s.rotateY)>1e-6?`perspective(1800px) rotateX(${s.rotateX}deg) rotateY(${s.rotateY}deg) `:'';el.style.transform=`${depth}rotate(${s.rotate}deg) scale(${s.scale*s.scaleX},${s.scale*s.scaleY})`;el.style.filter=s.blur>.001?`blur(${s.blur}px)`:'';el.style.clipPath=s.clip?`inset(0 ${s.clip*100}% 0 0)`:'';el.style.setProperty('--radius',s.radius+'px');el.style.setProperty('--titleSize',s.fontSize+'px');
 if(node.count&&n.count){const c=n.count,q=easing(c.ease||'out',(t-c.at)/c.duration),val=lerp(c.from??0,c.to,q);node.count.textContent=(c.prefix||'')+val.toLocaleString('en-US',{minimumFractionDigits:c.decimals||0,maximumFractionDigits:c.decimals||0,useGrouping:c.grouping??false})+(c.suffix||'');}
 const draw=clamp(s.draw);if(node.path){const L=node.path.getTotalLength();node.path.style.strokeDasharray=L;node.path.style.strokeDashoffset=L*(1-draw);if(node.area)node.area.style.opacity=.13*draw;}
 if(node.bars)node.bars.forEach((b,i)=>{const p=clamp(draw*1.15-i/Math.max(1,node.bars.length-1)*.15),height=b.h*p;b.rect.setAttribute('height',height);b.rect.setAttribute('y',b.negative?b.base:b.base-height);});
}
function seek(t){window.__time=clamp(t,0,TOTAL);t=window.__time;let start=0,current;SCENES.forEach((sc,i)=>{const active=t>=start&&(t<start+sc.spec.dur||i===SCENES.length-1&&t>=TOTAL);sc.el.style.display=active?'block':'none';sc.time=t-start;if(active)current=sc;start+=sc.spec.dur;});
 // Construct the active frame afresh: Chromium otherwise reuses text rasters from
 // earlier rotation/scale states, making identical random seeks subtly different.
 if(current){current.el.replaceChildren();NODES=NODES.filter(n=>n.scene!==current);const th=themeOf(current.spec.style||CFG.style);for(const n of current.spec.elements)buildNode(n,current.el,current,th);for(const n of NODES.filter(n=>n.scene===current))applyNode(n,current.time);}
}
window.__seek=async t=>{seek(t);await Promise.all([...document.querySelectorAll('.free-scene:not([style*="display: none"]) img')].map(im=>im.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));};
window.__stateAt=t=>{let offset=0;const result=[];for(const sc of SCENES){if(t>=offset&&(t<offset+sc.spec.dur||sc===SCENES[SCENES.length-1]&&t>=TOTAL)){for(const n of NODES.filter(x=>x.scene===sc))result.push({id:n.spec.id,...evaluate(n,t-offset)});break;}offset+=sc.spec.dur;}return result;};
window.__inspect=()=>{const sc=SCENES.find(s=>s.el.style.display!=='none'),problems=[];for(const n of NODES.filter(x=>x.scene===sc)){if(n.spec.allowClip||!n.fit||n.state.opacity<.98)continue;const e=n.fit;
 if(e.scrollWidth>e.clientWidth+3||e.scrollHeight>e.clientHeight+3)problems.push({kind:'content-overflow',id:n.spec.id,box:[e.clientWidth,e.clientHeight],content:[e.scrollWidth,e.scrollHeight]});
 }return {time:window.__time,scene:SCENES.indexOf(sc),fontsReady:document.fonts.check('40px CardSans'),problems,elements:NODES.filter(n=>n.scene===sc).map(n=>({id:n.spec.id,...n.state}))};};
async function load(data){CFG=data;ROOT=document.getElementById('root');ROOT.innerHTML='';ROOT.style.width=CFG.width+'px';ROOT.style.height=CFG.height+'px';document.body.style.width=CFG.width+'px';document.body.style.height=CFG.height+'px';SCENES=[];NODES=[];TOTAL=0;
 for(const spec of CFG.scenes){const th=themeOf(spec.style||CFG.style),el=make('section','free-scene');el.style.background=spec.background||th.bg;ROOT.appendChild(el);const scene={spec,el,style:spec.style||CFG.style,time:0};SCENES.push(scene);for(const n of spec.elements)buildNode(n,el,scene,th);TOTAL+=spec.dur;}
 await document.fonts.load('700 40px CardSans');await document.fonts.ready;await Promise.all([...document.images].map(im=>im.decode()));seek(0);return {total:TOTAL,scenes:SCENES.map(s=>({dur:s.spec.dur})),style:CFG.style};
}
window.load=load;window.seek=seek;
