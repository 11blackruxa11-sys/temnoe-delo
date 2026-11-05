/* ТЁМНОЕ ДЕЛО • Object examination V7. Native CSS 3D, gestures & animated camera. */
(()=>{
'use strict';
const $=id=>document.getElementById(id), game=$('game');
if(!game || !$('v5ClueViewer')) return;
const legacy=$('v5ClueViewer');
const clues={
 'Схема квартала':'map','Запись охраны':'window','Медный жетон':'ticket','Страница дневника':'page',
 'Вскрытая дверь':'lock','Восстановленный кадр':'photo','Противоречие в показаниях':'witness',
 'Проверенная хронология':'time','Разгадка дела':'final'
};
const DATA={
 map:{type:'map',title:'Схема квартала',lead:'На карте три маршрута. Разверни схему и проверь пометку архивариуса.',back:'МАРШРУТ 03',note:'Номер маршрута: 3',hidden:'Цифра 3 — первая в комбинации сейфа.'},
 page:{type:'journal',title:'Страница дневника',lead:'Старинный дневник с кожаным переплётом. На обороте есть заметка.',back:'ОКНО №1',note:'Порядок: маршрут → окно → жетон',hidden:'Окно 1 означает вторую цифру кода.'},
 ticket:{type:'coin',title:'Медный жетон',lead:'Тяжёлый жетон. Поверни его на обратную сторону и найди гравировку.',back:'4',note:'Гравировка на обороте жетона',hidden:'Цифра 4 — последняя в комбинации.'},
 window:{type:'record',title:'Запись охраны',lead:'Регистратор найден рядом с окном. Важное время написано на задней панели.',back:'20:40',note:'Последний проход перед опечатыванием',hidden:'После 20:40 дверь больше не открывали.'},
 lock:{type:'record',title:'Архивный замок',lead:'Механизм зафиксирован после вскрытия.',back:'314',note:'Замок открывался по найденным подсказкам',hidden:'Правильная комбинация совпадает с маршрутом, окном и жетоном.'},
 photo:{type:'photo',title:'Восстановленный кадр',lead:'Сравни предметы на фотографии и осмотри оборот снимка.',back:'СУМКА',note:'След курьера у входа в архив',hidden:'На восстановленном кадре видна курьерская сумка.'},
 witness:{type:'journal',title:'Протокол свидетеля',lead:'Утверждения свидетелей расходятся по времени.',back:'ПРОВЕРЬ ВРЕМЯ',note:'Свидетель перепутал последовательность событий',hidden:'Один из свидетелей не мог войти в архив после опечатывания.'},
 time:{type:'map',title:'Хронология',lead:'Восстанови порядок передвижения по отметкам.',back:'20:40',note:'Контрольное время',hidden:'Последний проход отмечен до закрытия здания.'},
 final:{type:'photo',title:'Финальное доказательство',lead:'Все детали расследования сложились в единую картину.',back:'ДЕЛО ЗАКРЫТО',note:'Сопоставь результаты со своими выводами',hidden:'Финальная версия должна объяснять каждую найденную улику.'}
};
const reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
const esc=t=>String(t).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
function buildFace(d,isBack){
 if(isBack){if(d.type==='coin')return `<div class="td7-coin-face"><small>НОВОРОССИЙСК</small><b>${esc(d.back)}</b><small>АРХИВ / 1926</small></div>`;
  return `<div class="td7-backnote"><small>Скрытая пометка</small><strong style="font-size:${d.back.length>12?'40':'clamp(38px,5vw,78px)'}px">${esc(d.back)}</strong><p>${esc(d.note)}</p></div>`;}
 if(d.type==='coin')return '<div class="td7-coin-face"><small>ГОРОДСКОЙ АРХИВ</small><span>⚓</span><small>МЕДНЫЙ ЖЕТОН</small></div>';
 if(d.type==='journal')return '<div class="td7-book-cover"><div class="td7-book-border"><span>⚜</span><strong>ДНЕВНИК</strong><small>Архивные записи</small><span>✦</span></div></div>';
 if(d.type==='record')return '<div class="td7-tape"><h3>АРХИВ • РЕГИСТРАТОР</h3><div class="td7-reels"><div class="td7-reel"></div><div class="td7-reel"></div></div><div class="td7-tape-meter"></div></div>';
 if(d.type==='photo')return '<div class="td7-film"><div class="td7-film-photo"></div></div>';
 return `<div class="td7-paper"><h3>СХЕМА КВАРТАЛА</h3><div class="td7-map-lines"><svg viewBox="0 0 300 160" preserveAspectRatio="none" aria-hidden="true"><path d="M10 130 Q80 30 155 58 T290 12" stroke="#9b3127" stroke-width="4" stroke-dasharray="7 5" fill="none"/><path d="M14 38 Q95 150 200 116 T290 78" stroke="#5e6837" stroke-width="3" stroke-dasharray="5 9" fill="none"/><path d="M30 142 L120 43 L249 132" stroke="#705d48" stroke-width="3" fill="none"/><g fill="#9b3127"><circle cx="10" cy="130" r="6"/><circle cx="155" cy="58" r="6"/><circle cx="290" cy="12" r="6"/></g></svg><div class="td7-map-stamp">№ 03</div></div></div>`;
}
function makeObject(d){
 const faces=`<div class="td7-face td7-front">${buildFace(d,false)}</div><div class="td7-face td7-back">${buildFace(d,true)}</div>`;
 const edges='<div class="td7-edge td7-side-left"></div><div class="td7-edge td7-side-right"></div><div class="td7-edge td7-side-top"></div><div class="td7-edge td7-side-bottom"></div>';
 const rim=d.type==='coin'?'<div class="td7-rim">'+Array.from({length:40},(_,i)=>`<span style="--a:${i*9}deg"></span>`).join('')+'</div>':'';
 return `<div class="td7-object td7-${d.type}" id="td7Object">${faces}${edges}${rim}</div>`;
}
const panel=document.createElement('div');panel.id='td7Inspector';panel.hidden=true;
panel.innerHTML=`<div class="td7-scrim" data-td7="close"></div><div class="td7-shell" role="dialog" aria-modal="true" aria-labelledby="td7Title" tabindex="-1">
<div class="td7-header"><div><div class="td7-overline">ЭКСПЕРТИЗА • ВЕЩЕСТВЕННОЕ ДОКАЗАТЕЛЬСТВО</div><h2 class="td7-title" id="td7Title">Улика</h2></div><button class="td7-close" type="button" data-td7="close" aria-label="Закрыть осмотр">×</button></div>
<div class="td7-main"><div class="td7-viewport" id="td7Viewport" aria-label="Объёмный предмет. Перетаскивай для вращения, колёсиком приближай">
<div class="td7-light"></div><div class="td7-podium"></div><div class="td7-orbit" id="td7Orbit"></div><div class="td7-zoom-hud"><span class="td7-zoom-value" id="td7ZoomText">100%</span></div>
<div class="td7-drag-hint">↔ ВРАЩАЙ • КОЛЁСИКО / ЩИПОК ДЛЯ ПРИБЛИЖЕНИЯ</div></div>
<aside class="td7-side"><div><span class="td7-kicker">НАЙДЕННАЯ УЛИКА</span><h3 id="td7SubTitle"></h3><p id="td7Lead"></p></div>
<div class="td7-controls"><button type="button" data-td7="minus" title="Отдалить">−</button><button type="button" data-td7="reset" title="Вернуть исходный ракурс">⟲ Сброс</button><button type="button" data-td7="plus" title="Приблизить">＋</button><button type="button" class="td7-flip" data-td7="flip">⤾ ПЕРЕВЕРНУТЬ ПРЕДМЕТ</button></div>
<div class="td7-inspection-note" id="td7Note" aria-live="polite">Осмотри все стороны предмета. На обратной стороне может быть подсказка.</div>
<div class="td7-progress" id="td7Status"><i></i><span id="td7StatusText">Ожидается осмотр</span></div>
</aside></div></div>`;
document.body.appendChild(panel);
const viewport=$('td7Viewport'), orbit=$('td7Orbit'), obj=()=> $('td7Object');
let active=false,currentKey='',facing=false,raf=0,lastFocus=null;
const pos={x:-12,y:22,z:1,tx:-12,ty:22,tz:1,px:0,py:0,tpx:0,tpy:0};
const pointers=new Map();let moveKind='rotate',lastX=0,lastY=0,pinchBase=1,pinchZoom=1;
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const reverseAngle=()=>Math.abs((((pos.ty%360)+360)%360)-180)<74;
function keyOfTitle(title){const t=title.trim();return clues[t]||Object.keys(DATA).find(k=>DATA[k].title===t)||null;}
function sceneCase(){let c=document.getElementById('caseCity');return c?c.textContent.trim():'ГОРОД';}
function setNote(key){const d=DATA[key],id='td7_inspected_'+sceneCase()+'_'+key;let done=false;try{done=sessionStorage.getItem(id)==='1'}catch(e){}
 $('td7Note').textContent=done?`✦ Обнаружено: ${d.hidden}`:'Осмотри все стороны предмета. На обратной стороне может быть подсказка.';
 $('td7Status').classList.toggle('is-found',done);$('td7StatusText').textContent=done?'Обратная сторона изучена':'Обратная сторона не изучена';
 if(reverseAngle()&&!done){try{sessionStorage.setItem(id,'1')}catch(e){}$('td7Note').textContent=`✦ Обнаружено: ${d.hidden}`;$('td7Status').classList.add('is-found');$('td7StatusText').textContent='Секретная пометка найдена';}
}
function draw(){if(!active){raf=0;return;}
 const ease=reduced.matches?1:.15;
 pos.x+=(pos.tx-pos.x)*ease;pos.y+=(pos.ty-pos.y)*ease;pos.z+=(pos.tz-pos.z)*ease;
 pos.px+=(pos.tpx-pos.px)*ease;pos.py+=(pos.tpy-pos.py)*ease;
 const el=obj();if(el){el.style.setProperty('--rot-x',pos.x.toFixed(2)+'deg');el.style.setProperty('--rot-y',pos.y.toFixed(2)+'deg');el.style.setProperty('--zoom',pos.z.toFixed(3));}
 orbit.style.setProperty('--pan-x',pos.px.toFixed(1)+'px');orbit.style.setProperty('--pan-y',pos.py.toFixed(1)+'px');
 $('td7ZoomText').textContent=Math.round(pos.tz*100)+'%';
 if(!facing&&reverseAngle()){facing=true;setNote(currentKey)}else if(facing&&!reverseAngle())facing=false;
 raf=requestAnimationFrame(draw);
}
function zoom(n){pos.tz=clamp(n,.65,2.9);}
function reset(){pos.tx=-12;pos.ty=22;pos.tz=1;pos.tpx=0;pos.tpy=0;}
function flip(){pos.ty+=180;}
function open(key){const d=DATA[key];if(!d)return;
 currentKey=key;facing=false;reset();pos.x=-12;pos.y=22;pos.z=.78;pos.px=pos.py=0;
 orbit.innerHTML=makeObject(d);$('td7Title').textContent=d.title;$('td7SubTitle').textContent=d.title;$('td7Lead').textContent=d.lead;
 lastFocus=document.activeElement;panel.hidden=false;legacy.hidden=true;active=true;document.documentElement.classList.add('td7-inspecting');
 setNote(key);raf&&cancelAnimationFrame(raf);raf=requestAnimationFrame(draw);
 panel.querySelector('.td7-close').focus({preventScroll:true});
}
function close(){if(!active)return;active=false;panel.hidden=true;document.documentElement.classList.remove('td7-inspecting');pointers.clear();
 if(raf)cancelAnimationFrame(raf);raf=0;lastFocus?.focus?.({preventScroll:true});}
const originalObserver=new MutationObserver(()=>{
 if(legacy.hidden||active)return;
 const key=keyOfTitle($('v5Title')?.textContent||'');if(key){legacy.hidden=true;open(key);}
});originalObserver.observe(legacy,{attributes:true,attributeFilter:['hidden']});
// Existing game engine still handles clue discovery. We only replace the viewer when it opens.
legacy.hidden=true;
function tapAction(a){if(a==='close')close();else if(a==='flip')flip();else if(a==='reset')reset();else if(a==='plus')zoom(pos.tz+.25);else if(a==='minus')zoom(pos.tz-.25);}
panel.addEventListener('click',e=>{const el=e.target.closest('[data-td7]');if(el)tapAction(el.dataset.td7)});
function distance(){const a=[...pointers.values()];return a.length>=2?Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y):0;}
viewport.addEventListener('pointerdown',e=>{if(!active)return;const pt={x:e.clientX,y:e.clientY};pointers.set(e.pointerId,pt);viewport.setPointerCapture?.(e.pointerId);
 if(pointers.size===2){pinchBase=distance();pinchZoom=pos.tz;}else{lastX=e.clientX;lastY=e.clientY;moveKind=e.button===2||e.shiftKey?'pan':'rotate';}});
viewport.addEventListener('pointermove',e=>{if(!active||!pointers.has(e.pointerId))return;const previous=pointers.get(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size>=2){if(pinchBase>0)zoom(pinchZoom*distance()/pinchBase);return;}
 const dx=e.clientX-previous.x,dy=e.clientY-previous.y;
 if(moveKind==='pan'&&pos.tz>1){pos.tpx=clamp(pos.tpx+dx,-250,250);pos.tpy=clamp(pos.tpy+dy,-180,180)}else{pos.ty+=dx*.47;pos.tx=clamp(pos.tx-dy*.37,-78,78);}
});
function lift(e){pointers.delete(e.pointerId);if(pointers.size===1){const p=[...pointers.values()][0];lastX=p.x;lastY=p.y;}else if(!pointers.size){pinchBase=0;}}
viewport.addEventListener('pointerup',lift);viewport.addEventListener('pointercancel',lift);
viewport.addEventListener('wheel',e=>{if(!active)return;e.preventDefault();zoom(pos.tz*(e.deltaY>0?.89:1.12));},{passive:false});
viewport.addEventListener('contextmenu',e=>e.preventDefault());
viewport.addEventListener('dblclick',e=>{e.preventDefault();flip()});
document.addEventListener('keydown',e=>{if(!active)return;
 if(e.key==='Escape'){e.preventDefault();close();return;}
 if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','+','=','-','0','f','F'].includes(e.key)){
  e.preventDefault();if(e.key==='ArrowLeft')pos.ty-=18;else if(e.key==='ArrowRight')pos.ty+=18;else if(e.key==='ArrowUp')pos.tx=clamp(pos.tx+15,-78,78);else if(e.key==='ArrowDown')pos.tx=clamp(pos.tx-15,-78,78);else if(e.key==='+'||e.key==='=')zoom(pos.tz+.2);else if(e.key==='-')zoom(pos.tz-.2);else if(e.key==='0')reset();else flip();
 }
});
// Cinematic micro-zoom on clicking a clue in the world before opening it.
const scene=$('gameScene');let lensTimer=0;
scene?.addEventListener('click',e=>{const hit=e.target.closest('[data-hot]');if(!hit)return;
 const img=scene.querySelector('.room-photo');if(!img)return;
 const rect=img.getBoundingClientRect(),r=hit.getBoundingClientRect();const x=(r.left+r.width/2-rect.left)/rect.width*100,y=(r.top+r.height/2-rect.top)/rect.height*100;
 img.style.transformOrigin=`${clamp(x,5,95).toFixed(1)}% ${clamp(y,5,95).toFixed(1)}%`;
 scene.classList.add('td7-camera-focus');clearTimeout(lensTimer);lensTimer=setTimeout(()=>{scene.classList.remove('td7-camera-focus')},770);
},{capture:true});
// Add clear interaction hints without replacing any stage logic.
const list=$('clueList');const mutate=new MutationObserver(()=>{
 for(const clue of list.querySelectorAll('[data-clue]')){
  if(clue.querySelector('.td7-clue-hint'))continue;
  const tip=document.createElement('div');tip.className='td7-clue-hint';tip.textContent='⤾ ВРАЩАТЬ • ПРИБЛИЖАТЬ';clue.appendChild(tip);
 }
});if(list){mutate.observe(list,{childList:true});}
window.TDInspectorVersion='7.0';
})();