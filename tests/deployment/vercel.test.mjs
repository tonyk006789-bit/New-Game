import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),handler=require('../../.vercel/output/functions/game.func/index.cjs').default;
const previous=process.env.GAME_ENV;process.env.GAME_ENV='production';
const server=createServer(handler);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
after(async()=>{await new Promise(resolve=>server.close(resolve));if(previous===undefined)delete process.env.GAME_ENV;else process.env.GAME_ENV=previous;});
test('emitted Node function runs and keeps credit play disabled without test configuration',async()=>{
 const r=await fetch(origin+'/game?__route=me');assert.equal(r.status,503);assert.equal((await r.json()).code,'API_NOT_CONFIGURED');assert.equal(r.headers.get('cache-control'),'no-store');
});
test('bounded adapter rejects oversized requests and unsafe rewritten paths',async()=>{
 assert.equal((await fetch(origin+'/game?__route=auth/login',{method:'POST',body:'x'.repeat(17000)})).status,413);
 assert.equal((await fetch(origin+'/game?__route=../admin')).status,404);
});
test('Vercel preserves the public path and rejects mismatched or extra routing inputs',async()=>{
 const fixture={GAME_ENV:'hosted-test',HOSTED_TEST_SITE_ID:'11111111-1111-4111-8111-111111111111',HOSTED_TEST_PLATFORM:'vercel',HOSTED_TEST_PROJECT_ID:'prj_Test123',VERCEL_PROJECT_ID:'prj_Test123',VERCEL:'1',HOSTED_TEST_PROFILE:'stage-paying30-v2',DATABASE_URL:'postgresql://fixture:fixture@database.example/test?sslmode=verify-full'};
 const saved=Object.fromEntries(Object.keys(fixture).map(key=>[key,process.env[key]]));Object.assign(process.env,fixture);
 try{
  for(const path of ['/v1/environment?__route=environment','/game?__route=environment','/v1/environment']){
   const r=await fetch(origin+path);assert.equal(r.status,200);assert.equal((await r.json()).staging,true);
  }
  for(const path of ['/v1/me?__route=environment','/game?__route=environment&__route=health','/v1/environment?__route=environment&accountId=someone','/v1/admin/accounts?__route=admin/accounts'])assert.equal((await fetch(origin+path)).status,404,path);
 }finally{for(const [key,value] of Object.entries(saved)){if(value===undefined)delete process.env[key];else process.env[key]=value;}}
});
test('API routing precedes SPA fallback and static output excludes privileged application',async()=>{
 const config=JSON.parse(await readFile('.vercel/output/config.json','utf8'));
 assert.equal(config.version,3);assert.equal(config.routes[1].src,'/v1/(.*)');assert.equal(config.routes.at(-1).dest,'/index.html');
 const html=await readFile('.vercel/output/static/index.html','utf8');assert.match(html,/New Game/);assert.doesNotMatch(html,/admin\/src/);
 const functionConfig=JSON.parse(await readFile('.vercel/output/functions/game.func/.vc-config.json','utf8'));assert.equal(functionConfig.runtime,'nodejs24.x');
});
