/* Живой интерфейс поверх игрового движка, без изменения логики загадок. */
(function(){
  const q=s=>document.querySelector(s);
  const brand=q('.brand span'); if(brand)brand.innerHTML='ГОРОДСКИЕ ДЕЛА<small>ИГРА • ГОРОДСКИЕ КВЕСТЫ</small>';
  const nav=q('.nav');if(nav){nav.innerHTML='<button data-home="true" class="active">Главная</button><button data-open="game">Играть</button><button data-open="cities">Расследования</button><button data-open="how">Как играть</button><button data-open="author">Истории авторов</button><button data-open="author">Предложить историю</button>';nav.addEventListener('click',e=>{const el=e.target.closest('button');if(!el)return;document.querySelector('header').classList.remove('mobile-open');if(el.dataset.home){if(!q('#game').classList.contains('hidden'))leaveGame(false);window.scrollTo({top:0,behavior:'smooth'})}else if(el.dataset.open==='game')enterGame(0);else if(el.dataset.open)navTo(el.dataset.open);});}
  const play=q('#headerPlay');if(play)play.textContent='▶ ИГРАТЬ';
  const h=q('.hero-title');if(h)h.innerHTML='ГОРОДСКИЕ<br><em>КВЕСТЫ</em>';
  const status=q('.hero-status');if(status)status.innerHTML='<span class="pulse"></span> ИГРА-РАССЛЕДОВАНИЕ';
  const intro=q('.hero-copy > p');if(intro)intro.textContent='Ищи улики, решай загадки и раскрывай тайны городов. Здесь важны твои решения.';
  const hp=q('#heroPlay');if(hp)hp.textContent='НАЧАТЬ ИГРУ  ▶';
  const second=q('.hero-buttons .ghost');if(second)second.textContent='КАК ЭТО РАБОТАЕТ  ⓘ';if(second)second.dataset.scrollto='how';
  const slider=q('.city-switch label');if(slider)slider.textContent='МЕСТО ДЕЙСТВИЯ';
  const cities=q('#cities'); if(cities){const head=cities.querySelector('.section-header');head.querySelector('.eyebrow').textContent='ВЫБИРАЙ МЕСТО ДЕЙСТВИЯ';head.querySelector('h2').textContent='НАЧНИ СВОЁ РАССЛЕДОВАНИЕ';head.querySelector('p').textContent='Шесть историй на выбор. Ещё 34 квеста ждут в каталоге.';
    const wrap=cities.querySelector('.wrap');
    const top=document.createElement('div');top.className='featured-title';top.innerHTML='<h3>ПОПУЛЯРНЫЕ ГОРОДА</h3><div class="featured-links"><button class="round-nav" id="featuredPrev" aria-label="Предыдущие города">‹</button><button class="round-nav" id="featuredNext" aria-label="Следующие города">›</button></div>';
    const featured=document.createElement('div');featured.className='featured-track';featured.id='featuredTrack';
    head.insertAdjacentElement('afterend',top);top.insertAdjacentElement('afterend',featured);
    const catalog=document.createElement('div');catalog.id='cityCatalog';catalog.innerHTML='<div class="catalog-top"><button class="catalog-toggle" id="catalogToggle" aria-expanded="false">ВСЕ 40 ГОРОДОВ  ＋</button></div><div class="catalog-content" id="catalogContent"></div>';
    featured.insertAdjacentElement('afterend',catalog);const content=q('#catalogContent');content.append(cities.querySelector('.filter'),q('#cityGrid'));
    let slide=0;const ids=[2,1,3,14,4,0,7,8,6,17,22,36,10,12,18,30,29,11];
    const renderFeatured=()=>{const show=Array.from({length:6},(_,i)=>CITIES[ids[(slide+i)%ids.length]]);featured.innerHTML=show.map(c=>`<button class="city-card" data-city="${c.id}" aria-label="Играть: ${htmlSafe(c.city)}"><div class="city-art">${citySVG(c.id)}</div><div class="card-info"><h3>${htmlSafe(c.city)}</h3></div></button>`).join('');};
    renderFeatured();featured.addEventListener('click',e=>{const c=e.target.closest('[data-city]');if(c)enterGame(Number(c.dataset.city))});
    q('#featuredPrev').onclick=()=>{slide=(slide+ids.length-1)%ids.length;renderFeatured()};q('#featuredNext').onclick=()=>{slide=(slide+1)%ids.length;renderFeatured()};
    const toggle=q('#catalogToggle'),box=q('#catalogContent');const setOpen=on=>{box.classList.toggle('open',on);toggle.setAttribute('aria-expanded',String(on));toggle.textContent=on?'СКРЫТЬ КАТАЛОГ  −':'ВСЕ 40 ГОРОДОВ  ＋'};
    toggle.onclick=()=>setOpen(!box.classList.contains('open'));
    q('#citySearch').addEventListener('input',()=>setOpen(true));
  }
  const steps=q('#how');if(steps){steps.querySelector('.eyebrow').textContent='КАК УСТРОЕНА ИГРА';steps.querySelector('h2').textContent='5 ШАГОВ ДО РАЗГАДКИ';
    steps.querySelector('.steps-grid').innerHTML=[
      ['⌖','ВЫБИРАЕШЬ ДЕЛО','Начни расследование в одном из городов.'],
      ['◎','ИССЛЕДУЕШЬ СЦЕНЫ','Осматривай предметы, ищи детали и скрытые связи.'],
      ['✣','РЕШАЕШЬ ЗАГАДКИ','Разгадывай шифры и собирай фрагменты.'],
      ['▣','СОБИРАЕШЬ УЛИКИ','Сопоставляй показания, документы и факты.'],
      ['★','РАСКРЫВАЕШЬ ДЕЛО','Сделай вывод и проверь свою версию.']
    ].map((s,i)=>`<div class="step-card"><span class="step-no">0${i+1}</span><span class="step-icon" aria-hidden="true">${s[0]}</span><h3>${s[1]}</h3><p>${s[2]}</p></div>`).join('');
  }
  const footer=q('footer');if(footer){footer.innerHTML=footer.innerHTML.replaceAll('ТЁМНОЕ ДЕЛО','ГОРОДСКИЕ ДЕЛА')};document.title='ГОРОДСКИЕ КВЕСТЫ | Игровые расследования';
})();