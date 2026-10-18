export const normalize = value => String(value).normalize('NFKC').toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export const accepts = (chapter, answer) => chapter.answers.some(a => normalize(a) === normalize(answer));
export function restore(raw, chapters) {
  const empty={done:[],solved:[],hints:{},revealed:false};
  try { const s=JSON.parse(raw); if(!s||typeof s!=='object')return empty;const done=[];for(const c of chapters){if(!s.done?.includes(c.id))break;done.push(c.id)}
    const solved=[...done];const current=chapters[done.length];if(current&&s.solved?.includes(current.id))solved.push(current.id);
    return {done,solved,hints:Object.fromEntries(chapters.map(c=>[c.id,Math.min(c.hints.length,Math.max(0,Number(s.hints?.[c.id])||0))])),revealed:done.length===chapters.length&&s.revealed===true};
  }catch{return empty}
}
export function canRevealDestination(state,chapter){return state.solved.includes(chapter.id)||state.done.includes(chapter.id)}
export function visibleStoryChapters(chapters,state){return chapters.filter((c,i)=>i===0||state.done.includes(c.id)||state.solved.includes(c.id))}
