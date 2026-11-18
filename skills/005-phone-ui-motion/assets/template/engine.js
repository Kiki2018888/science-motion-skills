/* Six app-specific layouts, one deterministic device and timeline. */
(() => {
const c=window.PHONE_CONFIG,$=s=>document.querySelector(s),cv=$('#film'),DPR=devicePixelRatio||1,U=756,H=c.screen.height,V=c.screen.visibleHeight??H,cropped=c.display.framing==='top';
let ctx=cv.getContext('2d',{willReadFrequently:true});cv.width=c.width*DPR;cv.height=c.height*DPR;
const presets={
 claude:{bg:'#faf9f5',ink:'#302e2a',muted:'#8b8881',accent:'#d97757',user:'#edeae2',answer:null,input:'#ffffff',composer:172,round:25,header:'center',font:'Georgia'},
 wechat:{bg:'#ededed',ink:'#171717',muted:'#858585',accent:'#07c160',user:'#95ec69',answer:'#ffffff',input:'#ffffff',composer:86,round:8,header:'contact',font:'Body'},
 chatgpt:{bg:'#ffffff',ink:'#171717',muted:'#858585',accent:'#171717',user:'#f0f0f0',answer:null,input:'#f2f2f2',composer:123,round:38,header:'left',font:'Arial'},
 gemini:{bg:'#f7f9ff',ink:'#263449',muted:'#7a8492',accent:'#527bd4',user:'#e7edfa',answer:'#edf2fd',input:'#e8edf7',composer:145,round:28,header:'center',font:'Arial'},
 deepseek:{bg:'#ffffff',ink:'#242832',muted:'#7d8698',accent:'#4668e7',user:'#edf1ff',answer:null,input:'#f6f7fb',composer:172,round:24,header:'center',font:'Arial'},
 kimi:{bg:'#17191e',ink:'#f1f3f6',muted:'#949ba7',accent:'#8bedd0',user:'#30343e',answer:null,input:'#242832',composer:164,round:25,header:'left',font:'Arial'}
};const theme={...presets[c.theme],...c.style.palette};if(c.style.accent)theme.accent=c.style.accent;if(c.style.chatBackground)theme.bg=c.style.chatBackground;
const F=c.style.fontSize,LH=F*c.style.lineHeight,clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>1-(1-clamp(x))**3,smooth=x=>{x=clamp(x);return x*x*(3-2*x)};
const cap=new URLSearchParams(location.search).has('cap');if(cap)document.body.classList.add('cap');
let current=0,playing=!cap,last=0,layouts=[],assets={},issues=new Set(),baseCache,wallCache;
function rr(x,y,w,h,r,fill,stroke){ctx.beginPath();ctx.roundRect(x,y,w,h,r);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=1.5;ctx.stroke();}}
function text(s,x,y,size=F,color=theme.ink,weight=400,align='left',font='Body',max=Infinity){ctx.font=`${weight} ${size}px ${font}`;const n=ctx.measureText(s).width;if(n>max){size*=max/n;ctx.font=`${weight} ${size}px ${font}`;if(size<16)issues.add('Text too long: '+s);}ctx.fillStyle=color;ctx.textAlign=align;ctx.textBaseline='alphabetic';ctx.fillText(s,x,y);}
function line(x1,y1,x2,y2,color=theme.muted,w=2){ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.strokeStyle=color;ctx.lineWidth=w;ctx.lineCap='round';ctx.stroke();}
function icon(kind,x,y,r=20,custom=null){if(custom&&assets[custom]){ctx.drawImage(assets[custom],x-r,y-r,2*r,2*r);return;}ctx.save();ctx.translate(x,y);ctx.fillStyle=presets[kind].accent;ctx.strokeStyle=presets[kind].accent;
 if(kind==='claude'){ctx.lineCap='round';ctx.lineWidth=r*.2;for(let i=0;i<12;i++){const a=i*Math.PI/6;ctx.beginPath();ctx.moveTo(Math.cos(a)*r*.25,Math.sin(a)*r*.25);ctx.lineTo(Math.cos(a)*r,Math.sin(a)*r);ctx.stroke();}}
 else if(kind==='gemini'){const g=ctx.createLinearGradient(-r,-r,r,r);g.addColorStop(0,'#448eff');g.addColorStop(.5,'#9b70cd');g.addColorStop(1,'#de7295');ctx.fillStyle=g;ctx.beginPath();ctx.moveTo(0,-r);ctx.quadraticCurveTo(r*.2,-r*.2,r,0);ctx.quadraticCurveTo(r*.2,r*.2,0,r);ctx.quadraticCurveTo(-r*.2,r*.2,-r,0);ctx.quadraticCurveTo(-r*.2,-r*.2,0,-r);ctx.fill();}
 else if(kind==='wechat'){ctx.fillStyle='#07c160';for(const [xx,yy,ss]of[[-r*.28,-r*.15,.75],[r*.33,r*.28,.65]]){ctx.beginPath();ctx.ellipse(xx,yy,r*ss,r*ss*.8,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(xx-r*ss*.5,yy+r*ss*.5);ctx.lineTo(xx-r*ss*.7,yy+r*ss);ctx.lineTo(xx,yy+r*ss*.65);ctx.fill();}ctx.fillStyle='#fff';for(const [xx,yy]of[[-.55,-.3],[-.15,-.3],[.2,.15],[.55,.15]]){ctx.beginPath();ctx.arc(xx*r,yy*r,r*.09,0,Math.PI*2);ctx.fill();}}
 else if(kind==='deepseek'){ctx.beginPath();ctx.ellipse(-r*.12,r*.12,r*.82,r*.55,-.1,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.moveTo(r*.4,r*.1);ctx.lineTo(r,-r*.55);ctx.lineTo(r*.9,r*.55);ctx.closePath();ctx.fill();ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(-r*.52,-r*.02,r*.09,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#4668e7';ctx.lineWidth=2;ctx.beginPath();ctx.arc(-r*.1,-r*.5,r*.3,Math.PI,Math.PI*2);ctx.stroke();}
 else if(kind==='kimi'){rr(-r,-r,2*r,2*r,r*.45,'#262d35');text('K',0,r*.55,r*1.65,'#a4f4dd',600,'center','Arial');}
 else {ctx.strokeStyle='#333b38';ctx.lineWidth=r*.22;for(let i=0;i<6;i++){ctx.save();ctx.rotate(i*Math.PI/3);ctx.beginPath();ctx.roundRect(-r*.4,-r*.95,r*.85,r*1.35,r*.35);ctx.stroke();ctx.restore();}}
 ctx.restore();}
function wrap(glyphs,width,size=F){ctx.font=`400 ${size}px Body`;const rows=[];let chars=[],start=0,count=0;for(const ch of glyphs){if(ch==='\n'){rows.push({text:chars.join(''),start,len:chars.length});count++;start=count;chars=[];continue;}if(chars.length&&ctx.measureText(chars.join('')+ch).width>width){rows.push({text:chars.join(''),start,len:chars.length});start=count;chars=[];}chars.push(ch);count++;}rows.push({text:chars.join(''),start,len:chars.length});return rows;}
function count(times,age){let n=0;while(n<times.length&&times[n]<=age+1e-9)n++;return n;}
function rowsDraw(rows,glyphs,n,x,y,size=F,lh=LH,color=theme.ink){for(let i=0;i<rows.length;i++){const r=rows[i],nn=Math.max(0,Math.min(r.len,n-r.start));text(glyphs.slice(r.start,r.start+nn).join(''),x,y+i*lh,size,color);} }
function build(){let y=0;layouts=c.messages.map((m,i)=>{const we=c.theme==='wechat',self=m.role==='user',boxed=self||we||c.theme==='gemini',max=we?510:self?595:664,rows=wrap(m.glyphs,max),brand=!self&&!we?52:0;
 const longest=Math.max(...rows.map(r=>{ctx.font=`400 ${F}px Body`;return ctx.measureText(r.text).width;}));const width=boxed?Math.min(max+40,longest+40):max;
 const h=rows.length*LH+(boxed?32:0)+brand+(!self&&!we?40:0),obj={m,index:i,y,h,rows,width,boxed,brand,self,we};y+=h+34;return obj;});
 for(const a of layouts)if(a.h>(cropped?V-bodyTop-48:H-400))issues.add('Message too tall; split at sentence boundaries: '+a.index);
 for(const n of c.notifications){n.rows=wrap(n.glyphs,652,29);n.cardHeight=Math.max(144,78+n.rows.length*41);if(n.cardHeight>(cropped?(n.kind==='lock'?V-510:V-130):H-640))issues.add('Notification too tall: '+n.text);}
}
function keyboardAmount(t){let amount=0;for(const m of c.messages){if(m.inputAt===undefined||!m.keyboard)continue;if(t>=m.inputAt&&t<m.at+.5)amount=Math.max(amount,ease((t-m.inputAt)/.25)*(1-ease((t-m.at)/.5)));}return amount;}
function composeY(t){return c.display.composer?V-59-theme.composer-440*keyboardAmount(t):V-24;}
const bodyTop=c.status.show?218:133;
function rawScroll(t){let bottom=0;for(const l of layouts){const m=l.m;if(t<m.at){if(m.thinkingAt!==undefined&&t>=m.thinkingAt)bottom=l.y+55;break;}const n=m.mode==='pop'?m.glyphs.length:count(m.reveal,t-m.at);const rowsShown=l.rows.filter(r=>n>r.start).length;bottom=l.y+(l.we||l.self?32:52)+Math.max(1,rowsShown)*LH+35;if(cropped&&n===m.glyphs.length)bottom=Math.max(bottom,l.y+l.h+12);}return Math.max(0,bottom-(composeY(t)-24-bodyTop));}
function scroll(t){let result=0;for(let i=0;i<9;i++)result+=rawScroll(Math.max(0,t-i*.025));return result/9;}
function status(color=theme.ink){if(!c.status.show)return;text(c.status.time,54,61,28,color,600,'left','Arial',165);ctx.fillStyle=color;const bh=[9,13,17,21];for(let i=0;i<4;i++)rr(604+i*10,66-bh[i],6.5,bh[i],3.2,color);const wx=668,wy=64;ctx.beginPath();ctx.arc(wx,wy,3.2,0,Math.PI*2);ctx.fill();ctx.strokeStyle=color;ctx.lineCap='round';ctx.lineWidth=3.4;for(const r of[8.5,14,19.5]){ctx.beginPath();ctx.arc(wx,wy,r,Math.PI*1.25,Math.PI*1.75);ctx.stroke();}rr(702,44,37,20,6,null,color);const bl=clamp(c.status.battery);if(bl>0)rr(705.5,47.5,30*bl,13,3.5,color);rr(741.5,50,4,8,2,color);}
function header(){const y=c.status.show?134:49;
 if(c.theme==='wechat'){line(34,y-8,22,y+4,theme.ink,3);line(22,y+4,34,y+16,theme.ink,3);text(c.app.title,378,y+16,34,theme.ink,500,'center','Body',540);text('⋯',708,y+16,39);line(0,y+55,U,y+55,'#d9d9d9',1);return;}
 line(42,y-8,70,y-8,theme.ink,2.6);line(42,y+2,61,y+2,theme.ink,2.6);
 if(theme.header==='center'){icon(c.theme,300,y-1,19,c.app.icon);text(c.app.title,333,y+13,37,theme.ink,400,'left',theme.font,280);}else{text(c.app.title,104,y+14,36,theme.ink,600,'left',theme.font,420);if(c.theme==='kimi')icon('kimi',U-100,y,19,c.app.icon);}
 rr(681,y-15,28,28,6,null,theme.ink);line(688,y+5,716,y-22,theme.ink,2.7);
}
function avatar(self,x,y){const p=self?c.app.userAvatar:c.app.assistantAvatar;rr(x,y,53,53,7,self?'#d0d9dc':'#d9dfd1');if(p&&assets[p])ctx.drawImage(assets[p],x,y,53,53);else text((self?c.app.userName:c.app.assistantName).slice(0,1),x+26.5,y+36,28,self?'#48636d':'#5e7152',500,'center');}
function chatMessages(t){const sy=scroll(t),bottom=composeY(t)-23;ctx.save();ctx.beginPath();ctx.rect(0,bodyTop,U,Math.max(0,bottom-bodyTop));ctx.clip();
 for(const l of layouts){const m=l.m,y=bodyTop+l.y-sy;if(t<m.at){if(m.thinkingAt!==undefined&&t>=m.thinkingAt){if(l.we)avatar(false,22,y);else icon(c.theme,49,y+22,20,c.app.icon);text(c.labels.thinking,l.we?92:84,y+33,26,theme.muted);for(let k=0;k<3;k++){ctx.globalAlpha=.35+.65*(.5+.5*Math.sin((t-m.thinkingAt)*6-k));rr((l.we?272:264)+k*14,y+23,6,6,3,theme.muted);}ctx.globalAlpha=1;}break;}
  const n=m.mode==='pop'?m.glyphs.length:count(m.reveal,t-m.at),age=t-m.at,p=ease(age/.48);let x=l.self?U-30-l.width:30;if(l.we)x=l.self?U-91-l.width:91;
  ctx.save();ctx.globalAlpha=clamp(age/.15);ctx.translate(0,14*(1-p));
  if(l.we)avatar(l.self,l.self?U-75:22,y+2);
  if(l.boxed){rr(x,y,l.width,l.h,theme.round,l.self?theme.user:theme.answer);if(l.we){ctx.beginPath();const xx=l.self?x+l.width:x;ctx.moveTo(xx,y+20);ctx.lineTo(xx+(l.self?8:-8),y+28);ctx.lineTo(xx,y+36);ctx.fillStyle=l.self?theme.user:theme.answer;ctx.fill();}}
  if(l.brand)icon(c.theme,x+20,y+21,19,c.app.icon);
  rowsDraw(l.rows,m.glyphs,n,x+(l.boxed?20:0),y+l.brand+(l.boxed?19:0)+F,F,LH);
  if(!l.self&&!l.we&&n===m.glyphs.length){const by=y+l.h-16;rr(x+4,by-18,17,21,3,null,theme.muted);rr(x+10,by-23,17,21,3,null,theme.muted);text('↻',x+66,by+1,28,theme.muted,400,'center');text('⋯',x+118,by,30,theme.muted,400,'center');}
  ctx.restore();
 }ctx.restore();}
const NIGHT=c.style&&c.style.appearance==='amber-night';
const KB=NIGHT
 ?{bg:'#1B1815',label:'#8C8378',key:'#2E2822',keyText:'#E8E2D8',fn:'#3A332B',fnText:'#CFC7BB',space:'#332C24',spaceText:'#A79C8E'}
 :{bg:'#d3d5da',label:'#61636a',key:'#fff',keyText:'#222',fn:'#b0b4bc',fnText:'#222',space:'#fff',spaceText:'#555'};
function keyboard(t){const k=keyboardAmount(t);if(k<=0)return;const y=H-440*k;ctx.fillStyle=KB.bg;ctx.fillRect(0,y,U,440);text('建议',60,y+35,22,KB.label);text('输入',U/2,y+35,22,KB.label,400,'center');text('文字',U-60,y+35,22,KB.label,400,'right');
 ['qwertyuiop','asdfghjkl','zxcvbnm'].forEach((row,j)=>{const kw=64,gap=9,start=U/2-(row.length*(kw+gap)-gap)/2;for(let i=0;i<row.length;i++){rr(start+i*(kw+gap),y+55+j*77,kw,65,8,KB.key);text(row[i],start+i*(kw+gap)+32,y+98+j*77,31,KB.keyText,400,'center','Arial');}});rr(24,y+297,90,61,9,KB.fn);text('123',69,y+338,24,KB.fnText,400,'center','Arial');rr(130,y+297,445,61,9,KB.space);text('空格',352,y+338,24,KB.spaceText,400,'center');rr(592,y+297,140,61,9,KB.fn);text('换行',662,y+338,24,KB.fnText,400,'center');}
function composer(t){const y=composeY(t),active=c.messages.find(m=>m.inputAt!==undefined&&t>=m.inputAt&&t<m.at),shown=active?active.glyphs.slice(0,count(active.inputReveal,t-active.inputAt)):[];
 if(c.theme==='wechat'){rr(0,y,U,theme.composer+60,0,'#f7f7f7','#d6d6d6');text('◉',35,y+52,30,theme.ink,400,'center');rr(66,y+12,U-190,58,9,'#fff');const rows=wrap(shown,U-220,29);rowsDraw(rows.slice(-1),shown,shown.length,80,y+51,29,39);if(active){rr(U-111,y+12,93,58,8,theme.accent);text(c.labels.send,U-65,y+50,25,'#fff',400,'center');}else{text('☺',U-91,y+52,32);text('+',U-35,y+52,33,theme.ink,400,'center','Arial');}return;}
 rr(28,y,U-56,theme.composer,theme.composer<150?38:28,theme.input,c.theme==='claude'?'#d8d4ca':null);
 const max=U-148,rows=wrap(shown,max,29),lastRows=rows.slice(-2),offset=(rows.length-lastRows.length)*42;
 if(shown.length)for(let i=0;i<lastRows.length;i++)text(lastRows[i].text,52,y+45+i*39,29);else text(c.labels.placeholder,52,y+48,29,theme.muted,400,'left','Body',U-160);
 const by=y+theme.composer-34;text('+',57,by+10,36,theme.muted,400,'center','Arial');
 if(c.theme==='claude'){rr(91,by-22,170,43,21,NIGHT?'#3A332B':'#eeece6');text(c.app.model||'Claude',112,by+7,22,NIGHT?'#D8D2C8':theme.ink,400,'left','Body',130);}
 if(c.theme==='deepseek'){rr(91,by-22,172,43,20,'#e8edff');text(c.app.model||'深度思考',112,by+7,22,theme.accent,400,'left','Body',145);text('联网搜索',284,by+7,22,theme.muted);}
 if(c.theme==='kimi'){text(c.app.model||'深度思考',100,by+7,22,theme.accent,400,'left','Body',300);}
 if(c.theme==='gemini')text(c.app.model||'工具',103,by+7,22,theme.muted,400,'left','Body',400);
 rr(U-92,by-26,50,50,25,active?theme.accent:c.theme==='kimi'?'#424a55':'#d7d9dc');const cc=active?(c.theme==='kimi'?'#17221f':'#fff'):theme.input;line(U-67,by+10,U-67,by-10,cc,3);line(U-75,by-2,U-67,by-10,cc,3);line(U-59,by-2,U-67,by-10,cc,3);
}
function chat(t){ctx.fillStyle=theme.bg;ctx.fillRect(0,0,U,H);if(c.chatBackground)bgPaint(c.chatBackground,U,H);status();header();if(c.theme!=='wechat'&&(!c.messages.length||t<c.messages[0].at)){const fadeFrom=c.messages.length?(c.messages[0].inputAt!==undefined?c.messages[0].inputAt:c.messages[0].at)-.3:0;ctx.save();ctx.globalAlpha=c.messages.length?1-smooth((t-fadeFrom)/.3):1;icon(c.theme,U/2,390,43,c.app.icon);text(c.labels.greeting,U/2,485,36,theme.ink,400,'center','Body',U-100);ctx.restore();}chatMessages(t);if(c.display.composer){composer(t);keyboard(t);}home(theme.ink);}
function home(color){rr(U/2-111,H-28,222,8,4,color);}
function bgPaint(b,w,h){if(b.type==='image'){const im=assets[b.src],s=Math.max(w/im.naturalWidth,h/im.naturalHeight);ctx.drawImage(im,(w-im.naturalWidth*s)/2,(h-im.naturalHeight*s)/2,im.naturalWidth*s,im.naturalHeight*s);}else{let fill=b.color||'#ecece8';if(b.type==='gradient'){const g=ctx.createLinearGradient(0,0,w,h);b.colors.forEach((v,i)=>g.addColorStop(i/(b.colors.length-1),v));fill=g;}ctx.fillStyle=fill;ctx.fillRect(0,0,w,h);}}
function cache(w,h,paint){const ca=document.createElement('canvas');ca.width=Math.ceil(w*DPR);ca.height=Math.ceil(h*DPR);const old=ctx;ctx=ca.getContext('2d',{willReadFrequently:true});ctx.scale(DPR,DPR);paint();ctx=old;return ca;}
function frameClassic(){const p=c.phone;ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.scale,p.scale);ctx.shadowColor='#1e272640';ctx.shadowBlur=44;ctx.shadowOffsetY=24;rr(0,0,792,1696,114,'#15191a');ctx.shadowColor='transparent';const g=ctx.createLinearGradient(0,0,792,0);[['#858e86',0],['#303735',.06],['#303735',.94],['#a9afa7',1]].forEach(([co,pos])=>g.addColorStop(pos,co));rr(3,3,786,1690,111,g);rr(11,11,770,1674,102,'#111413');ctx.save();ctx.beginPath();ctx.roundRect(0,0,792,1696,114);ctx.clip();
 const sh2=ctx.createLinearGradient(0,0,792,1696);
 sh2.addColorStop(0,'rgba(255,255,255,.22)');sh2.addColorStop(.3,'rgba(255,255,255,0)');
 sh2.addColorStop(1,'rgba(0,0,0,.18)');rr(0,0,792,1696,114,sh2);ctx.restore();
 if(c.display.hardware.buttons){rr(-4,308,6,126,3,'#69746d');rr(-4,463,6,126,3,'#69746d');rr(790,378,6,173,3,'#69746d');}ctx.restore();}
function frame(){
 const hw=c.display.hardware;if(hw.finish==='classic'){frameClassic();return;}
 const p=c.phone,pal={graphite:['#62666A','#25272B','#0C0E10'],titanium:['#B5AFA3','#69645C','#17181A'],silver:['#D8DBDE','#93999E','#191B1D']}[hw.finish];
 ctx.save();ctx.translate(p.x,p.y);ctx.scale(p.scale,p.scale);
 const edge=ctx.createLinearGradient(0,0,792,0);[[0,pal[0]],[.025,pal[1]],[.08,pal[2]],[.90,pal[2]],[.975,pal[0]],[1,pal[1]]].forEach(([a,b])=>edge.addColorStop(a,b));
 rr(0,0,792,1696,114,edge,'#C0C5C955');rr(6,6,780,1684,108,null,'#FFFFFF32');rr(11,11,770,1674,102,'#0D0F11');
 ctx.save();ctx.beginPath();ctx.roundRect(0,0,792,1696,114);ctx.clip();
 const sh=ctx.createLinearGradient(0,0,792,1696);
 sh.addColorStop(0,'rgba(255,255,255,.30)');sh.addColorStop(.22,'rgba(255,255,255,.05)');
 sh.addColorStop(.55,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(0,0,0,.20)');
 rr(0,0,792,1696,114,sh);ctx.restore();
 ctx.save();ctx.beginPath();ctx.roundRect(0,0,792,1696,114);ctx.clip();line(25,31,767,31,'#FFFFFF30',1);line(4,145,4,430,pal[0],1);line(788,1000,788,1390,pal[0],1);ctx.restore();
 if(hw.buttons){rr(-5,264,7,47,3,pal[1],pal[0]);rr(-5,353,7,106,3,pal[1],pal[0]);rr(-5,482,7,106,3,pal[1],pal[0]);rr(790,390,7,154,3,pal[1],pal[0]);}
 ctx.restore();
}
function notify(n,t,y){const age=t-n.at,p=ease(age/.65),out=n.until===undefined?1:1-smooth((t-(n.until-.35))/.35);if(age<0||out<=0)return;ctx.save();ctx.globalAlpha=clamp(age/.18)*out;const bounce=Math.exp(-age*8)*Math.sin(age*14)*8;ctx.translate(0,(1-p)*45+bounce);rr(24,y,708,n.cardHeight,31,n.kind==='banner'?'#f0f3f1':'#f0f3f1ec','#ffffff55');rr(46,y+20,43,43,12,'#fffaf5');icon(n.theme,67,y+42,15,n.icon);text(n.app,105,y+49,25,'#51565a',500,'left','Body',440);text(n.timeLabel,699,y+49,22,'#7e8689',400,'right','Body',135);rowsDraw(n.rows,n.glyphs,n.glyphs.length,50,y+94,29,41,'#24323a');ctx.restore();}
function lock(t){ctx.drawImage(wallCache,0,0,U,H);const l=c.lock,col=l.textColor;status(col);ctx.strokeStyle=col;ctx.lineWidth=3;ctx.beginPath();ctx.arc(U/2,145,10,Math.PI,Math.PI*2);ctx.stroke();rr(U/2-14,144,28,23,5,col);text(l.date,U/2,222,29,col,400,'center','Body',U-80);text(l.time,U/2,366,149,col,500,'center','Arial',U-90);
 const ns=c.notifications.filter(n=>n.kind==='lock'&&t>=n.at&&(n.until===undefined||t<n.until)),total=ns.reduce((a,n)=>a+n.cardHeight+18,0),available=cropped?V-510:H-710;let y=485-Math.max(0,total-available);ctx.save();ctx.beginPath();ctx.rect(0,480,U,Math.max(0,cropped?V-500:H-695));ctx.clip();for(const n of ns){notify(n,t,y);y+=n.cardHeight+18;}ctx.restore();
 for(const x of[100,U-100]){ctx.beginPath();ctx.arc(x,H-115,44,0,Math.PI*2);ctx.fillStyle='#e8f1f02a';ctx.fill();}rr(90,H-134,20,34,5,null,col);rr(U-119,H-127,39,26,6,null,col);ctx.beginPath();ctx.arc(U-99,H-114,8,0,Math.PI*2);ctx.strokeStyle=col;ctx.stroke();text(c.labels.unlock,U/2,H-72,22,col,400,'center','Body',U-260);home(col);}
function phase(t){return !c.lock||t<c.lock.at?'chat':t<c.lock.wakeAt?'sleep':'lock';}
function draw(t){current=Math.max(0,Math.min(c.duration,t));ctx.reset();ctx.setTransform(DPR,0,0,DPR,0,0);ctx.drawImage(baseCache,0,0,c.width,c.height);const s=c.screen,p=phase(current);ctx.save();ctx.beginPath();ctx.rect(...c.display.safeArea);ctx.clip();ctx.translate(s.x,s.y);ctx.scale(s.scale,s.scale);ctx.beginPath();ctx.roundRect(0,0,U,H,s.radius);ctx.clip();
 if(p==='lock'){lock(current);if(c.lock.wakeAt>c.lock.at){ctx.globalAlpha=1-smooth((current-c.lock.wakeAt)/.6);ctx.fillStyle='#060809';ctx.fillRect(0,0,U,H);ctx.globalAlpha=1;}}
 else{chat(current);for(const n of c.notifications)if(n.kind==='banner'&&current>=n.at&&current<n.until)notify(n,current,95);if(p==='sleep'){ctx.globalAlpha=smooth((current-c.lock.at)/.28);ctx.fillStyle='#060809';ctx.fillRect(0,0,U,H);ctx.globalAlpha=1;}}
 { const gl=ctx.createLinearGradient(0,0,U*.85,H*.75);
  gl.addColorStop(0,'rgba(255,255,255,.085)');gl.addColorStop(.18,'rgba(255,255,255,.025)');
  gl.addColorStop(.52,'rgba(255,255,255,0)');gl.addColorStop(1,'rgba(255,255,255,0)');
  ctx.fillStyle=gl;ctx.fillRect(0,0,U,H); }
 if(c.display.notch&&c.status.show&&c.display.hardware.camera!=='none'){rr(U/2-100,21,200,57,29,'#080a0a');ctx.beginPath();ctx.arc(U/2+70,49,8,0,Math.PI*2);ctx.fillStyle='#152a33';ctx.fill();if(c.display.hardware.camera==='island'){rr(U/2-40,31,75,5,2.5,'#25282B');ctx.beginPath();ctx.arc(U/2+70,49,5,0,Math.PI*2);ctx.fillStyle='#23394E';ctx.fill();ctx.beginPath();ctx.arc(U/2+68,47,1.5,0,Math.PI*2);ctx.fillStyle='#7591A0';ctx.fill();}}ctx.restore();
 if(c.display.caption&&c.display.mode==='phone')text(c.display.caption,c.width/2,c.height-28,22,'#818985',400,'center','Body',c.width-40);
 const ms=c.messages.map(m=>({role:m.role,visible:current>=m.at,shown:current<m.at?0:m.mode==='pop'?m.glyphs.length:count(m.reveal,current-m.at),length:m.glyphs.length}));window.__state={time:current,theme:c.theme,mode:c.display.mode,phase:p,scroll:scroll(current),keyboard:keyboardAmount(current),messages:ms,notifications:c.notifications.map(n=>current>=n.at&&(n.until===undefined||current<n.until)),screen:c.screen,lastMessageBottom:(()=>{const l=layouts.filter(l=>current>=l.m.at).at(-1);return l?bodyTop+l.y+l.h-scroll(current):null;})(),viewportBottom:composeY(current)-23,visibleHeight:V,framing:c.display.framing,readableOutputBottom:s.y+(composeY(current)-23)*s.scale};window.__issues=[...issues];$('#seek').value=current;$('#clock').textContent=current.toFixed(1)+' / '+c.duration.toFixed(1)+' s';}
function fit(){const k=cap?1:Math.min(innerWidth/c.width,Math.max(150,innerHeight-70)/c.height);cv.style.width=c.width*k+'px';cv.style.height=c.height*k+'px';}
window.__dur=c.duration;window.__seek=async t=>{draw(t);await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame)};window.__inspect=()=>window.__state;
$('#seek').max=c.duration;$('#seek').oninput=e=>{playing=false;$('#play').textContent='播放';draw(+e.target.value);};$('#play').onclick=()=>{if(current>=c.duration)draw(0);playing=!playing;$('#play').textContent=playing?'暂停':'播放';};$('#replay').onclick=()=>{draw(0);playing=true;$('#play').textContent='暂停';};addEventListener('resize',fit);
(async()=>{try{await document.fonts.load('32px Body');await document.fonts.ready;const paths=new Set([c.background.src,c.wallpaper.src,c.chatBackground?.src,c.app.icon,c.app.userAvatar,c.app.assistantAvatar,...c.notifications.map(n=>n.icon)].filter(Boolean));await Promise.all([...paths].map(async src=>{const im=new Image();im.src=src;await im.decode();assets[src]=im;}));build();baseCache=cache(c.width,c.height,()=>{bgPaint(c.background,c.width,c.height);if(c.display.mode==='phone'){ctx.save();ctx.beginPath();ctx.rect(...c.display.safeArea);ctx.clip();frame();ctx.restore();}});wallCache=cache(U,H,()=>{bgPaint(c.wallpaper,U,H);if(c.wallpaper.type==='gradient'){ctx.globalAlpha=.13;ctx.beginPath();ctx.moveTo(-80,H);ctx.bezierCurveTo(900,H*.8,140,H*.4,820,100);ctx.strokeStyle='#e5ffff';ctx.lineWidth=2;ctx.stroke();ctx.globalAlpha=1;}});fit();draw(0);window.__ready=true;requestAnimationFrame(function tick(ms){if(last&&playing){draw(current+(ms-last)/1000);if(current>=c.duration){playing=false;$('#play').textContent='重播';}}last=ms;requestAnimationFrame(tick);});}catch(e){window.__buildError=String(e);console.error(e);}})();
})();
