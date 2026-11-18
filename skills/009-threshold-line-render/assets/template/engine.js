// Original geometric demonstration. No real model ranking or performance data.
const C=window.THRESHOLD_CONFIG,T=C.text,RA=C.race,TH=C.threshold,TL=C.timeline,FR=C.fracture;
const W=1920,H=1080,DUR=C.duration,cv=document.querySelector('#film'),ctx=cv.getContext('2d',{willReadFrequently:true});cv.width=C.width;cv.height=C.height;
const cap=new URLSearchParams(location.search).has('cap');document.body.classList.toggle('cap',cap);
const P=C.theme;const issues=new Set();
const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);},mix=(a,b,t)=>a+(b-a)*t;
function text(s,x,y,size=28,color=P.ink,weight=400,max=800){s=String(s);ctx.font=`${weight} ${size}px Body`;const w=ctx.measureText(s).width;if(w>max){size*=max/w;if(size<12)issues.add('Text too long: '+s);ctx.font=`${weight} ${Math.max(12,size)}px Body`;}ctx.fillStyle=color;ctx.fillText(s,x,y,max);}
function line(points,col=P.line,width=1){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.strokeStyle=col;ctx.lineWidth=width;ctx.stroke();}
function poly(points,fill,stroke,width=1){ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
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
function box(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.3;ctx.stroke();}}
function circle(x,y,r,fill,stroke,width=1){ctx.beginPath();ctx.arc(x,y,Math.max(.01,r),0,Math.PI*2);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=width;ctx.stroke();}}
const pins=C.mode==='race'?[]:C.pins,cards=C.mode==='race'?[]:C.cards,LINE=TH.y;let textures=[];
const rnd=(n)=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x);};
const fragments=cards.map((c,k)=>{const verts=[],w=c.width,h=c.height;for(let r=0;r<=FR.rows;r++){verts[r]=[];for(let col=0;col<=FR.columns;col++)verts[r][col]=[col*w/FR.columns+(col>0&&col<FR.columns?(rnd(FR.seed+k*80+r*7+col)-.5)*w/FR.columns*FR.jitter:0),r*h/FR.rows+(r>0&&r<FR.rows?(rnd(FR.seed+k*99+r*3+col*9)-.5)*h/FR.rows*FR.jitter:0)];}const out=[];for(let r=0;r<FR.rows;r++)for(let col=0;col<FR.columns;col++){const a=verts[r][col],b=verts[r][col+1],d=verts[r+1][col],e=verts[r+1][col+1];for(const pts of [[a,b,e],[a,e,d]]){const n=out.length,cx=pts.reduce((s,p)=>s+p[0],0)/3,cy=pts.reduce((s,p)=>s+p[1],0)/3;out.push({pts,cx,cy,vx:(cx-w/2)*FR.spread+(rnd(FR.seed+k*30+n)-.5)*FR.spread*53,vy:-FR.lift*(.55+rnd(FR.seed+k*41+n)*.9),spin:(rnd(FR.seed+k*17+n+11)-.5)*FR.spin});}}return out;});
function stateAt(t){let phase=C.mode==='race'?T.raceReady:t<TH.at+TH.draw?TH.label:t<TL.noteChangeAt?T.beforeCards:T.afterCards;if(C.mode!=='threshold'&&t>=RA.start)phase=t<RA.start+RA.goAt?T.readyLabel:T.raceGo;for(const p of TL.phases)if(t>=p.at)phase=p.text;return {time:t,threshold:ease((t-TH.at)/TH.draw),pins:pins.map(p=>t>=p.at),cards:cards.map(c=>({hit:t>=c.hit,age:t-c.hit,bottom:t<c.hit?mix(c.startBottom,LINE,Math.pow(clamp((t-(c.hit-c.fall))/c.fall),2.25)):LINE})),transition:C.mode==='threshold'?0:C.mode==='race'?1:TL.transition?ease((t-RA.start)/TL.transition):+(t>=RA.start),raceTravel:entrants.map((e,i)=>entrantState(t,e,i).travel),phase};}
function cardTexture(c){const ca=document.createElement('canvas');ca.width=c.width;ca.height=c.height;const g=ca.getContext('2d');g.fillStyle=c.fill;g.beginPath();g.roundRect(0,0,c.width,c.height,c.radius);g.fill();g.strokeStyle=c.border;g.lineWidth=2;g.stroke();const fit=(s,size,y,col)=>{g.font=`400 ${size}px Body`;const actual=Math.min(size,size*(c.width-40)/Math.max(1,g.measureText(s).width));if(actual<12)issues.add('Card text too long: '+s);g.font=`400 ${Math.max(12,actual)}px Body`;g.fillStyle=col;g.fillText(s,20,y,c.width-40);};fit(c.tag,17,c.height*.19,c.muted);fit(c.label,36,c.height*.52,c.ink);fit(c.sub,20,c.height*.8,c.ink);return ca;}
function ruler(t){const r=C.ruler;if(!r.show)return;const a=ease((t-r.at)/r.enter);ctx.save();ctx.globalAlpha*=a;ctx.translate(-35*(1-a),0);ctx.save();ctx.shadowColor='rgba(0,0,0,.55)';ctx.shadowBlur=26;ctx.shadowOffsetY=12;
 squirclePath(r.x,r.top-10,r.width,r.bottom-r.top+36,12);ctx.fillStyle=P.ruler;ctx.fill();ctx.restore();
 ctx.save();squirclePath(r.x,r.top-10,r.width,r.bottom-r.top+36,12);ctx.clip();
 const rg=ctx.createLinearGradient(r.x,0,r.x+r.width,0);
 rg.addColorStop(0,'rgba(255,255,255,.65)');rg.addColorStop(.28,'rgba(255,255,255,0)');
 rg.addColorStop(.75,'rgba(0,0,0,.10)');rg.addColorStop(1,'rgba(0,0,0,.26)');
 ctx.fillStyle=rg;ctx.fillRect(r.x,r.top-10,r.width,r.bottom-r.top+36);
 const rgv=ctx.createLinearGradient(0,r.top,0,r.bottom);
 rgv.addColorStop(0,'rgba(255,255,255,.20)');rgv.addColorStop(1,'rgba(0,0,0,.10)');
 ctx.fillStyle=rgv;ctx.fillRect(r.x,r.top-10,r.width,r.bottom-r.top+36);ctx.restore();
 squirclePath(r.x,r.top-10,r.width,r.bottom-r.top+36,12);ctx.lineWidth=1.4;ctx.strokeStyle='rgba(255,255,255,.35)';ctx.stroke();for(let i=0;i<=Math.floor((r.max-r.min)/r.step+1e-8);i++){const v=r.min+i*r.step,y=r.bottom-(v-r.min)/(r.max-r.min)*(r.bottom-r.top),major=Math.abs((v-r.min)/r.labelEvery-Math.round((v-r.min)/r.labelEvery))<1e-7;line([[r.x+r.width-(major?74:38),y],[r.x+r.width,y]],P.rulerInk,major?2:1);if(major)text(v.toFixed(r.decimals)+r.unit,r.x+10,y+7,20,P.rulerInk,500,r.width-47);}text(r.label,r.x+5,r.bottom+78,18,P.muted,400,160);ctx.restore();}
