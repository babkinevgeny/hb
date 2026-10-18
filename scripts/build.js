import {mkdir,copyFile,readFile} from 'node:fs/promises';
await import('./generate-key.js');
const config=JSON.parse(await readFile('quest.json','utf8'));
const ids=new Set();
for(const c of config.chapters){if(ids.has(c.id)||!c.answers?.length||!c.hints?.length||(!c.privateLocation&&(!Array.isArray(c.coordinates)||c.coordinates.length!==2||!c.coordinates.every(Number.isFinite))))throw Error('Invalid chapter '+c.id);ids.add(c.id)}
await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css','app.js','core.js','quest.json','map.js','oviedo-map.svg','hero.jpg','hero-umka.jpg','hero-umka-oviedo.jpg','puzzles.js','melody.js','finale.js','invitation.js','music.js','decoder.js','breakfast-lock.js','living-leaf.js','dwarf-tablet.jpg','concerning-hobbits.mp3','map-fragment.svg','keeper-key.html','paper-grain.svg','storybook-background.jpg'])await copyFile(file,`dist/${file}`);
console.log('Static site built. Relative assets support /hb/ and local preview.');
