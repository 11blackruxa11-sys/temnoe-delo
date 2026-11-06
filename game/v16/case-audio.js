/* ТЁМНОЕ ДЕЛО / original procedural sound design
 * Five VFX families plus a distinct endless detective ambient score for each city.
 * No copyrighted tracks, external audio files or streaming. Audio starts only after a gesture. */
(()=>{
"use strict";
if(window.CaseAudio)return;
const city=document.body.dataset.caseAudio||"novorossiysk";
const KEY="td_audio_preferences_v1";
let prefs={music:true,vfx:true};
try{prefs={...prefs,...JSON.parse(localStorage.getItem(KEY)||"{}")}}catch{}
const AC=window.AudioContext||window.webkitAudioContext;
let ctx=null,musicBus=null,fxBus=null,noise=null,started=false,active=true,tickHandle=null,nextChord=0,chordCount=0;
const ROOT=city==="moscow"?{notes:[55,65.41,82.41,110],scale:[146.83,164.81,174.61,220],interval:12.5,texture:.57}:{notes:[46.25,58.27,69.30,92.5],scale:[138.59,155.56,174.61,207.65],interval:15,texture:.82};
const END=Math.max;
function store(){try{localStorage.setItem(KEY,JSON.stringify(prefs))}catch{}}
function init(){
 if(!AC)return false;
 if(ctx)return true;
 ctx=new AC({latencyHint:"interactive"});
 musicBus=ctx.createGain();musicBus.gain.value=0;musicBus.connect(ctx.destination);
 fxBus=ctx.createGain();fxBus.gain.value=.55;fxBus.connect(ctx.destination);
 const buffer=ctx.createBuffer(1,ctx.sampleRate*3,ctx.sampleRate),d=buffer.getChannelData(0);
 let prev=0;for(let i=0;i<d.length;i++){prev=prev*.91+(Math.random()*2-1)*.09;d[i]=prev*.85}
 noise=buffer;
 return true;
}
function routeVolume(){
 if(!ctx||!musicBus)return;
 const now=ctx.currentTime,target=started&&active&&prefs.music&&!document.hidden?.072:0;
 musicBus.gain.cancelScheduledValues(now);
 musicBus.gain.setTargetAtTime(target,now,.7);
}
function resume(){if(!init())return;started=true;ctx.resume().catch(()=>{});routeVolume();if(!tickHandle){nextChord=ctx.currentTime+.1;tickHandle=setInterval(schedule,800);schedule()}}
function stop(){started=false;routeVolume();if(tickHandle){clearInterval(tickHandle);tickHandle=null}}
function osc(freq,start,duration,amount,type="sine",dest=musicBus){
 const o=ctx.createOscillator(),g=ctx.createGain();
 o.type=type;o.frequency.setValueAtTime(freq,start);
 g.gain.setValueAtTime(.00001,start);g.gain.linearRampToValueAtTime(amount,start+Math.min(2.4,duration*.24));
 g.gain.setValueAtTime(amount*.7,start+duration*.68);
 g.gain.exponentialRampToValueAtTime(.00001,start+duration);
 o.connect(g).connect(dest);o.start(start);o.stop(start+duration+.01);return o;
}
function pad(start){
 const idx=chordCount++%8,root=ROOT.notes[[0,0,1,2,0,3,2,1][idx]];
 const dur=ROOT.interval+3;
 osc(root,start,dur,.18,"sine");
 osc(root*1.5,start+.4,dur-.7,.067,"triangle");
 osc(root*2,start+1.1,dur-1.4,.038,"sine");
 const fifth=city==="moscow"?ROOT.scale[[0,2,1,3,2,0,3,1][idx]]:ROOT.scale[[0,1,3,2,0,2,1,3][idx]];
 osc(fifth,start+2.1,dur-2.3,.034,"sine");
 // Ultra-low moving texture and pitched distant metallic resonance.
 const wind=ctx.createBufferSource(),filter=ctx.createBiquadFilter(),g=ctx.createGain();
 wind.buffer=noise;wind.loop=true;filter.type="lowpass";filter.frequency.setValueAtTime(city==="moscow"?310:540,start);
 filter.frequency.linearRampToValueAtTime(city==="moscow"?180:310,start+dur);
 g.gain.setValueAtTime(.00001,start);g.gain.linearRampToValueAtTime(.028*ROOT.texture,start+2);
 g.gain.exponentialRampToValueAtTime(.00001,start+dur);
 wind.connect(filter).connect(g).connect(musicBus);wind.start(start);wind.stop(start+dur+.01);
 if(idx%2===0)osc(root*4,start+4.7,5,.009,"sine");
}
function schedule(){
 if(!ctx||!started)return;
 if(!active||!prefs.music||document.hidden){nextChord=ctx.currentTime+.15;return}
 if(nextChord<ctx.currentTime)nextChord=ctx.currentTime+.12;
 while(nextChord<ctx.currentTime+2){pad(nextChord);nextChord+=ROOT.interval}
}
function nburst(start,duration,level,filterFreq,filterType="lowpass"){
 const source=ctx.createBufferSource(),f=ctx.createBiquadFilter(),g=ctx.createGain();
 source.buffer=noise;f.type=filterType;f.frequency.value=filterFreq;
 g.gain.setValueAtTime(level,start);g.gain.exponentialRampToValueAtTime(.0001,start+duration);
 source.connect(f).connect(g).connect(fxBus);source.start(start);source.stop(start+duration);
}
const vfxNames=["paper","clue","travel","dialogue","success"];
function play(type="paper"){
 if(!prefs.vfx||!active)return;
 if(!init())return;
 ctx.resume().catch(()=>{});
 const now=ctx.currentTime+.004;
 // 1 paper turn / old documents
 if(type==="paper"){nburst(now,.24,.11,1450,"highpass");nburst(now+.085,.16,.065,830,"highpass");}
 // 2 evidence discovered / tiny archival chime
 else if(type==="clue"){osc(330,now,.31,.057,"triangle",fxBus);osc(494,now+.09,.36,.032,"sine",fxBus);}
 // 3 traveling / closed door and distant footsteps
 else if(type==="travel"){nburst(now,.33,.18,215);osc(74,now,.43,.075,"triangle",fxBus);nburst(now+.18,.16,.076,280);}
 // 4 dialogue / reel-tape click
 else if(type==="dialogue"){nburst(now,.10,.12,480);osc(170,now+.03,.13,.036,"square",fxBus);}
 // 5 solved case / solemn muted motif
 else if(type==="success"){osc(220,now,.64,.046,"triangle",fxBus);osc(277.18,now+.17,.7,.044,"sine",fxBus);osc(329.63,now+.39,.95,.037,"sine",fxBus);}
 else play("paper");
}
function updateUI(){
 const music=document.getElementById("caseMusicSwitch"),fx=document.getElementById("caseFxSwitch");
 if(music){music.innerHTML='<span class="case-control-icon">♫</span><span class="case-control-label">'+(prefs.music?'МУЗЫКА':'ВЫКЛ.')+'</span>';music.setAttribute("aria-pressed",String(prefs.music));music.setAttribute("aria-label",prefs.music?"Выключить фоновую музыку":"Включить фоновую музыку");music.title=prefs.music?"Выключить фоновую музыку":"Включить фоновую музыку";}
 if(fx){fx.innerHTML='<span class="case-control-icon">◖</span><span class="case-control-label">'+(prefs.vfx?'VFX':'ВЫКЛ.')+'</span>';fx.setAttribute("aria-pressed",String(prefs.vfx));fx.setAttribute("aria-label",prefs.vfx?"Выключить звуковые эффекты":"Включить звуковые эффекты");fx.title=prefs.vfx?"Выключить звуки действий":"Включить звуки действий";}
}
function mount(){
 const target=document.querySelector(city==="moscow"?"#soundBtn":"#soundToggle");if(!target)return;
 target.id="caseFxSwitch";target.textContent="◖ VFX";
 target.setAttribute("aria-label","Звуковые эффекты");
 const music=document.createElement("button");music.type="button";music.id="caseMusicSwitch";music.className=target.className+" case-music-button";music.title="Фоновая музыка";target.insertAdjacentElement("beforebegin",music);
 const capture=e=>{
   if(e.target.closest("#caseMusicSwitch")){e.preventDefault();e.stopImmediatePropagation();prefs.music=!prefs.music;store();if(prefs.music)resume();routeVolume();updateUI();}
   if(e.target.closest("#caseFxSwitch")){e.preventDefault();e.stopImmediatePropagation();prefs.vfx=!prefs.vfx;store();if(prefs.vfx){resume();play("paper")}updateUI();}
 };
 // Capture before legacy listeners, which use their own old sound toggles.
 document.addEventListener("click",capture,true);
 updateUI();
}
document.addEventListener("pointerdown",e=>{if(!started&&prefs.music&&e.isTrusted&&e.target.closest("button,a,[data-action],[data-trip],[data-tab]"))resume()},{passive:true});
document.addEventListener("keydown",e=>{if(!started&&prefs.music&&e.isTrusted&&["Enter"," "].includes(e.key))resume()});
document.addEventListener("visibilitychange",()=>{routeVolume();if(document.hidden){nextChord=0}});
window.addEventListener("pagehide",()=>{active=false;stop()});
window.addEventListener("message",event=>{if(event.origin!==location.origin)return;if(event.data?.type==="td:case-visible"){active=!!event.data.active;routeVolume();if(active&&started)schedule()}});
document.addEventListener("visibilitychange",()=>{if(!document.hidden){if(started&&prefs.music){routeVolume();schedule()}}});
window.addEventListener("pageshow",()=>{active=true;if(started)routeVolume()});
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",mount);else mount();
window.CaseAudio={play,start:resume,pause:()=>{active=false;routeVolume()},resume:()=>{active=true;if(started)routeVolume()},getPreferences:()=>({...prefs}),types:vfxNames};
})();