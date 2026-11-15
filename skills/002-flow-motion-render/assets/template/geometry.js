/* Pure path diagnostics; geometry is in logical SVG pixels. */
(() => {
 const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y),cross=(a,b)=>a.x*b.y-a.y*b.x,sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
 function overlap(a,b,c,d,tolerance=7){
  const u=sub(b,a),v=sub(d,c),lu=dist(a,b),lv=dist(c,d);if(lu<.01||lv<.01)return 0;
  if(Math.abs(cross(u,v))/(lu*lv)>.08)return 0;
  if(Math.abs(cross(u,sub(c,a)))/lu>tolerance||Math.abs(cross(u,sub(d,a)))/lu>tolerance)return 0;
  const proj=p=>((p.x-a.x)*u.x+(p.y-a.y)*u.y)/lu,x=proj(c),y=proj(d);
  return Math.max(0,Math.min(lu,Math.max(x,y))-Math.max(0,Math.min(x,y)));
 }
 function intersection(a,b,c,d){
  const u=sub(b,a),v=sub(d,c),den=cross(u,v);if(Math.abs(den)<1e-8)return null;
  const w=sub(c,a),t=cross(w,v)/den,s=cross(w,u)/den;
  return t>=-1e-8&&t<=1+1e-8&&s>=-1e-8&&s<=1+1e-8?{x:a.x+t*u.x,y:a.y+t*u.y}:null;
 }
 function compare(a,b,same=false){
  let length=0;const intersections=[],shared=[a[0],a.at(-1)].filter(p=>dist(p,b[0])<1||dist(p,b.at(-1))<1);
  for(let i=0;i<a.length-1;i++)for(let j=same?i+3:0;j<b.length-1;j++){
   length+=overlap(a[i],a[i+1],b[j],b[j+1]);
   const p=intersection(a[i],a[i+1],b[j],b[j+1]);
   if(p&&!shared.some(q=>dist(p,q)<18)&&!intersections.some(q=>dist(p,q)<12))intersections.push(p);
  }
  return {overlap:length,intersections};
 }
 const rectHit=(a,b,p=0)=>a.x-p<b.x+b.width&&a.x+a.width+p>b.x&&a.y-p<b.y+b.height&&a.y+a.height+p>b.y;
 const pointIn=(p,b,pad=0)=>p.x>=b.x-pad&&p.x<=b.x+b.width+pad&&p.y>=b.y-pad&&p.y<=b.y+b.height+pad;
 globalThis.FlowGeometry={compare,rectHit,pointIn};
})();
