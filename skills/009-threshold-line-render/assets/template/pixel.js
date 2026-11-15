/* Squat pixel runners. Every pose is a pure function of original scene time. */
window.PixelRunner=(()=>{
 const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)},ramp=(t,a,d)=>d?smooth((t-a)/d):+(t>=a),snap=x=>Math.round(x/4)*4;
 const steps=[
  {lift:[0,8,0,8],shift:[-4,4,-4,4],hop:0,wide:4},
  {lift:[0,12,0,12],shift:[0,4,0,4],hop:4,wide:0},
  {lift:[0,4,0,4],shift:[4,0,4,0],hop:8,wide:-4},
  {lift:[8,0,8,0],shift:[4,-4,4,-4],hop:0,wide:4},
  {lift:[12,0,12,0],shift:[4,0,4,0],hop:4,wide:0},
  {lift:[4,0,4,0],shift:[0,4,0,4],hop:8,wide:-4}
 ];
 function pose(t,e,i,r){
  const c=e.pixel,u=Math.max(0,t-e.at),running=ramp(t,e.at,.25),anticipation=c.crouchDuration?ramp(t,e.at-c.crouchDuration,c.crouchDuration*.75)*(1-ramp(t,e.at,.12)):0;
  const stepIndex=Math.floor(u*c.strideRate+i)%steps.length,step=steps[stepIndex],turn=ramp(t,e.at-.12,c.turnDuration),turnScale=1-.78*Math.sin(Math.PI*turn),face=1-ramp(t,e.at-.04,.13);
  const stretch=ramp(t,e.at,.08)*(1-ramp(t,e.at+.1,.17)),halfWidth=snap((96+16*anticipation-8*stretch+step.wide*running)/2),height=snap(64*(1-c.crouchDepth*anticipation)+12*stretch);
  const hop=snap(step.hop/8*c.hop*running),bottom=-16-hop,top=bottom-height,blink=((t+i*.73)%c.blinkPeriod)<c.blinkDuration&&running===0;
  const feet=[-40,-16,8,32].map((x,j)=>({x:x+snap(step.shift[j]*running),top:bottom-4,bottom:-snap(step.lift[j]*running),width:12}));
  const armLeft=snap((step.lift[0]-step.lift[1])*.5*running-4*anticipation),armRight=snap((step.lift[1]-step.lift[0])*.5*running-4*anticipation),sway=snap(Math.sin(u*6.28+i)*3*running);
  const rects=[];feet.forEach((f,j)=>{rects.push({x:f.x,y:f.top,w:f.width,h:f.bottom-f.top,tone:j%2?'base':'shade'});rects.push({x:f.x+(j%2?-0:-4),y:f.bottom-4,w:16,h:4,tone:'base'})});
  rects.push({x:-halfWidth-16,y:top+24+armLeft,w:16,h:24,tone:'base'},{x:halfWidth,y:top+24+armRight,w:16,h:24,tone:'base'},{x:-halfWidth,y:top,w:halfWidth*2,h:height,tone:'base'},{x:-halfWidth+8,y:top-8,w:halfWidth*2-16,h:8,tone:'base'},{x:-halfWidth+8,y:bottom-4,w:halfWidth*2-16,h:8,tone:'base'});
  return {stepIndex,running,anticipation,halfWidth,height,top,bottom,hop,turn,turnScale,face,blink,feet,sway,rects,scale:r.scale*c.size};
 }
 function bounds(p,x,y){
  return {left:x+Math.min(...p.rects.map(a=>(a.x*p.turnScale+p.sway)*p.scale)),right:x+Math.max(...p.rects.map(a=>((a.x+a.w)*p.turnScale+p.sway)*p.scale)),top:y+Math.min(...p.rects.map(a=>a.y*p.scale)),bottom:y+Math.max(...p.rects.map(a=>(a.y+a.h)*p.scale))};
 }
 function tint(hex,amount){const v=[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));return '#'+v.map(x=>Math.max(0,Math.min(255,Math.round(x*amount))).toString(16).padStart(2,'0')).join('')}
 function draw(ctx,p,e,x,y){
  ctx.save();ctx.translate(x,y);ctx.scale(p.scale,p.scale);ctx.fillStyle='#171717';ctx.globalAlpha*=.35;ctx.fillRect(-44,0,88,5);ctx.fillRect(-36,5,72,3);ctx.restore();
  ctx.save();ctx.translate(x,y);ctx.scale(p.scale,p.scale);ctx.translate(p.sway,0);ctx.scale(p.turnScale,1);ctx.imageSmoothingEnabled=false;
  for(const a of p.rects){ctx.fillStyle=a.tone==='shade'?tint(e.color,.82):e.color;ctx.fillRect(a.x,a.y,a.w,a.h)}
  ctx.fillStyle=tint(e.color,1.25);ctx.globalAlpha*=.65;ctx.fillRect(-p.halfWidth+8,p.top-8,24,4);ctx.globalAlpha/=.65;
  ctx.fillStyle=tint(e.color,.78);ctx.fillRect(p.halfWidth-8,p.top+8,8,p.height-12);ctx.globalAlpha*=p.face;ctx.fillStyle=e.pixel.eyeColor;
  for(const x of [-28,20])ctx.fillRect(x,p.top+(p.blink?32:24),8,p.blink?4:20);
  ctx.restore();
 }
 return {pose,bounds,draw};
})();
