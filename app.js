import {finaleMarkup,mountFinale} from './finale.js';
import {accepts,restore,canRevealDestination,visibleStoryChapters} from './core.js';
import {chapterPosition} from './map.js';
import {puzzleMarkup,mountPuzzle,keyMarkup} from './puzzles.js';
const $=s=>document.querySelector(s);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const key='hobbit-quest-story-v2';
let puzzleCleanup=()=>{},finaleCleanup=()=>{};
let config,chapters,state,selected=0,db,urls=[],busy=false,zoom=1,puzzleProgress={};
try{const raw=JSON.parse(localStorage.getItem('hobbit-interactive-v1'));if(raw&&typeof raw==='object'&&!Array.isArray(raw))puzzleProgress=raw}catch{}
function savePuzzles(){try{localStorage.setItem('hobbit-interactive-v1',JSON.stringify(puzzleProgress))}catch{toast('Ход испытания не сохранился. Не закрывайте страницу до разгадки.')}}
function solve(chapter){if(chapters[state.done.length]?.id!==chapter.id||state.solved.includes(chapter.id))return;state.solved.push(chapter.id);save();render();toast('Печать открылась. Место проявилось на карте.');$('#chapter').scrollIntoView({behavior:'smooth',block:'start'})}

function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),4500)}
function save(){try{localStorage.setItem(key,JSON.stringify(state))}catch{toast('Браузер не сохранил прогресс. Разрешите хранение данных сайта.')}}
function openDB(){return new Promise((resolve,reject)=>{const r=indexedDB.open('hobbit-journal',1);r.onupgradeneeded=()=>r.result.createObjectStore('photos',{keyPath:'id'});r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error)})}
function store(mode,action){return new Promise((resolve,reject)=>{const tx=db.transaction('photos',mode);const r=action(tx.objectStore('photos'));let result;r.onsuccess=()=>result=r.result;tx.oncomplete=()=>resolve(result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error)})}
function renderMap(){
 const visible=visibleStoryChapters(chapters,state);let pen=false;const path=[];
 const positions=visible.map(c=>chapterPosition(c,{},config.map.bounds));
 positions.forEach(p=>{if(!p){pen=false;return}path.push(`${pen?'L':'M'} ${p.x} ${p.y}`);pen=true});$('#route').setAttribute('d',path.join(' '));
 $('#pins').innerHTML=visible.map((c,i)=>{const p=positions[i],index=chapters.indexOf(c);return p?`<button class="pin ${state.done.includes(c.id)?'done':''} ${index===selected?'selected':''}" style="left:${p.x}%;top:${p.y}%" data-index="${index}" aria-label="${esc(c.title)}" aria-pressed="${index===selected}">${state.done.includes(c.id)?'✓':index+1}</button>`:''}).join('');
 $('#chapter-list').innerHTML=chapters.slice(0,Math.min(state.done.length+1,chapters.length)).map((c,i)=>`<button data-index="${i}" aria-current="${i===selected?'step':'false'}"><span>${i<state.done.length?'✓':String(i+1).padStart(2,'0')}</span>${esc(c.title)}</button>`).join('');
 for(const parent of [$('#pins'),$('#chapter-list')])parent.querySelectorAll('button').forEach(b=>b.onclick=()=>{selected=+b.dataset.index;render();$('#chapter').scrollIntoView({behavior:'smooth',block:'start'})});
 $('#map-status').textContent=visible.length===1?'Пока карта знает лишь твой порог. Остальные места проявятся, когда ты прочтёшь печати.':`На карте проявилось мест: ${visible.length}. Неразгаданные печати ещё берегут свои тайны.`;
}
function render(){
 puzzleCleanup();puzzleCleanup=()=>{};finaleCleanup();finaleCleanup=()=>{};
 const c=chapters[selected],done=state.done.includes(c.id),solved=canRevealDestination(state,c),hint=state.hints[c.id]||0;
 $('#chapter').classList.toggle('constellation-card',c.puzzle?.type==='constellation'&&!solved);
 $('#progress').textContent=`${state.done.length} / ${chapters.length} глав`;
 renderMap();
 $('#chapter').innerHTML=`<div class="letter-top"><span>ПОСЛАНИЕ ${String(selected+1).padStart(2,'0')}</span><span class="seal-mark">${done?'✓':solved?'✧':'✥'}</span></div><h2>${esc(c.title)}</h2><p class="story-copy">${esc(c.story)}</p>${solved?`<div class="opened-note"><p class="eyebrow">ПЕЧАТЬ ПОДДАЛАСЬ · НА КАРТЕ ПРОЯВИЛСЯ ЗНАК</p><h3>Теперь ты знаешь путь</h3><p class="place">⌖ ${esc(c.place)}</p><p>${esc(done&&c.afterVisit?c.afterVisit:c.arrival)}</p>${c.claimOrder?`<aside class="claim"><span class="eyebrow">ГРАМОТА ХРАНИТЕЛЮ</span><p class="order-number">№ ${esc(c.orderNumber)}</p><button id="copy-order" class="secondary">Скопировать номер</button></aside>`:''}${done?'<p class="success">✓ Слово найдено и вплетено в карту.</p>':`<button id="arrived">${esc(c.visitButton||'Мы на месте. Снять следующую печать →')}</button><p class="fine-print">${esc(c.visitNote||'Нажми после визита, когда будете готовы идти дальше.')}</p>`}</div><details class="solved-riddle"><summary>Перечитать разгаданную печать</summary><p class="puzzle-text">${esc(c.riddle)}</p></details>`:`<div class="riddle"><p class="eyebrow">ПРОЧТИ ЗНАКИ</p><p class="puzzle-text">${esc(c.riddle)}</p></div>${puzzleMarkup(c)}${!c.puzzle||c.puzzle.type==='cipher'?`<form id="answer-form"><label for="answer">Слово или число с печати</label><div class="answer-row"><input id="answer" autocomplete="off" required placeholder="Твой ответ…"><button aria-label="Проверить ответ">→</button></div><p id="answer-status" role="status"></p></form>`:''}<button id="hint" class="text-button" ${hint>=c.hints.length?'disabled':''}>Спросить у странника · ${hint}/${c.hints.length}</button>${c.hints.slice(0,hint).map(t=>`<p class="hint">${esc(t)}</p>`).join('')}`}${solved?'<label class="photo-button">＋ Оставить мгновение в летописи<input id="photo-input" type="file" accept="image/jpeg,image/png,image/webp" capture="environment"></label><p class="fine-print">Необязательно · Фото остаётся на этом устройстве</p>':''}`;
 if(!solved){
  if($('#answer-form'))$('#answer-form').onsubmit=e=>{e.preventDefault();if(accepts(c,$('#answer').value))solve(c);else $('#answer-status').textContent='Печать пока молчит. Попробуй иначе — или спроси у странника.'};
  $('#hint').onclick=()=>{state.hints[c.id]=hint+1;save();render()};
  if(c.puzzle){if(!puzzleProgress[c.id]||typeof puzzleProgress[c.id]!=='object'||Array.isArray(puzzleProgress[c.id]))puzzleProgress[c.id]={};puzzleCleanup=mountPuzzle(c,puzzleProgress[c.id],savePuzzles,()=>solve(c))||(()=>{})}
 }
 if($('#arrived'))$('#arrived').onclick=()=>complete();
 if($('#copy-order'))$('#copy-order').onclick=async()=>{try{await navigator.clipboard.writeText(c.orderNumber);toast('Номер грамоты скопирован.')}catch{toast('Покажите номер на экране.')}};
 if($('#photo-input'))$('#photo-input').onchange=upload;
 $('#inventory').innerHTML=state.done.length?chapters.slice(0,state.done.length).map((c,i)=>`<div class="word-fragment"><small>${String(i+1).padStart(2,'0')}</small><span>${esc(c.reward)}</span></div>`).join(''):'<p class="empty">Восемь печатей. Восемь слов. Одно послание, которое ждёт, когда ты его соберёшь.</p>';
 $('#final').hidden=state.done.length!==chapters.length;$('#second-map').hidden=!state.revealed;$('#finale-puzzle').hidden=state.revealed;
 if(state.done.length===chapters.length&&!state.revealed){$('#finale-puzzle').innerHTML=finaleMarkup();puzzleProgress.finale||={};finaleCleanup=mountFinale($('#finale-puzzle'),puzzleProgress.finale,savePuzzles,()=>{state.revealed=true;save();render();$('#second-map').scrollIntoView({behavior:'smooth',block:'center'})})}
}
function complete(force=false){const c=chapters[state.done.length];if(!c||(!force&&!canRevealDestination(state,c)))return;if(!state.solved.includes(c.id))state.solved.push(c.id);state.done.push(c.id);selected=Math.min(state.done.length,chapters.length-1);save();render();toast('Слово сохранено. Следующее послание ждёт.');if(state.done.length===chapters.length)$('#final').scrollIntoView({behavior:'smooth'});else $('#chapter').scrollIntoView({behavior:'smooth',block:'start'})}
async function upload(e){const file=e.target.files[0];if(!file||busy)return;if(!db){toast('Хранилище фото недоступно в этом браузере.');return}if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>12*1024*1024){toast('Выберите JPEG, PNG или WebP до 12 МБ.');return}busy=true;const chapter=chapters[selected];try{await store('readwrite',s=>s.put({id:crypto.randomUUID(),chapter:chapter.id,title:chapter.title,blob:file,date:Date.now(),ext:file.type.split('/')[1]}));await photos();toast('Снимок сохранён на этом устройстве.')}catch{toast('Не удалось сохранить фото: возможно, память заполнена. Скачайте снимок из галереи телефона.')}finally{busy=false;e.target.value=''}}
async function photos(){if(!db)return;const rows=await store('readonly',s=>s.getAll());urls.forEach(URL.revokeObjectURL);urls=[];$('#photos').innerHTML=rows.sort((a,b)=>a.date-b.date).map(r=>{const url=URL.createObjectURL(r.blob);urls.push(url);return `<figure><img src="${url}" alt="Снимок: ${esc(chapters.find(c=>c.id===r.chapter)?.title||"Мгновение в пути")}"><figcaption>${esc(chapters.find(c=>c.id===r.chapter)?.title||"Мгновение в пути")}</figcaption><a href="${url}" download="hobbit-${r.chapter}-${r.id}.${r.ext}">Скачать</a><button class="text-button" data-delete="${r.id}">Удалить</button></figure>`}).join('')||'<p class="empty">У каждой дороги есть мгновения, которые хочется сохранить.</p>';$('#photos').querySelectorAll('[data-delete]').forEach(b=>b.onclick=async()=>{if(confirm('Удалить этот снимок из локального журнала?')){await store('readwrite',s=>s.delete(b.dataset.delete));await photos()}})}
$('#start').onclick=()=>$('#prologue').scrollIntoView({behavior:'smooth'});
$('#accept-letter').onclick=()=>$('#adventure').scrollIntoView({behavior:'smooth'});
let taps=0,timer;$('#admin-trigger').onclick=()=>{clearTimeout(timer);if(++taps===5){$('#admin').showModal();taps=0}timer=setTimeout(()=>taps=0,2500)};
$('#skip').onclick=()=>{complete(true);$('#admin').close()};
$('#restart').onclick=()=>{if(!confirm('Начать историю заново? Прогресс загадок сбросится, фотографии останутся.'))return;state=restore(null,chapters);puzzleProgress={};savePuzzles();selected=0;save();render();$('#admin').close();toast('История началась заново. Фотографии сохранены.');$('#adventure').scrollIntoView({behavior:'smooth'})};
$('#reset').onclick=async()=>{if(!confirm('Удалить прогресс и ВСЕ локальные фото? Сначала скачайте нужные снимки.'))return;try{if(db)await store('readwrite',s=>s.clear());state=restore(null,chapters);puzzleProgress={};savePuzzles();selected=0;save();render();await photos();$('#admin').close();toast('Первая печать снова ждёт тебя.')}catch{toast('Не удалось сбросить прогресс. Попробуйте ещё раз.')}};
$('#keeper-alphabet').innerHTML=keyMarkup();

