const path = d => new Path2D(d);
const soft = (p,c) => cut(p,c,{edge:"#d9ccbe",width:2,shadow:4});
function jointArm(sx,sy,ex,ey,hx,hy,colors){
  const outer=colors.dark,light=colors.light;
  function bone(x1,y1,x2,y2,breadth,fill){
    const len=Math.hypot(x2-x1,y2-y1);
    at(x1,y1,Math.atan2(y2-y1,x2-x1)*180/Math.PI,()=>{
      cut(rough([[-5,-breadth*.68],[7,-breadth],[len-6,-breadth*.70],[len+4,-6],
        [len+2,breadth*.65],[5,breadth],[-6,breadth*.56]],619,12,.8),fill,{width:2.5,shadow:4});
      line([[12,-breadth*.48],[len-10,-breadth*.37]],colors.rim,2);
    });
  }
  bone(sx,sy,ex,ey,24,outer);bone(ex,ey,hx,hy,19,light);
  rivet(sx,sy,9);rivet(ex,ey,8);rivet(hx,hy,5);
  at(hx,hy,-10,()=>{
    cut(poly([[-12,-13],[8,-13],[8,-18],[23,-18],[23,-10],[13,-6],[11,4],[23,4],[23,12],[7,16],[-12,10]]),light,{width:2,shadow:2.5});
  });
}
function robotPuppet(t,arm,colors,tilt=0){
  at(0,0,tilt,()=>{
    for(const [px,rot] of [[-55,3],[58,-3]])at(px,-74,rot,()=>{
      cut(poly([[-17,-18],[18,-18],[19,48],[-19,47]]),colors.dark,{width:2.5,shadow:4});
      for(let yy=-4;yy<33;yy+=12)line([[-15,yy],[15,yy+1]],colors.rim,3);
      cut(poly([[-32,43],[25,43],[25,50],[34,50],[34,72],[-40,72],[-40,53],[-32,53]]),colors.dark,{width:3,shadow:4});
    });
    const body=rough([[-84,-252],[74,-250],[91,-231],[84,-92],[62,-78],[-77,-81],[-92,-105]],438,12,1);
    cut(body,colors.base);cut(poly([[-54,-221],[48,-220],[56,-206],[52,-139],[-51,-137],[-59,-150]]),colors.dark,{edge:colors.rim,width:3,shadow:2});
    for(let i=0;i<4;i++)line([[-43+i*21,-210],[-42+i*21,-151]],colors.light,1.2);
    line([[-40,-158],[-24,-190],[-4,-171],[16,-195],[38,-160],[-40,-158]],"#a6d1c8",4);
    rivet(-76,-113,5);rivet(70,-110,5);
    const nod=1.7*Math.sin(t*2);
    at(0,-271,nod,()=>{
      cut(poly([[-8,-123],[7,-123],[6,-167],[-6,-168]]),C.butter,{width:2,shadow:4});
      cut(poly([[-15,-169],[0,-185],[17,-169],[1,-153]]),C.yellow,{width:2,shadow:4});
      const shell=rough([[-105,-105],[-91,-105],[-91,-124],[-58,-124],[-58,-134],[71,-134],[71,-119],[93,-119],[93,-103],
        [106,-103],[106,-24],[95,-24],[95,-4],[77,-4],[77,9],[-77,9],[-77,0],[-94,0],[-94,-16],[-105,-16]],128,13,1);
      cut(shell,colors.light);cut(poly([[-81,-95],[78,-95],[88,-84],[87,-26],[72,-17],[-76,-18],[-87,-28],[-87,-82]]),C.ink,{edge:"#efb99d",width:2.6,shadow:2});
      for(const ex of [-45,43]){
        const wink=Math.abs((t%3.2)-2.9)<.11;
        if(wink)line([[ex-16,-53],[ex+14,-52]],C.paper,6);
        else{ink(poly([[ex-15,-68],[ex+12,-68],[ex+16,-62],[ex+15,-44],[ex-16,-44]]),paper("#b6dad2"));
          ink(rect(ex+(t%4>2?1:-7),-63,10,15),C.ink);}
      }
      line([[-18,-7],[-5,-3],[12,-9]],colors.dark,3);rivet(-91,-58,4);rivet(92,-60,4);
    });
    jointArm(-85,-219,-119,-173,-93,-135,colors);
    const [hx,hy]=arm;
    jointArm(84,-218,(84+hx)*.5+23,(-218+hy)*.5+18,hx,hy,colors);
  });
}
function personPuppet(t,walk,hand,coat){
  at(0,0,0,()=>{
    const step=walk?[-1,-.32,.68,1,.32,-.68][Math.floor(t*9)%6]*walk:0;
    for(const [i,bias] of [[-1,1],[1,-1]]){
      const knee=i*13+bias*step*11,foot=i*16+bias*step*25;
      line([[i*10,-64],[knee,-36],[foot,-8]],"#cfc4ac",10);
      cut(poly([[foot-8,-12],[foot+10,-12],[foot+20,-5],[foot+20,0],[foot-9,0]]),C.ink,{width:1.8,shadow:2});
    }
    cut(poly([[-43,-105],[-32,-117],[-19,-115],[-19,-59],[-46,-53],[-53,-66]]),"#768c8d",{width:2,shadow:3});
    cut(poly([[-28,-111],[-10,-123],[17,-119],[31,-101],[24,-58],[-28,-58],[-34,-69]]),
      coat,{edge:"#f2dbac",width:2.5,shadow:4});
    line([[-19,-110],[-5,-61]],"#81624d",5);
    cut(path("M-20 -160 Q0 -176 19 -157 L22 -145 L28 -140 L24 -135 L20 -135 L15 -121 L-4 -119 L-21 -136 Z"),
      "#e1b18a",{width:2,shadow:3});
    cut(poly([[-29,-151],[-29,-161],[-18,-173],[9,-175],[21,-167],[23,-159],[38,-158],[39,-152]]),
      "#73a6a6",{edge:"#cbdddd",width:2,shadow:2});
    ink(rect(13,-148,4,5),C.ink);
    cut(poly([[-19,-124],[15,-126],[21,-118],[7,-111],[-7,-114],[-20,-120]]),"#74a8a7",{width:1.8,shadow:2});
    const hx=hand?hand[0]:32+step*11,hy=hand?hand[1]:-76;
    const ex=(10+hx)*.5+9,ey=(-104+hy)*.5+11;
    line([[12,-104],[ex,ey],[hx,hy]],"#99734e",13);line([[13,-106],[ex,ey-3],[hx,hy-3]],"#d6b482",8);
    soft(disk(hx,hy,6.5),"#edbd94");
  });
}

