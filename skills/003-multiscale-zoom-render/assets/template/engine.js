/* Pure-time camera and compositing engine. All artwork uses one world coordinate system. */
(() => {
'use strict';
const c=window.ZOOM_CONFIG,$=s=>document.querySelector(s),canvas=$('#film'),ctx=canvas.getContext('2d');
const W=c.designWidth,H=c.designHeight,V=c.viewport,C=c.theme,T=c.text,levels=c.levels,dpr=devicePixelRatio||1,ratio=c.width/W;
canvas.width=c.width*dpr;canvas.height=c.height*dpr;
const cap=new URLSearchParams(location.search).has('cap');if(cap)document.body.classList.add('cap');
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)},lerp=(a,b,p)=>a+(b-a)*p;
let current=0,playing=!cap,last=0,scene;const issues=new Set();
function camera(t){
 t=Math.max(0,Math.min(c.duration,t));let k=0;
 while(k<levels.length-1&&t>=levels[k].end)k++;
 const target=levels[k],prev=levels[Math.max(0,k-1)],moving=k>0&&t<target.arrive;
 const p=moving?smooth((t-target.start)/target.transition):1,pan=1-(1-p)**target.panEase;
 const width=moving?Math.exp(lerp(Math.log(prev.viewWidth),Math.log(target.viewWidth),p)):target.viewWidth;
 return {cx:moving?lerp(prev.center[0],target.center[0],pan):target.center[0],cy:moving?lerp(prev.center[1],target.center[1],pan):target.center[1],width,scale:V.w/width,stage:moving&&p<.9?k-1:k,target:k,moving,progress:p,relative:levels[0].viewWidth/width};
}
function text(s,x,y,size=26,color=C.ink,weight=400,align='left',maxWidth=Infinity){
 ctx.font=`${weight} ${size}px Body`;if(Number.isFinite(maxWidth)){
  const natural=ctx.measureText(s).width;if(natural>maxWidth){size*=maxWidth/natural;ctx.font=`${weight} ${size}px Body`;if(size<16)issues.add('Text too long: '+s);}
 }
 ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(s,x,y);
}
function line(x1,y1,x2,y2,color=C.ink,width=1){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
function rounded(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.lineWidth=1.5;ctx.strokeStyle=stroke;ctx.stroke()}}
function project(x,y,cam){return {x:V.x+V.w/2+(x-cam.cx)*cam.scale,y:V.y+V.h/2+(y-cam.cy)*cam.scale}}
function fmt(n){return Number(n.toPrecision(3)).toLocaleString('en-US',{maximumFractionDigits:8})}
function length(value){
 if(c.units.metresPerUnit===null||c.scaleBar.unit==='world')return fmt(value)+' '+c.units.name;
 const m=value*c.units.metresPerUnit;
 const units=[[1e3,'km'],[1,'m'],[1e-3,'mm'],[1e-6,'μm'],[1e-9,'nm'],[1e-12,'pm']];
 const unit=units.find(([s])=>m>=s)||units.at(-1);return fmt(m/unit[0])+' '+unit[1];
}
function bar(cam){
 let value=c.scaleBar.pixels/cam.scale;
 if(c.scaleBar.mode==='nice'){const exponent=10**Math.floor(Math.log10(value)),n=value/exponent;value=(n>=5?5:n>=2?2:1)*exponent;}
 return {worldLength:value,pixels:value*cam.scale};
}
function focus(cam,t){
 if(!c.showFocus)return;let next=cam.moving?levels[cam.target]:levels[cam.stage+1];if(!next)return;
 const p=project(...next.center,cam),w=next.viewWidth*cam.scale,h=w*V.h/V.w;
 if(w>V.w*.9||h>V.h*.9)return;
 const a=cam.moving?1-smooth((cam.progress-.65)/.3):smooth((t-levels[cam.stage].arrive)/.5);
 ctx.save();ctx.globalAlpha=a*.9;ctx.strokeStyle='#ffffff';ctx.lineWidth=2.5;
 for(const [u,v] of [[-1,-1],[1,-1],[-1,1],[1,1]]){const x=p.x+u*w/2,y=p.y+v*h/2,l=Math.min(18,w/4);ctx.beginPath();ctx.moveTo(x,y-v*l);ctx.lineTo(x,y);ctx.lineTo(x-u*l,y);ctx.stroke();}ctx.restore();
}
function annotations(cam,t){
 if(cam.moving)return;
 ctx.save();ctx.globalAlpha=smooth((t-levels[cam.stage].arrive)/.6);
 for(const a of levels[cam.stage].annotations){const p=project(...a.point,cam),x=p.x+a.offset[0],y=p.y+a.offset[1];ctx.font='26px Body';const w=ctx.measureText(a.text).width+28;
  if(x-w/2<V.x||x+w/2>V.x+V.w||y-26<V.y||y+18>V.y+V.h)issues.add('Annotation outside viewport: '+a.text);
  line(p.x,p.y,x,y,C.ink,1.8);rounded(x-w/2,y-26,w,44,6,C.panel);text(a.text,x,y+5,26,C.ink,500,'center');
 }ctx.restore();
}
function field(cam,t){
 ctx.save();ctx.beginPath();ctx.roundRect(V.x,V.y,V.w,V.h,24);ctx.clip();ctx.fillStyle=C.field;ctx.fillRect(V.x,V.y,V.w,V.h);
 ctx.save();ctx.translate(V.x+V.w/2,V.y+V.h/2);ctx.scale(cam.scale,cam.scale);ctx.translate(-cam.cx,-cam.cy);scene.draw(cam);ctx.restore();
 focus(cam,t);annotations(cam,t);
 if(c.scaleBar.show){const b=bar(cam),box=Math.max(260,b.pixels+76),x=V.x+26,y=V.y+V.h-95;
  rounded(x,y,box,72,12,C.panel);text(length(b.worldLength),x+box/2,y+36,24,C.ink,500,'center',box-24);const bx=x+(box-b.pixels)/2,by=y+52;
  line(bx,by,bx+b.pixels,by,C.ink,3);line(bx,by-5,bx,by+5,C.ink,2);line(bx+b.pixels,by-5,bx+b.pixels,by+5,C.ink,2);
 }ctx.restore();rounded(V.x,V.y,V.w,V.h,24,null,C.rule);
}
function locator(cam,x,y,w,h){
 if(!c.showLocator)return;
 rounded(x,y,w,h,12,C.field);ctx.save();ctx.beginPath();ctx.roundRect(x,y,w,h,12);ctx.clip();
 const b=scene.bounds,s=Math.min(w/b.width,h/b.height),mx=x+w/2,my=y+h/2;
 ctx.save();ctx.translate(mx,my);ctx.scale(s,s);ctx.translate(-b.cx,-b.cy);scene.overview();ctx.restore();
 ctx.strokeStyle=C.locator;ctx.lineWidth=1.5;const ww=Math.max(2,cam.width*s),hh=Math.max(2,cam.width*V.h/V.w*s);
 ctx.strokeRect(mx+(cam.cx-b.cx)*s-ww/2,my+(cam.cy-b.cy)*s-hh/2,ww,hh);ctx.restore();text(T.locator,x+12,y+h-12,17,C.ink,400,'left',w-24);
}
function sidebar(cam){
 if(!c.portrait){const x=1532; text(T.position,x,300,23,C.muted,400,'left',286);const row=Math.min(83,332/levels.length);
  levels.forEach((l,i)=>{const y=350+i*row,active=i===cam.stage;ctx.beginPath();ctx.arc(x+13,y,active?8:5,0,Math.PI*2);ctx.fillStyle=active?C.accent:C.rule;ctx.fill();text(l.name,x+40,y+8,active?30:25,active?C.ink:C.muted,active?700:400,'left',245);if(active&&row>55)text(l.description,x+40,y+37,19,C.muted,400,'left',245);});
  line(x,663,1818,663,C.rule);text(T.viewWidth,x,706,22,C.muted,400,'left',286);text(length(cam.width),x,757,43,C.ink,600,'left',286);text(T.relative,x,803,21,C.muted,400,'left',185);text('× '+fmt(cam.relative),1818,803,25,C.accent,600,'right',100);locator(cam,x,834,286,114);
 }else{
  text(T.position,64,1350,23,C.muted);const cols=2,rows=Math.ceil(levels.length/cols),rh=Math.min(70,260/rows);
  levels.forEach((l,i)=>{const x=64+(i%cols)*490,y=1395+Math.floor(i/cols)*rh,active=i===cam.stage;text((i+1)+'  '+l.name,x,y,29,active?C.ink:C.muted,active?700:400,'left',455);if(active&&rh>55)text(l.description,x,y+27,19,C.muted,400,'left',455);});
  text(T.viewWidth,64,1695,22,C.muted);text(length(cam.width),64,1743,39,C.ink,600,'left',380);text(T.relative+'  × '+fmt(cam.relative),64,1783,24,C.accent,400,'left',490);locator(cam,650,1660,366,140);
 }
}
function draw(t){
 current=Math.max(0,Math.min(c.duration,t));const cam=camera(current);ctx.setTransform(dpr*ratio,0,0,dpr*ratio,0,0);ctx.globalAlpha=1;ctx.fillStyle=C.background;ctx.fillRect(0,0,W,H);
 const pad=c.portrait?64:96,right=W-pad;
 rounded(pad,66,224,40,7,C.ink);text(T.badge,pad+112,94,22,C.background,400,'center',208);text(T.kicker,pad+246,94,22,C.muted,400,'left',c.portrait?250:500);
 text(T.note,right,c.portrait?139:96,c.portrait?18:22,C.muted,400,'right',c.portrait?952:560);
 text(T.title,pad,c.portrait?205:192,c.portrait?52:64,C.ink,700,'left',W-pad*2);text(T.subtitle,pad,c.portrait?250:237,27,C.muted,400,'left',W-pad*2);
 field(cam,current);sidebar(cam);
 const l=levels[cam.stage],foot=c.portrait?1860:1019;line(pad,foot-29,pad,foot+7,C.accent,5);text(l.caption,pad+22,foot,c.portrait?27:30,C.ink,400,'left',c.portrait?930:1450);
 if(!c.portrait)text(cam.moving?T.moving:T.holding,right,foot,22,C.muted,400,'right',210);
 $('#seek').value=current;$('#clock').textContent=current.toFixed(1)+' / '+c.duration.toFixed(1)+' s';
 window.__state={time:current,...cam,scaleBar:bar(cam),viewport:V,layerAlpha:scene.alphas?scene.alphas(cam):[],issues:[...issues]};window.__issues=[...issues];
}
async function imageScene(){
 const layers=await Promise.all(c.scene.layers.map(async l=>{const image=new Image();image.src=l.data;await image.decode();const b={...l.bounds,height:l.bounds.height||l.bounds.width*image.naturalHeight/image.naturalWidth};return {...l,image,b};}));
 const alpha=(l,cam)=>l.opacity*(l.revealWidth===undefined?1:smooth(Math.log(l.revealWidth/cam.width)/Math.log(l.fadeRatio)));
 function paint(l){const b=l.b;ctx.drawImage(l.image,b.cx-b.width/2,b.cy-b.height/2,b.width,b.height)}
 return {draw(cam){for(const l of layers){ctx.save();ctx.globalAlpha=alpha(l,cam);paint(l);ctx.restore();}},overview(){paint(layers[0]);},bounds:layers[0].b,alphas:cam=>layers.map(l=>alpha(l,cam))};
}
function fit(){const s=cap?1:Math.min(innerWidth/c.width,Math.max(150,innerHeight-70)/c.height);canvas.style.width=c.width*s+'px';canvas.style.height=c.height*s+'px';}
window.__dur=c.duration;window.__cameraAt=camera;window.__seek=async t=>{draw(t);await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame)};window.__inspect=()=>window.__state;
$('#seek').max=c.duration;$('#seek').oninput=e=>{playing=false;$('#play').textContent='播放';draw(+e.target.value)};$('#play').onclick=()=>{if(current>=c.duration)draw(0);playing=!playing;$('#play').textContent=playing?'暂停':'播放'};$('#replay').onclick=()=>{draw(0);playing=true;$('#play').textContent='暂停'};addEventListener('resize',fit);
(async()=>{try{await document.fonts.ready;scene=c.scene.type==='leaf'?window.createLeafScene(ctx,c):await imageScene();fit();draw(0);window.__ready=true;requestAnimationFrame(function tick(ms){if(last&&playing){draw(current+(ms-last)/1000);if(current>=c.duration){playing=false;$('#play').textContent='重播'}}last=ms;requestAnimationFrame(tick)});}catch(e){window.__buildError=String(e);console.error(e);}})();
})();
