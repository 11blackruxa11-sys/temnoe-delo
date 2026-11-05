/* TЁМНОЕ ДЕЛО / immersive investigation engine 8.0
   Real interactive 2.5D scene, camera, object inspection, puzzles, sound and persistent progress.
   Preserves the existing seven-stage case logic and 40-city catalogue. */
(function(){
'use strict';
const game=document.getElementById('game');
if(!game||typeof window.enterGame!=='function'||typeof window.renderGame!=='function')return;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const STAGES=['Получить дело','Осмотр места','Секретный замок','Восстановить кадр','Допрос','Линия времени','Вердикт'];
const KIND={map:'Схема квартала',window:'Запись охраны',ticket:'Медный жетон',page:'Дневник архивариуса',lock:'Сломанная пломба',photo:'Восстановленный снимок',witness:'Ложные показания',time:'Линия времени',final:'Дело закрыто'};
const THUMB={map:'clue-map-v6.webp',window:'clue-record-v6.webp',ticket:'clue-coin-v6.webp',page:'clue-journal-v6.webp',lock:'scene-safe-v6.webp',photo:'clue-photo-v6.webp',witness:'clue-record-v6.webp',time:'clue-map-v6.webp',final:'clue-photo-v6.webp'};
const SCENE={office:'scene-office-v6.webp',safe:'scene-safe-v6.webp'};
const LOCATIONS=[
 {key:'map',x:53,y:79,name:'План маршрутов',tag:'Чертёж на столе'},
 {key:'window',x:74,y:40,name:'Запись охраны',tag:'Часы у окна'},
 {key:'ticket',x:32,y:77,name:'Медный жетон',tag:'На краю стола'},
 {key:'page',x:26,y:52,name:'Дневник',tag:'Бумаги архивариуса'}
];
const FALSE_MARKERS=[{x:11,y:42,name:'Светильник',text:'Лампа слегка гудит, но к исчезновению предмета не имеет отношения.'},{x:90,y:42,name:'Книжная полка',text:'Старые атласы. Ничего важного для этого дела.'}];
const HINTS8=[
 'Прочитай вводную и прими дело.',
 'Найди четыре улики: маршрут, отметку у окна, медный жетон и страницу дневника. Каждую можно перевернуть.',
 'Порядок в дневнике: маршрут → окно → жетон. Цифры: 3, 1 и 4.',
 'Поменяй местами два фрагмента. Нужно восстановить изображение целиком.',
 'Сравни слова курьера с записью охраны. После 20:40 дверь была опечатана.',
 'Сортируй по времени: 19:30, затем 20:10, 20:40 и 21:00.',
 'Курьер подменил предмет ещё до закрытия, а поздний звонок был отвлекающим манёвром.'
];
const LINES=[
 '19:30 · Смотритель покидает архив',
 '20:10 · Курьер получает пакет',
 '20:40 · Охрана опечатывает дверь',
 '21:00 · Кто-то звонит в архив'
];
let active=false,editing=false,selectedTile=null,fromDrag=null,lastStage=-1,focusTimer=0,rafId=0,px=0,py=0,pr=0;
const camera={x:0,y:0,z:1,tx:0,ty:0,tz:1,down:false,id:null,startX:0,startY:0,baseX:0,baseY:0};
const extra={sound:false,xp:0,plays:0,clockStart:Date.now(),focussed:false,reels:[0,0,0],who:'',way:'',why:''};
let audioContext=null;
let sceneCanvas=null, specks=[],particleRaf=0,particleThen=0;
const reduce=window.matchMedia('(prefers-reduced-motion: reduce)');
const root=document.createElement('section');root.id='td8Root';root.className='td8';root.setAttribute('aria-label','Игровое расследование');
game.insertBefore(root,game.firstElementChild);
function metaKey(){return 'td8_meta_v1_'+caseId;}
function loadMeta(){try{const d=JSON.parse(localStorage.getItem(metaKey())||'{}');extra.xp=Number(d.xp)||0;extra.sound=!!d.sound;}catch(e){extra.xp=0;extra.sound=false;}extra.reels=[0,0,0];extra.who=extra.way=extra.why='';}
function saveMeta(){try{localStorage.setItem(metaKey(),JSON.stringify({xp:extra.xp,sound:extra.sound}))}catch(e){}}
function tone(type='tap'){
 if(!extra.sound)return;
 try{audioContext=audioContext||new (window.AudioContext||window.webkitAudioContext)();if(audioContext.state==='suspended')audioContext.resume();let t=audioContext.currentTime;
 const osc=audioContext.createOscillator(),g=audioContext.createGain();osc.connect(g);g.connect(audioContext.destination);
 let first=type==='win'?720:type==='found'?520:type==='bad'?130:320,second=type==='win'?1080:type==='found'?790:type==='bad'?80:415;
 osc.type=type==='win'?'sine':'triangle';osc.frequency.setValueAtTime(first,t);osc.frequency.exponentialRampToValueAtTime(second,t+.16);
 g.gain.setValueAtTime(.001,t);g.gain.exponentialRampToValueAtTime(.09,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+.27);osc.start(t);osc.stop(t+.28);
 }catch(e){}
}
function award(n,message){extra.xp+=n;saveMeta();tone(n>=50?'win':'found');let e=document.createElement('div');e.className='td8-reward';e.textContent='+'+n+' XP · '+message;root.appendChild(e);setTimeout(()=>e.remove(),1900);}
function say(msg,success=false){const el=root.querySelector('.td8-toast');if(!el)return;el.className='td8-toast '+(success?'ok':'');el.textContent=msg;el.hidden=false;clearTimeout(say.timer);say.timer=setTimeout(()=>{el.hidden=true},3200);tone(success?'found':'bad');}
function siteCase(){return CITIES[caseId]||CITIES[0]}
function seen(k){return state.clues.includes(k)}
function countFind(){return LOCATIONS.filter(p=>seen(p.key)).length}
function completed(){return state.cleared.length}
function setStage(i){const max=Math.max(state.highestStage||0,state.stage);if(i>max)return;state.stage=i;persist();renderGame();}
function boot(){if(active)return;active=true;loadMeta();lastStage=-1;camera.x=camera.tx=0;camera.y=camera.ty=0;camera.z=camera.tz=1;
 game.classList.add('td8-active');document.body.classList.add('td8-in-game');render();loop();}
function stop(){active=false;game.classList.remove('td8-active');document.body.classList.remove('td8-in-game');cancelAnimationFrame(rafId);rafId=0;cancelAnimationFrame(particleRaf);particleRaf=0;root.innerHTML='';}
function shell(){const c=siteCase();
 const percent=Math.round(completed()/7*100);let number=String(caseId+1).padStart(3,'0');
 return `<div class="td8-topbar">
 <button class="td8-back" data-a="back" aria-label="Назад к городам"><span>‹</span> ВЫБРАТЬ ГОРОД</button>
 <div class="td8-case-id"><span>АРХИВ / ДЕЛО №${number}</span><strong>${esc(c.city.toUpperCase())}</strong><small>${esc(c.title)}</small></div>
 <div class="td8-right-top"><div class="td8-progress"><span>РАССЛЕДОВАНИЕ <b>${percent}%</b></span><i><em style="width:${percent}%"></em></i></div>
 <button class="td8-top-icon" data-a="sound" title="Включить или выключить звуки" aria-label="Звуки">${extra.sound?'♫':'♪̸'}</button>
 <button class="td8-top-icon" data-a="fullscreen" title="Полный экран" aria-label="Полный экран">⛶</button></div></div>
 <div class="td8-layout"><nav class="td8-nav" aria-label="Этапы расследования"><div class="td8-label">МАРШРУТ РАССЛЕДОВАНИЯ</div>
 ${STAGES.map((name,i)=>`<button data-a="stage" data-n="${i}" class="td8-step ${state.stage===i?'is-current':''} ${state.cleared.includes(i)?'is-done':''}" ${i>Math.max(state.highestStage||0,state.stage)?'disabled':''}><span>${state.cleared.includes(i)?'✓':String(i+1).padStart(2,'0')}</span><b>${name}</b>${i===state.stage?'<i></i>':''}</button>`).join('')}
 <div class="td8-nav-footer"><span>✦</span><div>ТВОЙ ОПЫТ<strong>${extra.xp} XP</strong></div></div></nav>
 <main class="td8-center"><div class="td8-stage-overline"><span>ГЛАВА ${String(state.stage+1).padStart(2,'0')} / 07</span><span class="td8-live">● ЖИВОЕ РАССЛЕДОВАНИЕ</span></div>
 <div id="td8Theatre" class="td8-theatre" aria-label="Игровая сцена: двигай для обзора, приближай колёсиком мыши">
 <div class="td8-scene-move" id="td8SceneMove"><img id="td8Backdrop" class="td8-backdrop" src="./${state.stage===2?SCENE.safe:SCENE.office}" alt="Стилизованная комната архивариуса: ночь, документы и предметы расследования" draggable="false"><div class="td8-colorwash"></div><div id="td8Targets" class="td8-targets"></div></div>
 <div class="td8-noise" aria-hidden="true"></div><div class="td8-sheen" aria-hidden="true"></div><canvas class="td8-stars" aria-hidden="true"></canvas>
 <div class="td8-scene-top"><strong>${STAGES[state.stage].toUpperCase()}</strong><span>${state.stage===1?'НАЖМИ НА ПРЕДМЕТ':state.stage===2?'НАСТРОЙ БАРАБАНЫ':state.stage===3?'ВОССТАНОВИ ФОТО':'СОБЕРИ ДОКАЗАТЕЛЬСТВА'}</span></div>
 <div class="td8-camera-controls"><button data-a="zoomout" title="Отдалить" aria-label="Отдалить">−</button><span id="td8Zoom">100%</span><button data-a="zoomin" title="Приблизить" aria-label="Приблизить">＋</button><button data-a="camreset" title="Сбросить камеру" aria-label="Сбросить камеру">⟲</button></div>
 <div class="td8-tutorial">↔ ПЕРЕТАСКИВАЙ СЦЕНУ <span>·</span> КОЛЁСИКО / ЩИПОК: ЗУМ</div></div>
 <section class="td8-mission" id="td8Mission"></section></main>
 <aside class="td8-inventory"><div class="td8-label">ДОСЬЕ <span>${state.clues.length} / 9</span></div><p class="td8-sub">Собранные вещественные доказательства</p><div id="td8Items" class="td8-items"></div><div class="td8-inventory-footer"><button data-a="evidence-board">⊞ ДОСКА ВЕРСИЙ</button><span>Нажми на улику, чтобы изучить её со всех сторон</span></div></aside></div>
 <div class="td8-toast" hidden></div><div id="td8Modal" class="td8-modal" hidden></div>`;
}
function drawInventory(){const p=$('td8Items');if(!p)return;
 p.innerHTML=(state.clues.length?state.clues.map((key,i)=>`<button class="td8-item" data-a="inspect" data-key="${key}" title="Покрутить улику: ${esc(KIND[key]||key)}"><div class="td8-item-art"><img src="./${THUMB[key]||SCENE.office}" alt="" loading="lazy"><span class="td8-check">✓</span></div><div><b>${esc(KIND[key]||key)}</b><small>ОСМОТРЕТЬ ↗</small></div></button>`).join(''):'<div class="td8-empty"><span>⌕</span>Здесь появятся улики, когда ты начнёшь исследование.</div>');
}
function hotspots(){const p=$('td8Targets');if(!p)return;
 p.innerHTML=LOCATIONS.map((h,i)=>`<button class="td8-hotspot ${seen(h.key)?'is-found':''}" data-a="find" data-key="${h.key}" data-x="${h.x}" data-y="${h.y}" style="left:${h.x}%;top:${h.y}%" aria-label="Осмотреть ${h.name}"><span class="td8-halo"></span><span class="td8-cross">${seen(h.key)?'✓':'⌕'}</span><span class="td8-tooltip"><strong>${esc(h.name)}</strong><small>${esc(seen(h.key)?'НАЙДЕНО · ПОВТОРНО ОСМОТРЕТЬ':h.tag)}</small></span></button>`).join('')+FALSE_MARKERS.map((d,i)=>`<button class="td8-hotspot td8-decoy" data-a="decoy" data-i="${i}" style="left:${d.x}%;top:${d.y}%" aria-label="Осмотреть ${d.name}"><span class="td8-halo"></span><span class="td8-cross">·</span><span class="td8-tooltip"><strong>${esc(d.name)}</strong></span></button>`).join('');
}
function button(label,action,extraClass=''){return `<button class="td8-cta ${extraClass}" data-a="${action}">${label} <span>↗</span></button>`}
function mission(){const el=$('td8Mission');if(!el)return;
 const c=siteCase();let title='',description='',inner='';
 switch(state.stage){
  case 0:
   title='Начинается новое дело';description=`${esc(c.city)}. Из городского архива исчезла ценная находка. Последняя запись обрывается в 20:40. У тебя есть подозреваемые, несколько странных отметок и семь этапов расследования.`;
   inner=`<div class="td8-chips"><span>◉ 7 этапов</span><span>◆ 9 улик</span><span>⏱ 30–50 минут на пилотное дело</span></div>${button('ПРИНЯТЬ ДЕЛО','start')}`;break;
  case 1:
   title='Найди четыре улики';description='Осматривай комнату, приближай стол, проверь дневник и записи охраны. Важное часто спрятано на обороте предмета.';
   inner=`<div class="td8-mission-progress"><span>НАЙДЕНО</span><strong>${countFind()} / 4</strong><div><i style="width:${countFind()*25}%"></i></div></div>${countFind()>=4?button('ПЕРЕЙТИ К ЗАМКУ','next'):'<div class="td8-hintline">Подсвеченные точки можно нажимать. Все найденные предметы останутся в досье.</div>'}`;break;
  case 2:
   title='Сейф с трёхзначным кодом';description='В дневнике записан порядок: маршрут → окно → жетон. Поворачивай барабаны колёсиком, свайпом или кнопками.';
   inner=`<div class="td8-safe-work"><div class="td8-dials" aria-label="Трёхзначный код">${extra.reels.map((n,i)=>`<div class="td8-dial" data-reel="${i}"><button data-a="reel" data-i="${i}" data-d="1" aria-label="Увеличить цифру">⌃</button><div class="td8-dial-digit">${n}</div><button data-a="reel" data-i="${i}" data-d="-1" aria-label="Уменьшить цифру">⌄</button></div>`).join('')}</div>${button('ОТКРЫТЬ ЗАМОК','unlock')}</div>`;break;
  case 3:
   title='Восстанови найденный кадр';description='Камера сняла неизвестного у архива, но изображение рассыпалось на фрагменты. Меняй плитки местами, пока не соберёшь снимок.';
   inner=`<div class="td8-puzzle-wrap"><div class="td8-puzzle" id="td8Puzzle" aria-label="Головоломка из девяти фрагментов">${state.shots.map((k,i)=>`<button class="td8-tile ${selectedTile===i?'is-selected':''}" draggable="true" data-tile="${i}" title="Фрагмент ${i+1}" aria-label="Фрагмент ${i+1}"><span style="background-image:url('./clue-photo-v6.webp');background-position:${k%3*50}% ${Math.floor(k/3)*50}%"></span></button>`).join('')}</div><div class="td8-puzzle-help"><b>КАК СОБРАТЬ</b><p>Нажми одну плитку, затем другую. На компьютере их можно перетаскивать.</p><button data-a="puzzlehint">✧ ПОМОЩЬ</button><button data-a="puzzlereset">↺ ПЕРЕМЕШАТЬ</button></div></div>`;break;
  case 4:
   title='Кто-то врёт';description='После 20:40 дверь архива больше не открывали. Но один из свидетелей утверждает обратное. Кто говорит неправду?';
   inner=`<div class="td8-dialogue"><div class="td8-dialogue-head">ЗАПИСЬ С ОПРОСА · 21:12 <span>● REC</span></div>
   ${[['guard','Смотритель','«В 19:30 я ушёл домой, как всегда».'],['courier','Курьер','«Лично вошёл через главную дверь около 21:00».'],['resident','Соседка','«Слышала звонок около девяти, но никого не видела».']].map(([key,name,words])=>`<button data-a="witness" data-w="${key}" class="td8-answer"><span>❝</span><b>${name}</b><small>${words}</small><i>ПРОВЕРИТЬ ↗</i></button>`).join('')}</div>`;break;
  case 5:
   title='Восстанови хронологию';description='Поставь четыре события в правильной последовательности. Перетаскивай карточки или пользуйся стрелками.';
   inner=`<div class="td8-timeline" id="td8Timeline">${state.sequence.map((n,i)=>`<div class="td8-time-card" draggable="true" data-order="${i}"><span>${String(i+1).padStart(2,'0')}</span><b>${LINES[n]}</b><div><button data-a="move" data-i="${i}" data-d="-1" ${i===0?'disabled':''} aria-label="Поднять событие">↑</button><button data-a="move" data-i="${i}" data-d="1" ${i===3?'disabled':''} aria-label="Опустить событие">↓</button></div></div>`).join('')}</div>${button('ПРОВЕРИТЬ ХРОНОЛОГИЮ','timelinecheck')}`;break;
  case 6:
   if(state.cleared.includes(6)){
    title='Дело раскрыто!';description='Ты сопоставил показания с уликами и восстановил последовательность событий. Разгадка найдена.';
    inner=`<div class="td8-finale"><div>✓</div><strong>РАССЛЕДОВАНИЕ ЗАКРЫТО</strong><p>Все доказательства собраны. Игра сохранила твой прогресс.</p>${button('ВЫБРАТЬ ДРУГОЙ ГОРОД','back')}${button('СЫГРАТЬ ЕЩЁ РАЗ','replay','secondary')}</div>`;
   }else{
    title='Собери окончательную версию';description='Кто подменил архивный предмет? Как это произошло и зачем понадобился звонок? Выбери объяснение, которое подтверждают все улики.';
    inner=`<div class="td8-verdict"><label>КТО?<select id="td8Who"><option value="">Выбрать подозреваемого</option><option value="guard">Смотритель</option><option value="courier" ${extra.who==='courier'?'selected':''}>Курьер</option><option value="resident">Соседка</option></select></label><label>КОГДА?<select id="td8Way"><option value="">Время подмены</option><option value="after">После закрытия</option><option value="before" ${extra.way==='before'?'selected':''}>До опечатывания</option></select></label><label>ЗАЧЕМ ЗВОНОК?<select id="td8Why"><option value="">Выбери версию</option><option value="warning">Предупреждение</option><option value="distraction" ${extra.why==='distraction'?'selected':''}>Отвлечь охрану</option></select></label></div>${button('ЗАКРЫТЬ ДЕЛО','verdict')}`;
   }
 }
 el.innerHTML=`<div class="td8-mission-copy"><span class="td8-mission-tag">ЗАДАНИЕ · ${String(state.stage+1).padStart(2,'0')}</span><h2>${title}</h2><p>${description}</p></div><div class="td8-mission-action">${inner}</div>`;
}
function drawScene(){const targets=$('td8Targets'),scene=$('td8Theatre');if(!scene)return;scene.dataset.stage=String(state.stage);scene.classList.remove('td8-scene-swap');void scene.offsetWidth;scene.classList.add('td8-scene-swap');
 const img=$('td8Backdrop'),type=state.stage===2?'safe':'office';const src='./'+SCENE[type];if(img&&img.getAttribute('src')!==src)img.src=src;
 if(state.stage===1)hotspots();else if(targets)targets.innerHTML='';
 if(state.stage===0){if(targets)targets.innerHTML='<div class="td8-scene-center-title"><small>ДЕЛО ОТКРЫТО</small><strong>У каждой тайны<br>есть свой свидетель</strong><span>Тебе предстоит собрать картину по кусочкам.</span></div>'}
 if(state.stage===2){if(targets)targets.innerHTML='<div class="td8-safe-target"><span>↻</span><b>ШИФР ИЗ ТРЁХ ЦИФР</b><small>Собери код в панели снизу</small></div>'}
 if(state.stage===3){if(targets)targets.innerHTML='<div class="td8-scene-center-title"><small>УДАЛЁННЫЕ ФРАГМЕНТЫ</small><strong>Потерянный кадр</strong><span>Восстанови изображение в нижней панели</span></div>'}
 if(state.stage===4||state.stage===5||state.stage===6){if(targets)targets.innerHTML='<div class="td8-scene-center-title"><small>СЛЕДСТВЕННЫЙ ОТДЕЛ</small><strong>'+(['','','','','Показания расходятся','Время расставит всё','Доказательства говорят'][state.stage]||'Дело')+'</strong><span>Смотри на факты, а не на догадки</span></div>'}
 camera.tx=camera.ty=0;camera.tz=1;
 setupSpecks();
}
function render(){if(!active)return;const previous=lastStage;root.innerHTML=shell();drawInventory();mission();drawScene();lastStage=state.stage;
 if(previous!==state.stage&&previous>=0){const curtain=document.createElement('div');curtain.className='td8-transition';curtain.innerHTML=`<span>ГЛАВА ${String(state.stage+1).padStart(2,'0')}</span><strong>${STAGES[state.stage]}</strong>`;root.appendChild(curtain);setTimeout(()=>curtain.remove(),870)}
}
function zoom(delta){camera.tz=Math.min(2.65,Math.max(1,camera.tz+delta));$('td8Zoom').textContent=Math.round(camera.tz*100)+'%';}
function focusAt(x,y){camera.tz=1.42;camera.tx=Math.max(-180,Math.min(180,(50-x)*3));camera.ty=Math.max(-85,Math.min(85,(50-y)*2));}
function inspect(k){tone('tap');if(typeof window.TDInspectorOpen==='function'){window.TDInspectorOpen(k);return;}say('Инспектор недоступен. Обнови страницу.');}
function find(k,x,y){const fresh=!seen(k);focusAt(x,y);tone('tap');clearTimeout(focusTimer);
 focusTimer=setTimeout(()=>{if(fresh){clueAdd(k);if(active){award(35,'Улика найдена');render();}}inspect(k);},reduce.matches?10:280);
}
function advance(action){tone('tap');const old=state.stage;
 if(action==='start'){handleGameAction('start')}
 if(action==='next'){if(countFind()!==4){say('Сначала найди все четыре улики.');return;}handleGameAction('next')}
 if(state.stage!==old){award(65,'Этап завершён');render()}
}
function reel(i,d){extra.reels[i]=(extra.reels[i]+d+10)%10;tone('tap');mission()}
function unlock(){const code=extra.reels.join('');if(code==='314'){clueAdd('lock');completeStage(2);award(100,'Замок вскрыт');render();say('Сейф открыт, печать снята!',true)}else{say('Неверная комбинация. Изучи обратную сторону предметов.');root.querySelectorAll('.td8-dial-digit').forEach(x=>{x.classList.remove('shake');void x.offsetWidth;x.classList.add('shake')})}}
function swap(i,j){if(i===j){selectedTile=null;mission();return;}const a=state.shots;[a[i],a[j]]=[a[j],a[i]];persist();selectedTile=null;tone('tap');if(a.every((x,i)=>x===i)){clueAdd('photo');completeStage(3);award(120,'Кадр восстановлен');render();say('В кадре обнаружен важный предмет!',true)}else mission()}
function moveOrder(i,j){if(j<0||j>3||i===j)return;const v=state.sequence.splice(i,1)[0];state.sequence.splice(j,0,v);persist();tone('tap');mission()}
function checkTimeline(){if(state.sequence.every((v,i)=>v===i)){clueAdd('time');completeStage(5);award(90,'Хронология собрана');render();say('Все отметки совпали!',true)}else say('Последовательность неверна. Сверь время каждого события.')}
function checkVerdict(){const who=$('td8Who')?.value,way=$('td8Way')?.value,why=$('td8Why')?.value;
 Object.assign(extra,{who,way,why});if(who==='courier'&&way==='before'&&why==='distraction'){
 const oldWho=$('who'),oldWay=$('howway'),oldWhy=$('why');if(oldWho&&oldWay&&oldWhy){oldWho.value=who;oldWay.value=way;oldWhy.value=why;handleGameAction('verdict')}else{clueAdd('final');if(!state.cleared.includes(6))state.cleared.push(6);persist()}
 award(350,'Дело раскрыто');render();say('Поздравляем, версия подтверждена!',true);
 }else{say('Не все выводы подтверждаются уликами. Проверь хронологию и показания.');}}
function board(){const modal=$('td8Modal');if(!modal)return;modal.hidden=false;modal.innerHTML=`<div class="td8-modal-shade" data-a="closemodal"></div><div class="td8-board" role="dialog" aria-modal="true" aria-label="Доска версий"><button data-a="closemodal" class="td8-board-close" aria-label="Закрыть">×</button><div class="td8-label">ДОСКА РАССЛЕДОВАНИЯ</div><h2>Соедини детали в одну картину</h2><p>Каждая находка приближает к ответу. Нажми на карту, чтобы изучить её в объёме.</p><div class="td8-board-grid">${Object.keys(KIND).map((k,i)=>`<button class="td8-board-card ${seen(k)?'known':'unknown'}" ${seen(k)?`data-a="inspect" data-key="${k}"`:''}><img src="./${THUMB[k]}" alt="" loading="lazy"><b>${seen(k)?esc(KIND[k]):'НЕ НАЙДЕНО'}</b></button>`).join('')}</div><button class="td8-cta" data-a="closemodal">НАЗАД К ИГРЕ <span>↗</span></button></div>`;}
function closeModal(){const el=$('td8Modal');if(el){el.hidden=true;el.innerHTML='';}}
function hint(){state.hints++;persist();say(HINTS8[state.stage],true);if(state.stage===1){const p=LOCATIONS.find(p=>!seen(p.key));if(p){const t=root.querySelector('[data-key="'+p.key+'"][data-a="find"]');t?.classList.add('td8-highlight');setTimeout(()=>t?.classList.remove('td8-highlight'),3500)}}}
function fullscreen(){if(!document.fullscreenElement){(root.requestFullscreen||root.webkitRequestFullscreen)?.call(root)}else{document.exitFullscreen?.()}}
root.addEventListener('click',ev=>{
 const target=ev.target.closest('[data-a]');if(!target||!active)return;
 const a=target.dataset.a;const val=target.dataset.key;
 if(a==='back'){stop();leaveGame();return}
 if(a==='stage'){setStage(Number(target.dataset.n));return}
 if(a==='sound'){extra.sound=!extra.sound;saveMeta();render();tone('tap');return}
 if(a==='fullscreen'){fullscreen();return}
 if(a==='zoomout'){zoom(-.28);return}
 if(a==='zoomin'){zoom(.28);return}
 if(a==='camreset'){camera.tx=camera.ty=0;camera.tz=1;return}
 if(a==='find'){find(val,Number(target.dataset.x),Number(target.dataset.y));return}
 if(a==='decoy'){say(FALSE_MARKERS[Number(target.dataset.i)].text);return}
 if(a==='inspect'){closeModal();inspect(val);return}
 if(a==='evidence-board'){board();return}
 if(a==='closemodal'){closeModal();return}
 if(a==='start'||a==='next'){advance(a);return}
 if(a==='reel'){reel(Number(target.dataset.i),Number(target.dataset.d));return}
 if(a==='unlock'){unlock();return}
 if(a==='puzzlehint'){const wrong=state.shots.findIndex((n,i)=>n!==i);if(wrong>=0){state.hints++;swap(wrong,state.shots.indexOf(wrong));}return}
 if(a==='puzzlereset'){state.shots=[7,1,4,0,8,2,5,6,3];selectedTile=null;persist();mission();return}
 if(a==='witness'){if(target.dataset.w==='courier'){clueAdd('witness');completeStage(4);award(100,'Противоречие найдено');render();say('Показания курьера противоречат протоколу.',true)}else say('Эти слова не противоречат протоколу охраны.');return}
 if(a==='move'){moveOrder(Number(target.dataset.i),Number(target.dataset.i)+Number(target.dataset.d));return}
 if(a==='timelinecheck'){checkTimeline();return}
 if(a==='verdict'){checkVerdict();return}
 if(a==='replay'){if(confirm('Начать расследование заново? Сохранённые улики и этапы будут очищены.')){localStorage.removeItem(caseKey(caseId));state=defaultState(caseId);renderGame()}return}
 });
root.addEventListener('click',e=>{const t=e.target.closest('.td8-tile');if(!t||!active)return;const i=Number(t.dataset.tile);if(selectedTile==null){selectedTile=i;mission()}else swap(selectedTile,i)});
root.addEventListener('dragstart',e=>{const t=e.target.closest('.td8-tile, .td8-time-card');if(!t)return;fromDrag={type:t.classList.contains('td8-tile')?'tile':'time',index:Number(t.dataset.tile??t.dataset.order)};e.dataTransfer?.setData('text/plain',String(fromDrag.index));});
root.addEventListener('dragover',e=>{if(e.target.closest('.td8-tile, .td8-time-card'))e.preventDefault()});
root.addEventListener('drop',e=>{const t=e.target.closest('.td8-tile, .td8-time-card');if(!t||!fromDrag)return;e.preventDefault();let type=t.classList.contains('td8-tile')?'tile':'time';if(type===fromDrag.type){let to=Number(t.dataset.tile??t.dataset.order),from=fromDrag.index;if(type==='tile'){selectedTile=null;swap(from,to)}else moveOrder(from,to)}fromDrag=null});
root.addEventListener('wheel',e=>{const dial=e.target.closest('.td8-dial');if(dial){e.preventDefault();reel(Number(dial.dataset.reel),e.deltaY>0?-1:1);return}const viewport=e.target.closest('#td8Theatre');if(viewport){e.preventDefault();zoom(e.deltaY<0?.17:-.17)}},{passive:false});
let pinch=new Map(),pinchAt=0,pinchZoom=1;
root.addEventListener('pointerdown',e=>{if(!active)return;const theatre=e.target.closest('#td8Theatre');if(!theatre||e.target.closest('button'))return;pinch.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pinch.size===2){const v=[...pinch.values()];pinchAt=Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y);pinchZoom=camera.tz;camera.down=false;return}
 camera.down=true;camera.id=e.pointerId;camera.startX=e.clientX;camera.startY=e.clientY;camera.baseX=camera.tx;camera.baseY=camera.ty;theatre.setPointerCapture(e.pointerId);});
