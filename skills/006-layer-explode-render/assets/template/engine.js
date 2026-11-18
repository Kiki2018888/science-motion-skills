const c=window.LAYER_CONFIG,canvas=document.querySelector('#film'),ctx=canvas.getContext('2d',{willReadFrequently:true});
const W=1920,H=1080,DUR=c.duration,DPR=devicePixelRatio||1,cap=new URLSearchParams(location.search).has('cap');
document.body.classList.toggle('cap',cap);canvas.width=c.width*DPR;canvas.height=c.height*DPR;
const C=c.style,issues=new Set(),assets={},textures=[],n=c.layers.length,tl=c.timeline;
const clamp=x=>Math.min(1,Math.max(0,x)),smooth=x=>{x=clamp(x);return x*x*x*(x*(x*6-15)+10);},lerp=(a,b,p)=>a+(b-a)*p;
function text(s,x,y,size=30,color=C.ink,weight=400){ctx.font=`${weight} ${size}px Body`;ctx.fillStyle=color;ctx.fillText(s,x,y);}
function squirclePts(x,y,w,h,r,n=4.5,steps=14){
 const hw=w/2,hh=h/2,cx=x+hw,cy=y+hh;r=Math.max(0,Math.min(r,hw,hh));
 const pts=[];const corner=(sx,sy,rev)=>{const ccx=cx+sx*(hw-r),ccy=cy+sy*(hh-r);
  for(let i=0;i<=steps;i++){const k=rev?steps-i:i,th=k/steps*Math.PI/2;
   pts.push([ccx+sx*r*Math.pow(Math.sin(th),2/n),ccy+sy*r*Math.pow(Math.cos(th),2/n)]);}};
 pts.push([cx-hw+r,cy-hh]);pts.push([cx+hw-r,cy-hh]);corner(1,-1,false);
 pts.push([cx+hw,cy+hh-r]);corner(1,1,true);pts.push([cx-hw+r,cy+hh]);corner(-1,1,false);
 pts.push([cx-hw,cy-hh+r]);corner(-1,-1,true);return pts;
}
function squirclePath(x,y,w,h,r,n=4.5){const p=squirclePts(x,y,w,h,r,n);ctx.beginPath();ctx.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)ctx.lineTo(p[i][0],p[i][1]);ctx.closePath();}
const NIGHT=()=>c.appearance==='amber-night';
function panelCard(x,y,w,h,r,fill){
 const night=NIGHT();
 ctx.save();ctx.shadowColor=night?'rgba(0,0,0,.55)':'rgba(32,61,54,.10)';ctx.shadowBlur=night?18:12;ctx.shadowOffsetY=night?6:3;
 squirclePath(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();ctx.restore();
 ctx.save();squirclePath(x,y,w,h,r);ctx.clip();
 let g=ctx.createLinearGradient(0,y,0,y+h);
 g.addColorStop(0,night?'rgba(255,255,255,.09)':'rgba(255,255,255,.65)');g.addColorStop(1,'rgba(255,255,255,0)');
 ctx.fillStyle=g;ctx.fillRect(x,y,w,h);
 g=ctx.createLinearGradient(0,y+h*.5,0,y+h);
 g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,night?'rgba(0,0,0,.28)':'rgba(32,61,54,.04)');
 ctx.fillStyle=g;ctx.fillRect(x,y,w,h);ctx.restore();
 squirclePath(x,y,w,h,r);ctx.lineWidth=1.2;ctx.strokeStyle=night?'rgba(255,255,255,.07)':'rgba(32,61,54,.09)';ctx.stroke();
}
function rr(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}}
function line(points,color,width=2){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
function poly(points,fill){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();}
function tint(hex,f){if(!/^#[0-9a-f]{6}$/i.test(hex))return hex;const a=hex.slice(1).match(/../g).map(v=>parseInt(v,16));return '#'+a.map(v=>Math.round(f<0?v*(1+f):v+(255-v)*f).toString(16).padStart(2,'0')).join('');}
function validColor(s){return typeof s==='string'&&CSS.supports('color',s);}
function wrap(s,max,size){ctx.font=`400 ${size}px Body`;const rows=[];let row='';for(const ch of Array.from(s)){if(ch==='\n'){rows.push(row);row='';continue;}if(ctx.measureText(row+ch).width>max&&row){rows.push(row);row=ch;}else row+=ch;}rows.push(row);return rows;}
function cover(g,im,x,y,w,h,fit='cover'){const s=(fit==='cover'?Math.max:Math.min)(w/im.naturalWidth,h/im.naturalHeight);g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.drawImage(im,x+(w-im.naturalWidth*s)/2,y+(h-im.naturalHeight*s)/2,im.naturalWidth*s,im.naturalHeight*s);g.restore();}
function texture(l){const o=l.texture,ca=document.createElement('canvas');ca.width=1000;ca.height=650;const g=ca.getContext('2d',{willReadFrequently:true});
 g.fillStyle=o.frameColor;g.fillRect(0,0,1000,650);const pad=o.frame?44:0,x=pad,y=pad,w=1000-pad*2,h=650-pad*2;
 g.fillStyle=o.color;g.fillRect(x,y,w,h);g.save();g.beginPath();g.rect(x,y,w,h);g.clip();
 const rand=i=>Math.abs(Math.sin((i+o.seed*13)*127.1+19.7)*43758.5453)%1;
 if(o.kind==='image')cover(g,assets[o.src],x,y,w,h,o.fit);
 if(o.kind==='grid'||o.kind==='mesh'){const step=(o.kind==='mesh'?24:125)/o.density;g.strokeStyle=o.detailColor;g.lineWidth=o.kind==='mesh'?3:12;g.beginPath();for(let a=x+step/2;a<x+w;a+=step){g.moveTo(a,y);g.lineTo(a,y+h);}for(let b=y+step/2;b<y+h;b+=step){g.moveTo(x,b);g.lineTo(x+w,b);}g.stroke();if(o.kind==='mesh'){g.strokeStyle=tint(o.color,.3);g.lineWidth=14;g.beginPath();for(const a of[335,665]){g.moveTo(a,y);g.lineTo(a,y+h);}g.stroke();}}
 if(o.kind==='pleats'){const step=38/o.density;for(let a=x;a<x+w;a+=step){const gr=g.createLinearGradient(a,0,a+step,0);gr.addColorStop(0,o.color);gr.addColorStop(.48,o.detailColor);gr.addColorStop(.5,tint(o.color,-.2));gr.addColorStop(1,o.color);g.fillStyle=gr;g.fillRect(a,y,step,h);g.fillStyle=o.detailColor;g.fillRect(a+step*.48,y,2,h);}}
 if(o.kind==='granules'){for(let i=0;i<Math.round(950*o.density);i++){const a=x+rand(i*3)*w,b=y+rand(i*3+1)*h,r=5+rand(i*3+2)*8;g.beginPath();g.arc(a,b,r,0,Math.PI*2);g.fillStyle=[tint(o.color,.12),o.detailColor,tint(o.color,-.2),tint(o.detailColor,-.25)][i%4];g.fill();g.beginPath();g.arc(a-2,b-2,r*.28,0,Math.PI*2);g.fillStyle='#ffffff22';g.fill();}}
 if(o.kind==='slots'){for(let b=y+40;b<y+h-20;b+=52/o.density){g.fillStyle=o.detailColor;g.beginPath();g.roundRect(x+45,b,w-90,19/o.density,8);g.fill();g.fillStyle='#ffffff55';g.fillRect(x+50,b+20/o.density,w-100,3);}}
 g.restore();if(o.frame){g.strokeStyle='#ffffff99';g.lineWidth=4;g.strokeRect(8,8,984,634);for(const a of[24,976])for(const b of[24,626]){g.beginPath();g.arc(a,b,7,0,Math.PI*2);g.fillStyle=tint(o.frameColor,-.3);g.fill();}}
 if(o.text){g.font='500 30px Body';g.textAlign='center';g.fillStyle=o.detailColor;g.fillText(o.text,500,333,850);}return ca;}
function extents(l){const u=c.geometry.u,v=c.geometry.v;return [Math.abs(u[0]*l.size[0])+Math.abs(v[0]*l.size[1]),Math.abs(u[1]*l.size[0])+Math.abs(v[1]*l.size[1])];}
let transform;
function build(){const min=[Infinity,Infinity],max=[-Infinity,-Infinity];for(const l of c.layers){const [ex,ey]=extents(l);for(const p of[l.home,l.open]){min[0]=Math.min(min[0],p[0]-ex);min[1]=Math.min(min[1],p[1]-ey);max[0]=Math.max(max[0],p[0]+ex);max[1]=Math.max(max[1],p[1]+ey+l.thickness);}}
 const [x,y,w,h]=c.layout.artBox,scale=Math.min(w/(max[0]-min[0]),h/(max[1]-min[1]));transform={scale,x:x+w/2-(min[0]+max[0])/2*scale,y:y+h/2-(min[1]+max[1])/2*scale,bounds:[min,max]};
 for(const l of c.layers)textures.push(texture(l));
 const labelLayers=c.layers.filter(l=>c.labels.show&&l.showLabel).slice().sort((a,b)=>a.open[1]-b.open[1]||b.open[0]-a.open[0]);
 labelLayers.forEach((l,i)=>{l.labelY=labelLayers.length===1?(c.layout.labelTop+c.layout.labelBottom)/2:lerp(c.layout.labelTop,c.layout.labelBottom,i/(labelLayers.length-1));l.noteRows=l.note?wrap(l.note,c.layout.labelWidth-64,C.noteSize):[];ctx.font=`500 ${C.labelSize}px Body`;if(ctx.measureText(l.label).width>c.layout.labelWidth-64)issues.add('Label too long: '+l.id);const maxHeight=labelLayers.length<2?300:(c.layout.labelBottom-c.layout.labelTop)/(labelLayers.length-1)-14;if(C.labelSize+(l.noteRows.length?12:0)+l.noteRows.length*C.noteSize*1.4>maxHeight)issues.add('Labels overlap; shorten notes or reduce label/note size: '+l.id);if(l.labelY+l.noteRows.length*C.noteSize*1.4+12>975)issues.add('Label below footer: '+l.id);});
 for(const [s,max,size] of[[c.title,1220,48],[c.eyebrow,1200,23],[c.subject,330,26],[c.note,330,20]]){ctx.font=`400 ${size}px Body`;if(ctx.measureText(s).width>max)issues.add('Header text too wide: '+s);}
 for(const k of['ink','muted','accent','rule'])if(!validColor(C[k]))issues.add('Invalid style color: '+k);
 for(const l of c.layers)for(const col of[l.color,l.texture.color,l.texture.detailColor,l.texture.frameColor,l.edgeDark,l.edgeLight].filter(Boolean))if(!validColor(col))issues.add('Invalid layer color: '+l.id);
 for(const col of[c.background.color,...(c.background.colors||[])].filter(Boolean))if(!validColor(col))issues.add('Invalid background color');
}
function stateAt(t){t=Math.max(0,Math.min(DUR,t));const f=tl.focus.find(f=>t>=f.start&&t<f.end);const active=f?c.layers.findIndex(l=>l.id===f.layer):-1;
 const focus=f?smooth((t-f.start)/Math.min(.45,f.duration/3))*(1-smooth((t-(f.end-Math.min(.5,f.duration/3)))/Math.min(.5,f.duration/3))):0;
 const layers=c.layers.map((l,i)=>{const e=smooth((t-l.openAt)/tl.explode)*(tl.reassemble?1-smooth((t-l.closeAt)/tl.assemble):1);return {i,id:l.id,expansion:e,x:lerp(l.home[0],l.open[0],e),y:lerp(l.home[1],l.open[1],e)};});
 const phase=t<tl.intro?0:t<tl.openEnd?1:!tl.reassemble||t<tl.closeAt?2:t<tl.closeEnd?3:4;
 return {time:t,layers,active,focus,phase,scale:transform?.scale};}
function points(l,s){const {scale,x,y}=transform,u=c.geometry.u.map(v=>v*l.size[0]*scale),v=c.geometry.v.map(v=>v*l.size[1]*scale),cx=x+s.x*scale,cy=y+s.y*scale;return [[cx-u[0]-v[0],cy-u[1]-v[1]],[cx+u[0]-v[0],cy+u[1]-v[1]],[cx+u[0]+v[0],cy+u[1]+v[1]],[cx-u[0]+v[0],cy-u[1]+v[1]]];}
function plate(l,s,focus){const p=points(l,s),th=l.thickness*transform.scale;
 const topPath=()=>{ctx.beginPath();p.forEach((q,i)=>i?ctx.lineTo(q[0],q[1]):ctx.moveTo(q[0],q[1]));ctx.closePath();};
 ctx.save();topPath();ctx.shadowColor='rgba(32,61,54,.22)';ctx.shadowBlur=26;ctx.shadowOffsetY=20;ctx.fillStyle=l.color;ctx.fill();ctx.restore();
 poly([p[1],p[2],[p[2][0],p[2][1]+th],[p[1][0],p[1][1]+th]],l.edgeDark||tint(l.color,-.22));
 poly([p[2],p[3],[p[3][0],p[3][1]+th],[p[2][0],p[2][1]+th]],l.edgeLight||tint(l.color,.12));
 ctx.save();ctx.transform((p[1][0]-p[0][0])/1000,(p[1][1]-p[0][1])/1000,(p[3][0]-p[0][0])/650,(p[3][1]-p[0][1])/650,p[0][0],p[0][1]);ctx.drawImage(textures[s.i],0,0);ctx.restore();
 line([p[0],p[1]],'rgba(255,255,255,.85)',1.6);
 line([p[1],p[2]],'rgba(0,0,0,.10)',1.2);
 line([p[2],p[3]],'rgba(0,0,0,.16)',1.4);
 line([p[3],p[0]],'rgba(255,255,255,.55)',1.2);
 if(focus){ctx.save();ctx.globalAlpha*=focus;line([...p,p[0]],C.accent,4);ctx.restore();}
 if(c.labels.numbers&&s.expansion>.2){ctx.save();ctx.globalAlpha*=smooth((s.expansion-.2)/.3);text(String(n-s.i).padStart(2,'0'),p[2][0]-12,p[2][1]+th*.8,Math.min(17,th*.9),C.ink,500);ctx.restore();}}
function background(){const b=c.background;if(b.type==='image')cover(ctx,assets[b.src],0,0,W,H);else{let fill=b.color;if(b.type==='gradient'){const g=ctx.createRadialGradient(800,500,80,800,500,1000);b.colors.forEach((v,i)=>g.addColorStop(i/(b.colors.length-1),v));fill=g;}ctx.fillStyle=fill;ctx.fillRect(0,0,W,H);}}
function draw(t){const s=stateAt(t);ctx.reset();ctx.setTransform(canvas.width/W,0,0,canvas.height/H,0,0);background();
 text(c.eyebrow,96,82,23,C.accent,500);text(c.title,96,148,48,C.ink,600);text(c.subject,1490,88,26);text(c.note,1490,128,20,C.muted);
 if(C.showPhase){text(String(s.phase+1).padStart(2,'0'),100,320,68,C.accent,500);text(C.phaseTitles[s.phase],100,375,31,C.ink,500);const rows=wrap(C.phaseNotes[s.phase],235,21);rows.forEach((a,i)=>text(a,100,422+i*34,21,C.muted));if(rows.length>3)issues.add('Phase note too long');}
 const box=c.layout.artBox;if(c.layout.showShadow){ctx.save();ctx.translate(box[0]+box[2]/2,box[1]+box[3]-10);ctx.scale(1,.16);const r=box[2]*.46,g=ctx.createRadialGradient(0,0,10,0,0,r);g.addColorStop(0,'#284f3530');g.addColorStop(1,'#284f3500');ctx.fillStyle=g;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();ctx.restore();}
 const a=c.labels.show?smooth((t-c.labels.showAt)/c.labels.fade)*(1-smooth((t-c.labels.hideAt)/c.labels.fade)):0;
 if(c.layout.showGuides&&a){const first=s.layers[0],last=s.layers.at(-1);ctx.save();ctx.globalAlpha=a*.35;ctx.setLineDash([5,9]);line([[transform.x+first.x*transform.scale,transform.y+first.y*transform.scale],[transform.x+last.x*transform.scale,transform.y+last.y*transform.scale]],C.muted,1.3);ctx.restore();}
 for(const l of s.layers){ctx.save();ctx.globalAlpha=s.active<0||s.active===l.i?1:1-s.focus*C.dimOthers;plate(c.layers[l.i],l,s.active===l.i?s.focus:0);ctx.restore();}
 if(a)for(const l of s.layers){const def=c.layers[l.i];if(!def.showLabel)continue;const p=points(def,l),anchor=p[1],ly=def.labelY,lx=c.layout.labelX,selected=s.active===l.i;
  ctx.save();ctx.globalAlpha=a*(s.active<0||selected?1:1-s.focus*.45);line([anchor,[Math.min(lx-25,Math.max(anchor[0]+15,lx-70)),ly-10],[lx-16,ly-10]],selected?C.accent:C.muted,selected?2.5:1.3);ctx.beginPath();ctx.arc(...anchor,4,0,Math.PI*2);ctx.fillStyle=selected?C.accent:def.color;ctx.fill();
  const tx=lx+(c.labels.numbers?62:0);if(c.labels.numbers){rr(lx,ly-31,44,37,9,selected?C.accent:(NIGHT()?'#2E2822':'#dde5dc'));text(String(n-l.i).padStart(2,'0'),lx+8,ly-4,20,selected?'#fff':C.muted,500);}
  text(def.label,tx,ly,C.labelSize,selected?C.accent:C.ink,500);def.noteRows.forEach((r,i)=>text(r,tx,ly+12+(i+1)*C.noteSize*1.4,C.noteSize,C.muted));ctx.restore();}
 if(s.active>=0&&C.showPhase){ctx.save();ctx.globalAlpha=s.focus;panelCard(100,540,245,108,16,NIGHT()?'#2A241D':'#e0ebe2');text('正在观察',120,575,19,C.muted);const name=c.layers[s.active].label;ctx.font='500 30px Body';if(ctx.measureText(name).width>205)issues.add('Focus label too long: '+name);text(name,120,619,30,C.accent,500);ctx.restore();}
 if(C.showProgress){const ends=[tl.intro,tl.openEnd,tl.closeAt,DUR],starts=[0,tl.intro,tl.openEnd,tl.closeAt];
  const names=['整体','展开','观察',tl.reassemble?'复位':'停留'],xs=names.map((_,i)=>120+i*450);
  line([[xs[0],989],[xs[xs.length-1],989]],C.rule,2);
  names.forEach((a,i)=>{const x=xs[i],p=clamp((t-starts[i])/Math.max(.001,ends[i]-starts[i])),done=i<names.length-1?t>=ends[i]:p>=1;
   if(p>0&&i>0)line([[xs[i-1],989],[x-18,989]],C.accent,2);
   ctx.beginPath();ctx.arc(x,989,done?7:5,0,Math.PI*2);
   if(done||p>0){ctx.fillStyle=C.accent;ctx.fill();}else{ctx.fillStyle=NIGHT()?'#1A1714':'#ffffff';ctx.fill();ctx.strokeStyle=C.rule;ctx.lineWidth=2;ctx.stroke();}
   if(i===0&&p>0){ctx.beginPath();ctx.arc(x,989,13,0,Math.PI*2);ctx.strokeStyle=C.accent;ctx.globalAlpha=.3;ctx.lineWidth=2;ctx.stroke();ctx.globalAlpha=1;}
   text(a,x,1031,21,i<=Math.max(0,Math.floor(t/ends[1]))?C.ink:C.muted,500,'center');ctx.textAlign='left';});}
 window.__state=s;window.__issues=[...issues];document.querySelector('#seek').value=t;document.querySelector('#clock').textContent=t.toFixed(1)+' / '+DUR.toFixed(1)+' s';}
function fit(){const scale=cap?1:Math.min(innerWidth/c.width,(innerHeight-66)/c.height);canvas.style.width=c.width*scale+'px';canvas.style.height=c.height*scale+'px';}
window.__dur=DUR;window.__stateAt=stateAt;window.__inspect=()=>window.__state;window.__seek=async t=>{current=Math.max(0,Math.min(DUR,t));draw(current);};
let current=0,playing=!cap,last=0;document.querySelector('#seek').max=DUR;document.querySelector('#play').onclick=()=>{if(current>=DUR)current=0;playing=!playing;document.querySelector('#play').textContent=playing?'暂停':'播放';};document.querySelector('#replay').onclick=()=>{current=0;playing=true;};document.querySelector('#seek').oninput=e=>{playing=false;window.__seek(+e.target.value);document.querySelector('#play').textContent='播放';};addEventListener('resize',fit);
(async()=>{try{await document.fonts.load('32px Body');await document.fonts.ready;const paths=new Set([c.background.type==='image'?c.background.src:null,...c.layers.filter(l=>l.texture.kind==='image').map(l=>l.texture.src)].filter(Boolean));await Promise.all([...paths].map(async src=>{const im=new Image();im.src=src;await im.decode();assets[src]=im;}));build();fit();draw(0);window.__ready=true;requestAnimationFrame(function tick(ms){if(last&&playing){current=Math.min(DUR,current+(ms-last)/1000);draw(current);if(current===DUR)playing=false;}last=ms;requestAnimationFrame(tick);});}catch(e){window.__buildError=String(e);console.error(e);}})();