function rivet(t,p){const start=p.at-p.drop;if(t<start)return;const travel=Math.pow(clamp((t-start)/p.drop),3),dt=t-p.at,scale=dt<0?mix(2.8,1,travel):1+.12*Math.sin(clamp(dt/.25)*Math.PI),y=dt<0?LINE-190*(1-travel):LINE;
 if(dt>=0&&dt<.7){ctx.save();ctx.globalAlpha*=(1-dt/.7)*.7;circle(p.x,LINE,25+dt*125,null,P.red,2);ctx.restore();}
 ctx.save();ctx.translate(p.x,y);ctx.scale(scale*p.radius/25,scale*p.radius/25);ctx.shadowColor='#000000';ctx.shadowBlur=12;ctx.shadowOffsetY=8;circle(0,0,25,P.pinDark,p.color,2);ctx.shadowBlur=0;ctx.shadowOffsetY=0;const g=ctx.createLinearGradient(-19,-19,19,19);g.addColorStop(0,P.pinLight);g.addColorStop(.45,P.pinMid);g.addColorStop(1,P.pinShade);poly(Array.from({length:6},(_,i)=>[Math.cos(i*Math.PI/3)*17,Math.sin(i*Math.PI/3)*17]),g,p.color,1);line([[-7,-7],[7,7]],P.pinDark,3);ctx.restore();
 if(dt>0){ctx.save();ctx.globalAlpha*=ease(dt/.3);line([[p.x,LINE+30],[p.x,LINE+66]],P.line,2);ctx.textAlign='center';text(p.label,p.x,LINE+116,43,P.ink,500,220);text(p.sub,p.x,LINE+154,17,P.muted,400,220);ctx.restore();}}
