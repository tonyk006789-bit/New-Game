// Run after build:netlify: exercise the emitted entry, not the source module.
import {test} from 'node:test';
import assert from 'node:assert/strict';
import handler from '../../netlify/functions-build/game-api.mjs';

test('compiled ESM entry remains callable and closed without hosted settings',async()=>{
 const old=process.env.GAME_ENV;process.env.GAME_ENV='production';
 try{
  assert.equal(typeof handler,'function');
  const response=await handler(new Request('https://example.test/v1/me'),{});
  assert.equal(response.status,503);
  assert.equal((await response.json()).code,'API_NOT_CONFIGURED');
 }finally{if(old===undefined)delete process.env.GAME_ENV;else process.env.GAME_ENV=old;}
});
