const escapeHTML=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const alphabet='АБВГДЕЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ';
export function rune(letter,label='Знак'){
 const value=alphabet.indexOf(letter.toUpperCase())+1;if(!value)return '';
 const points=[[10,10],[30,10],[8,24],[32,24],[10,38],[30,38]];
 return `<svg viewBox="0 0 40 48" role="img" aria-label="${escapeHTML(label)}"><path d="M20 2L38 24 20 46 2 24Z" fill="none" stroke="currentColor" opacity=".25"/><path d="M20 8V40" stroke="currentColor" stroke-width="1.5"/>${points.map(([x,y],i)=>value&(1<<i)?`<path d="M20 24L${x} ${y}" stroke="currentColor" stroke-width="1.5"/><circle cx="${x}" cy="${y}" r="2.5" fill="currentColor"/>`:'').join('')}</svg>`;
}
export function encodeMarkup(message){let count=0;return message.toUpperCase().replace(/Ё/g,'Е').split(/\s+/).map(word=>`<span class="rune-word">${[...word].map(l=>alphabet.includes(l)?`<span class="cipher-rune">${rune(l,`Знак ${++count}`)}</span>`:`<span class="cipher-punctuation">${escapeHTML(l)}</span>`).join('')}</span>`).join(' ')}
export function keyMarkup(){return `<div class="rune-key">${[...alphabet].map(l=>`<div>${rune(l,`Буква ${l}`)}<strong>${l}</strong></div>`).join('')}</div>`}
export function constellationStep(sequence,selected,id){
 if(selected.includes(id))return {selected:[...selected],solved:false,wrong:false,duplicate:true};
 const next=[...selected,id];if(next.length<sequence.length)return {selected:next,solved:false,wrong:false};
 const solved=next.length===sequence.length&&sequence.every((v,i)=>v===next[i]);
 return {selected:solved?next:[],solved,wrong:!solved};
}
export function validArrangement(values){return Array.isArray(values)&&values.length===9&&new Set(values).size===9&&values.every(v=>Number.isInteger(v)&&v>=0&&v<9)}
export function swapTiles(values,a,b){const next=[...values];[next[a],next[b]]=[next[b],next[a]];return next}
export const tilesSolved=values=>validArrangement(values)&&values.every((v,i)=>v===i);
const skyPatterns={
 branch:{points:[[20,80],[40,62],[52,43],[62,17],[33,33],[16,48],[76,40]],edges:[[0,1],[1,2],[2,3],[2,4],[1,5],[2,6]]},
 crescent:{points:[[67,18],[39,24],[29,48],[47,77],[76,72],[53,56],[50,35],[83,31]],edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,0]]},
 bird:{points:[[16,54],[32,47],[47,53],[67,20],[75,61],[56,78],[37,69]],edges:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,2]]}
};
export function starGeometry(id,mirror=false){
 const [raw,variant]=id.split('-');const name=({leaf:'branch',moon:'crescent',sun:'bird'})[raw]||raw;
 const pattern=skyPatterns[name]||skyPatterns.branch;let points=pattern.points.map(p=>[...p]);const edges=pattern.edges.map(e=>[...e]);
 if(variant==='extra'){points.push(name==='bird'?[83,83]:[18,18]);edges.push([name==='bird'?4:1,points.length-1])}
 if(variant==='rotated')points=points.map(([x,y])=>[100-y,x]);
 if((variant==='mirror')!==mirror)points=points.map(([x,y])=>[100-x,y]);
 return {points,edges};
}
export function starShape(id,mirror=false){const {points,edges}=starGeometry(id,mirror);return `<svg viewBox="0 0 100 100" aria-hidden="true">${edges.map(([a,b])=>`<line x1="${points[a][0]}" y1="${points[a][1]}" x2="${points[b][0]}" y2="${points[b][1]}" stroke="currentColor" stroke-width="1" opacity=".8"/>`).join('')}${points.map(([x,y],i)=>`<circle class="star-glow" cx="${x}" cy="${y}" r="${i===0?2.6:2}" fill="currentColor"/>`).join('')}</svg>`}
export function puzzleMarkup(chapter){const p=chapter.puzzle;if(!p)return '';
 if(p.type==='constellation')return `<div class="star-letter"><div class="star-parchment"><p class="eyebrow">ТРИ ПЕЧАТИ · ОДНО НАСТОЯЩЕЕ НЕБО</p><div class="star-signatures">${p.signatures.map(s=>`<div><div class="wax-imprint" role="img" aria-label="${escapeHTML(s.description)}">${starShape(s.sign,true)}</div><span>${escapeHTML(s.name)}</span></div>`).join('')}</div><p class="star-verse">${escapeHTML(p.orderClue)}</p><div class="star-divider">✧</div><p class="star-quote">${escapeHTML(p.mirrorClue)}</p></div><div class="star-sky"><svg class="star-thread" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polyline id="star-thread-line" points=""/></svg>${p.groups.map((g,i)=>`<button data-star="${g.id}" class="star-group star-group-${i}" aria-label="${escapeHTML(g.label)}">${starShape(g.id)}<span class="star-order"></span></button>`).join('')}</div><p id="star-progress" class="puzzle-feedback" role="status"></p><button id="star-reset" class="text-button" type="button">Начать цепочку заново</button></div>`;
 if(p.type==='map')return `<div class="map-restoration"><div class="restoration-heading"><span>N ↑</span><span>ЛИСТ ИЗ КНИГИ ДОРОГ</span></div><div id="tile-board" class="tile-board" aria-label="Девять фрагментов карты"></div><p class="tile-instruction">Коснись одного фрагмента, затем другого, чтобы поменять их местами. Перетаскивать не нужно.</p><p id="tile-status" class="puzzle-feedback" role="status"></p><button id="tile-reset" class="text-button" type="button">Вернуть исходные фрагменты</button><p class="tile-credit">Геометрия © OpenStreetMap contributors · ODbL</p></div>`;
 if(p.type==='cipher')return `<div class="cipher-message"><p class="eyebrow">ПОСЛАНИЕ ДЛЯ ДВОИХ</p>${encodeMarkup(p.message)}<p class="cipher-instruction">У спутника есть ключ. У тебя — послание. Опишите друг другу знаки и прочтите его вместе. Ё записана как Е.</p></div>`;
 return '';
}
export function mountPuzzle(chapter,progress,save,onSolve){const p=chapter.puzzle;if(!p)return;
 if(p.type==='constellation'){
  let selected=progress.revision===p.revision&&Array.isArray(progress.stars)&&new Set(progress.stars).size===progress.stars.length&&progress.stars.every(id=>p.groups.some(g=>g.id===id))&&progress.stars.length<p.sequence.length?[...progress.stars]:[];progress.revision=p.revision;
  const feedback=document.querySelector('#star-progress');
  function paint(message){document.querySelectorAll('[data-star]').forEach(b=>{const index=selected.indexOf(b.dataset.star);b.classList.toggle('star-chosen',index>=0);b.setAttribute('aria-pressed',String(index>=0));b.querySelector('.star-order').textContent=index>=0?String(index+1):''});const sky=document.querySelector('.star-sky').getBoundingClientRect();document.querySelector('#star-thread-line').setAttribute('points',selected.map(id=>{const b=document.querySelector(`[data-star="${id}"]`).getBoundingClientRect();return `${(b.left+b.width/2-sky.left)/sky.width*100},${(b.top+b.height/2-sky.top)/sky.height*100}`}).join(' '));feedback.textContent=message||`Выбрано звёздных знаков: ${selected.length} / ${p.sequence.length}`;progress.stars=selected;save()}
  document.querySelectorAll('[data-star]').forEach(b=>b.onclick=()=>{const result=constellationStep(p.sequence,selected,b.dataset.star);selected=result.selected;if(result.solved){progress.stars=selected;save();onSolve();return}paint(result.wrong?'Печати молчат: не сошлись рисунки или порядок. Вглядись в письмо и попробуй снова.':result.duplicate?'Этот знак уже в цепочке. Выбери другой или начни заново.':undefined)});
  document.querySelector('#star-reset').onclick=()=>{selected=[];paint()};paint();
 }
 if(p.type==='map'){
  let values=validArrangement(progress.tiles)&&!tilesSolved(progress.tiles)?[...progress.tiles]:[...p.initial],selected=null;
  const board=document.querySelector('#tile-board');
  function paint(message){board.innerHTML=values.map((value,i)=>`<button type="button" class="map-tile ${selected===i?'tile-selected':''}" data-slot="${i}" style="background-position:${value%3*50}% ${Math.floor(value/3)*50}%" aria-label="Фрагмент в позиции ${i+1}" aria-pressed="${selected===i}"></button>`).join('');document.querySelector('#tile-status').textContent=message||'Собери улицы в единую карту. Север — сверху.';board.querySelectorAll('button').forEach(b=>b.onclick=()=>{const slot=+b.dataset.slot;if(selected===null){selected=slot;paint('Теперь выбери второй фрагмент.');return}if(selected===slot){selected=null;paint();return}values=swapTiles(values,selected,slot);selected=null;progress.tiles=values;save();if(tilesSolved(values)){onSolve();return}paint('Фрагменты поменялись местами. Продолжай восстанавливать улицы.')})}
  document.querySelector('#tile-reset').onclick=()=>{values=[...p.initial];selected=null;progress.tiles=values;save();paint()};paint();
 }
}
