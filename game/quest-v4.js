/* Cinematic gameplay layer: original case logic, state and 7 stages remain intact */
(()=>{
 const IMG={map:'photo-map.webp',window:'photo-record.webp',ticket:'photo-coin.webp',page:'photo-journal.webp',lock:'photo-room.webp',photo:'room.webp',witness:'photo-record.webp',time:'photo-map.webp',final:'room.webp'};
 const LABEL={map:'Карта',window:'Запись',ticket:'Жетон',page:'Дневник'};
 const CIRCLE={map:[54.5,80],window:[71.5,44],ticket:[93.4,72],page:[16.2,74]};
 const IMAGE='./room.webp';
 function dot(key){const [x,y]=CIRCLE[key];return `<button type="button" class="scene-hot ${found(key)?'found':''}" data-hot="${key}" data-label="${LABEL[key]}" style="left:${x}%;top:${y}%" aria-label="Изучить: ${LABEL[key]}" title="${LABEL[key]}">${found(key)?'✓':'⌕'}</button>`}
 const sceneBase=()=>`<img class="room-photo" src="${IMAGE}" alt="Детализированная игровая сцена. Старый архив, карта, документы, техника и окно с видом на порт" draggable="false"><div class="room-vignette"></div>`;
 roomArt=function(){
  let result=sceneBase();
  if(state?.stage===2){return result+`<div class="quest-lock"><div class="quest-safe"><strong>АРХИВНЫЙ ЗАМОК</strong><div class="safe-display" id="scenePinDisplay">•••</div><div class="safe-digits">${[1,2,3,4,5,6,7,8,9,'⌫',0,'OK'].map(v=>`<button type="button" data-safe="${v}" aria-label="Клавиша ${v}">${v}</button>`).join('')}</div></div></div>`}
  if(state?.stage===4){return result+`<div class="scene-heading"><strong>ДОПРОС СВИДЕТЕЛЕЙ</strong><small>Улика: запись охраны 20:40</small></div>`}
  return result+`<div class="scene-heading"><strong>ОСМОТР МЕСТА ПРОИСШЕСТВИЯ</strong><small>${['map','window','ticket','page'].filter(found).length} / 4 найдено</small></div>${Object.keys(CIRCLE).map(dot).join('')}<button class="scene-decoy" data-decoy="photo" style="left:16.2%;top:15.5%" title="Изучить старую фотографию" aria-label="Изучить старую фотографию">⌕</button><button class="scene-decoy" data-decoy="lamp" style="left:33%;top:25%" title="Осмотреть лампу" aria-label="Осмотреть лампу">⌕</button><div class="scene-tutorial">◉ Осматривай предметы, находи улики и открывай новые этапы</div>`;
 };
 const oldSceneSet=sceneSet;
 sceneSet=function(art){
  if(typeof art==='string' && art.trim().startsWith('<svg')){
   const step=state?.stage||0;
   const captions=['НОВОЕ ДЕЛО · ДОСЬЕ ОТКРЫТО','ОСМОТР МЕСТА','КОДОВЫЙ ЗАМОК','ВОССТАНОВЛЕНИЕ ФОТОГРАФИИ','ДОПРОС','ВОССТАНОВЛЕНИЕ ХРОНОЛОГИИ',state?.cleared?.includes(6)?'ДЕЛО РАСКРЫТО':'ФИНАЛЬНЫЙ ВЕРДИКТ'];
   const label=captions[step]||'РАССЛЕДОВАНИЕ';
   return oldSceneSet(`${sceneBase()}<div class="quest-overview"><strong>${label}</strong></div>`)
  }
  return oldSceneSet(art);
 };
 drawPhoto=function(){
  const root=document.getElementById('photoBoard');if(!root)return;
  root.innerHTML=state.shots.map((tile,i)=>`<button class="photo-tile ${tileSelected===i?'selected':''}" data-tile="${i}" aria-label="Фрагмент ${i+1}"><span class="tile-art" style="--tx:${tile%3};--ty:${Math.floor(tile/3)};background-image:url('${IMAGE}')"></span></button>`).join('');
 };
 drawClues=function(){
  const n=state.clues.length;document.getElementById('clueCount').textContent=`${n} / 9`;
  document.getElementById('clueList').innerHTML=state.clues.map(k=>{
   let e=clueDescriptions[k];
   return `<button type="button" class="clue" data-clue="${k}" aria-label="Посмотреть улику ${e[0]}"><img class="clue-thumb" src="./${IMG[k]||'photo-room.webp'}" alt="Иллюстрация улики"><span class="clue-body"><b>✦ ${e[0]}</b><span>${e[1]}</span></span></button>`;
  }).join('')+(n===0?'<div class="clue empty">Улик пока нет. Начни осмотр комнаты.</div>':'');
 };
 const modal=document.createElement('div');modal.id='evidenceViewer';modal.className='clue-viewer';modal.setAttribute('hidden','');modal.innerHTML='<div class="clue-viewer-inner" role="dialog" aria-modal="true" aria-label="Просмотр улики"><button class="clue-viewer-close" id="clueClose" aria-label="Закрыть">×</button><img id="clueViewImage" src="" alt="Улика крупным планом"><div class="clue-viewer-copy"><small>АРХИВ НАЙДЕННЫХ УЛИК</small><h2 id="clueViewTitle"></h2><p id="clueViewText"></p><div class="clue-viewer-foot">Улика сохранена в досье. Вернись к осмотру, чтобы продолжить.</div></div></div>';
 document.getElementById('game').appendChild(modal);
 function viewClue(key){if(!found(key))return;const x=clueDescriptions[key];if(!x)return;
  document.getElementById('clueViewImage').src='./'+(IMG[key]||'photo-room.webp');
  document.getElementById('clueViewTitle').textContent=x[0];document.getElementById('clueViewText').textContent=x[1];
  modal.hidden=false;document.getElementById('clueClose').focus();
 }
 function closeClue(){modal.hidden=true}
 document.getElementById('clueClose').addEventListener('click',closeClue);
 modal.addEventListener('click',e=>{if(e.target===modal)closeClue()});
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!modal.hidden)closeClue()});
 document.getElementById('clueList').addEventListener('click',e=>{const b=e.target.closest('[data-clue]');if(b)viewClue(b.dataset.clue)});
 document.getElementById('gameScene').addEventListener('click',e=>{
  const dot=e.target.closest('[data-hot]');if(dot){const key=dot.dataset.hot;setTimeout(()=>viewClue(key),25);return}
  const decoy=e.target.closest('[data-decoy]');if(decoy){feedback(decoy.dataset.decoy==='photo'?'На старой фотографии нет отметок о пропавшем предмете. Найди другие следы.':'Лампа исправна и не имеет отношения к исчезновению. Продолжай осмотр.');return}
  const safe=e.target.closest('[data-safe]');if(safe){const inp=document.getElementById('pinInput');if(!inp)return;const d=safe.dataset.safe;let val=inp.value;if(d==='⌫')val=val.slice(0,-1);else if(d==='OK'){handleGameAction('checkPin');return}else if(val.length<3)val+=d;inp.value=val;const screen=document.getElementById('scenePinDisplay');if(screen)screen.textContent=(val+'•••').slice(0,3);inp.focus();return}
 });
 // Reuse original stage and puzzle logic; don't duplicate listeners or state.
 document.addEventListener('click',e=>{if(e.target.matches('.game-head-buttons #hintButton')){setTimeout(()=>{const fb=document.getElementById('gameFeedback');fb?.scrollIntoView({behavior:'smooth',block:'nearest'})},0)}});
})();