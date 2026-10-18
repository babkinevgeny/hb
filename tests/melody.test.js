import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {melodyRoundStep,roundSequence,restoreMelody,melodyMarkup} from '../melody.js';
const c=JSON.parse(readFileSync(new URL('../quest.json',import.meta.url))),p=c.chapters.find(c=>c.id==='company').puzzle;
test('three growing rounds open the gate only after all twelve final notes',()=>{
 let round=0;
 for(const length of [4,8,12]){assert.equal(roundSequence(p,round).length,length);let entered=[];for(let i=0;i<length;i++){const r=melodyRoundStep(p,round,entered,p.sequence[i]);assert.equal(r.solved,length===12&&i===11);if(i===length-1){assert.equal(r.round,round+1);assert.equal(r.advanced,length!==12)}entered=r.entered}round++}
});
test('a mistake in a later round preserves completed seals and allows retry',()=>{
 const r=melodyRoundStep(p,2,p.sequence.slice(0,5),7);assert.equal(r.round,2);assert.ok(r.wrong);assert.deepEqual(r.entered,[]);
 let result={round:2,entered:[]};for(const note of p.sequence)result=melodyRoundStep(p,result.round,result.entered,note);assert.ok(result.solved);
});
test('saved round and valid partial input survive reload; corrupt input is discarded',()=>{
 assert.deepEqual(restoreMelody({round:1,heard:true,entered:p.sequence.slice(0,6)},p),{round:1,heard:true,entered:p.sequence.slice(0,6)});
 assert.deepEqual(restoreMelody({round:2,heard:true,entered:[7]},p).entered,[]);
 assert.deepEqual(restoreMelody({round:1,heard:false,entered:[0]},p).entered,[]);
 assert.deepEqual(restoreMelody({round:99,entered:'oops'},p),{round:0,heard:false,entered:[]});
});
test('eight fixed leaves include two semitones and replay controls without destination spoilers',()=>{
 assert.equal(p.notes.length,8);assert.equal(p.notes.filter(n=>n.accidental).length,2);assert.deepEqual(p.rounds,[4,8,12]);
 for(const n of p.sequence)assert.ok(Number.isInteger(n)&&n>=0&&n<p.notes.length);
 assert.ok(Math.abs(p.notes[3].frequency/p.notes[2].frequency-2**(1/12))<.001);
 assert.ok(p.slowTempoMs>p.tempoMs);
 const html=melodyMarkup(p);assert.equal((html.match(/data-note=/g)||[]).length,8);assert.equal((html.match(/data-seal=/g)||[]).length,3);assert.match(html,/melody-slow/);assert.match(html,/melody-sound/);assert.doesNotMatch(html,/Campoamor|Viticulture|настольн/i);
});
