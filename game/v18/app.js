
const state = { sound: true };

const modal = document.getElementById('modal');
const modalContent = document.getElementById('modalContent');

const clueData = {
  photo: { title: 'Фотография с перевала', text: 'На снимке виден белый силуэт, появившийся у края обрыва. Свет падает снизу, будто кто-то подсветил фигуру прожектором.' },
  journal: { title: 'Журнал поста', text: 'Последняя запись сделана в 21:04. После этого часть строк аккуратно вырвана.' },
  note: { title: 'Обрывок записки', text: 'Фраза читается не полностью: «...если снова будет ветер, никто не поверит, что это был просто знак...»' },
  medal: { title: 'Кулон', text: 'Медальон с гравировкой А.С. и датой 17.06.1998. Внутри — выцветший фрагмент фотографии.' },
  road: { title: 'Схема дороги', text: 'Маршрут к перевалу отмечен карандашом. На полях пометка: «служебный выезд 21:04».' }
};

function openModal(html){
  modalContent.innerHTML = html;
  modal.classList.remove('hidden');
  modal.setAttribute('aria-hidden','false');
  playSfx('open');
}
function closeModal(){
  modal.classList.add('hidden');
  modal.setAttribute('aria-hidden','true');
  modalContent.innerHTML = '';
}
document.querySelectorAll('[data-close="modal"]').forEach(el => el.addEventListener('click', closeModal));
modal.addEventListener('click', (e) => {
  if(e.target.classList.contains('modal-backdrop')) closeModal();
});
document.addEventListener('keydown', (e) => {
  if(e.key === 'Escape') closeModal();
});

function storyHtml(){
  return `
    <div class="modal-grid">
      <div class="modal-story">
        <div class="eyebrow">ИСТОРИЯ ДЕЛА</div>
        <h2>НЕВЕСТА СЕМИ ВЕТРОВ</h2>
        <p>Летом 1998 года на перевале «Семь ветров» исчезла Алина Сорокина. Официальное дело быстро закрыли, а город запомнил только легенду о девушке в белом, которая появляется в туман и непогоду.</p>
        <p>Спустя годы новый снимок снова запускает слухи. Но теперь у нас есть карта, архив, свидетели и улика за уликой. Игроку предстоит восстановить хронологию, допросить людей и понять, где закончился несчастный случай и началось сокрытие правды.</p>
        <button class="action-btn sfx-click" onclick="closeModal()">ПОНЯТНО</button>
      </div>
      <div class="modal-large-medal"></div>
    </div>`;
}

function gameHtml(){
  return `
    <div class="modal-story">
      <div class="eyebrow">РАССЛЕДОВАНИЕ</div>
      <h2>КАРКАС СЦЕНЫ УЖЕ ГОТОВ</h2>
      <p>Этот экран сделан именно как веб-версия под сайт: карта дела, персонажи, допросы, улики, осмотр предметов, хронология и итоговая доска расследования.</p>
      <p>Дальше это можно переносить в рабочую ветку сайта как основной интерфейс Новороссийска.</p>
      <button class="action-btn sfx-click" onclick="closeModal()">ИДЁМ ДАЛЬШЕ</button>
    </div>`;
}

function clueHtml(key){
  const c = clueData[key];
  return `
    <div class="modal-grid">
      <div class="modal-large-medal"></div>
      <div class="modal-story">
        <div class="eyebrow">ВЕЩЕСТВЕННАЯ УЛИКА</div>
        <h2>${c.title}</h2>
        <p>${c.text}</p>
        <p>В следующей рабочей версии сюда же можно привязать вращение, переворот предмета и дополнительные hidden-детали, как в игре.</p>
        <button class="action-btn sfx-click" onclick="closeModal()">ЗАКРЫТЬ</button>
      </div>
    </div>`;
}

function allCluesHtml(){
  return `
    <div>
      <div class="section-title between" style="margin-bottom:16px">
        <div>ВСЕ НАЙДЕННЫЕ УЛИКИ</div>
        <div class="count">8/18</div>
      </div>
      <div class="modal-all-clues">
        ${Object.keys(clueData).map(key => `
          <button class="clue-card sfx-hover" onclick="window.openClueFromModal('${key}')">
            <div class="thumb thumb-${key === 'medal' ? 'medal' : key === 'photo' ? 'photo' : key === 'journal' ? 'journal' : key === 'note' ? 'note' : 'road'}"></div>
            <span>${clueData[key].title}</span>
          </button>
        `).join('')}
      </div>
    </div>`;
}

window.openClueFromModal = function(key){
  openModal(clueHtml(key));
};

document.querySelectorAll('[data-open]').forEach(btn => {
  btn.addEventListener('click', () => {
    const type = btn.dataset.open;
    if(type === 'story-panel') openModal(storyHtml());
    if(type === 'game-panel') { window.location.href = '../v16/'; return; }
    if(type === 'clue-modal') openModal(clueHtml('medal'));
    if(type === 'all-clues') openModal(allCluesHtml());
  });
});

document.querySelectorAll('.clue-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.clue-card').forEach(el => el.classList.remove('active'));
    card.classList.add('active');
    const key = card.dataset.clue;
    if(key && clueData[key]){
      document.querySelector('.object-title').textContent = clueData[key].title.toUpperCase();
      document.querySelector('.object-copy p').textContent = clueData[key].text;
      playSfx('clue');
    }
  });
});