function drawCard(t,c,k){if(t<c.hit-c.fall-.2)return;const dt=t-c.hit;ctx.save();ctx.beginPath();ctx.rect(275,215,1535,752);ctx.clip();if(dt<0||!FR.enabled){const state=stateAt(t).cards[k];ctx.globalAlpha*=ease((t-(c.hit-c.fall-.2))/.3);ctx.save();ctx.shadowColor='rgba(0,0,0,.45)';ctx.shadowBlur=26;ctx.shadowOffsetY=12;
  ctx.fillStyle='#ffffff';ctx.fillRect(c.x-c.width/2,state.bottom-c.height,c.width,c.height);ctx.restore();
  ctx.drawImage(textures[k],c.x-c.width/2,state.bottom-c.height);}else if(dt<FR.lifetime){const fade=1-ease((dt-(FR.lifetime-FR.fade))/FR.fade);for(const f of fragments[k]){ctx.save();ctx.globalAlpha*=fade;const dx=f.vx*dt,dy=f.vy*dt+.5*FR.gravity*dt*dt;ctx.translate(c.x-c.width/2+f.cx+dx,LINE-c.height+f.cy+dy);ctx.rotate(f.spin*dt);ctx.beginPath();f.pts.forEach(([x,y],i)=>i?ctx.lineTo(x-f.cx,y-f.cy):ctx.moveTo(x-f.cx,y-f.cy));ctx.closePath();ctx.clip();ctx.drawImage(textures[k],-f.cx,-f.cy);ctx.restore();}
  for(let i=0;i<FR.sparks;i++){const a=(i/Math.max(1,FR.sparks-1))*Math.PI,dist=dt*(120+80*rnd(i+k*12));ctx.save();ctx.globalAlpha*=Math.max(0,1-dt/.45);line([[c.x+Math.cos(a)*dist,LINE+Math.sin(a)*dist*.35],[c.x+Math.cos(a)*(dist+17),LINE+Math.sin(a)*(dist+17)*.35]],P.gold,2);ctx.restore();}
 }ctx.restore();}
function threshold(t,s){if(s.transition>=1)return;let shake=0;for(const p of pins){const dt=t-p.at;if(dt>=0&&dt<.35)shake+=Math.sin(dt*80)*6*Math.exp(-dt*11);}for(const c of cards){const dt=t-c.hit;if(dt>=0&&dt<.25)shake+=Math.sin(dt*70)*3*Math.exp(-dt*14);}
 ctx.save();ctx.globalAlpha=1-s.transition;ctx.translate(0,shake*TL.shake);for(let i=0;i<6;i++){const y=260+i*120;line([[268,y],[1816,y]],P.grid);}ruler(t);
 if(s.threshold&&(C.mode==='threshold'||t<RA.start)){ctx.save();
 const tip=mix(TH.left,TH.right,s.threshold);
 ctx.shadowColor=TH.color;ctx.shadowBlur=TH.glow*2;line([[TH.left,LINE],[tip,LINE]],TH.color,TH.width);
 ctx.shadowBlur=34;circle(tip,LINE,TH.width*1.1,TH.color);
 ctx.shadowBlur=18;circle(TH.left,LINE,TH.width*.9,TH.color);
 ctx.shadowBlur=0;ctx.restore();ctx.save();ctx.globalAlpha*=s.threshold;text(TH.label,278,LINE-31,38,TH.color,600,350);text(TH.subtitle,278,LINE+37,17,TH.color,400,350);ctx.restore();}
 cards.forEach((c,k)=>drawCard(t,c,k));pins.forEach(p=>rivet(t,p));if(t>TL.noteAt){ctx.save();ctx.globalAlpha*=ease((t-TL.noteAt)/.5);text(t<TL.noteChangeAt?T.beforeCards:T.afterCards,310,910,29,P.muted);ctx.restore();}ctx.restore();}
