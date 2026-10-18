import test from 'node:test';
import assert from 'node:assert/strict';
import {roadAligned,finaleMarkup,mountFinale} from '../finale.js';
import {readFileSync} from 'node:fs';
test('both road rings must align, including wrapped rotations',()=>{for(let a=0;a<8;a++)for(let b=0;b<8;b++)assert.equal(roadAligned([a,b]),a===0&&b===0);assert.ok(roadAligned([8,-8]));assert.ok(!roadAligned([0]));assert.ok(!roadAligned([.5,0]))});
test('dinner precedes the final seal and has no answer input',()=>{const q=JSON.parse(readFileSync(new URL('../quest.json',import.meta.url)));const f=q.chapters.at(-1);assert.equal(f.puzzle.type,'invitation');assert.match(f.place,/Tierra Astur/);assert.match(f.visitButton,/готовы к новой дороге/);assert.match(f.visitNote,/после ужина/);const html=finaleMarkup();assert.equal((html.match(/data-ring=/g)||[]).length,2);assert.equal((html.match(/data-hand=/g)||[]).length,2)});
test('one hand cannot reveal map; releasing either cancels the shared hold',async()=>{
 const elements=new Map();const element=()=>({style:{},classList:{toggle(){},remove(){}},setPointerCapture(){},value:0,hidden:false});for(const s of ['#road-hands','#road-hold','#road-outer','#road-inner','#road-status'])elements.set(s,element());
 const rings=[0,1].map(i=>({...element(),dataset:{ring:String(i)}})),hands=[0,1].map(i=>({...element(),dataset:{hand:String(i)}}));
 const root={classList:{toggle(){}},querySelector(s){const m=s.match(/data-hand="(\d)"/);return m?hands[+m[1]]:elements.get(s)},querySelectorAll(s){return s==='[data-ring]'?rings:hands}};
 globalThis.window={addEventListener(){},removeEventListener(){}};let revealed=0;const progress={rings:[0,0]},cleanup=mountFinale(root,progress,()=>{},()=>revealed++);const down={preventDefault(){},pointerId:1};
 hands[0].onpointerdown(down);await new Promise(r=>setTimeout(r,60));assert.equal(elements.get('#road-hold').value,0);hands[1].onpointerdown(down);await new Promise(r=>setTimeout(r,90));assert.ok(elements.get('#road-hold').value>0);hands[0].onpointerup();assert.equal(elements.get('#road-hold').value,0);assert.equal(revealed,0);
 hands[0].onpointerdown(down);await new Promise(r=>setTimeout(r,2100));assert.equal(revealed,1);cleanup();delete globalThis.window;
});
