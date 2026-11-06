/* Shared investigative clock for all city cases. Only active time counts. */
(()=>{
'use strict';
const name=document.body.dataset.caseClock;if(!name)return;
const config={novorossiysk:{label:"НОВОРОССИЙСК / ДЕЛО №001",minutes:100},moscow:{label:"МОСКВА / ДЕЛО №002",minutes:150}}[name];if(!config)return;
const key="td_case_clock_"+name+"_v1";
let saved;try{saved=JSON.parse(localStorage.getItem(key)||"null")||{}}catch{saved={}}
const data={elapsed:Math.max(0,Number(saved.elapsed)||0),started:!!saved.started,paused:!!saved.paused};
const el=document.createElement("div");el.className="case-clock";el.setAttribute("role","timer");el.setAttribute("aria-label","Время расследования");
el.innerHTML='<div class="case-clock-mark">◷</div><div class="case-clock-info"><small>ВРЕМЯ РАССЛЕДОВАНИЯ</small><strong id="caseClockDigits">00:00:00</strong><span>ОРИЕНТИР: '+Math.floor(config.minutes/60)+' Ч '+String(config.minutes%60).padStart(2,"0")+' МИН</span></div><button id="caseClockPause" type="button" aria-label="Пауза или продолжить отсчёт" title="Пауза">Ⅱ</button>';
const rail=document.createElement("div");rail.className="case-clock-rail";rail.setAttribute("aria-label","Панель таймера расследования");rail.append(el);const header=document.querySelector(".topbar,.game-head");if(header)header.insertAdjacentElement("afterend",rail);else document.body.prepend(rail);
const digits=el.querySelector("#caseClockDigits"),pause=el.querySelector("#caseClockPause");
let last=Date.now();
function fmt(n){const s=Math.floor(n/1000);return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(v=>String(v).padStart(2,"0")).join(":")}
function save(){try{localStorage.setItem(key,JSON.stringify(data))}catch{}}
function paint(){digits.textContent=fmt(data.elapsed);pause.textContent=data.paused?"▶":"Ⅱ";pause.setAttribute("aria-label",data.paused?"Продолжить отсчёт":"Поставить отсчёт на паузу");el.classList.toggle("paused",data.paused);el.classList.toggle("running",data.started);}
function tick(){const now=Date.now();if(data.started&&!data.paused&&!document.hidden){data.elapsed+=Math.min(2500,Math.max(0,now-last));}last=now;paint();}
const loop=setInterval(()=>{tick();save()},1000);
pause.addEventListener("click",()=>{tick();data.paused=!data.paused;save();paint()});
document.addEventListener("visibilitychange",()=>{last=Date.now();save();});
window.addEventListener("pagehide",()=>{tick();save()});
window.CaseClock={start(){data.started=true;last=Date.now();save();paint()},pause(){tick();data.paused=true;save();paint()},resume(){data.started=true;data.paused=false;last=Date.now();save();paint()},reset(){data.elapsed=0;data.started=false;data.paused=false;last=Date.now();save();paint()},getElapsed(){tick();return data.elapsed}};
paint();
})();