const entrants=C.mode==='threshold'?[]:C.entrants;
function trackPoint(x,z){return [960+x*(RA.farWidth+RA.spread*z),RA.farY+RA.depth*z];}
function entrantState(t,e,i){const entry=ease((t-e.entryGlobal)/e.entryDuration),p=clamp((t-e.at)/e.travel),travel=ease(p);return {entry,travel,z:mix(RA.readyZ+.24,RA.readyZ,entry)-travel*(RA.readyZ-RA.finishZ),scale:mix(1,RA.endScale,travel)};}
function entrantBounds(t,e,i){const r=entrantState(t,e,i),[x,y]=trackPoint(e.lane,r.z);if(e.type==='pixel')return PixelRunner.bounds(PixelRunner.pose(t,e,i,r),x,y);return {left:x-RA.cardWidth*r.scale/2,right:x+RA.cardWidth*r.scale/2,top:y-RA.cardHeight*r.scale,bottom:y};}
function pixelLabel(t,e,i){const r=entrantState(t,e,i),[x,y]=trackPoint(e.lane,r.z),size=Math.max(22,e.pixel.labelSize*mix(1,.75,r.travel)),baseline=y+32*Math.max(.65,r.scale)+8;ctx.font=`500 ${size}px Body`;const width=ctx.measureText(e.name).width;return {x,baseline,size,width,left:x-width/2,right:x+width/2,top:baseline-size,bottom:baseline+size*.2};}
// Find the first crossing, including stepped pixel poses; do not reuse card height.
for(let i=0;i<entrants.length;i++){const e=entrants[i];let lo=e.at,hi=e.at+e.travel;
 if(e.type==='pixel')for(let n=1;n<=256;n++){const t=e.at+e.travel*n/256;if(entrantBounds(t,e,i).top<=RA.startY){hi=t;lo=e.at+e.travel*(n-1)/256;break;}}
 for(let n=0;n<40;n++){const t=(lo+hi)/2;if(entrantBounds(t,e,i).top>RA.startY)lo=t;else hi=t;}e.cross=(lo+hi)/2;e.crossX=trackPoint(e.lane,entrantState(e.cross,e,i).z)[0];}
