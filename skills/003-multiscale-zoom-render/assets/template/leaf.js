// Original deterministic leaf illustration, model units are micrometres.
window.createLeafScene=(ctx,config)=>{
const FOCUS={x:config.scene.focus[0],y:config.scene.focus[1]},V=config.viewport;
const clamp=x=>Math.max(0,Math.min(1,x)),smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const leaf=new Path2D('M-33000 0 C-21000 -19000 17000 -20500 34000 -1000 C16000 17800 -22000 17500 -33000 0Z');
const leftGuard=new Path2D('M-1.8 -14 C-9.8 -18 -14.2 -9.5 -13.5 0 C-13.8 9.7 -8 17.5 -1.8 14 C-6.1 7.8 -6.1 -7.7 -1.8 -14Z');
const cellCache=new Map();
function random(i,j,k=0){let h=Math.imul(i+9341,374761393)^Math.imul(j+8179,668265263)^Math.imul(k+31,2246822519);h=Math.imul(h^(h>>>13),1274126177);return ((h^(h>>>16))>>>0)/4294967295}
function site(i,j){return {x:(i+(j%2? .5:0))*52+(random(i,j)-.5)*15,y:j*45+(random(i,j,1)-.5)*14}}
function clip(poly,nx,ny,k){const out=[];for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length],da=a.x*nx+a.y*ny-k,db=b.x*nx+b.y*ny-k;if(da<=0)out.push(a);if((da<=0)!==(db<=0)){const f=da/(da-db);out.push({x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f})}}return out}
function cell(i,j){const key=i+','+j;if(cellCache.has(key))return cellCache.get(key);const p=site(i,j);let poly=[{x:p.x-75,y:p.y-75},{x:p.x+75,y:p.y-75},{x:p.x+75,y:p.y+75},{x:p.x-75,y:p.y+75}];for(let v=j-2;v<=j+2;v++)for(let u=i-2;u<=i+2;u++){if(u===i&&v===j)continue;const q=site(u,v),nx=q.x-p.x,ny=q.y-p.y;poly=clip(poly,nx,ny,(q.x*q.x+q.y*q.y-p.x*p.x-p.y*p.y)/2)}const path=new Path2D();poly.forEach((p,k)=>k?path.lineTo(p.x,p.y):path.moveTo(p.x,p.y));path.closePath();
 const border=new Path2D(),slot=i%5===0&&j%5===0;
 if(slot){const center=i===0&&j===0?{x:0,y:0}:p;for(const vertex of poly){const angle=Math.atan2(vertex.y-center.y,vertex.x-center.x),cx=Math.cos(angle),cy=Math.sin(angle);border.moveTo(vertex.x,vertex.y);border.lineTo(center.x+Math.sign(cx)*Math.max(3,11*Math.abs(cx)),center.y+13*cy)}}
 else for(let k=0;k<poly.length;k++){const a=poly[k],b=poly[(k+1)%poly.length],m={x:(a.x+b.x)/2,y:(a.y+b.y)/2},d0=(m.x-p.x)**2+(m.y-p.y)**2;let skip=false;for(let v=j-2;v<=j+2;v++)for(let u=i-2;u<=i+2;u++){if(u%5||v%5)continue;const q=site(u,v);if(Math.abs((m.x-q.x)**2+(m.y-q.y)**2-d0)<.01)skip=true}if(!skip){border.moveTo(a.x,a.y);border.lineTo(b.x,b.y)}}
 const result={path,border,poly,p};cellCache.set(key,result);return result}
