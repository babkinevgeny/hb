// Called directly from each user gesture, including after a saved game remount.
export function createMelodyAudio(env=window){
 let context=null,disposed=false;
 return {
  async ready(){
   if(disposed)return null;
   try{
    try{if(env.navigator?.audioSession)env.navigator.audioSession.type='playback'}catch{}
    if(!context||context.state==='closed'){const Audio=env.AudioContext||env.webkitAudioContext;if(!Audio)return null;context=new Audio()}
    const current=context;
    // Start a silent buffer inside the gesture to unlock older mobile WebKit.
    const source=current.createBufferSource();source.buffer=current.createBuffer(1,1,current.sampleRate);source.connect(current.destination);source.start(0);source.onended=()=>source.disconnect();
    if(current.state!=='running')await current.resume();
    return !disposed&&current.state==='running'?current:null;
   }catch{return null}
  },
  suspend(){if(context?.state==='running')context.suspend().catch(()=>{})},
  close(){disposed=true;if(context&&context.state!=='closed')context.close().catch(()=>{})}
 };
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function melodyStep(sequence,entered,note){const next=[...entered,note];if(next.length>sequence.length||next.some((v,i)=>v!==sequence[i]))return {entered:[],wrong:true,solved:false};return {entered:next,wrong:false,solved:next.length===sequence.length}}
export const roundSequence=(p,round)=>p.sequence.slice(0,p.rounds[Math.min(round,p.rounds.length-1)]);
export function melodyRoundStep(p,round,entered,note){
 if(round>=p.rounds.length)return {round,entered:[],wrong:false,advanced:false,solved:true};
 const result=melodyStep(roundSequence(p,round),entered,note);
 if(result.solved)return {round:round+1,entered:[],wrong:false,advanced:round+1<p.rounds.length,solved:round+1===p.rounds.length};
 return {round,entered:result.entered,wrong:result.wrong,advanced:false,solved:false};
}
export function restoreMelody(progress,p){
 const round=Number.isInteger(progress.round)&&progress.round>=0&&progress.round<=p.rounds.length?progress.round:0;
 const sequence=roundSequence(p,round),heard=progress.heard===true;
 return {round,heard,entered:heard&&round<p.rounds.length&&Array.isArray(progress.entered)&&progress.entered.length<sequence.length&&progress.entered.every((v,i)=>v===sequence[i])?[...progress.entered]:[]};
}
const leaf=`<svg viewBox="0 0 60 76" aria-hidden="true"><path d="M30 4C20 9 23 17 10 17L16 29 4 34 15 44 10 55 26 57 30 69 35 57 51 54 45 43 57 33 44 29 50 16C38 19 40 9 30 4Z" fill="currentColor" stroke="#d1b371" stroke-width="1"/><path d="M30 12V65M30 32L19 23M30 44L44 33M30 52L19 43" fill="none" stroke="#172c1c" stroke-width="1.5"/></svg>`;
export function melodyMarkup(p){return `<div class="melody-trial"><p id="melody-round-label" class="melody-round-label"></p><div id="vine-gate" class="vine-gate" role="img" aria-label="Закрытые ворота Дорвиниона"><div class="gate-light"></div><div class="gate-door gate-left"><span>❦</span></div><div class="gate-door gate-right"><span>❦</span></div><div class="gate-arch">Д О Р В И Н И О Н</div><span class="gate-lock">✧</span><div id="gate-seals" class="gate-seals" aria-label="Три печати ворот">${p.rounds.map((_,i)=>`<span data-seal="${i}">${i+1}</span>`).join('')}</div></div><div class="melody-leaves" role="group" aria-label="Восемь поющих листьев">${p.notes.map((n,i)=>`<button class="melody-leaf ${n.accidental?'leaf-accidental':''}" data-note="${i}" aria-label="Лист ${i+1}: ${esc(n.name)}" disabled>${leaf}<span>${i+1}${n.accidental?`<small>${esc(n.accidental)}</small>`:''}</span></button>`).join('')}</div><div class="melody-controls"><button id="melody-listen" type="button">Послушать ветер</button><button id="melody-slow" type="button">Послушать медленно</button><button id="melody-sound" type="button" class="text-button" aria-pressed="true">Звук включён</button></div><p class="melody-caption">Три печати: 4 → 8 → 12 нот. Каждый напев продолжает предыдущий. Ошибка возвращает к началу только текущего напева. Можно слушать сколько угодно — со звуком или по свету листьев.</p><div id="melody-dots" class="melody-dots" aria-label="Ход мелодии"></div><p id="melody-status" class="puzzle-feedback" role="status" aria-live="polite"></p></div>`}
export function mountMelody(p,progress,save,onSolve){
 let disposed=false,playing=false,opening=false,sound=progress.sound!==false,audio=null;const engine=createMelodyAudio();const timers=new Set();
 if(progress.revision!==p.revision){progress.round=0;progress.heard=false;progress.entered=[];progress.opened=false}progress.revision=p.revision;
 let {round,heard,entered}=restoreMelody(progress,p);
 const root=document.querySelector('.melody-trial'),listen=root.querySelector('#melody-listen'),slow=root.querySelector('#melody-slow'),status=root.querySelector('#melody-status'),leaves=[...root.querySelectorAll('[data-note]')];
 function later(fn,ms){const id=setTimeout(()=>{timers.delete(id);if(!disposed)fn()},ms);timers.add(id);return id}
 function persist(){progress.round=round;progress.heard=heard;progress.entered=[...entered];progress.sound=sound;save()}
 function paint(message){
  root.querySelector('#melody-sound').setAttribute('aria-pressed',String(sound));root.querySelector('#melody-sound').textContent=sound?'Звук включён · выключить':'Включить звук';leaves.forEach(b=>b.disabled=playing||opening||!heard);listen.disabled=slow.disabled=playing||opening;
  const length=roundSequence(p,round).length;
  root.querySelector('#melody-round-label').textContent=round<p.rounds.length?`Печать ${round+1} из ${p.rounds.length} · ${length} нот`:'Все три печати открыты';
  root.querySelectorAll('[data-seal]').forEach((seal,i)=>{seal.classList.toggle('seal-lit',i<round);seal.setAttribute('aria-label',`Печать ${i+1}: ${i<round?'открыта':'закрыта'}`)});
  root.querySelector('#melody-dots').innerHTML=roundSequence(p,round).map((_,i)=>`<span class="${i<entered.length||round===p.rounds.length?'filled':''}" aria-hidden="true"></span>`).join('');root.querySelector('#melody-dots').setAttribute('aria-label',`Повторено нот: ${entered.length} из ${length}`);
  status.textContent=message||(heard?`Теперь твоя очередь. Повторено: ${entered.length} / ${length}`:'Послушай новый напев. Уже открытые печати останутся с тобой.');persist();
 }
 function tone(index,duration){if(!sound||!audio||audio.state!=='running')return;try{const now=audio.currentTime,end=Math.max(.2,duration/1000),osc=audio.createOscillator(),gain=audio.createGain();osc.type='sine';osc.frequency.value=p.notes[index].frequency;gain.gain.setValueAtTime(.0001,now);gain.gain.exponentialRampToValueAtTime(.10,now+.035);gain.gain.exponentialRampToValueAtTime(.0001,now+end);osc.connect(gain);gain.connect(audio.destination);osc.start(now);osc.stop(now+end+.02)}catch{}}
 function flash(index,duration=500,withSound=true){const b=leaves[index];b.classList.add('leaf-singing');if(withSound)tone(index,duration);later(()=>b.classList.remove('leaf-singing'),duration)}
 function unlock(){opening=true;progress.opened=true;persist();root.querySelector('#vine-gate').classList.add('gate-open');root.querySelector('#vine-gate').setAttribute('aria-label','Ворота Дорвиниона открываются');paint('Три печати отозвались. Добро пожаловать в Дорвинион!');later(onSolve,850)}
 async function play(slowly){
  if(playing||opening)return;playing=true;entered=[];paint(slowly?'Слушай медленный напев и следи за листьями…':'Слушай и следи за листьями…');
  if(sound){audio=await engine.ready();if(disposed)return;if(!audio){playing=false;paint('Браузер не включил звук. Нажми «Послушать ветер» ещё раз или выключи звук и следи за подсветкой.');return}}
  let offset=250;const sequence=roundSequence(p,round),tempo=slowly?p.slowTempoMs:p.tempoMs;
  sequence.forEach((note,i)=>{const interval=tempo*(p.rhythm?.[i]||1),duration=Math.max(240,interval*.72);later(()=>{flash(note,duration);status.textContent=`Печать ${round+1}. Лист ${note+1} · ${i+1} / ${sequence.length}`},offset);offset+=interval});
  later(()=>{playing=false;heard=true;paint('Теперь твоя очередь. Коснись листьев в том же порядке.')},offset);
 }
 listen.onclick=()=>play(false);slow.onclick=()=>play(true);
 root.querySelector('#melody-sound').onclick=async()=>{sound=!sound;if(!sound){engine.suspend();paint()}else{audio=await engine.ready();if(disposed)return;paint(audio?'Звук готов. Нажми «Послушать ветер».':'Звук пока недоступен. Проверь громкость мультимедиа и беззвучный режим телефона.')}persist()};

 leaves.forEach(b=>b.onclick=()=>{if(playing||opening||!heard)return;const note=+b.dataset.note;if(sound)engine.ready().then(ctx=>{if(disposed)return;audio=ctx;if(ctx)tone(note,280)});flash(note,280,false);const result=melodyRoundStep(p,round,entered,note);round=result.round;entered=result.entered;if(result.solved){unlock();return}if(result.advanced){heard=false;paint(`Печать ${round} зажглась! Послушай следующий напев — ${p.rounds[round]} нот.`);return}paint(result.wrong?'Песня сбилась. Попробуй текущий напев с начала: открытые печати сохранены.':undefined)});
 paint();if(progress.opened===true||round===p.rounds.length)unlock();
 return ()=>{disposed=true;timers.forEach(clearTimeout);timers.clear();engine.close()};
}