function palmTool(x,y,tilt,scale=1,shade=false){
  at(x,y,tilt,()=>{
    const offscreen=-2*Math.hypot(W,H);
    const sleeveShape=rough([[offscreen,55],[-149,31],[-127,99],[-182,126],[offscreen,163]],509,13,1.8);
    cut(sleeveShape,shade?"#35303b":C.vermilion,{edge:shade?"#a49ba3":"#e6a384",width:3,shadow:7});
    cut(poly([[-187,34],[-138,23],[-118,94],[-165,111]]),shade?"#5b5361":C.rust,{width:2.4,shadow:4});
    const h=path("M-148 38 L-120 25 Q-96 1 -73 -6 L-14 -14 Q5 -17 6 -7 Q7 -1 -2 2 L-54 20 L-71 33 L-45 29 Q-34 24 -27 29 L-27 38 L-37 48 L-40 61 L-59 80 L-79 89 L-100 86 L-131 99 Z");
    cut(h,shade?"#403946":C.skin,{edge:shade?"#c4babd":"#f2d8b4",width:3.4,shadow:7});
    line([[-104,52],[-89,41],[-77,38]],shade?"#796f80":"#b88d6b",2.5);
    line([[-21,-7],[-12,-8],[-7,-8]],shade?"#8b8194":"#f5d4ac",2.5);
  },scale);
}
