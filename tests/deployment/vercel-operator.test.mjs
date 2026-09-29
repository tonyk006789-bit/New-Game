import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),handler=require('../../.local/vercel-operator/.vercel/output/functions/operator.func/index.cjs').default;
const previous=process.env.GAME_ENV;process.env.GAME_ENV='production';
const server=createServer(handler);await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const origin=`http://127.0.0.1:${server.address().port}`;
after(async()=>{await new Promise(resolve=>server.close(resolve));if(previous===undefined)delete process.env.GAME_ENV;else process.env.GAME_ENV=previous;});
test('operator bundle fails closed outside its explicitly configured project',async()=>{
 const r=await fetch(origin+'/operator?__route=me');assert.equal(r.status,503);assert.equal((await r.json()).code,'API_NOT_CONFIGURED');
});
test('operator Node adapter limits request bodies and rejects route substitution',async()=>{
 assert.equal((await fetch(origin+'/operator?__route=auth/login',{method:'POST',body:'x'.repeat(17000)})).status,413);
 assert.equal((await fetch(origin+'/operator?__route=../admin')).status,404);
 assert.equal((await fetch(origin+'/v1/me?__route=operator/accounts')).status,404);
});
test('separate deployment contains only operator assets and preserves API routing',async()=>{
 const base='.local/vercel-operator/.vercel/output';
 const config=JSON.parse(await readFile(base+'/config.json','utf8'));assert.equal(config.routes[1].dest,'/operator?__route=$1');
 assert.equal(config.routes.at(-1).dest,'/index.html');
 const html=await readFile(base+'/static/index.html','utf8');assert.match(html,/Operator console/);
 const metadata=JSON.parse(await readFile(base+'/functions/operator.func/.vc-config.json','utf8'));assert.equal(metadata.runtime,'nodejs24.x');
});
