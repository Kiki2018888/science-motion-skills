(async()=>{
  try{
    const info=await load(window.CARD_CONFIG);
    window.__dur=info.total;window.__seek(0);window.__ready=true;
    if(new URLSearchParams(location.search).has('cap'))return;
    const ui=document.createElement('div');
    ui.style.cssText='position:fixed;bottom:8px;left:50%;transform:translateX(-50%);z-index:99;display:flex;gap:14px;align-items:center;background:#111d;color:white;padding:10px 18px;border-radius:12px;font-size:14px';
    ui.innerHTML='<button type="button" style="padding:5px 15px">暂停</button><input aria-label="时间轴" type="range" min="0" step=".01" style="width:360px"><span></span>';
    document.body.appendChild(ui);
    const range=ui.querySelector('input'),button=ui.querySelector('button'),label=ui.querySelector('span');range.max=info.total;
    let playing=true,start=performance.now(),offset=0;
    button.onclick=()=>{offset=window.__time;start=performance.now();playing=!playing;button.textContent=playing?'暂停':'播放';};
    range.oninput=()=>{playing=false;offset=+range.value;window.__seek(offset);button.textContent='播放';};
    const fit=()=>{const w=window.CARD_CONFIG.width||1920,h=window.CARD_CONFIG.height||1080,scale=Math.min(innerWidth/w,innerHeight/h);const root=document.getElementById('root');Object.assign(root.style,{transform:`scale(${scale})`,transformOrigin:'0 0',position:'absolute',left:`${(innerWidth-w*scale)/2}px`,top:`${(innerHeight-h*scale)/2}px`});};
    addEventListener('resize',fit);fit();
    function tick(now){if(playing)window.__seek((offset+(now-start)/1000)%info.total);range.value=window.__time;label.textContent=window.__time.toFixed(1)+' / '+info.total.toFixed(1)+' s';requestAnimationFrame(tick);}requestAnimationFrame(tick);
  }catch(e){window.__buildError=String(e.stack||e);throw e;}
})();