function setZoom(value){zoom=Math.max(1,Math.min(3,value));$('#map-canvas').style.width=`${zoom*100}%`;$('#zoom-out').disabled=zoom===1;$('#zoom-in').disabled=zoom===3}
$('#zoom-in').onclick=()=>setZoom(zoom+.5);$('#zoom-out').onclick=()=>setZoom(zoom-.5);setZoom(1);
try{
 const response=await fetch('./quest.json');if(!response.ok)throw Error();config=await response.json();chapters=config.chapters.filter(c=>c.enabled);if(!chapters.length)throw Error();let raw;
 try{raw=localStorage.getItem(key)}catch{toast('Сохранение недоступно. Не закрывайте страницу во время квеста.')}
 state=restore(raw,chapters);selected=Math.min(state.done.length,chapters.length-1);
 $('#intro').textContent=config.intro;$('#prologue-copy').innerHTML=config.prologue.map(p=>`<p>${esc(p)}</p>`).join('');$('#prologue-signature').textContent=config.prologueSignature;
 $('#destination').textContent=config.journey.destination||'Ещё одна карта. Ещё одна история.';$('#journey-message').textContent=config.journey.message;render();
 try{db=await openDB();await photos();$('#storage-status').textContent='Летопись хранится в этом браузере. Скачать снимок можно под фотографией.'}catch{$('#storage-status').textContent='Хранилище недоступно. Сохраняйте фотографии в галерее телефона.'}
}catch{$('#chapter').textContent='Письма не удалось прочесть. Обнови страницу, когда появится соединение.';$('#start').disabled=true}