function raceDiagnostics(){
 const result={pixelEntrants:entrants.filter(e=>e.type==='pixel').length,samples:0,crossings:entrants.map((e,i)=>({name:e.name,type:e.type,time:e.cross,frontBefore:entrantBounds(e.cross-.00001,e,i).top,frontAfter:entrantBounds(e.cross+.00001,e,i).top}))};
 if(!result.pixelEntrants)return result;
 const samples=new Set();entrants.forEach(e=>{for(let n=0;n<=80;n++)samples.add(e.entryGlobal+e.entryDuration+(e.at+e.travel-e.entryGlobal-e.entryDuration)*n/80)});
 for(const t of samples){const visible=entrants.map((e,i)=>({e,i,r:entrantState(t,e,i),b:entrantBounds(t,e,i)})).filter(a=>a.r.entry>=.999&&a.r.travel<.96);result.samples++;
  for(const a of visible){const {b,e,r}=a;if(b.left<88||b.right>1832||b.top<350||b.bottom>974)issues.add('Entrant outside race area: '+e.name);
   if(e.type==='pixel'){a.label=pixelLabel(t,e,a.i);if(a.label.width>220)issues.add('Pixel label too long: '+e.name);if(a.label.bottom>1004)issues.add('Pixel label outside race area: '+e.name);}
   const k=RA.lanes.findIndex((v,i)=>i<RA.lanes.length-1&&e.lane>v&&e.lane<RA.lanes[i+1]);if(k<0)issues.add('Entrant needs a lane between boundaries: '+e.name);
   else if(b.left<trackPoint(RA.lanes[k],r.z)[0]+6||b.right>trackPoint(RA.lanes[k+1],r.z)[0]-6)issues.add('Entrant exceeds lane width: '+e.name);
  }
  for(let i=0;i<visible.length;i++)for(let j=i+1;j<visible.length;j++){const hit=(a,b)=>a&&b&&a.left<b.right+8&&a.right>b.left-8&&a.top<b.bottom+8&&a.bottom>b.top-8;const a=visible[i],b=visible[j];if(hit(a.b,b.b))issues.add('Entrants overlap: '+a.e.name+' / '+b.e.name);if(hit(a.label,b.label)||hit(a.label,b.b)||hit(a.b,b.label))issues.add('Entrant label overlap: '+a.e.name+' / '+b.e.name);}
 }
 return result;
}
window.__raceDiagnostics=null;
function detailedTrack(grid){
 const near=RA.readyZ+.04;poly([trackPoint(-1,near),trackPoint(-1,.03),trackPoint(1,.03),trackPoint(1,near)],'#292929',P.trackGrid,1);
 for(let i=0;i<RA.lanes.length-1;i++){const a=RA.lanes[i],b=RA.lanes[i+1];if(i%2===0)poly([trackPoint(a,near),trackPoint(a,.03),trackPoint(b,.03),trackPoint(b,near)],'#303030');
  const [x,y]=trackPoint((a+b)/2,.2);ctx.save();ctx.globalAlpha*=.55;ctx.textAlign='center';text(String(i+1).padStart(2,'0'),x,y,18,P.muted,500,70);ctx.restore();}
 for(const side of [-1,1]){line([trackPoint(side,.02),trackPoint(side,near)],P.trackEdge,2);line([trackPoint(side*1.035,.02),trackPoint(side*1.035,near)],P.line,3);
  for(let j=1;j<=9;j++){const z=j/10;line([trackPoint(side,z),trackPoint(side*1.024,z)],j%3===0?P.gold:P.muted,1.5);}}
 for(const e of entrants){const [x,y]=trackPoint(e.lane,RA.readyZ);for(const side of [-1,1]){poly([[x+side*23-11,y+5],[x+side*23-7,y-5],[x+side*23+12,y-5],[x+side*23+10,y+5]],P.line,P.trackEdge,1);}}
}
function rgb(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16));}
function newRace(t,s){if(C.mode==='threshold'||t<RA.start)return;const local=t-RA.start,tilt=C.mode==='race'?1:ease((local-RA.moveAt)/RA.moveDuration),grid=ease((local-RA.gridAt)/RA.gridDuration),startY=mix(LINE,RA.startY,tilt),left=mix(TH.left,RA.left,tilt),right=mix(TH.right,RA.right,tilt);
 // The original red line remains intact while the surrounding diagram changes.
 ctx.save();ctx.beginPath();ctx.rect(88,194,1744,RA.trackStyle==='detailed'?810:780);ctx.clip();
 if(grid){ctx.save();ctx.globalAlpha=grid;const glow=ctx.createRadialGradient(960,760,15,960,760,760);glow.addColorStop(0,RA.color+'18');glow.addColorStop(1,P.bg+'00');ctx.fillStyle=glow;ctx.fillRect(100,320,1720,640);
 if(RA.trackStyle==='detailed')detailedTrack(grid);
 for(const x of RA.lanes){const near=trackPoint(x,RA.readyZ),far=trackPoint(x,.03);line([near,[mix(near[0],far[0],grid),mix(near[1],far[1],grid)]],x===-1||x===1?P.trackEdge:P.trackGrid,x===-1||x===1?1.8:1.2);}
 for(let i=0;i<10;i++){const z=i/10;ctx.globalAlpha=grid*(.1+z*.17);line([trackPoint(-1,z),trackPoint(1,z)],P.muted,1);}ctx.globalAlpha=grid;
 for(let i=0;i<entrants.length;i++){const [x,y]=trackPoint(entrants[i].lane,.06);circle(x,y,4,entrants[i].color);}
 ctx.restore();}
 const go=ease((local-RA.goAt)/RA.goDuration),red=rgb(TH.color),green=rgb(RA.color),lineColor=`rgb(${red.map((v,i)=>Math.round(mix(v,green[i],go))).join(',')})`;
 ctx.save();ctx.shadowColor=lineColor;ctx.shadowBlur=RA.glow;line([[left,startY],[right,startY]],lineColor,RA.width);ctx.shadowBlur=0;ctx.restore();
 if(tilt>.5){ctx.save();ctx.globalAlpha=ease((tilt-.5)*2);text(go<.5?T.readyLabel:T.startLabel,left+6,startY-25,25,lineColor,500);ctx.textAlign='right';text(go<.5?T.readyTag:T.goTag,right-8,startY-25,19,lineColor);ctx.restore();}
 for(let i=0;i<entrants.length;i++){const e=entrants[i],r=entrantState(t,e,i);if(!r.entry)continue;const [x,y]=trackPoint(e.lane,r.z),w=RA.cardWidth*r.scale,h=RA.cardHeight*r.scale,fade=1-ease((r.travel-.86)/.14);ctx.save();ctx.globalAlpha=r.entry*fade;
 if(r.travel>0){const tail=trackPoint(e.lane,Math.min(1.12,r.z+.12+r.travel*.2)),g=ctx.createLinearGradient(x,y,tail[0],tail[1]);g.addColorStop(0,e.color);g.addColorStop(1,e.color+'00');line([[x,y],[tail[0],tail[1]]],g,3*r.scale);}
 if(e.type==='pixel'){
  const pose=PixelRunner.pose(t,e,i,r),label=pixelLabel(t,e,i);PixelRunner.draw(ctx,pose,e,x,y);ctx.textAlign='center';text(e.name,x,label.baseline,label.size,P.ink,500,220);
 }else{
 ctx.shadowColor=e.color+'33';ctx.shadowBlur=20;box(x-w/2,y-h,w,h,9*r.scale,P.raceFill,e.color);ctx.shadowBlur=0;line([[x-w/2+18*r.scale,y-h+16*r.scale],[x-w/2+48*r.scale,y-h+16*r.scale]],e.color,3*r.scale);
 ctx.textAlign='center';text(e.name,x,y-h*.43,30*r.scale,P.ink,500,w-24*r.scale);text(r.travel>0?T.entrantGo:T.entrantReady,x,y-h*.15,13*r.scale,e.color,400,w-20*r.scale);}ctx.restore();
 // A short local pulse marks each crossing; other lanes remain visually quiet.
 const cross=e.cross,dt=t-cross;if(dt>=0&&dt<.55){ctx.save();ctx.globalAlpha=(1-dt/.55)*.6;const px=e.crossX;line([[px-40-dt*110,startY],[px+40+dt*110,startY]],e.color,8*(1-dt/.55));ctx.restore();}}
 ctx.restore();
 ctx.save();ctx.globalAlpha=ease((local-RA.titleAt)/.9);ctx.textAlign='center';text(T.raceTitle,960,278,56,P.ink,600,1500);text(local<RA.goAt+RA.goDuration?T.raceReady:T.raceGo,960,330,25,local<RA.goAt+RA.goDuration?P.muted:RA.color);ctx.restore();}
