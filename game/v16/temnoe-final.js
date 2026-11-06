(() => {
  "use strict";
  const $=(sel,root=document)=>root.querySelector(sel);
  const $$=(sel,root=document)=>Array.from(root.querySelectorAll(sel));
  const routes=new Set(["home","cities","cases","about","submit","play","moscow-case","moscow"]);
  const title={home:"Главная",cities:"Архив городов",cases:"Дело №001",about:"О проекте",submit:"Добавить историю",play:"Расследование", "moscow-case":"Москва · Либерея",moscow:"Либерея · Расследование"};
  const nav=$("#primaryNav"),mobile=$("#mobileMenu"),frame=$("#gameFrame"),moscowFrame=$("#moscowFrame");
  let frameLoaded=false,moscowFrameLoaded=false,sound=false,audio=null;
  function tone(type="click"){
    if(!sound)return;
    try {
      const C=window.AudioContext||window.webkitAudioContext;
      if(!C)return;audio ||= new C();
      const osc=audio.createOscillator(),gain=audio.createGain(),t=audio.currentTime;
      osc.type=type==="success"?"sine":"triangle";
      osc.frequency.setValueAtTime(type==="success"?620:215,t);
      osc.frequency.exponentialRampToValueAtTime(type==="success"?880:75,t+.09);
      gain.gain.setValueAtTime(.025,t);gain.gain.exponentialRampToValueAtTime(.0001,t+.13);
      osc.connect(gain);gain.connect(audio.destination);osc.start(t);osc.stop(t+.14);
    } catch(e){}
  }
  function route(){
    let page=decodeURIComponent(location.hash.slice(1).split("?")[0])||"home";
    if(!routes.has(page))page="home";
    $$(".view").forEach(el=>{const active=el.id==="view-"+page;el.classList.toggle("active",active);el.setAttribute("aria-hidden",String(!active));});
    $$("[data-route]").forEach(el=>{if(el.closest(".primary-nav")){const active=el.dataset.route===page||(el.dataset.route==="cities"&&(page==="moscow-case"||page==="moscow"));el.classList.toggle("active",active);if(active)el.setAttribute("aria-current","page");else el.removeAttribute("aria-current");}});
    if(page==="play"&&!frameLoaded){frame.src="./investigation-premium.html?play=1";frameLoaded=true;}
    if(page==="moscow"&&!moscowFrameLoaded){moscowFrame.src="./moscow-investigation.html";moscowFrameLoaded=true;}
    $("#siteFooter").hidden=page==="play"||page==="moscow";
    document.title=(title[page]||"ТЁМНОЕ ДЕЛО")+" | ТЁМНОЕ ДЕЛО";
    nav.classList.remove("open");mobile.setAttribute("aria-expanded","false");
    window.scrollTo({top:0,behavior:"instant"});
  }
  document.addEventListener("click",e=>{
    const navButton=e.target.closest("[data-route]");
    if(navButton){e.preventDefault();tone();const page=navButton.dataset.route;if(location.hash==="#"+page)route();else location.hash=page;return;}
    const action=e.target.closest("[data-action]");
    if(action?.dataset.action==="open-demo"){e.preventDefault();tone();const section=$("#mini-case");section?.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion:reduce)").matches?"instant":"smooth"});}
  });
  window.addEventListener("hashchange",route);
  mobile.addEventListener("click",()=>{const open=nav.classList.toggle("open");mobile.setAttribute("aria-expanded",String(open));tone();});
  $("#backToTop").addEventListener("click",()=>window.scrollTo({top:0,behavior:"smooth"}));
  $("#toggleSound").addEventListener("click",()=>{sound=!sound;$("#toggleSound").classList.toggle("active",sound);$("#toggleSound").setAttribute("aria-pressed",String(sound));$("#toggleSound").setAttribute("title",sound?"Выключить звуки":"Включить звуки");if(sound)tone("success");});
  $("#toggleSound").setAttribute("aria-pressed","false");
  route();

  // Archive demo: each tab changes a REAL text description and remains keyboard accessible.
  const materials={
    witness:["ПРОТОКОЛ / ПОКАЗАНИЯ СВИДЕТЕЛЕЙ","Версии очевидцев противоречат друг другу. Изучи каждую запись перед выводом."],
    camera:["ВИДЕОАРХИВ / ЗАПИСИ С КАМЕР","Видеофрагмент может подтвердить время, но сам по себе не доказывает, кто именно присутствовал."],
    calls:["ТЕЛЕФОНИЯ / ИСТОРИЯ ЗВОНКОВ","Отметки времени помогают выстроить хронологию. Личность звонившего ещё необходимо установить."],
    documents:["АРХИВ / ПИСЬМЕННЫЕ ДОКУМЕНТЫ","Записи и протоколы нужно сопоставлять с другими источниками, а не принимать за готовый ответ."]
  };
  $$("[data-material]").forEach(b=>b.addEventListener("click",()=>{
    $$("[data-material]").forEach(x=>{x.classList.toggle("selected",x===b);x.setAttribute("aria-pressed",String(x===b));});
    const [h,p]=materials[b.dataset.material];$("#materialDetailTitle").textContent=h;$("#materialDetailDescription").textContent=p;tone();
  }));
  $$("[data-material]").forEach(b=>b.setAttribute("aria-pressed",String(b.classList.contains("selected"))));

  // Independent micro-case, intentionally not presenting unverified guesses as proof.
  const clues={
    witness:["ПРОТОКОЛ СВИДЕТЕЛЯ","Свидетель утверждает, что покинул территорию только в 22:40. Независимого подтверждения этому времени пока нет."],
    camera:["ЗАПИСЬ КАМЕРЫ","В 22:17 камера записала автомобиль возле входа. Неизвестно, кто находился за рулём."],
    call:["ТЕЛЕФОННЫЙ ВЫЗОВ","В 22:25 с территории здания зарегистрирован звонок. Для вывода о местонахождении свидетеля надо выяснить, кто звонил."]
  };
  const seen=new Set();
  const demoExtract=$("#demoExtract"),demoCount=$("#demoCount"),demoResult=$("#demoResult");
  $$("[data-clue]").forEach(b=>b.addEventListener("click",()=>{
    const id=b.dataset.clue;if(!clues[id])return;seen.add(id);demoCount.textContent=String(seen.size);
    $$("[data-clue]").forEach(x=>{x.classList.toggle("active",x===b);if(seen.has(x.dataset.clue)){x.classList.add("seen");const i=x.querySelector("i");if(i)i.textContent="✓";}});
    demoExtract.textContent=clues[id][0]+": "+clues[id][1];
    if(seen.size===3)demoResult.textContent="Все материалы изучены. Теперь выбери вывод, который следует проверить.";
    tone("click");
  }));
  $("#demoCheck")?.addEventListener("click",()=>{
    const value=$("#demoVersion").value;
    if(seen.size<3){demoResult.textContent="Сначала открой все три материала: "+seen.size+" из 3.";return;}
    if(!value){demoResult.textContent="Выбери одну из версий.";return;}
    if(value==="timeline"){demoResult.textContent="Верное направление: нужно установить, кто находился на территории в 22:25. Один факт звонка ещё не доказывает присутствие свидетеля.";demoResult.style.color="#b7d0b7";tone("success");}
    else{demoResult.textContent="Это предположение пока ничем не подтверждено. Попробуй построить проверяемую хронологию.";demoResult.style.color="#e3b3ac";tone();}
  });

  // Form: preserve draft locally and never claim submission if API failed.
  const form=$("#storyForm"),status=$("#storyStatus"),key="td_premium_draft_v1";
  const values=()=>Object.fromEntries(new FormData(form).entries());
  function save(){try{localStorage.setItem(key,JSON.stringify(values()));}catch(e){}}
  try {
    const saved=JSON.parse(localStorage.getItem(key)||"null");
    if(saved)for(const [name,val] of Object.entries(saved)){
      const field=form.elements.namedItem(name);if(!field)continue;
      if(field instanceof RadioNodeList)field.value=val;
      else if(field.type==="checkbox")field.checked=val==="on";else field.value=val;
    }
  }catch(e){}
  form.addEventListener("input",save);form.addEventListener("change",save);
  const copyText=()=>{const v=values();return ["ТЁМНОЕ ДЕЛО / ЗАЯВКА","Тип: "+(v.submissionType||""),"Город: "+(v.city||""),"Название: "+(v.storyTitle||""),"История: "+(v.storyBody||""),"Источник: "+(v.source||""),"Контакт: "+(v.contact||"")].join("\n\n");};
  $("#copyStory").addEventListener("click",async()=>{try{await navigator.clipboard.writeText(copyText());status.textContent="Заявка скопирована. Это ещё не отправка редакции.";tone("success");}catch(e){status.textContent="Не удалось скопировать автоматически. Проверь разрешение браузера."; }});
  form.addEventListener("submit",async e=>{
    e.preventDefault();if(!form.reportValidity())return;
    const v=values(),btn=$('button[type="submit"]',form);
    btn.disabled=true;status.textContent="Проверяем возможность отправки в редакцию…";save();
    try {
      const controller=new AbortController(),timeout=setTimeout(()=>controller.abort(),18000);
      let response;
      try{response=await fetch("https://temnoe-delo-stories-api.onrender.com/api/stories",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({city:v.city,storyTitle:v.storyTitle,storyBody:v.storyBody,source:v.source||"",contact:v.contact,submissionType:v.submissionType,consent:v.consent==="on",website:""}),signal:controller.signal});}
      finally{clearTimeout(timeout);}
      if(!response.ok)throw Error(response.status===503?"Серверное хранилище ещё не подключено":response.status===429?"Превышен лимит заявок":"Сервер не принял заявку (код "+response.status+")");
      const data=await response.json();
      if(!data.id)throw Error("Сервер не подтвердил сохранение заявки");
      status.textContent="Заявка №"+data.id+" сохранена и ожидает рассмотрения редакции.";localStorage.removeItem(key);form.reset();tone("success");
    }catch(error){
      status.textContent="ЗАЯВКА НЕ ОТПРАВЛЕНА. "+(error.name==="AbortError"?"Сервер не ответил вовремя.":error.message)+". Черновик сохранён. Можно скопировать текст.";
    }finally{btn.disabled=false;}
  });
})();