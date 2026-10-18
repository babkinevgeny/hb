import test from 'node:test';import assert from 'node:assert/strict';import {musicMayPlay,MUSIC_VIDEO} from '../music.js';
test('background music pauses for leaf puzzle and respects explicit off',()=>{assert.equal(MUSIC_VIDEO,'CL_3mlOPnGI');assert.ok(musicMayPlay(true,false));assert.ok(!musicMayPlay(true,true));assert.ok(!musicMayPlay(false,true));assert.ok(!musicMayPlay(false,false))});
