/* TЁМНОЕ ДЕЛО V10 — chapter flipbook, viewport clip, city-specific artwork */
(()=>{'use strict';
 const $=s=>document.querySelector(s),reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const skylineCache=new Map();
 window.TDCasePhoto=function(id){if(skylineCache.has(id))return skylineCache.get(id);
  try{const svg=window.citySVG?window.citySVG(id,'hero'):typeof citySVG==='function'?citySVG(id,'hero'):null;
   if(!svg)return './harbor-port.webp';
   const uri='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent(svg);
   skylineCache.set(id,uri);return uri;
  }catch(e){return './harbor-port.webp'}
 };
 const notice=document.createElement('div');notice.className='td10-live-region';notice.setAttribute('aria-live','polite');document.body.appendChild(notice);
 let lastTheatre=null,lastStage=null,lastCity=null,scheduled=false;
 function currentStory(){const id=window.TDGamePages?.city??0;return window.TDCaseStory?.(id);}
 function chapter(){const root=$('#td8Root');if(!root||root.offsetParent===null)return;
  const theatre=$('#td8Theatre');if(!theatre)return;
  const s=window.TDGamePages?.stage??0,city=window.TDGamePages?.city??0,story=currentStory();
  if(!story)return;
  if(theatre!==lastTheatre||lastStage!==s||lastCity!==city){lastTheatre=theatre;lastStage=s;lastCity=city;
   const title=$('.td8-scene-top strong');if(title)title.textContent=['ПОЛУЧИТЬ ДЕЛО','ОСМОТР МЕСТА','РАСШИФРОВАТЬ КОД','СОБРАТЬ СНИМОК','ДОПРОС','ХРОНОЛОГИЯ','РАЗГАДКА'][s];
   const p=$('.td8-scene-top span');if(p)p.textContent='◈ '+story.setting;
   root.dataset.case=String(city);root.dataset.chapter=String(s);
   root.style.setProperty('--td10-tone', ['#ffb76a','#e9a960','#a7d1d0','#e9d3a5','#cab4f0'][city%5]);
  }
  const center=$('.td8-stage-overline');if(center&&!$('#td10Pager')){
   const nav=document.createElement('nav');nav.id='td10Pager';nav.className='td10-pager';nav.setAttribute('aria-label','Листать главы дела');
   nav.innerHTML='<button data-pg="prev" aria-label="Предыдущая страница">‹</button><span class="td10-page-status"></span><button data-pg="next" aria-label="Следующая страница">›</button>';
   center.appendChild(nav);nav.addEventListener('click',e=>{const b=e.target.closest('[data-pg]');if(!b)return;const pages=window.TDGamePages;if(!pages)return;const dest=pages.stage+(b.dataset.pg==='next'?1:-1);if(!pages.go(dest)&&b.dataset.pg==='next'){notice.textContent='Чтобы открыть следующую главу, сначала реши задание.';}});
  }
  const pages=window.TDGamePages, pager=$('#td10Pager');if(pages&&pager){pager.querySelector('.td10-page-status').textContent=`ЛИСТ ${String(pages.stage+1).padStart(2,'0')} / 07`;pager.querySelector('[data-pg="prev"]').disabled=pages.stage===0;pager.querySelector('[data-pg="next"]').disabled=pages.stage>=pages.unlocked;}
  const page=$('.td8-mission-copy .td8-mission-tag');if(page)page.textContent=`ЛИСТ ${String(s+1).padStart(2,'0')} · ${story.setting.toUpperCase()}`;
  let disclaimer=$('#td10CaseNote');if(!disclaimer){disclaimer=document.createElement('aside');disclaimer.id='td10CaseNote';disclaimer.className='td10-case-note';const top=$('.td8-case-id');top?.appendChild(disclaimer)}
  if(disclaimer)disclaimer.textContent='Художественная реконструкция · городская история и игровые версии разделены';
  const label=$('.td9-legend');if(label){label.firstChild.textContent='ОБЗОР КОМНАТЫ · ';}
  const game=$('#td8Root');const cityView=$('#td8Theatre .td9-shell');if(game&&cityView){game.style.setProperty('--td10-scene-city',`url("${window.TDCasePhoto(city)}")`)}
 }
 function loop(){if(scheduled)return;scheduled=true;requestAnimationFrame(()=>{scheduled=false;chapter()})}
 const root=$('#td8Root');if(root){const ob=new MutationObserver(loop);ob.observe(root,{childList:true,subtree:true,characterData:false});loop();}
 document.addEventListener('keydown',e=>{if(e.target.matches('input,select,textarea')||e.ctrlKey||e.altKey||e.metaKey||$('#td9Inspector'))return;
  if(!$('#td8Root')||$('#game')?.classList.contains('hidden'))return;
  if(e.key==='PageDown'||e.key==='PageUp'){const pages=window.TDGamePages;if(!pages)return;const target=pages.stage+(e.key==='PageDown'?1:-1);if(pages.go(target))e.preventDefault();}
 });
 window.TDQuest10={version:'10.0',cityCount:40};
})();