root.addEventListener('pointermove',e=>{if(!active)return;const theatre=e.target.closest('#td8Theatre');if(!theatre)return;const r=theatre.getBoundingClientRect();theatre.style.setProperty('--mx',((e.clientX-r.left)/r.width*100).toFixed(1)+'%');theatre.style.setProperty('--my',((e.clientY-r.top)/r.height*100).toFixed(1)+'%');
 if(pinch.has(e.pointerId))pinch.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pinch.size===2){const v=[...pinch.values()];if(pinchAt>0)camera.tz=Math.max(1,Math.min(2.65,pinchZoom*Math.hypot(v[0].x-v[1].x,v[0].y-v[1].y)/pinchAt));return}
 if(camera.down&&camera.id===e.pointerId){camera.tx=Math.max(-450,Math.min(450,camera.baseX+e.clientX-camera.startX));camera.ty=Math.max(-220,Math.min(220,camera.baseY+e.clientY-camera.startY));}
});
function endPointer(e){pinch.delete(e.pointerId);if(camera.id===e.pointerId)camera.down=false;if(pinch.size<2)pinchAt=0;}
root.addEventListener('pointerup',endPointer);root.addEventListener('pointercancel',endPointer);
root.addEventListener('dblclick',e=>{if(e.target.closest('#td8Theatre')&&!e.target.closest('button')){camera.tx=camera.ty=0;camera.tz=1}});
root.addEventListener('keydown',e=>{if(!active)return;if(document.getElementById('td7Inspector')?.hidden===false)return;
 if(e.key==='Escape'){closeModal();return}if(e.target.matches('input, select, textarea'))return;
 if(e.key==='+'||e.key==='='){zoom(.2);e.preventDefault()}else if(e.key==='-'){zoom(-.2);e.preventDefault()}
 else if(['a','d','w','s','ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){const dx=e.key==='a'||e.key==='ArrowLeft'?-40:e.key==='d'||e.key==='ArrowRight'?40:0;const dy=e.key==='w'||e.key==='ArrowUp'?-30:e.key==='s'||e.key==='ArrowDown'?30:0;camera.tx+=dx;camera.ty+=dy;e.preventDefault();}
 });
function loop(){if(!active){rafId=0;return}const m=reduce.matches?1:.13;
 for(const k of ['x','y','z'])camera[k]+=(camera['t'+k]-camera[k])*m;
 const stage=$('td8SceneMove');if(stage){stage.style.transform=`translate3d(${camera.x.toFixed(1)}px,${camera.y.toFixed(1)}px,0) scale(${camera.z.toFixed(3)})`;}
 const z=$('td8Zoom');if(z)z.textContent=Math.round(camera.tz*100)+'%';rafId=requestAnimationFrame(loop);
}
function setupSpecks(){sceneCanvas=root.querySelector('.td8-stars');if(!sceneCanvas)return;const r=sceneCanvas.getBoundingClientRect(),dpi=Math.min(window.devicePixelRatio||1,1.6);sceneCanvas.width=r.width*dpi;sceneCanvas.height=r.height*dpi;
 specks=Array.from({length:innerWidth<720?23:51},()=>({x:Math.random()*r.width,y:Math.random()*r.height,r:.45+Math.random()*1.35,v:.12+Math.random()*.28,a:.12+Math.random()*.48}));if(!particleRaf&&!reduce.matches){particleThen=0;particleRaf=requestAnimationFrame(speckLoop)}}
function speckLoop(t){particleRaf=0;if(!active||reduce.matches||!sceneCanvas||!sceneCanvas.isConnected)return;const ctx=sceneCanvas.getContext('2d'),r=sceneCanvas.getBoundingClientRect();if(!ctx)return;const dpi=sceneCanvas.width/Math.max(1,r.width);ctx.clearRect(0,0,sceneCanvas.width,sceneCanvas.height);ctx.save();ctx.scale(dpi,dpi);
 const dt=Math.min(2.5,(t-particleThen)/16||1);particleThen=t;for(const p of specks){p.y-=p.v*dt;if(p.y<0){p.y=r.height;p.x=Math.random()*r.width}ctx.fillStyle=`rgba(255,218,166,${p.a})`;ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()}ctx.restore();particleRaf=requestAnimationFrame(speckLoop)}
const previousEnter=window.enterGame;window.enterGame=function(id){previousEnter(id);if(active){loadMeta();lastStage=-1;render()}else boot();};
const previousLeave=window.leaveGame;window.leaveGame=function(){if(active)stop();return previousLeave.apply(this,arguments)};
const previousRender=window.renderGame;window.renderGame=function(){const result=previousRender.apply(this,arguments);if(active)render();return result};
if(!game.classList.contains('hidden'))boot();
window.TDGameEngine='8.0';
})();