/* Local deterministic rendering support; visual engine originates in the user's file. */
window.prepareCards=async()=>{
  await document.fonts.load('700 40px CardSans');
  await document.fonts.ready;
  for(const sc of document.querySelectorAll('.scene'))sc.style.display='block';
  for(const el of document.querySelectorAll('.ph .p')){
    const m=el.style.background.match(/url\(["']?(.*?)["']?\)/);
    if(m){const img=new Image();img.src=m[1];await img.decode();}
  }
  document.querySelectorAll('svg.ln').forEach((svg,i)=>{
    const g=svg.querySelector('linearGradient');g.id='card-gradient-'+i;
    svg.querySelector('.ar').setAttribute('fill',`url(#${g.id})`);
  });
  const fit=(el,max,min=20)=>{
    let size=parseFloat(getComputedStyle(el).fontSize);
    while(size>min&&(el.scrollWidth>max+1)){size--;el.style.fontSize=size+'px';}
  };
  for(const el of document.querySelectorAll('.l1,.l2')){
    el.style.maxWidth=el.closest('.txt').clientWidth+'px';fit(el,el.closest('.txt').clientWidth,46);
  }
  for(const el of document.querySelectorAll('.k .v,.k .lb')){
    el.style.whiteSpace='nowrap';fit(el,el.clientWidth,el.classList.contains('v')?24:12);
  }
  for(const el of document.querySelectorAll('.cap span'))fit(el,1680,24);
  for(const el of document.querySelectorAll('.hd h3')){el.style.whiteSpace='nowrap';fit(el,el.parentElement.clientWidth,22);}
};

// Match skeleton boxes to the actual measured UI; handle the tall header and picture rows.
buildWire=function(card,st,focus){
  const w=h('div','wire');w.style.cssText='padding:0;display:block';
  if(focus&&![...card.querySelectorAll('[data-region]')].some(e=>e.dataset.region===focus))throw new Error('Focus region is not present: '+focus);
  for(const el of card.querySelectorAll('[data-region]')){
    const region=el.dataset.region;if(region==='main')continue;
    let x=0,y=0,n=el;
    while(n&&n!==card){x+=n.offsetLeft;y+=n.offsetTop;n=n.offsetParent;}
    const b=h('div','w'+(focus===region?' f':''));
    b.style.cssText=`position:absolute;left:${x}px;top:${y}px;width:${el.offsetWidth}px;height:${el.offsetHeight}px`;
    if(focus===region)b.innerHTML=`<b>${st._focusLabel||''}</b>`;
    w.appendChild(b);
  }
  return w;
};

window.__seek=async t=>{
  window.__time=Math.max(0,Math.min(TOTAL,t));seek(window.__time);
  // Allow the 3D compositor and backdrop filters to commit after discontinuous seeking.
  await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
};
window.__inspect=()=>{
  const visible=SC.find(s=>s.el.style.display!=='none');
  const problems=[];
  if(visible)for(const el of visible.el.querySelectorAll('.l1,.l2,.k .v,.k .lb,.hd h3,.cap span')){
    if(el.scrollWidth>el.clientWidth+2)problems.push({kind:'text-overflow',text:el.textContent});
    const r=el.getBoundingClientRect();
    if(r.left<0||r.right>1921||r.bottom>1081)problems.push({kind:'outside-frame',text:el.textContent});
  }
  return {time:window.__time,scene:visible?SC.indexOf(visible):-1,
    values:visible?[...visible.el.querySelectorAll('.k .v')].map(e=>e.textContent):[],
    fontsReady:document.fonts.check('40px CardSans'),problems};
};
