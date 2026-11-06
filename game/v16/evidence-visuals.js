/* Scene-bound 18 clue visuals. Never substitute unrelated stock photography.
   Physical items use case-location images with object reconstruction; documents
   are separate paper records filled from the actual clue data. */
(()=>{
const backgrounds={fabric:"pass.webp",photo:"pass.webp",direction:"pass.webp",railing:"pass.webp",repair:"archive.webp",route:"archive.webp",journal:"archive.webp",stamp:"archive.webp",token:"post.webp",signal:"post.webp",lamp:"post.webp",antenna:"post.webp",harborlog:"harbor.webp",weather:"harbor.webp",ticket:"harbor.webp",tracks:"road.webp",van:"road.webp",gate:"road.webp"};
const evidenceNotes={
fabric:["ЛОСКУТ НА ПЕРИЛАХ","Видна машинная строчка и мокрые белые волокна."],
photo:["КАМЕРА / 21:12","У перил светлый силуэт; узкий луч направлен снизу."],
direction:["ОТМЕТКИ НА ГРУНТЕ","Три вдавленных следа образуют правильный треугольник."],
railing:["СТАРАЯ ТРЕЩИНА","Трещина в металле под свежим слоем краски."],
repair:["ЗАЯВКА НА РЕМОНТ","20:45 / ОГРАЖДЕНИЕ / НЕ ВЫПОЛНЕНО"],
route:["СХЕМА МАРШРУТОВ","01 ПРИЧАЛ / 02 АРХИВ / 03 ТЕХПОСТ"],
journal:["ДНЕВНИК ДЕЖУРНОГО","Въезд автомобиля и включение света отмечены отдельно."],
stamp:["ПИСЬМО БЕЗ ОТВЕТА","Номер регистрации отсутствует."],
token:["МЕДНЫЙ ЖЕТОН","ДОРОГА / ЧАСЫ / ЯКОРЬ"],
signal:["ЛЕНТА РАДИОСИГНАЛА","21:09 / РУЧНАЯ АКТИВАЦИЯ"],
lamp:["ОПТИКА ПРОЖЕКТОРА","На отражателе остались белые волокна."],
antenna:["ПУЛЬТ УПРАВЛЕНИЯ","21:09 / СИГНАЛ ВКЛЮЧЕН ВРУЧНУЮ"],
harborlog:["ЖУРНАЛ ПРИЧАЛА","Наблюдали кратковременный свет на склоне."],
weather:["СВОДКА ПОГОДЫ","ВЕТЕР / ТУМАН / НИЗКАЯ ОБЛАЧНОСТЬ"],
ticket:["КАМЕРА ПРИЧАЛА","21:10 / ЛУЧ НА СКЛОНЕ"],
tracks:["ПРОТЕКТОР НА ГРУНТЕ","Мокрая грязь сохранила рисунок узких шин."],
van:["ВЕДОМОСТЬ ВЪЕЗДА","21:04 / СЛУЖЕБНЫЙ ТРАНСПОРТ"],
gate:["НАРЯД НА ВЫЕЗД","ПРОЖЕКТОР · ШТАТИВ · СВЕТООТРАЖАЮЩАЯ ПОЛОСА"]};
const docs=new Set(["repair","route","journal","stamp","signal","harborlog","weather","van","gate"]);
const object={
fabric:'<path d="M35 147H490" stroke="#464442" stroke-width="18"/><path d="M140 148v220" stroke="#57534d" stroke-width="17"/><path d="M146 145Q210 122 279 156Q320 172 394 145L374 247Q344 269 301 285Q244 257 201 213Z" fill="#e7e7dd" stroke="#d5d4c9" stroke-width="3" opacity=".90"/><path d="M170 150Q235 164 373 151" stroke="#b6b5ae" stroke-width="4" fill="none" stroke-dasharray="5 5"/>',
photo:'<path d="M128 355L293 92L310 102L232 355Z" fill="#fff3c2" opacity=".19"/><path d="M238 177Q254 158 270 174L292 240L340 302L238 322L207 303L222 231Z" fill="#eeeeeb" opacity=".68"/><circle cx="250" cy="164" r="17" fill="#fffef7" opacity=".72"/><path d="M222 239L201 301M276 234L315 296" stroke="#e6e9e7" stroke-width="9" opacity=".56"/>',
direction:'<g fill="#191a19" stroke="#b1a69b" stroke-width="7"><ellipse cx="138" cy="312" rx="30" ry="14" transform="rotate(-13 138 312)"/><ellipse cx="370" cy="313" rx="29" ry="14" transform="rotate(12 370 313)"/><ellipse cx="255" cy="187" rx="27" ry="14"/></g><path d="M138 312L255 187L370 313Z" stroke="#e1c7ad" stroke-width="2" fill="none" stroke-dasharray="8 7"/>',
railing:'<path d="M36 175L481 161M125 168v202M361 165v202" stroke="#4f5150" stroke-width="17" fill="none"/><path d="M36 164L481 150" stroke="#aba396" stroke-width="4"/><path d="M269 160l-12 38 16 21-20 33" stroke="#181e1f" stroke-width="11" fill="none"/><path d="M267 157l-10 41 16 22" stroke="#dba57d" stroke-width="3" fill="none"/>',
token:'<defs><radialGradient id="coinGrad"><stop stop-color="#e7bb77"/><stop offset=".72" stop-color="#af8549"/><stop offset="1" stop-color="#6c4d2d"/></radialGradient></defs><circle cx="254" cy="230" r="116" fill="url(#coinGrad)" stroke="#ecd0a3" stroke-width="8"/><circle cx="254" cy="230" r="93" fill="none" stroke="#694b30" stroke-width="4"/><path d="M224 277v-74l31-37 31 37v74M206 279h98M244 231h24" stroke="#734a2f" stroke-width="12" fill="none"/>',
lamp:'<path d="M171 359L250 154L280 158L339 356" stroke="#464846" stroke-width="19"/><path d="M194 136L349 89L387 208L229 256Z" fill="#62696a" stroke="#b8b4a6" stroke-width="8"/><circle cx="285" cy="177" r="61" fill="#e1d1b2" stroke="#e1c9a3" stroke-width="6"/><circle cx="285" cy="177" r="43" fill="#fff3cd"/><path d="M310 175L506 111V275Z" fill="#ffefb5" opacity=".22"/>',
antenna:'<path d="M205 145L239 55" stroke="#989e9b" stroke-width="11"/><rect x="145" y="130" width="215" height="185" rx="17" fill="#4c5555" stroke="#b9b9ab" stroke-width="8"/><circle cx="251" cy="209" r="52" fill="#202b2b" stroke="#d5bb92" stroke-width="7"/><path d="M251 209L272 171" stroke="#ab3e3d" stroke-width="6"/><rect x="204" y="278" width="95" height="18" rx="2" fill="#b63a3e"/>',
ticket:'<path d="M172 361L304 96L329 112L227 361" fill="#ffebbb" opacity=".29"/><path d="M78 319L442 319" stroke="#525d60" stroke-width="13"/><circle cx="314" cy="105" r="13" fill="#fff6dc"/>',
tracks:'<path d="M121 46L175 46L220 352L168 352Z M328 46L380 46L335 352L286 352Z" fill="#1a221d" opacity=".68"/><g stroke="#d0bba0" stroke-width="9" opacity=".56"><path d="M131 102L185 91M141 149L191 139M153 202L199 191M165 267L211 259M322 91L374 102M311 139L363 149M299 191L346 202M286 259L334 267"/></g>'
};
const e=t=>String(t).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function render(id,c,small=false){
 const [title,caption]=evidenceNotes[id]||[c.name,c.summary],background="./assets/"+(backgrounds[id]||"archive.webp");
 if(docs.has(id)){
 const detail=String(c.back||c.summary||"");
 return '<div class="td-proof-document"><img src="'+background+'" loading="lazy" alt="Фон архива" aria-hidden="true"/><div class="td-proof-sheet"><div class="td-proof-heading"><span>ДЕЛО 001 / '+e(id.toUpperCase())+'</span><span>КОПИЯ</span></div><h3>'+e(title)+'</h3><p class="td-proof-caption">'+e(caption)+'</p><p class="td-proof-detail">'+e(detail)+'</p><div class="td-proof-sign">СЛУЖЕБНАЯ ЗАПИСЬ<br><b>ПРОВЕРИТЬ</b></div></div></div>';
 }
 return '<div class="td-proof-scene td-proof-'+e(id)+'"><img src="'+background+'" loading="eager" alt="Реконструкция места: '+e(c.scene)+'"/><svg viewBox="0 0 512 385" preserveAspectRatio="xMidYMid meet" role="img" aria-label="'+e(c.name)+'" xmlns="http://www.w3.org/2000/svg">'+(object[id]||'')+'</svg><div class="td-scene-legend"><b>УЛИКА / '+e(id.toUpperCase())+'</b><strong>'+e(title)+'</strong><small>'+e(caption)+'</small></div></div>';
}
window.EvidenceVisuals={render};
})();
