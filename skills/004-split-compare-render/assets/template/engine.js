/* Deterministic, shared-clock two-panel comparison. */
(() => {
const c=window.COMPARE_CONFIG,$=s=>document.querySelector(s),cv=$('#film'),ctx=cv.getContext('2d'),DPR=devicePixelRatio||1,R=c.width/1920,C=c.theme,T=c.text;
const cap=new URLSearchParams(location.search).has('cap');if(cap)document.body.classList.add('cap');cv.width=c.width*DPR;cv.height=c.height*DPR;
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
let current=0,playing=!cap,last=0,busy=false;const issues=new Set(),media={};
const rects={left:{x:124,y:454,w:734,h:363},right:{x:1062,y:454,w:734,h:363}};
function clock(t){t=Math.max(0,Math.min(c.duration,t));const step=c.steps.find(s=>t<s.end)||c.steps.at(-1),p=clamp((t-step.start)/(step.end-step.start));return {time:t,scenario:step.fromTime+(step.toTime-step.fromTime)*p,phase:step.phase,pause:step.pause,phaseAge:t-step.start};}
function interpolate(points,t,mode='linear'){if(t<=points[0].at)return points[0].value;for(let i=1;i<points.length;i++)if(t<=points[i].at){const a=points[i-1],b=points[i],p=(t-a.at)/(b.at-a.at);return mode==='step'&&t<b.at?a.value:a.value+(b.value-a.value)*p;}return points.at(-1).value;}
function fall(m,t){const {g,mass,drag,height}=m;let hit,vt,tau;
 if(drag===0)hit=Math.sqrt(2*height/g);else{vt=Math.sqrt(mass*g/drag);tau=vt/g;const q=height*g/(vt*vt);hit=tau*(q+Math.log(1+Math.sqrt(-Math.expm1(-2*q))));}
 const s=Math.min(hit,t),u=drag?s/tau:0,logcosh=u+Math.log1p(Math.exp(-2*u))-Math.log(2);
 return {hit,landed:t>=hit,distance:Math.min(height,drag?vt*vt/g*logcosh:g*s*s/2),velocity:t>=hit?0:drag?vt*Math.tanh(u):g*s};
}
function metric(side,id,s){const m=c[side].metrics.find(x=>x.id===id);if(!m)return null;return m.values?interpolate(m.values,s.scenario,m.interpolation):fall(c[side].media,s.scenario)[m.source];}
function active(a,s){const w=a.when;return (w.phase==='all'||w.phase===s.phase)&&s.scenario>=w.from-1e-9&&s.scenario<=w.to+1e-9&&(w.pause===undefined||w.pause===s.pause);}
function text(v,x,y,size=26,color=C.ink,weight=400,align='left',width=Infinity){const s=String(v);ctx.font=`${weight} ${size}px Body`;const natural=ctx.measureText(s).width;if(natural>width){size*=width/natural;ctx.font=`${weight} ${size}px Body`;if(size<16)issues.add('Text too long: '+s);}ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(s,x,y);}
function line(x1,y1,x2,y2,color=C.rule,width=1){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function box(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.lineWidth=1.6;ctx.strokeStyle=stroke;ctx.stroke();}}
function assetTime(m,s){return m.start+s.scenario*m.rate;}
function place(img,m,v){const iw=img.videoWidth||img.naturalWidth,ih=img.videoHeight||img.naturalHeight,k=m.fit==='cover'?Math.max(v.w/iw,v.h/ih):Math.min(v.w/iw,v.h/ih);ctx.drawImage(img,v.x+(v.w-iw*k)/2,v.y+(v.h-ih*k)/2,iw*k,ih*k);}
function sphere(x,y,m,alpha=1){ctx.save();ctx.globalAlpha=alpha;const g=ctx.createRadialGradient(x-9,y-10,2,x,y,28);g.addColorStop(0,'#fff2d0');g.addColorStop(.4,m.ballColor);g.addColorStop(1,'#966330');ctx.fillStyle=g;ctx.beginPath();ctx.arc(x,y,25,0,Math.PI*2);ctx.fill();ctx.restore();}
function fallDrawing(side,s,v){const m=c[side].media,b=fall(m,s.scenario),color=C[side],x=v.x+392,top=v.y+16,bottom=v.y+336,scale=(bottom-top)/m.height,y=top+b.distance*scale;
 for(let i=0;i<=4;i++){const d=m.height*i/4,yy=top+d*scale;text(Number(d.toFixed(2))+' m',v.x+12,yy+6,19,C.muted);ctx.save();ctx.setLineDash([4,8]);line(v.x+72,yy,v.x+v.w-12,yy,C.rule);ctx.restore();}
 text(m.releaseLabel,v.x+76,top-10,18,C.muted);line(v.x+75,bottom+25,v.x+v.w-12,bottom+25,'#a9b5b7',3);
 for(let a=m.traceInterval;a<Math.min(s.scenario,b.hit)-.03;a+=m.traceInterval){ctx.beginPath();ctx.arc(x,top+fall(m,a).distance*scale,4,0,Math.PI*2);ctx.fillStyle=color;ctx.globalAlpha=.45;ctx.fill();ctx.globalAlpha=1;}
 ctx.save();ctx.globalAlpha=.14;ctx.beginPath();ctx.ellipse(x,bottom+26,26,5,0,0,Math.PI*2);ctx.fillStyle=C.ink;ctx.fill();ctx.restore();sphere(x,y,m);
 if(b.landed){text(m.landedLabel,x+48,y-24,24,color,600);text(b.hit.toFixed(2)+' s',x+48,y+7,28,C.ink,600);}
 else text(m.velocityPrefix+b.velocity.toFixed(2)+' m/s',x+(side==='left'?-48:48),y+7,22,C.muted,400,side==='left'?'right':'left');
 return {x,y,...b};
}
function chartDrawing(side,s,v){const m=c[side].media,g=c.chart,p={x:v.x+65,y:v.y+20,w:v.w-95,h:v.h-65},xy=(t,value)=>({x:p.x+t/c.timeline.duration*p.w,y:p.y+p.h-(value-g.min)/(g.max-g.min)*p.h});
 for(let i=0;i<=4;i++){const value=g.min+(g.max-g.min)*i/4,q=xy(0,value);line(p.x,q.y,p.x+p.w,q.y,C.rule);text(Number(value.toFixed(2)),p.x-12,q.y+7,18,C.muted,400,'right');}
 line(p.x,p.y,p.x,p.y+p.h,C.muted);text(g.unit||'',p.x,p.y-5,18,C.muted);
 for(let i=0;i<=4;i++){const t=c.timeline.duration*i/4,q=xy(t,g.min);text(Number(t.toFixed(2))+' '+T.clockUnit,q.x,q.y+26,17,C.muted,400,'center');}
 const points=m.values.filter(p=>p.at<s.scenario);points.push({at:s.scenario,value:interpolate(m.values,s.scenario)});ctx.beginPath();points.forEach((a,i)=>{const q=xy(a.at,a.value);i?ctx.lineTo(q.x,q.y):ctx.moveTo(q.x,q.y);});ctx.strokeStyle=C[side];ctx.lineWidth=4;ctx.stroke();const q=xy(s.scenario,interpolate(m.values,s.scenario));ctx.beginPath();ctx.arc(q.x,q.y,7,0,Math.PI*2);ctx.fillStyle=C[side];ctx.fill();return q;
}
function panel(side,s){const x=side==='left'?96:1034,p=c[side],v=rects[side],m=p.media,color=C[side];box(x,316,790,550,24,C.panel,C.rule);box(x+22,338,42,36,8,color);text(p.label,x+43,364,23,'#ffffff',600,'center',36);text(p.title,x+80,365,31,C.ink,600,'left',p.metrics.length?450:675);
 if(p.metrics.length){const mm=p.metrics[0];text(mm.label,x+762,353,18,C.muted,400,'right',230);text(metric(side,mm.id,s).toFixed(mm.decimals)+' '+mm.unit,x+762,383,28,color,600,'right',230);}
 box(x+26,393,738,44,9,C.banner);text(p.condition,x+43,423,23,color,500,'left',698);
 ctx.save();ctx.beginPath();ctx.rect(v.x,v.y,v.w,v.h);ctx.clip();ctx.fillStyle=m.background;ctx.fillRect(v.x,v.y,v.w,v.h);let anchor=null;
 if(m.kind==='fall')anchor=fallDrawing(side,s,v);else if(m.kind==='chart')anchor=chartDrawing(side,s,v);else if(m.kind==='sequence'){const t=assetTime(m,s),i=m.frames.findLastIndex(f=>f.at<=t);place(media[side].frames[Math.max(0,i)],m,v);}else place(media[side].element,m,v);
 ctx.restore();text(p.footer,x+28,847,18,C.muted,400,'left',734);return anchor;
}
function point(side,p,anchors){if(p==='object')return anchors[side];const r=rects[side];return {x:r.x+r.w*p[0],y:r.y+r.h*p[1]};}
function annotations(s,anchors){let delta=null;
 for(const a of c.annotations){if(!active(a,s))continue;
  if(a.type==='delta'){let value=a.value;if(value===undefined){const l=metric('left',a.leftMetric,s),r=metric('right',a.rightMetric,s);value=a.operation==='absolute'?Math.abs(l-r):a.operation==='left-right'?l-r:r-l;}delta={text:a.text,value:a.prefix+value.toFixed(a.decimals)+' '+a.unit,color:a.color};continue;}
  ctx.save();ctx.globalAlpha=smooth(s.phaseAge/.3);ctx.strokeStyle=a.color;ctx.lineWidth=3;
  if(a.type==='bracket'){const l=point('left',a.left,anchors),r=point('right',a.right,anchors),x=960;ctx.setLineDash([5,6]);line(l.x+30,l.y,x-8,l.y,C.left,1.5);line(x+8,r.y,r.x-30,r.y,C.right,1.5);ctx.setLineDash([]);line(x,l.y,x,r.y,a.color,2);line(x-9,l.y,x+9,l.y,a.color,2);line(x-9,r.y,x+9,r.y,a.color,2);}
  else for(const side of a.side==='both'?['left','right']:[a.side]){const v=rects[side];
   if(a.type==='box'){const [x,y,w,h]=a.rect;box(v.x+x*v.w,v.y+y*v.h,w*v.w,h*v.h,6,null,a.color);if(a.text)text(a.text,v.x+x*v.w+8,v.y+y*v.h+28,23,a.color,600,'left',w*v.w-16);}
   else {const p=point(side,a.point,anchors);if(a.type==='circle'){ctx.beginPath();ctx.arc(p.x,p.y,a.radius*Math.min(v.w,v.h),0,Math.PI*2);ctx.stroke();}if(a.text){ctx.font='23px Body';const w=ctx.measureText(a.text).width+24;let x=p.x,y=p.y;if(x+w>v.x+v.w||y-28<v.y||y+10>v.y+v.h)issues.add('Annotation outside panel: '+a.text);box(x,y-28,w,38,6,C.panel);text(a.text,x+12,y,23,a.color,500);}}
  }ctx.restore();
 }return delta;
}
function draw(t){current=Math.max(0,Math.min(c.duration,t));const s=clock(current);ctx.setTransform(DPR*R,0,0,DPR*R,0,0);ctx.globalAlpha=1;ctx.fillStyle=C.background;ctx.fillRect(0,0,1920,1080);
 box(96,54,224,40,7,C.ink);text(T.badge,208,82,22,C.background,500,'center',210);text(T.kicker,343,82,22,C.muted,400,'left',500);text(T.note,1824,82,22,C.muted,400,'right',650);
 text(T.title,96,165,61,C.ink,700,'left',1728);text(T.subtitle,98,204,23,C.muted,400,'left',1726);
 text(T.clock,96,257,23,C.muted,400,'left',180);text(s.scenario.toFixed(2)+' '+T.clockUnit,293,260,38,C.ink,600,'left',170);box(475,224,185,47,9,s.phase==='pause'?C.pause:C.banner);text(({intro:T.ready,run:T.running,pause:T.paused,outro:T.finished})[s.phase],568,256,23,C.left,500,'center',170);text(T.sync,688,256,22,C.muted,400,'left',370);
 const tx=1090,ty=242,tw=708;line(tx,ty,tx+tw,ty,C.rule,5);line(tx,ty,tx+tw*s.scenario/c.timeline.duration,ty,C.left,5);for(let i=0;i<=4;i++){const xx=tx+i*tw/4;line(xx,ty-7,xx,ty+7,C.muted);text(Number((i*c.timeline.duration/4).toFixed(2))+' '+T.clockUnit,xx,ty+30,17,C.muted,400,'center');}ctx.beginPath();ctx.arc(tx+tw*s.scenario/c.timeline.duration,ty,7,0,Math.PI*2);ctx.fillStyle=C.left;ctx.fill();
 const anchors={left:panel('left',s),right:panel('right',s)},delta=annotations(s,anchors);box(96,892,1728,112,18,s.phase==='pause'?C.pause:s.phase==='outro'?C.summary:C.banner);
 let title=T.runTitle,subtitle=T.runSubtitle;if(s.phase==='intro'){title=T.introTitle;subtitle=T.introSubtitle;}if(s.phase==='pause'){title=c.timeline.pauses[s.pause].title;subtitle=c.timeline.pauses[s.pause].subtitle;}if(s.phase==='outro'){title=T.summaryTitle;subtitle=T.summarySubtitle;}
 text(title,122,938,31,C.ink,600,'left',delta?1100:1660);text(subtitle,122,976,24,C.muted,400,'left',delta?1100:1660);if(delta){text(delta.text,1788,925,20,C.muted,400,'right',500);text(delta.value,1788,980,54,delta.color,600,'right',500);}
 text(T.footer,96,1044,20,C.muted,400,'left',1230);text(T.footerRight,1824,1044,20,C.muted,400,'right',460);
 $('#seek').value=current;$('#clock').textContent=current.toFixed(1)+' / '+c.duration.toFixed(1)+' s';window.__state={...s,anchors,delta,metrics:Object.fromEntries(['left','right'].map(side=>[side,Object.fromEntries(c[side].metrics.map(m=>[m.id,metric(side,m.id,s)]))])),mediaTimes:Object.fromEntries(['left','right'].map(side=>[side,media[side]?.element?.currentTime??null]))};window.__issues=[...issues];
}
async function loadImage(src){const im=new Image();im.src=src;await im.decode();return im;}
async function loadMedia(side){const m=c[side].media;if(m.kind==='image')return {element:await loadImage(m.src)};if(m.kind==='sequence')return {frames:await Promise.all(m.frames.map(f=>loadImage(f.src)))};if(m.kind==='video'){
 const v=document.createElement('video');v.muted=true;v.preload='auto';v.playsInline=true;
 await new Promise((resolve,reject)=>{v.onloadeddata=resolve;v.onerror=()=>reject(Error('Cannot decode video: '+m.src));v.src=m.src;v.load();});
 if(!Number.isFinite(v.duration))throw Error('Invalid video duration');if(m.start>=v.duration)throw Error('media.start beyond video duration');if(m.end==='error'&&m.start+c.timeline.duration*m.rate>v.duration+.001)throw Error('Video is too short; trim shared duration or explicitly set end: hold');return {element:v};
 }return {};}
async function syncVideos(s){await Promise.all(['left','right'].map(async side=>{const m=c[side].media,v=media[side].element;if(m.kind!=='video')return;const target=Math.min(assetTime(m,s),Math.max(0,v.duration-.0001));if(Math.abs(v.currentTime-target)<1e-7&&v.readyState>=2)return;
 await new Promise((resolve,reject)=>{const timer=setTimeout(()=>{clean();reject(Error('Video seek timed out'));},15000),clean=()=>{clearTimeout(timer);v.removeEventListener('seeked',done);v.removeEventListener('error',failed);},done=()=>{clean();resolve();},failed=()=>{clean();reject(Error('Video seek failed'));};v.addEventListener('seeked',done);v.addEventListener('error',failed);v.currentTime=target;});
}));}
async function seek(t){const s=clock(t);await syncVideos(s);draw(t);await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);}
function fit(){const k=cap?1:Math.min(innerWidth/c.width,Math.max(150,innerHeight-70)/c.height);cv.style.width=c.width*k+'px';cv.style.height=c.height*k+'px';}
window.__dur=c.duration;window.__clockAt=clock;window.__fallAt=fall;window.__inspect=()=>window.__state;window.__seek=seek;
$('#seek').max=c.duration;let queued=null;
async function userSeek(t){queued=t;if(busy)return;busy=true;try{while(queued!==null){const next=queued;queued=null;await seek(next);}}finally{busy=false;}}
$('#seek').oninput=e=>{playing=false;$('#play').textContent='播放';userSeek(+e.target.value);};$('#play').onclick=()=>{if(current>=c.duration)userSeek(0);playing=!playing;$('#play').textContent=playing?'暂停':'播放';};$('#replay').onclick=()=>{userSeek(0);playing=true;$('#play').textContent='暂停';};addEventListener('resize',fit);
(async()=>{try{await document.fonts.ready;for(const side of ['left','right'])media[side]=await loadMedia(side);fit();await seek(0);window.__ready=true;requestAnimationFrame(async function tick(ms){const elapsed=last?(ms-last)/1000:0;last=ms;if(playing&&!busy){busy=true;try{await seek(current+elapsed);if(current>=c.duration){playing=false;$('#play').textContent='重播';}}finally{busy=false;}}if(queued!==null&&!busy)await userSeek(queued);requestAnimationFrame(tick);});}catch(e){window.__buildError=String(e);console.error(e);}})();
})();
