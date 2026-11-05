/* ТЁМНОЕ ДЕЛО — cinematic motion and high-resolution assets, v6.
   Zero libraries. Works with existing stage engine and saved game state. */
(function(){
'use strict';
const BASE='./';
const ASSETS={
 office:BASE+'scene-office-v6.webp?v=6',
 safe:BASE+'scene-safe-v6.webp?v=6',
 map:BASE+'clue-map-v6.webp?v=6',
 window:BASE+'clue-record-v6.webp?v=6',
 page:BASE+'clue-journal-v6.webp?v=6',
 ticket:BASE+'clue-coin-v6.webp?v=6',
 lock:BASE+'scene-safe-v6.webp?v=6',
 photo:BASE+'clue-photo-v6.webp?v=6',
 time:BASE+'clue-map-v6.webp?v=6',
 witness:BASE+'clue-record-v6.webp?v=6',
 final:BASE+'scene-office-v6.webp?v=6'
};
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
const scene=document.getElementById('gameScene');
const game=document.getElementById('game');
if(!scene||!game) return;
const touch=window.matchMedia('(pointer: coarse)').matches;
// Preload sharp hero-quality images without stopping the UI thread.
[ASSETS.office,ASSETS.safe,ASSETS.map].forEach(src=>{const im=new Image();im.decoding='async'; im.src=src;});
let canvas=null,particles=[],last=0,rafId=0,currentSceneId='',stageChange=0;
function visualStage(){try {return state&&Number.isFinite(state.stage)?state.stage:1;}catch(e){return 1;}}
function active(){return game&&(!game.classList.contains('hidden'))&&document.visibilityState==='visible'&&!reduceMotion.matches;}
function setupParticles(){
 const existing=scene.querySelector('.v6-particles');if(existing)existing.remove();
 canvas=document.createElement('canvas');canvas.className='v6-particles';canvas.setAttribute('aria-hidden','true');scene.appendChild(canvas);
 const dpr=Math.min(window.devicePixelRatio||1,2);const w=scene.clientWidth||1000;const h=scene.clientHeight||430;
 canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);
 canvas.style.width=w+'px';canvas.style.height=h+'px';
 const amount=touch?22:45;
 particles=Array.from({length:amount},()=>({x:Math.random()*w,y:Math.random()*h,r:Math.random()*1.5+.45,vy:Math.random()*.22+.035,vx:(Math.random()-.5)*.12,a:Math.random()*.38+.12,phase:Math.random()*6.28}));
 if(!rafId&&!reduceMotion.matches){last=0;rafId=requestAnimationFrame(tick)}
}
function tick(t){
 rafId=0;
 if(!active()){return;}
 if(!canvas||!canvas.isConnected){return;}
 const ctx=canvas.getContext('2d',{alpha:true});if(!ctx)return;
 const w=scene.clientWidth,h=scene.clientHeight,dpr=Math.min(window.devicePixelRatio||1,2);
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){setupParticles();return;}
 ctx.clearRect(0,0,canvas.width,canvas.height);ctx.save();ctx.scale(dpr,dpr);
 const delta=Math.min(2.5,(t-last)/16.67||1);last=t;
 for(const p of particles){
   p.y-=p.vy*delta;p.x+=p.vx*delta;
   if(p.y<-5){p.y=h+5;p.x=Math.random()*w;}
   if(p.x<-5)p.x=w+5;if(p.x>w+5)p.x=-5;
   const twinkle=(Math.sin(t*.0007+p.phase)+1)*.23+.5;
   ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
   ctx.fillStyle=`rgba(255,213,151,${(p.a*twinkle).toFixed(3)})`;ctx.fill();
 }
 ctx.restore();rafId=requestAnimationFrame(tick);
}
function ensureRunning(){if(!rafId&&active()&&canvas&&canvas.isConnected){last=0;rafId=requestAnimationFrame(tick)}}
function sceneEnhance(){
 let img=scene.querySelector('.room-photo'); if(!img)return;
 const st=visualStage();
 const src=st===2?ASSETS.safe:ASSETS.office;
 if(img.getAttribute('data-v6-src')!==src){
   img.setAttribute('data-v6-src',src);img.classList.remove('v6-loaded');
   img.addEventListener('load',()=>img.classList.add('v6-loaded'),{once:true});
   img.src=src;
   if(img.complete)img.classList.add('v6-loaded');
 }
 scene.querySelector('.v6-room-fx')?.remove();
 const fx=document.createElement('div');fx.className='v6-room-fx';fx.setAttribute('aria-hidden','true');
 fx.innerHTML='<div class="v6-glint"></div><div class="v6-window-reflection"></div><div class="v6-mouse-light"></div>';
 scene.appendChild(fx);
 scene.querySelector('.v6-stageline')?.remove();
 const line=document.createElement('div');line.className='v6-stageline';line.setAttribute('aria-hidden','true');scene.appendChild(line);
 scene.classList.remove('v6-scene-in');void scene.offsetWidth;scene.classList.add('v6-scene-in');
 scene.dataset.v6Stage=String(st);
 if(!reduceMotion.matches)setupParticles();
 if(touch){const tutorial=scene.querySelector('.scene-tutorial');if(tutorial&&window.innerWidth<930&&!tutorial.textContent.includes('свайп'))tutorial.textContent+='  ·  Свайпни сцену влево и вправо';}
}
const previousSceneSet=window.sceneSet;
if(typeof previousSceneSet==='function'){
 window.sceneSet=function(art){let res=previousSceneSet(art);sceneEnhance();return res};
}
const priorDrawClues=window.drawClues;
function replaceClueArt(){
 document.querySelectorAll('#clueList .clue[data-clue]').forEach(el=>{
   const key=el.dataset.clue;const img=el.querySelector('img.clue-thumb');
   if(img&&ASSETS[key]&&img.dataset.v6Src!==ASSETS[key]){img.dataset.v6Src=ASSETS[key];img.src=ASSETS[key];img.loading='lazy';img.decoding='async';}
 });
}
if(typeof priorDrawClues==='function')window.drawClues=function(){const result=priorDrawClues.apply(this,arguments);replaceClueArt();return result};
const priorDrawPhoto=window.drawPhoto;
if(typeof priorDrawPhoto==='function')window.drawPhoto=function(){const result=priorDrawPhoto.apply(this,arguments);document.querySelectorAll('#photoBoard .tile-art').forEach(tile=>{tile.style.backgroundImage=`url('${ASSETS.office}')`;tile.style.backgroundSize='300% 300%';});return result;};
// The v5 viewer is functional; swap only its low-resolution illustration for the big one.
function upgradeViewer(){
 const modal=document.getElementById('v5ClueViewer');const preview=document.getElementById('v5Preview');
 if(!modal||modal.hidden||!preview)return;
 const title=document.getElementById('v5Title')?.textContent||'';
 const names={
  'Схема квартала':'map','Запись охраны':'window','Медный жетон':'ticket',
  'Страница дневника':'page','Архивный замок':'lock','Восстановленный кадр':'photo',
  'Старая фотография':'photo','Снимок с камеры':'photo'
 };
 const key=names[title];if(key&&ASSETS[key]&&preview.dataset.v6Key!==key){preview.src=ASSETS[key];preview.dataset.v6Key=key;preview.decoding='async';}
}
// Action-driven animation. Discovery marker only on newly found evidence.
let lastClues=-1;
function stamp(){
 if(reduceMotion.matches)return;
 const existing=scene.querySelector('.v6-discovery');if(existing)existing.remove();
 const n=document.createElement('div');n.className='v6-discovery';n.innerHTML='<span>✦ УЛИКА НАЙДЕНА</span>';n.setAttribute('aria-hidden','true');scene.appendChild(n);
 setTimeout(()=>n.remove(),850);
}
function onClueInteraction(event){
 const hot=event.target.closest('[data-hot]');
 const clue=event.target.closest('[data-clue]');
 if(!hot&&!clue)return;
 const before=hot?(() => {try{return state.clues.length}catch(e){return -1}})():-1;
 setTimeout(()=>{
   replaceClueArt();upgradeViewer();
   if(hot){try{if(state.clues.length>before)stamp()}catch(e){}}
 },hot?88:0);
}
// Capture only signals — leave the existing game click handlers intact.
document.addEventListener('click',onClueInteraction,true);
// Mouse light moves without setting React-style component state or rerendering scene.
scene.addEventListener('pointermove',e=>{
 if(touch||reduceMotion.matches)return;
 const r=scene.getBoundingClientRect();
 scene.style.setProperty('--v6-x',Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100)).toFixed(2)+'%');
 scene.style.setProperty('--v6-y',Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100)).toFixed(2)+'%');
},{passive:true});
window.addEventListener('resize',()=>{if(canvas&&canvas.isConnected&&!reduceMotion.matches)setupParticles()},{passive:true});
document.addEventListener('visibilitychange',()=>{if(active())ensureRunning()});
reduceMotion.addEventListener?.('change',()=>{if(reduceMotion.matches){if(canvas)canvas.remove();canvas=null;}else{sceneEnhance();ensureRunning()}});
// Avoid stale v5 screenshot when the page loads directly with #case-1.
replaceClueArt();
if(!game.classList.contains('hidden')){sceneEnhance();ensureRunning();}
window.TDVisualVersion='6.0';
})();