function leafDrawing(mini=false){
 const g=ctx.createLinearGradient(-25000,-12000,26000,15000);g.addColorStop(0,'#93ad67');g.addColorStop(.48,'#719653');g.addColorStop(1,'#3f744a');ctx.fillStyle=g;ctx.fill(leaf);
 ctx.strokeStyle='#3e6742';ctx.lineWidth=mini?600:180;ctx.stroke(leaf);
 ctx.strokeStyle='#b4c88b';ctx.lineWidth=mini?400:420;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(-38500,900);ctx.quadraticCurveTo(-5000,-1700,33400,-1000);ctx.stroke();
 ctx.save();ctx.clip(leaf);if(!mini)for(let k=0;k<9;k++){const x=-25000+k*5900,y=-1200;for(const side of[-1,1]){const h=(14500-Math.abs(x)*.23)*side;ctx.lineWidth=125;ctx.strokeStyle='#a8be7c';ctx.beginPath();ctx.moveTo(x,y);ctx.bezierCurveTo(x+3500,y+h*.15,x+6500,y+h*.8,x+8500,y+h);ctx.stroke();for(let n=1;n<4;n++){ctx.lineWidth=55;ctx.globalAlpha=.5;ctx.beginPath();const xx=x+n*1600,yy=y+h*n/5;ctx.moveTo(xx,yy);ctx.quadraticCurveTo(xx+2800,yy+side*1800,xx+4200,yy+side*2200);ctx.stroke();ctx.globalAlpha=1}}}ctx.restore();
}
function stoma(x,y,scale,seed=0,main=false){
 ctx.save();ctx.translate(x,y);if(!main)ctx.rotate((random(seed,5)-.5)*1.2);
 // Two kidney-shaped guard cells frame the pore; surface geometry is illustrative.
 ctx.fillStyle='#547348';ctx.beginPath();ctx.ellipse(0,0,6.5,14.5,0,0,Math.PI*2);ctx.fill();
 for(const side of[1,-1]){ctx.save();ctx.scale(side,1);const g=ctx.createLinearGradient(-14,-2,-1,2);g.addColorStop(0,'#b8cf77');g.addColorStop(.45,'#91b75e');g.addColorStop(1,'#477e46');ctx.fillStyle=g;ctx.fill(leftGuard);ctx.strokeStyle='#355e37';ctx.lineWidth=.55;ctx.stroke(leftGuard);
  if(scale>.8){const alpha=smooth((scale-.8)/2);ctx.globalAlpha=alpha;for(const [u,v,r]of[[-7,-10,1.15],[-10,-5,1.05],[-10,1,1.1],[-8.7,7,1.1],[-5.4,11,.85]]){ctx.fillStyle='#477c3f';ctx.beginPath();ctx.ellipse(u,v,r*.7,r, -.35,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#d6e6a4';ctx.lineWidth=.18;ctx.stroke()}ctx.globalAlpha=1}
  ctx.restore();}
 ctx.restore();
}
function epidermis(cam){const alpha=smooth((Math.log(7000)-Math.log(cam.width))/Math.log(3.5));if(alpha<=0)return;
 ctx.save();ctx.globalAlpha=alpha;ctx.translate(FOCUS.x,FOCUS.y);
 const halfW=cam.width/2,halfH=V.h/cam.scale/2,cx=cam.cx-FOCUS.x,cy=cam.cy-FOCUS.y;
 const i0=Math.floor((cx-halfW)/52)-2,i1=Math.ceil((cx+halfW)/52)+2,j0=Math.floor((cy-halfH)/45)-2,j1=Math.ceil((cy+halfH)/45)+2;
 for(let j=j0;j<=j1;j++)for(let i=i0;i<=i1;i++){const c=cell(i,j),v=random(i,j,2);ctx.fillStyle=`hsl(${83+v*12} ${25+v*9}% ${78+v*8}%)`;ctx.fill(c.path);ctx.strokeStyle='#7f9b68';ctx.lineWidth=Math.max(.7,.8/cam.scale);ctx.stroke(c.border);
  if(cam.scale>.8&&!(i===0&&j===0)){const a=clamp((cam.scale-.8)/2);ctx.globalAlpha=alpha*a*.38;ctx.fillStyle='#9bac7a';ctx.beginPath();ctx.ellipse(c.p.x+5,c.p.y-5,3.5,2.5,.3,0,Math.PI*2);ctx.fill();ctx.globalAlpha=alpha}
 }
 // Widely separated illustrative stomata; the selected one stays at world FOCUS.
 for(let j=Math.floor(j0/5)-1;j<=Math.ceil(j1/5)+1;j++)for(let i=Math.floor(i0/5)-1;i<=Math.ceil(i1/5)+1;i++){const p=site(i*5,j*5);const x=i===0&&j===0?0:p.x,y=i===0&&j===0?0:p.y;stoma(x,y,cam.scale,i+j*73,i===0&&j===0)}
 ctx.restore();
}

return {draw(cam){leafDrawing();ctx.save();ctx.clip(leaf);epidermis(cam);ctx.restore()},overview(){leafDrawing(true)},bounds:{cx:0,cy:0,width:85000,height:38000}};
};