document.querySelectorAll('.person-item').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.person-item').forEach(el => el.classList.remove('active'));
    btn.classList.add('active');
    const id = btn.dataset.person;
    const leftTitle = document.querySelector('#leftInterview .section-title div div');
    const leftSmall = document.querySelector('#leftInterview .section-title small');
    const dossierTitle = document.querySelector('.paper-title');
    const photo = document.querySelector('.paper-photo');
    if(id === 'kuznetsov'){
      leftTitle.textContent = 'ДОПРОС: КУЗНЕЦОВ В.Л.';
      leftSmall.textContent = 'Бывший смотритель поста';
      dossierTitle.textContent = 'ДОСЬЕ: КУЗНЕЦОВ В.Л.';
      photo.style.filter = 'grayscale(0)';
    }
    if(id === 'morozova'){
      leftTitle.textContent = 'ДОПРОС: МОРОЗОВА Е.А.';
      leftSmall.textContent = 'Сотрудник архива';
      dossierTitle.textContent = 'ДОСЬЕ: МОРОЗОВА Е.А.';
      photo.style.filter = 'sepia(.25)';
    }
    if(id === 'dehtyarev'){
      leftTitle.textContent = 'ДОПРОС: ДЕГТЯРЁВ С.А.';
      leftSmall.textContent = 'Бывший сотрудник';
      dossierTitle.textContent = 'ДОСЬЕ: ДЕГТЯРЁВ С.А.';
      photo.style.filter = 'contrast(1.1)';
    }
    if(id === 'ryabin'){
      leftTitle.textContent = 'ДОПРОС: РЯБИНИН И.Г.';
      leftSmall.textContent = 'Местный житель';
      dossierTitle.textContent = 'ДОСЬЕ: РЯБИНИН И.Г.';
      photo.style.filter = 'brightness(.92)';
    }
    playSfx('paper');
  });
});

document.querySelectorAll('.question-item').forEach(btn => {
  btn.addEventListener('click', () => {
    btn.parentElement.querySelectorAll('.question-item').forEach(el => el.classList.remove('active'));
    btn.classList.add('active');
    playSfx('hover');
  });
});

document.querySelectorAll('.map-pin').forEach(pin => {
  pin.addEventListener('click', () => {
    const place = pin.dataset.pin;
    openModal(`
      <div class="modal-story">
        <div class="eyebrow">ЛОКАЦИЯ</div>
        <h2>${place}</h2>
        <p>Войти в полноценное расследование, чтобы изучить локацию, найти улики и допросить свидетелей.</p>
        <button class="action-btn sfx-click" onclick="location.href='../v16/'">ВОЙТИ В ЛОКАЦИЮ →</button>
      </div>`);
    playSfx('open');
  });
});

document.getElementById('soundToggle').addEventListener('click', () => {
  state.sound = !state.sound;
  document.getElementById('soundToggle').textContent = state.sound ? '♫' : '◻';
  document.getElementById('soundToggle').setAttribute('aria-label', state.sound ? 'Звук включен' : 'Звук выключен');
});

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
function tone(freq = 440, dur = .09, type = 'triangle', volume = .03, when = 0){
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  gain.gain.value = 0.0001;
  osc.connect(gain).connect(audioCtx.destination);
  const start = audioCtx.currentTime + when;
  osc.start(start);
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);
  osc.stop(start + dur + .02);
}
function noiseBurst(duration=.12, volume=.018){
  const bufferSize = audioCtx.sampleRate * duration;
  const buffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
  const output = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) output[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
  const white = audioCtx.createBufferSource();
  const gain = audioCtx.createGain();
  white.buffer = buffer;
  white.connect(gain).connect(audioCtx.destination);
  gain.gain.value = volume;
  white.start();
}
function playSfx(kind='click'){
  if(!state.sound) return;
  if(audioCtx.state === 'suspended') audioCtx.resume();
  switch(kind){
    case 'hover':
      tone(520,.05,'triangle',.018);
      tone(680,.04,'triangle',.012,.03);
      break;
    case 'click':
      tone(220,.08,'square',.028);
      tone(330,.08,'triangle',.016,.04);
      break;
    case 'open':
      noiseBurst(.05,.012);
      tone(290,.08,'sine',.02);
      tone(420,.12,'triangle',.018,.05);
      break;
    case 'paper':
      noiseBurst(.08,.022);
      tone(170,.06,'triangle',.012);
      break;
    case 'clue':
      tone(392,.07,'triangle',.02);
      tone(523,.11,'triangle',.024,.05);
      tone(659,.15,'sine',.018,.1);
      break;
    case 'voice':
      tone(148,.06,'sawtooth',.016);
      tone(128,.06,'sawtooth',.012,.06);
      noiseBurst(.04,.006);
      break;
    case 'resolve':
      tone(294,.1,'triangle',.025);
      tone(392,.12,'triangle',.026,.08);
      tone(587,.15,'sine',.022,.18);
      break;
    default:
      tone();
  }
}
document.querySelectorAll('.sfx-hover').forEach(el => el.addEventListener('mouseenter', () => playSfx('hover')));
document.querySelectorAll('.sfx-click').forEach(el => el.addEventListener('click', () => playSfx(el.dataset.sfx || 'click')));
