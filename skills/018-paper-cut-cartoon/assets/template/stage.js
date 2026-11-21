"use strict";
const film = JSON.parse(document.getElementById("film").textContent);
const canvas = document.getElementById("stage");
const portrait = film.format === "portrait";
const W = canvas.width = portrait ? 1080 : 1920;
const H = canvas.height = portrait ? 1920 : 1080;
let g = canvas.getContext("2d", {alpha:false});
const FPS = 30;
const fpsFrames = s => Math.round(s * FPS);
const backgrounds = new Map();
const shapes = new Map();
const poses = ["x","y","scale","angle","handX","handY","walk"];
const fits = new Map();

function tone(base, fraction, other) {
  const rgb = [1,3,5].map(i => {
    const a = parseInt(base.slice(i,i+2),16), b = parseInt(other.slice(i,i+2),16);
    return Math.round(a + (b-a)*fraction).toString(16).padStart(2,"0");
  });
  return "#" + rgb.join("");
}
function puppetColors(color) {
  if (color === "#e64a3c") return {base:color,dark:"#ad382e",light:"#df6452",rim:"#f2b299"};
  return {base:color,dark:tone(color,.27,"#29202c"),light:tone(color,.19,"#f4efe6"),rim:tone(color,.55,"#f4efe6")};
}
function newSheet() {
  const sheet=document.createElement("canvas"); sheet.width=W; sheet.height=H;
  return sheet;
}
function drawGround(color) {
  if (!backgrounds.has(color)) {
    const sheet = newSheet(), main=g;
    g=sheet.getContext("2d",{alpha:false});
    g.fillStyle=paper(color); g.fillRect(0,0,W,H);
    const panel=tone(color,.105,"#b6a5a2"), seam=tone(color,.29,"#b6a5a2");
    cut(rough([[W*.7,-10],[W+10,-10],[W+10,H*.64],[W*.89,H*.44]],835,13,2.1),
        panel,{edge:seam,width:1.5,shadow:4});
    const floor=rough([[-10,H*.757],[W*.18,H*.749],[W*.37,H*.758],[W*.58,H*.745],
      [W*.84,H*.751],[W+10,H*.743],[W+10,H+10],[-10,H+10]],52,14,2.3);
    cut(floor,panel,{edge:seam,width:2.2,shadow:0});
    g=main; backgrounds.set(color,sheet);
  }
  g.drawImage(backgrounds.get(color),0,0);
}
function fitLabel(text,size,maxWidth) {
  g.font="800 "+size+"px "+face;
  const actual=g.measureText(text).width;
  return actual>maxWidth ? size*maxWidth/actual : size;
}
function label(node) {
  const size=fitLabel(node.text,node.fontSize||48,(node.maxWidth||.67)*W);
  g.font="800 "+size+"px "+face;
  const w=g.measureText(node.text).width+size*1.25, h=size*1.62;
  cut(strip(-w/2,-h/2,w,h,217,1.8),node.color||C.yellow,{width:2.1,shadow:5});
  if(node.enter==="stamp"){
    g.strokeStyle=C.ink; g.lineWidth=1.8;
    g.strokeRect(-w/2+7,-h/2+6,w-14,h-12);
  }
  type(node.text,0,size*.33,size,800,C.ink,"center");
}
function swapSticker(node,t) {
  const impact=node.impact??1.55, age=t-impact;
  const size=node.fontSize||54, max=(node.maxWidth||.57)*W;
  const fontSize=Math.min(fitLabel(node.before,size,max),fitLabel(node.after,size,max));
  g.font="800 "+fontSize+"px "+face;
  const w=Math.max(g.measureText(node.before).width,g.measureText(node.after).width)+fontSize*1.45;
  const h=fontSize*1.72;
  cut(strip(-w*.55,-h*.63,w*1.10,h*1.26,732),C.mauve,{edge:"#bbadbf",width:2,shadow:6});
  function sticker(word,c,x,y,a,fold){
    at(x,y,a,()=>{
      cut(strip(-w/2,-h/2,w,h,391),c,{width:2.5,shadow:5});
      type(word,0,fontSize*.34,fontSize,800,C.ink,"center");
      if(fold>0){
        cut(poly([[w/2,h/2],[w/2-h*.48*fold,h/2],[w/2,h/2-h*.44*fold]]),
          "#ded1b8",{edge:"#c7b99f",width:1,shadow:1});
      }
    });
  }
  // Both the sticker and the hand follow the same contact point during pickup.
  const old=pose(age,[[-1,0,0,0,0],[-.68,0,0,0,1],[-.49,-w*.12,-17,-12,1],
    [-.31,-w*.58,-68,-24,1],[-.20,-w*1.25,-145,-40,1]]);
  if(age<-.20)sticker(node.before,node.oldColor||C.paper,...old);
  const fresh=pose(age,[[-.25,-w*.25,-107,-13],[-.16,-w*.12,-71,-8],
    [0,2,4,2],[.083,-2,-1,-1],[.167,0,0,0]]);
  if(age>=-.25)sticker(node.after,node.color||C.yellow,...fresh,0);
  if(age>-1.12 && age<.42){
    const hand=pose(age,[[-1.12,-W*.7,-95,-18],[-.76,w*.42,-8,0],[-.66,w*.43,1,0],
      [-.49,w*.30,-18,-9],[-.31,-w*.18,-77,-18],[-.25,-w*.66,-134,-20],
      [-.16,-w*.23,-76,-6],[0,-w*.10,0,3],[.13,-w*.13,3,1],[.42,-W*.75,-110,-12]]);
    palmTool(hand[0],hand[1],hand[2],.62);
  }
}
function caption(text) {
  if (!text) return;
  const available=W*(portrait?.73:.84);
  const key=String(available)+text;
  let layout=fits.get(key);
  if(!layout){
    const size=portrait?48:44;
    g.font="600 "+size+"px "+face;
    const lines=[];
    for(const paragraph of text.split("\n")){
      let lineText="";
      for(const c of paragraph){
        if(lineText && g.measureText(lineText+c).width>available){
          lines.push(lineText);lineText="";
        }
        lineText+=c;
      }
      lines.push(lineText);
    }
    const width=Math.max(...lines.map(v=>g.measureText(v).width))+size*1.85;
    layout={lines,width,size,height:size*(lines.length*1.25+.58)};fits.set(key,layout);
  }
  const {lines,width,size,height}=layout;
  const bottom=portrait?H-397:H*.903;
  const cx=portrait?W*.475:W*.5;
  at(cx,bottom-height/2,-.35,()=>{
    const w=width/2,h=height/2;
    const edge=[[-w+4,-h],[w-7,-h],[w,-h+7],[w-5,-h*.64],[w+1,-h*.34],[w-4,-2],[w+1,h*.24],[w-5,h*.52],[w,h*.79],[w-5,h],
      [-w+1,h],[-w-3,h*.73],[-w+3,h*.53],[-w-4,h*.24],[-w+2,-2],[-w-3,-h*.32],[-w+2,-h*.67]];
    cut(rough(edge,62,14,1.3),C.paper,{edge:"#d4c9b7",width:1.8,shadow:6});
    lines.forEach((s,i)=>type(s,0,(i-(lines.length-1)/2)*size*1.25+size*.34,size,600,C.ink,"center"));
  });
}
function propertyAt(value, keys, prop, t) {
  let start=0;
  for (const k of keys) {
    if (!(prop in k)) continue;
    if (t < k.t) return value+(k[prop]-value)*(t-start)/(k.t-start);
    value=k[prop]; start=k.t;
  }
  return value;
}
function drawProp(name) {
  if(!shapes.has(name)){
    shapes.set(name,film.props[name].map(layer=>({...layer,shape:new Path2D(layer.d)})));
  }
  for(const layer of shapes.get(name)){
    if(layer.fill) cut(layer.shape,layer.fill,{edge:layer.edge||"#ede2cd",width:layer.outline??2.5,shadow:layer.shadow??5});
    if(layer.stroke){
      g.strokeStyle=layer.stroke;g.lineWidth=layer.weight??3;g.lineCap="round";g.lineJoin="round";g.stroke(layer.shape);
    }
  }
}
function position(node,t,anchors) {
  const person=node.type==="person";
  const initial={x:node.at?.[0]??.5,y:node.at?.[1]??.7,angle:node.angle??0,scale:node.scale??1,
    handX:node.hand?.[0]??(person?35:114),handY:node.hand?.[1]??(person?-76:-144),walk:node.walk??0};
  for(const prop of poses) initial[prop]=propertyAt(initial[prop],node.keys||[],prop,t);
  let {x,y,scale,angle,handX,handY,walk}=initial;
  x*=W; y*=H;
  if (node.attach) {
    const parent=anchors.get(node.attach.to);
    if (!parent) return null;
    const target=node.attach.point==="hand"?parent.hand:[0,0];
    const [dx,dy]=node.attach.offset||[0,0];
    const point=parent.matrix.transformPoint({x:target[0]+dx,y:target[1]+dy});
    x=point.x;y=point.y;
  }
  const age=t-(node.start||0);
  if(age<0 || (node.end!=null && t>=node.end)) return null;
  if(node.enter==="drop"||node.enter==="stamp"){
    const [lift,bounce]=pose(age,[[0,-76,.94],[.083,-39,1.03],[.167,3,1.01],[.25,-2,.99],[.333,0,1]]);
    y+=lift;scale*=bounce;
  }
  const matrix=new DOMMatrix().translate(x,y).rotate(angle).scale(node.facing==="left"?-scale:scale,scale);
  return {matrix,hand:[handX,handY],walk};
}
function paintScene(scene,frame) {
  drawGround(scene.background||film.background||C.night);
  const t=tick(frame/FPS), anchors=new Map();
  const shake=rng(73*scene.index+Math.floor(t*2));
  g.save();g.translate((shake()-.5)*1.6,(shake()-.5)*1.6);
  for(const node of scene.layers){
    const p=position(node,t,anchors);
    if(!p) continue;
    if(node.id) anchors.set(node.id,p);
    const m=p.matrix;g.save();g.transform(m.a,m.b,m.c,m.d,m.e,m.f);
    switch(node.type){
      case "robot": robotPuppet(t,p.hand,puppetColors(node.color||C.vermilion)); break;
      case "person": personPuppet(t,p.walk,p.hand,node.color||"#d3ab70"); break;
      case "prop": drawProp(node.prop); break;
      case "label": label(node); break;
      case "swap": swapSticker(node,t); break;
    }
    g.restore();
  }
  g.restore();
}
function turnPage(sheet,p) {
  if(p<=0){g.drawImage(sheet,0,0);return;}
  const end=W*1.19-W*1.42*p;
  const edge=[[-.004,0],[.004,.105],[-.017,.201],[-.027,.297],[-.041,.359],[-.045,.413],
    [-.064,.516],[-.071,.584],[-.091,.687],[-.096,.741],[-.11,.826],[-.117,.88],[-.131,1.02]]
    .map(([x,y])=>[end+x*W,y*H-4]);
  const shiftX=-W*.048*p, shiftY=-H*.015*p;
  g.save();g.clip(poly([[-4,-4],...edge,[-4,H+4]]));
  g.drawImage(sheet,shiftX,shiftY,W-shiftX,H-shiftY);g.restore();
  const folded=edge.map(([x,y])=>[x+9+15*Math.sin(p*Math.PI),y+2]).reverse();
  cut(rough([...edge,...folded],270,13,1.4),"#c7b6a3",{edge:"#ded3bf",width:1.4,shadow:3});
}
let total=0, previousSheet=null, previousIndex=-1;
const scenes=film.scenes.map((s,index)=>{
  const first=total, frames=fpsFrames(s.duration);total+=frames;
  return {...s,index,first,frames,layers:s.layers.map(n=>portrait?{...n,...n.portrait}:n)};
});
function seek(seconds) {
  const frame=clamp(Math.floor(seconds*FPS+1e-6),0,total-1);
  const scene=scenes.find(s=>frame<s.first+s.frames);
  const local=frame-scene.first;
  paintScene(scene,local);
  if(scene.index>0 && scene.transition==="peel" && local<13){
    if(previousIndex!==scene.index-1){
      const prev=scenes[scene.index-1],main=g; previousSheet=newSheet();
      g=previousSheet.getContext("2d",{alpha:false});paintScene(prev,prev.frames-1);g=main;
      previousIndex=prev.index;
    }
    const step=Math.min(5,Math.floor(local*12/FPS));
    turnPage(previousSheet,[0,.1,.36,.67,.94,1][step]);
  }
  const cue=(scene.captions||[]).filter(c=>c[0]<=local/FPS+1e-8).at(-1);
  if(cue)caption(cue[1]);
  return scene.index+"|"+Math.floor(local*12/FPS)+"|"+(cue?.[0]??-1);
}
window.__dur=total/FPS;
window.__seek=seek;
window.__ready=document.fonts.load("600 44px PaperBody").then(()=>{fits.clear();seek(0);});
if(!new URLSearchParams(location.search).has("cap")){
  window.__ready.then(()=>{
    let base=null;
    function play(ms){
      if(base===null)base=ms;
      seek(((ms-base)/1000)%window.__dur);
      requestAnimationFrame(play);
    }
    requestAnimationFrame(play);
  });
}
