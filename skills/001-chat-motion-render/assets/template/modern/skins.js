/* Brand-specific UI composition. Original illustrations and generic icons. */
(()=>{
const $=s=>document.querySelector(s);
const paths={
 back:'<path d="m14.5 4.5-7.5 7.5 7.5 7.5"/>',
 arrowback:'<path d="M20 12H4m6-6-6 6 6 6"/>',
 menu:'<path d="M4 6h16M4 12h11M4 18h16"/>',
 sidebar:'<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M9 4v16"/>',
 down:'<path d="m7 10 5 5 5-5"/>',
 chevron:'<path d="m9 6 6 6-6 6"/>',
 plus:'<path d="M12 4v16M4 12h16"/>',
 more:'<circle cx="5" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.4" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.4" fill="currentColor" stroke="none"/>',
 video:'<rect x="2" y="6" width="13" height="12" rx="3"/><path d="m15 10 6-4v12l-6-4"/>',
 phone:'<path d="m8 3 2 5-3 2c1.5 3.5 3.5 5.5 7 7l2-3 5 2c1 8-8 5-13 0S0 2 8 3Z"/>',
 mic:'<rect x="9" y="2" width="6" height="13" rx="3"/><path d="M5 11v1a7 7 0 0 0 14 0v-1M12 19v3m-3 0h6"/>',
 voice:'<path d="M4 10v4M8 6v12M12 3v18M16 7v10M20 10v4"/>',
 smile:'<circle cx="12" cy="12" r="9"/><path d="M8 14c2 3 6 3 8 0M8.5 9h.01M15.5 9h.01"/>',
 camera:'<path d="M8 6 9.5 3h5L16 6h4a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="4"/>',
 edit:'<path d="M13 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-8M10 14l1-5 9-9 4 4-9 9-5 1Z" transform="translate(0 1) scale(.9)"/>',
 copy:'<rect x="8" y="7" width="12" height="14" rx="2"/><path d="M16 7V3H4v14h4"/>',
 up:'<path d="M12 20V4m-7 7 7-7 7 7"/>',
 like:'<path d="M8 10v11H3V10h5Zm0 0 5-7c2-1 3 1 2 4l-1 3h5c2 0 2 2 1.5 4L19 20a2 2 0 0 1-2 1H8"/>',
 dislike:'<g transform="rotate(180 12 12)"><path d="M8 10v11H3V10h5Zm0 0 5-7c2-1 3 1 2 4l-1 3h5c2 0 2 2 1.5 4L19 20a2 2 0 0 1-2 1H8"/></g>',
 retry:'<path d="M20 9a8 8 0 1 0 0 7M20 3v6h-6"/>',
 share:'<path d="M5 13v7h14v-7M12 16V2m-5 5 5-5 5 5"/>',
 tools:'<path d="M3 6h18M3 12h18M3 18h18"/><circle cx="8" cy="6" r="2" fill="var(--surface)"/><circle cx="16" cy="12" r="2" fill="var(--surface)"/><circle cx="10" cy="18" r="2" fill="var(--surface)"/>',
 check:'<path d="m3 12 4 4L17 6m-5 10L22 6"/>',
 reply:'<path d="M21 11a8.5 8.5 0 0 1-9 8H8l-5 3v-6a8 8 0 0 1-2-5 9.5 9.5 0 0 1 20 0Z"/>',
 repost:'<path d="M5 17V4m-4 4 4-4 4 4M5 4h12M19 7v13m-4-4 4 4 4-4M19 20H7"/>',
 heart:'<path d="M12 21S2 15 2 8a5 5 0 0 1 10-2A5 5 0 0 1 22 8c0 7-10 13-10 13Z"/>',
 chart:'<path d="M4 20V10M10 20V4M16 20v-7M22 20V7"/>',
 bookmark:'<path d="M6 3h12v19l-6-4-6 4Z"/>',
 speaker:'<path d="M4 9h4l5-5v16l-5-5H4ZM17 7c3 3 3 7 0 10M20 4c5 5 5 11 0 16"/>',
 person:'<circle cx="12" cy="8" r="4" fill="currentColor" stroke="none"/><path d="M3 23v-3a9 9 0 0 1 18 0v3" fill="currentColor" stroke="none"/>',
 chat:'<path d="M4 4h16a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H8l-7 4V7a3 3 0 0 1 3-3Z" fill="currentColor" stroke="none"/><path d="M7 12h.01M12 12h.01M17 12h.01" stroke="var(--avatar-blue,#568dde)" stroke-width="2.6"/>',
 x:'<path d="m3 3 18 18M21 3 3 21M2 3h5l15 18h-5Z" stroke-width="1.3"/>'
};
function icon(key,cls=''){
 if(key==='claude') return `<svg class="icon ${cls}" viewBox="0 0 40 40" fill="currentColor" aria-hidden="true">${Array.from({length:12},(_,i)=>`<path d="M18.6 2.5 22 1.7 21 16 19 17Z" transform="rotate(${i*30} 20 20)"/>`).join('')}<circle cx="20" cy="20" r="5.7"/></svg>`;
 if(key==='gemini') return `<svg class="icon ${cls}" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="gemini-tone" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#4285f4"/><stop offset=".48" stop-color="#6688f0"/><stop offset="1" stop-color="#c16dd0"/></linearGradient></defs><path d="M20 1C22.4 13.6 26.4 17.6 39 20 26.4 22.4 22.4 26.4 20 39 17.6 26.4 13.6 22.4 1 20 13.6 17.6 17.6 13.6 20 1Z" fill="url(#gemini-tone)"/></svg>`;
 return `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[key]||''}</svg>`;
}
const control=(key,cls='')=>`<span class="ui-control ${cls}">${icon(key)}</span>`;
const avatar=(cls='')=>`<span class="peer-avatar ${cls}">${icon('person')}</span>`;
const hidden='<span id="brand-icon" hidden></span><small id="status" hidden></small><span id="send" hidden></span>';
const themes={
 apple:{title:'Messages',brand:'科普讨论',icon:'',placeholder:'iMessage 信息',peer:'讲解员'},
 wechat:{title:'微信',brand:'科普讨论',icon:'',placeholder:'',peer:'讲解员'},
 whatsapp:{title:'WhatsApp',brand:'科普讨论',icon:'',placeholder:'消息',peer:'讲解员'},
 claude:{title:'Claude',brand:'Claude',icon:'',placeholder:'回复 Claude…',peer:'Claude'},
 chatgpt:{title:'ChatGPT',brand:'ChatGPT',icon:'',placeholder:'询问任何问题',peer:'ChatGPT'},
 x:{title:'X · 公开回复串',brand:'帖子',icon:'',placeholder:'发布你的回复',peer:'科普讨论'},
 gemini:{title:'Google Gemini',brand:'Gemini',icon:'',placeholder:'问问 Gemini',peer:'Gemini'}
};
const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function mount(cfg){
 const t=cfg.theme; const stage=$('#stage');stage.dataset.appearance=cfg.appearance||'light';$('#appearance').value=stage.dataset.appearance;
 stage.classList.toggle('ai', ['claude','chatgpt','gemini'].includes(t));
 let header='',footer='',time='';
 if(t==='apple'){
  header=`<header class="chat-header"><div class="header-wash"></div><div class="glass-icon back-icon">${icon('back')}</div><div class="contact"><div class="contact-avatar">${icon('chat')}</div><div class="contact-title"><strong id="brand-title"></strong>${icon('chevron')}</div></div><div class="glass-icon video-icon">${icon('video')}</div></header>`;
  footer=`<div class="composer-wash"></div><footer class="composer"><div class="glass-icon add-icon">${icon('plus')}</div><div class="composer-field"><span id="input-placeholder"></span>${icon('mic','microphone')}</div></footer>`;
  time=`<span>iMessage</span><span>${esc(cfg.dateLabel||'今天')} ${esc(cfg.timeLabel||'09:41')}</span>`;
 }else if(t==='wechat'){
  header=`<header class="product-header">${control('back')}<strong id="brand-title"></strong>${control('more')}</header>`;
  footer=`<footer class="wechat-composer">${control('voice','ring-control')}<div class="wechat-field"><span id="input-placeholder"></span></div>${control('smile')}${control('plus','ring-control')}</footer>`;
  time=`<span>${esc(cfg.timeLabel||'09:41')}</span>`;
 }else if(t==='whatsapp'){
  header=`<header class="product-header">${control('back')}<div class="peer">${avatar()}<div><strong id="brand-title"></strong><small>在线</small></div></div><div class="header-actions">${control('video')}${control('phone')}</div></header>`;
  footer=`<footer class="whatsapp-composer">${control('plus')}<div class="whatsapp-field"><span id="input-placeholder"></span>${icon('camera')}</div><span class="wa-mic">${icon('mic')}</span></footer>`;
  time=`<span class="date-pill">${esc(cfg.dateLabel||'今天')}</span>`;
 }else if(t==='claude'){
  header=`<header class="product-header ai-header">${control('menu')}<div class="ai-brand"><strong id="brand-title"></strong>${icon('down')}</div>${control('edit')}</header>`;
  footer=`<footer class="ai-composer"><div class="ai-placeholder" id="input-placeholder"></div><div class="ai-bottom">${control('plus')}<span class="model-label">${esc(cfg.modelLabel||'Sonnet')} ${icon('down')}</span><span class="ai-send">${icon('up')}</span></div></footer>`;
 }else if(t==='chatgpt'){
  header=`<header class="product-header ai-header">${control('sidebar')}<div class="ai-brand"><strong id="brand-title"></strong>${icon('down')}</div>${control('edit')}</header>`;
  footer=`<footer class="gpt-composer"><span id="input-placeholder"></span><div class="ai-bottom">${control('plus')}<span class="composer-spacer"></span>${control('mic')}<span class="gpt-voice">${icon('voice')}</span></div></footer>`;
 }else if(t==='gemini'){
  header=`<header class="product-header ai-header">${control('menu')}<div class="ai-brand"><strong id="brand-title"></strong></div><div class="google-user">${esc(cfg.userLabel||'我')}</div></header>`;
  footer=`<footer class="gemini-composer"><span id="input-placeholder"></span><div class="ai-bottom">${control('plus')}<span class="tools-label">${icon('tools')} 工具</span><span class="composer-spacer"></span><span class="model-label">${esc(cfg.modelLabel||'思考')} ${icon('down')}</span>${control('mic')}<span class="gemini-live">${icon('voice')}</span></div></footer>`;
 }else if(t==='x'){
  header=`<header class="product-header x-header">${control('arrowback')}<strong id="brand-title"></strong><span class="x-mark">${icon('x')}</span></header>`;
  footer=`<footer class="x-composer">${avatar('self')}<span id="input-placeholder"></span><span class="x-reply-button">回复</span></footer>`;
 }
 $('#skin-header').innerHTML=header+hidden;$('#skin-composer').innerHTML=footer;$('#skin-time').innerHTML=time;
}
function add(el,cls,html){const child=document.createElement('div');child.className=cls;child.innerHTML=html;el.append(child);return child;}
function decorate(rows,cfg){
 const t=cfg.theme;
 rows.forEach((r,i)=>{
   const stack=r.row.querySelector('.stack'); const bubble=r.row.querySelector('.bubble');const av=r.row.querySelector('.avatar');
   if(r.m.avatar)av.textContent=r.m.avatar;else av.innerHTML=icon('person');
   if(t==='whatsapp')add(bubble,'message-meta',`<span>${esc(r.m.time||cfg.timeLabel||'09:41')}</span>${r.m.side==='right'?icon('check'):''}`);
   if(['claude','chatgpt','gemini'].includes(t)&&r.m.side==='left'){
    if(t!=='chatgpt'){const brand=document.createElement('div');brand.className='answer-brand';brand.innerHTML=icon(t);r.row.insertBefore(brand,stack);}
    const actions=t==='claude'?['copy','like','dislike','retry']:['copy','like','dislike','speaker','retry'];
    add(stack,'answer-actions',actions.map(k=>icon(k)).join(''));
   }
   if(t==='x'){
    const isSelf=r.m.side==='right',name=r.name,handle=r.m.handle||(isSelf?'@me':'@reply');
    r.row.classList.toggle('root-post',i===0);r.row.classList.add('post');r.row.style.animationName='arrive';
    const label=r.row.querySelector('.name');label.innerHTML=`<b>${esc(name)}</b><span>${esc(handle)}</span><span class="post-age">· ${esc(r.m.age||'现在')}</span><span class="post-more">${icon('more')}</span>`;
    if(i>0){const prior=rows[i-1];const target=r.m.replyTo||prior.m.handle||(prior.m.side==='right'?'@me':'@reply');const relation=document.createElement('div');relation.className='replying-to';relation.innerHTML=`回复 <span>${esc(target)}</span>`;stack.insertBefore(relation,bubble);}
    else add(stack,'post-time',`${esc(r.m.time||cfg.timeLabel||'09:41')}${r.m.views!==undefined?` · <b>${esc(r.m.views)}</b> 次查看`:''}`);
    add(stack,'post-actions',`<span>${icon('reply')}<small>${esc(r.m.replies)}</small></span><span>${icon('repost')}<small>${esc(r.m.reposts)}</small></span><span>${icon('heart')}<small>${esc(r.m.likes)}</small></span><span>${icon('chart')}</span><span>${icon('share')}</span>`);
    // Public replies use ordinary entrance. Never inflate an entire post as a message bubble.
    r.row.dataset.mode='thread';
   }
 });
}
$('#appearance').onchange=event=>window.__setConfig({appearance:event.target.value});
window.ChatSkins={themes,mount,decorate,icon};
})();
