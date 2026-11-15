/* Reusable monitor spine. No app/global timeline dependencies. */
window.MonitorBand={create(config,theme){
 const m=config,P=theme,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x)},mix=(a,b,t)=>a+(b-a)*t,issues=new Set();
 const clock=t=>t-m.events.reduce((sum,e)=>sum+Math.max(0,Math.min(t,e.releaseAt)-e.lockAt),0);
 const events=m.events.map(e=>({...e,clockAt:clock(e.lockAt)}));
 function stateAt(t){const i=events.findLastIndex(e=>t>=e.at),e=events[i],held=events.some(e=>t>=e.lockAt&&t<e.releaseAt),u=e?clamp((t-e.at)/e.rise):0;
  return {time:t,eventIndex:i,eventId:e?.id??null,month:e?.month??m.month,year:e?.year??m.year,held,clock:clock(t),locked:!!e&&t>=e.lockAt,value:e?mix(e.from,e.value,ease(u)):null,reveal:e?ease((t-e.at)/.35):0,stamp:e?clamp((t-e.lockAt)/m.stampDuration):0,releaseAt:e?.releaseAt??null};}
 function trace(u,height){let noise=(Math.sin(u*17)*1.8+Math.sin(u*37)*1.1)*m.noise,v=noise;
  for(const e of events){const d=u-(e.clockAt-.45),envelope=Math.exp(-d*d/.018);v+=e.peak*height*(envelope-.14*Math.exp(-((d+.18)**2)/.006)-.11*Math.exp(-((d-.18)**2)/.009));v-=noise*envelope;}
  return v;
 }
 function text(ctx,s,x,y,size,col=P.ink,weight=400,max=Infinity,align='left',font='Body'){ctx.font=`${weight} ${size}px ${font}`;ctx.textAlign=align;ctx.fillStyle=col;if(ctx.measureText(String(s)).width>max+1)issues.add('Monitor text exceeds readable area: '+s);ctx.fillText(String(s),x,y);}
 function box(ctx,x,y,w,h,stroke,fill=null,r=4){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill()}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1;ctx.stroke()}}
 function lines(ctx,s,width,size){ctx.font=`500 ${size}px Body`;const out=[];let current='';for(const ch of Array.from(s)){if(ch==='\n'||(current&&ctx.measureText(current+ch).width>width)){out.push(current);current=ch==='\n'?'':ch}else current+=ch;}if(current)out.push(current);return out;}
 function drawBand(ctx,t,rect){const s=stateAt(t),{x,y,w,h}=rect;ctx.save();box(ctx,x,y,w,h,'rgba(255,255,255,.12)',P.panel);const gx=x+230,gw=w-254,base=y+h-19;
  ctx.save();ctx.beginPath();ctx.rect(gx,y+8,gw,h-16);ctx.clip();ctx.strokeStyle='rgba(255,255,255,.09)';ctx.lineWidth=.5;ctx.beginPath();for(let a=gx;a<=gx+gw;a+=40){ctx.moveTo(a,y);ctx.lineTo(a,y+h)}for(let a=y+16;a<y+h;a+=20){ctx.moveTo(gx,a);ctx.lineTo(gx+gw,a)}ctx.stroke();
  ctx.beginPath();for(let a=0;a<=gw;a+=2){const u=s.clock-(gw-a)/m.speed,py=base-trace(u,h);a?ctx.lineTo(gx+a,py):ctx.moveTo(gx+a,py)}ctx.strokeStyle=P.accent;ctx.lineWidth=2;ctx.shadowColor=P.accent;ctx.shadowBlur=5;ctx.stroke();ctx.restore();
  box(ctx,x+20,y+18,184,34,P.accent);text(ctx,`${String(s.month).padStart(2,'0')}月 · ${s.year}`,x+112,y+42,21,P.gold,500,170,'center','Consolas,Body');text(ctx,s.held?m.holdLabel:m.liveLabel,x+22,y+h-22,18,s.held?P.gold:P.muted,400,184);ctx.restore();return s;
 }
 function drawEvent(ctx,t,rect){const s=stateAt(t),{x,y,w,h}=rect,e=events[s.eventIndex];ctx.save();box(ctx,x,y,w,h,'rgba(255,255,255,.12)',P.panel,6);
  if(!e){text(ctx,m.waiting,x+w/2,y+h/2,42,P.muted,500,w-120,'center');ctx.restore();return s;}
  ctx.globalAlpha*=s.reveal;box(ctx,x+42,y+36,180,36,P.accent);text(ctx,e.label,x+132,y+62,21,P.accent,500,166,'center','Consolas,Body');
  const title=lines(ctx,e.title,w*.29,48);if(title.length>3)issues.add('Monitor event title needs more than 3 lines: '+e.id);title.forEach((line,i)=>text(ctx,line,x+44,y+202+i*67,48,P.ink,600,w*.29));
  const sub=lines(ctx,e.subtitle,w*.29,25);if(sub.length>3)issues.add('Monitor event subtitle needs more than 3 lines: '+e.id);sub.forEach((line,i)=>text(ctx,line,x+44,y+430+i*38,25,P.muted,400,w*.29));
  const nx=x+w*.52,ny=y+h*.53;ctx.save();ctx.shadowColor=P.accent;ctx.shadowBlur=12;text(ctx,s.value.toFixed(e.decimals),nx,ny,m.valueSize,P.gold,700,w*.29,'center');ctx.restore();text(ctx,e.unit,nx,ny+68,28,P.muted,400,w*.29,'center');
  if(s.stamp>0){const k=1+.28*(1-ease(s.stamp)),cx=x+w*.83,cy=y+h*.47;ctx.save();ctx.globalAlpha*=Math.min(1,s.stamp*3);ctx.translate(cx,cy);ctx.rotate(-5*Math.PI/180);ctx.scale(k,k);box(ctx,-146,-61,292,122,P.accent,null,4);box(ctx,-137,-52,274,104,P.accent,null,2);text(ctx,e.stamp,0,5,35,P.accent,600,244,'center');text(ctx,m.stampLabel,0,38,18,P.gold,400,244,'center','Consolas,Body');ctx.restore();}
  ctx.strokeStyle=P.line;ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x+44,y+h-76);ctx.lineTo(x+w-44,y+h-76);ctx.stroke();
  text(ctx,`${String(s.eventIndex+1).padStart(2,'0')} / ${String(events.length).padStart(2,'0')}`,x+44,y+h-32,20,P.muted,400,160,'left','Consolas,Body');text(ctx,s.locked?m.lockLabel:m.riseLabel,x+w-44,y+h-32,23,s.locked?P.gold:P.muted,400,w*.6,'right');ctx.restore();return s;
 }
 return {stateAt,trace,drawBand,drawEvent,issues,events};
}};
