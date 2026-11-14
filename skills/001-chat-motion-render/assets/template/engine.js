(()=>{'use strict';
const $=s=>document.querySelector(s),params=new URLSearchParams(location.search),cap=params.has('cap'),base=structuredClone(window.CHAT_CONFIG);
const themes={wechat:{title:'微信风格',brand:'科普讨论',icon:'',placeholder:'发送消息',peer:'朋友'},claude:{title:'Claude 风格',brand:'Claude',icon:'✳',placeholder:'回复 Claude…',peer:'Claude'},chatgpt:{title:'ChatGPT 风格',brand:'ChatGPT',icon:'',placeholder:'询问任何问题',peer:'ChatGPT'},minimal:{title:'简洁卡片',brand:'科普聊天室',icon:'◌',placeholder:'从一个好问题开始',peer:'讲解员'}};
let cfg={...base,theme:params.get('theme')||base.theme,mode:params.get('mode')||base.mode,aspect:params.get('aspect')||base.aspect||'portrait'},content=params.get('content')||'short',custom=null,rows=[],now=0,playing=!cap,last=0;
const segmenter=new Intl.Segmenter('zh',{granularity:'grapheme'}),clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
function fit(){const [w,h]=cfg.aspect==='portrait'?[1080,1920]:[1920,1080];window.__size={width:w,height:h};const bars=cap?0:$('#controls').offsetHeight+$('#playback').offsetHeight,scale=Math.min(innerWidth/w,Math.max(100,innerHeight-bars)/h);$('#stage').style.transform=`scale(${scale})`;$('#view').style.width=w*scale+'px';$('#view').style.height=h*scale+'px';}
function build(){window.__ready=false;if(!themes[cfg.theme])throw Error('Unknown theme');if(!['type','pop'].includes(cfg.mode))throw Error('Unknown motion mode');
 if(!['portrait','landscape'].includes(cfg.aspect))throw Error('Unknown aspect');$('#stage').dataset.aspect=cfg.aspect;$('#aspect').value=cfg.aspect;fit();
 const theme=themes[cfg.theme];$('#stage').dataset.theme=cfg.theme;$('#style-title').textContent=theme.title;$('#mode-title').textContent=cfg.mode==='pop'?'泡泡弹出':'逐字输入';$('#brand-title').textContent=theme.brand;$('#brand-icon').textContent=theme.icon;$('#input-placeholder').textContent=theme.placeholder;$('#send').textContent=cfg.theme==='wechat'?'发送':'↑';$('#track').replaceChildren();$('#track').style.transform='none';$('#clip').scrollTop=0;
 $('#style-title').textContent=cfg.title||'对话记录';$('#brand-title').textContent=cfg.chatTitle||theme.brand;$('.kicker').textContent=cfg.eyebrow||'';$('#mode-title').hidden=!cfg.showLabels;$('.note').hidden=!cfg.showLabels;$('#content').closest('label').hidden=true;
 let next=.55;const messages=custom||(content==='long'?base.longMessages:base.messages);
 rows=messages.map((m,i)=>{const mode=m.mode||cfg.mode,chars=Array.from(segmenter.segment(m.text),s=>s.segment),start=m.start??next;
  if(!['left','right'].includes(m.side)||!['type','pop'].includes(mode)||!Number.isFinite(start)||start<0||!((m.cps??cfg.cps)>0))throw Error('Invalid message parameters');
  const times=[];let end=start+.38;
  if(mode==='type'){for(let j=0;j<chars.length;j++){times.push(end);end+=1/(m.cps||cfg.cps)*(1+((j*7+i*3)%5-2)*.035)+(/[，、：；]/.test(chars[j])?.13:/[。？！]/.test(chars[j])?.2:0);}}
  else{end=start+.48;chars.forEach(()=>times.push(start));}
  const hold=m.hold??(mode==='pop'?Math.max(cfg.popHold,chars.length/8):cfg.readHold);next=end+hold;
  const row=document.createElement('article');row.className='row '+m.side;row.dataset.mode=mode;row.innerHTML='<div class="avatar"></div><div class="stack"><div class="name"></div><div class="bubble"><div class="reserve"></div><div class="typed"></div><div class="dots"><i></i><i></i><i></i></div></div></div>';
  const name=m.name||(m.side==='right'?'我':theme.peer);row.querySelector('.name').textContent=name;row.querySelector('.avatar').textContent=m.avatar||(m.side==='right'?'我':'答');row.querySelector('.reserve').textContent=m.text+'\u2002';$('#track').append(row);
  return{row,m,name,mode,chars,times,start,end,hold,typed:row.querySelector('.typed'),dots:row.querySelector('.dots')};
 });
 for(let i=1;i<rows.length;i++)if(rows[i].start<rows[i-1].start+.5)throw Error('Message starts must be ordered and at least 0.5 seconds apart');
 let prior=0;for(const r of rows){r.scrollFrom=prior;r.scrollTo=Math.max(prior,r.row.offsetTop+r.row.offsetHeight-$('#clip').clientHeight+24);prior=r.scrollTo;}
 window.__dur=Math.ceil((next+cfg.tail)*24)/24;window.CHAT_TIMELINE=rows.map(r=>({text:r.m.text,mode:r.mode,start:r.start,end:r.end,hold:r.hold,scrollTo:r.scrollTo}));$('#scrub').max=window.__dur;$('#theme').value=cfg.theme;$('#mode').value=cfg.mode;$('#content').value=content;draw(0);fit();window.__ready=true;
}
function draw(t){now=clamp(t,0,window.__dur);let active=null,latest=null;
 for(const r of rows){const age=now-r.start,entered=age>=0,duration=r.mode==='pop'?.48:.38;r.row.style.visibility=entered?'visible':'hidden';r.row.style.setProperty('--age',Math.max(0,age));r.row.style.animationName=age>=duration?'none':r.mode==='pop'?'popArrival':'arrive';r.row.querySelector('.bubble').style.animationName=r.mode==='pop'&&age<duration?'bubbleInflate':'none';const n=r.mode==='pop'?(entered?r.chars.length:0):r.times.filter(x=>x<=now).length;
  r.typed.replaceChildren(document.createTextNode(r.chars.slice(0,n).join('')));r.dots.style.display=entered&&r.mode==='type'&&n===0?'flex':'none';
  if(entered){latest=r;if(r.mode==='type'&&now<r.end){active=r;if(n>0){const cursor=document.createElement('span');cursor.className='cursor';cursor.style.opacity=String(.4+.6*(.5+.5*Math.cos(age*10)));r.typed.append(cursor);}Array.from(r.dots.children).forEach((e,j)=>e.style.transform=`translateY(${-3*(.5+.5*Math.sin(age*10-j))}px)`);}}
 }
 let scroll=0;if(latest){const x=clamp((now-latest.start)/.38,0,1),ease=x*x*(3-2*x);scroll=latest.scrollFrom+(latest.scrollTo-latest.scrollFrom)*ease;}$('#track').style.transform=`translateY(${-scroll}px)`;$('#clip').scrollTop=0;
 $('#status').textContent=active?active.name+'正在输入…':cfg.mode==='pop'?'消息按顺序送达':'在线';$('#scrub').value=now;$('#clock').textContent=`${now.toFixed(1)} / ${window.__dur.toFixed(1)} s`;return now;
}
window.__seek=async t=>{draw(t);await new Promise(requestAnimationFrame);await new Promise(requestAnimationFrame);};
window.__setConfig=async patch=>{if(patch.messages)custom=structuredClone(patch.messages);cfg={...cfg,...patch};build();await window.__seek(0);};
window.__inspect=()=>({theme:cfg.theme,mode:cfg.mode,aspect:cfg.aspect,time:now,scroll:$('#track').style.transform,messages:rows.map(r=>({text:r.typed.textContent,mode:r.mode,start:r.start,end:r.end,visible:now>=r.start,box:r.row.getBoundingClientRect().toJSON()}))});
function replay(){draw(0);playing=!cap;$('#pause').textContent='暂停';}
$('#aspect').onchange=e=>{cfg.aspect=e.target.value;build();replay();};$('#theme').onchange=e=>{cfg.theme=e.target.value;build();replay();};$('#mode').onchange=e=>{cfg.mode=e.target.value;build();replay();};$('#content').onchange=e=>{content=e.target.value;custom=null;build();replay();};$('#replay').onclick=replay;
$('#pause').onclick=()=>{playing=!playing;if(now>=window.__dur&&playing)draw(0);$('#pause').textContent=playing?'暂停':'播放';};$('#scrub').oninput=e=>{playing=false;$('#pause').textContent='播放';draw(+e.target.value);};
$('#edit').onclick=()=>{playing=false;$('#pause').textContent='播放';$('#script').value=rows.map(r=>(r.m.side==='right'?'我：':'对方：')+r.m.text).join('\n');$('#editor').showModal();};$('#close').onclick=()=>$('#editor').close();$('#apply').onclick=()=>{const lines=$('#script').value.split('\n').map(x=>x.trim()).filter(Boolean);if(!lines.length)return;custom=lines.map(x=>({side:/^我[:：]/.test(x)?'right':'left',text:x.replace(/^(我|对方)[:：]\s*/, '')}));build();$('#editor').close();replay();};
if(cap){$('#controls').style.display='none';$('#playback').style.display='none';}addEventListener('resize',fit);
document.fonts.ready.then(()=>{build();requestAnimationFrame(function tick(ms){if(last&&playing){draw(now+(ms-last)/1000);if(now>=window.__dur){playing=false;$('#pause').textContent='播放';}}last=ms;requestAnimationFrame(tick);});});
})();