function draw(t){const s=stateAt(t);cv.width=C.width;ctx.reset();ctx.scale(C.width/W,C.height/H);ctx.fillStyle=P.bg;ctx.fillRect(0,0,W,H);text(T.title,88,123,62,P.ink,600,620);text(T.subtitle,750,121,26,P.muted,400,670);text(T.eyebrow,1490,92,20,P.muted,400,342);text(s.phase,1490,140,26,C.mode==='threshold'||t<RA.start?TH.color:RA.color,400,342);line([[88,181],[1832,181]],P.line);threshold(t,s);newRace(t,s);
 text(T.footerLeft,88,1026,18,P.muted,400,1050);ctx.save();ctx.textAlign='right';text(T.footerRight,1832,1026,20,P.muted,400,650);ctx.restore();const fade=Math.max(TL.fadeIn?1-ease(t/TL.fadeIn):0,TL.fadeOut?ease((t-(DUR-TL.fadeOut))/TL.fadeOut):0);if(fade){ctx.globalAlpha=fade;ctx.fillStyle=P.bg;ctx.fillRect(0,0,W,H);ctx.globalAlpha=1;}window.__state=s;window.__issues=[...issues];document.querySelector('#seek').value=t;document.querySelector('#clock').textContent=t.toFixed(1)+' / '+DUR.toFixed(1)+' s';}
function fit(){const r=cap?1:Math.min(innerWidth/C.width,(innerHeight-66)/C.height);cv.style.width=C.width*r+'px';cv.style.height=C.height*r+'px';}
document.querySelector('#seek').max=DUR;let current=0,playing=!cap,last=0;window.__dur=DUR;window.__stateAt=stateAt;window.__inspect=()=>window.__state;window.__seek=async t=>{current=Math.max(0,Math.min(DUR,t));draw(current);};
document.querySelector('#play').onclick=()=>{if(current>=DUR)current=0;playing=!playing;};document.querySelector('#replay').onclick=()=>{current=0;playing=true;};document.querySelector('#seek').oninput=e=>{playing=false;window.__seek(+e.target.value);};addEventListener('resize',fit);
(async()=>{try{await document.fonts.load('32px Body');await document.fonts.ready;textures=cards.map(cardTexture);window.__raceDiagnostics=raceDiagnostics();fit();draw(0);window.__ready=true;requestAnimationFrame(function tick(ms){if(last&&playing){current=Math.min(DUR,current+(ms-last)/1000);draw(current);if(current===DUR)playing=false;}last=ms;requestAnimationFrame(tick);});}catch(e){window.__buildError=String(e);console.error(e);}})();
