export const normalize = value => String(value).normalize('NFKC').toLocaleLowerCase('ru').replace(/ё/g, 'е').replace(/[^\p{L}\p{N}]+/gu, ' ').trim();
export const accepts = (chapter, answer) => chapter.answers.some(a => normalize(a) === normalize(answer));
export function restore(raw, chapters) {
  try { const s = JSON.parse(raw); const done = []; for (const c of chapters) { if (!s.done?.includes(c.id)) break; done.push(c.id); } return {done, hints: Object.fromEntries(chapters.map(c=>[c.id,Math.min(c.hints.length,Math.max(0,Number(s.hints?.[c.id])||0))])), revealed: done.length===chapters.length && s.revealed===true}; } catch { return {done:[],hints:{},revealed:false}; }
}
