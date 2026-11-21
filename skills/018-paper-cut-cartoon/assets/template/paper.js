// Seeded cut-paper materials, transforms and brass joint fasteners.
const C = {
  night:"#17141a", charcoal:"#242029", ink:"#29202c", paper:"#f4efe6",
  butter:"#e9d9b4", mauve:"#6b5b8e", iris:"#a79ac4", violet:"#554668",
  deep:"#3d354b", lilac:"#c3b6d3", vermilion:"#e64a3c", rust:"#ad382e",
  yellow:"#f2c94c", gold:"#d59a39", blue:"#57b8c4", skin:"#e8bc8b"
};
const radians = degrees => degrees*Math.PI/180;
const clamp = (v,min,max) => Math.max(min,Math.min(max,v));
const tick = time => Math.floor(time*12+1e-7)/12;
function rng(seed) {
  let n=seed>>>0;
  return ()=>{ n=(Math.imul(1664525,n)+1013904223)>>>0; return n/4294967296; };
}
function pose(t, keys) {
  if(t<=keys[0][0]) return keys[0].slice(1);
  for(let i=1;i<keys.length;i++){
    if(t<=keys[i][0]){
      const a=keys[i-1], b=keys[i], f=(t-a[0])/(b[0]-a[0]);
      return b.slice(1).map((v,j)=>a[j+1]+(v-a[j+1])*f);
    }
  }
  return keys[keys.length-1].slice(1);
}
function at(x,y,rotation,draw,sx=1,sy=sx){
  g.save(); g.translate(x,y); g.rotate(radians(rotation)); g.scale(sx,sy); draw(); g.restore();
}
function poly(points){
  const p=new Path2D(); p.moveTo(points[0][0],points[0][1]);
  for(const pt of points.slice(1))p.lineTo(pt[0],pt[1]);
  p.closePath(); return p;
}
const rect = (x,y,w,h)=>poly([[x,y],[x+w,y],[x+w,y+h],[x,y+h]]);
function disk(x,y,r){const p=new Path2D();p.arc(x,y,r,0,Math.PI*2);return p;}
function rough(points,seed,spacing=17,amp=1.6){
  const random=rng(seed), edges=[];
  points.forEach((a,i)=>{
    const b=points[(i+1)%points.length], dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);
    const n=Math.max(1,Math.floor(len/spacing));
    edges.push(a);
    for(let j=1;j<n;j++){
      const k=(j+(random()-.5)*.52)/n, d=(random()-.5)*2*amp;
      edges.push([a[0]+dx*k-dy/len*d,a[1]+dy*k+dx/len*d]);
    }
  });
  return poly(edges);
}
function strip(x,y,w,h,seed=1,rag=2.2){
  return rough([[x+3,y],[x+w-6,y+1],[x+w,y+6],[x+w-3,y+h-4],
    [x+w-9,y+h],[x,y+h-1],[x+3,y+h-10],[x-2,y+6]],seed,9,rag);
}
const materials=new Map();
function paper(color) {
  if(materials.has(color))return materials.get(color);
  const size=256, tile=document.createElement("canvas"); tile.width=tile.height=size;
  const p=tile.getContext("2d"), rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
  const random=rng(parseInt(color.slice(1),16)), img=p.createImageData(size,size);
  for(let i=0;i<img.data.length;i+=4){
    const value=(random()+random()+random()-1.5)*14;
    for(let c=0;c<3;c++)img.data[i+c]=rgb[c]+value;
    img.data[i+3]=255;
  }
  p.putImageData(img,0,0);
  for(let i=0;i<720;i++){
    const x=random()*size,y=random()*size,ang=random()*Math.PI, len=1+random()**2*16;
    p.strokeStyle=i%3?"rgba(255,246,224,.135)":"rgba(48,31,37,.19)";
    p.lineWidth=.4+random()*.8;
    p.beginPath();p.moveTo(x,y);p.quadraticCurveTo(x+len*.45*Math.cos(ang)+1,y+len*.45*Math.sin(ang),
        x+len*Math.cos(ang),y+len*Math.sin(ang));p.stroke();
  }
  const pattern=g.createPattern(tile,"repeat");materials.set(color,pattern);return pattern;
}
function cut(p,color,{edge="rgba(246,236,217,.88)",width=3,shadow=7}={}){
  if(shadow){g.save();g.translate(shadow,shadow);g.fillStyle="rgba(8,6,11,.42)";g.fill(p);g.restore();}
  g.fillStyle=paper(color);g.fill(p);
  if(width){g.strokeStyle=edge;g.lineWidth=width;g.lineJoin="round";g.stroke(p);}
}
function ink(p,color){g.fillStyle=color;g.fill(p);}
function line(points,color,width=3){
  g.beginPath();g.moveTo(points[0][0],points[0][1]);
  for(const pt of points.slice(1))g.lineTo(pt[0],pt[1]);
  g.lineJoin="round";g.lineCap="round";g.strokeStyle=color;g.lineWidth=width;g.stroke();
}
const face = '"PaperBody","MiSans","Noto Sans SC","Microsoft YaHei",sans-serif';
function type(text,x,y,size,weight,color,align="left",family=face){
  g.font=weight+" "+size+"px "+family;g.textAlign=align;g.textBaseline="alphabetic";
  g.fillStyle=color;g.fillText(text,x,y);
}
function rivet(x,y,r=9){
  ink(disk(x+2,y+3,r+1),C.ink);ink(disk(x,y,r),paper("#d9b873"));
  ink(disk(x-1,y-1,r*.55),paper("#eed8a4"));
  line([[x-r*.38,y+r*.22],[x+r*.37,y-r*.30]],"#775b45",1.7);
}
