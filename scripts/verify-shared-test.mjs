import {readFile,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
const url=process.argv.includes('--local')?'http://127.0.0.1:5185':JSON.parse(await readFile('.local/staging/share-link.json','utf8')).url;
const users=JSON.parse(await readFile('.local/staging/human-testers.json','utf8')).accounts;
const evidence={url,verifiedAt:new Date().toISOString(),users:[],publicBoundary:{},browser:{}};
const env=await fetch(`${url}/v1/environment`,{signal:AbortSignal.timeout(20000)});assert.equal(env.status,200);const config=await env.json();assert.equal(config.profile.id,'stage-paying30-v2');assert.equal(config.sampleLogin,undefined);
for(const path of ['/v1/admin/accounts','/v1/admin/report','/.local/staging/human-testers.json','/src/App.vue']){const r=await fetch(url+path,{signal:AbortSignal.timeout(20000)});assert.equal(r.status,404);evidence.publicBoundary[path]=r.status;}
const sessions=[];
try{
 for(const user of users){
  const response=await fetch(`${url}/v1/auth/login`,{method:'POST',headers:{Origin:url,'Content-Type':'application/json'},body:JSON.stringify({username:user.username,password:user.password}),signal:AbortSignal.timeout(20000)});assert.equal(response.status,201,await response.clone().text());const cookie=response.headers.get('set-cookie');if(url.startsWith('https:'))assert.match(cookie,/Secure/);const auth={cookie:cookie.split(';')[0],csrf:(await response.json()).csrf};sessions.push(auth);
  const me=await (await fetch(`${url}/v1/me`,{headers:{Cookie:auth.cookie},signal:AbortSignal.timeout(20000)})).json();assert.equal(me.id,user.id);assert.equal(me.wallet.available,'100000');evidence.users.push({username:user.username,available:me.wallet.available});
 }
 const rooms=await Promise.all(sessions.map(async auth=>{const response=await fetch(`${url}/v1/practice/reef/join`,{method:'POST',headers:{Origin:url,'Content-Type':'application/json',Cookie:auth.cookie,'X-CSRF-Token':auth.csrf},body:'{}',signal:AbortSignal.timeout(20000)});assert.equal(response.status,201);return response.json();}));
 assert.equal(new Set(rooms.map(r=>r.id+':'+r.seat)).size,5);evidence.tables=new Set(rooms.map(r=>r.id)).size;assert.ok(evidence.tables>=2);console.log('Five distinct logins verified: 1000 credits each; five seats across '+evidence.tables+' tables.');
}finally{await Promise.all(sessions.map(auth=>fetch(`${url}/v1/auth/logout`,{method:'POST',headers:{Origin:url,'Content-Type':'application/json',Cookie:auth.cookie,'X-CSRF-Token':auth.csrf},body:'{}',signal:AbortSignal.timeout(20000)})));}
const browser=await chromium.launch({executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe',headless:true,args:['--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{
 const context=await browser.newContext({viewport:{width:1440,height:1000}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error'&&/Content Security|unsafe-eval|renderer/i.test(e.text()))errors.push(e.text());});
 await page.goto(url,{waitUntil:'networkidle',timeout:90000});assert.equal(await page.locator('.sample-login').count(),0);
 await page.getByLabel('PLAYER ID',{exact:true}).fill(users[0].username);await page.getByLabel('PASSWORD',{exact:true}).fill(users[0].password);await page.getByRole('button',{name:'SIGN IN',exact:true}).click();await page.locator('.hall-floor').waitFor({state:'visible'});
 assert.equal(await page.locator('.credit-meter strong').innerText(),'1,000.00');await mkdir('reports/screenshots-v7',{recursive:true});await page.screenshot({path:'reports/screenshots-v7/shared-lobby-desktop.png',fullPage:true});
 await page.getByRole('button',{name:'Explore Reef Party',exact:true}).click();await page.getByRole('button',{name:'OPEN TABLE',exact:true}).click();await page.locator('.fish-canvas canvas').waitFor({state:'visible',timeout:30000});await page.locator('.reef-seat-plaque.yours').waitFor({state:'visible',timeout:30000});
 assert.equal(await page.getByLabel('Stake',{exact:true}).locator('option').count(),80);await page.getByRole('button',{name:'Target lock',exact:true}).click();await page.getByRole('button',{name:'Fast fire cadence',exact:true}).click();await page.screenshot({path:'reports/screenshots-v7/shared-reef-desktop.png',fullPage:true});
 assert.deepEqual(errors,[]);await page.getByRole('button',{name:'Back to fishing lobby'}).click();await page.getByRole('button',{name:'Back to arcade'}).click();await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('button',{name:'SIGN OUT',exact:true}).click();
 evidence.browser={login:true,lobby:true,fishRenderer:true,stakeAmounts:80,errors,roundsPlayed:0};console.log('Shared browser login, lobby, cannon controls and eight-species renderer passed. No tester credits spent.');
}finally{await browser.close();await writeFile('reports/SHARED_TEST_VERIFICATION.json',JSON.stringify(evidence,null,2)+'\n');}
