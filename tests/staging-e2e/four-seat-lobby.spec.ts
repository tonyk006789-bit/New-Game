import {test,expect} from '@playwright/test';
import {readFile,mkdir} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {totp} from '../../apps/api/src/security';
type Auth={cookie:string;csrf:string};
test('four distinct players choose seats in the secondary lobby and release them on exit',async({page,browser},info)=>{
 test.skip(info.project.name!=='desktop','Desktop exercises four concurrent browsers; viewport cases cover the responsive lobby separately.');test.setTimeout(120000);
 await page.emulateMedia({reducedMotion:'reduce'});
 const credentials=JSON.parse(await readFile('.local/staging/admin-credentials.json','utf8'));
 async function call(path:string,body:unknown|undefined,auth?:Auth){const res=await fetch(`http://127.0.0.1:3001/v1/${path}`,{method:body===undefined?'GET':'POST',headers:{Origin:'http://127.0.0.1:5184','Content-Type':'application/json',...(auth?{Cookie:auth.cookie,'X-CSRF-Token':auth.csrf}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});const data=await res.json();if(!res.ok)throw new Error(JSON.stringify(data));return {data,cookie:res.headers.get('set-cookie')?.split(';')[0]||''};}
 const root=await call('auth/login',{username:credentials.username,password:credentials.password,code:totp(credentials.totpSecret)}),admin={cookie:root.cookie,csrf:root.data.csrf};
 const branch=JSON.parse(await readFile('.local/staging/player-credentials.json','utf8')).accounts.find((a:{role:string})=>a.role==='AGENT');
 const users:({id:string;username:string;password:string;name:string;auth:Auth})[]=[],contexts=[],tabs=[page];let roomId='',heartbeats:ReturnType<typeof setInterval>|undefined;
 try{
  for(let i=0;i<4;i++){
   const username=`qa.${randomUUID().slice(0,12)}`,password=randomUUID(),name=`Seat Tester ${i+1}`;
   const account=await call('admin/accounts',{parentId:branch.id,username,password,displayName:name},admin),login=await call('auth/login',{username,password});users.push({id:account.data.id,username,password,name,auth:{cookie:login.cookie,csrf:login.data.csrf}});
   if(i){const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});contexts.push(context);tabs.push(await context.newPage());}
  }
  const seated:number[]=[];
  heartbeats=setInterval(()=>{for(const index of seated)void call('practice/reef/join',{roomId},users[index].auth).catch(()=>{});},4000);
  for(let i=0;i<4;i++){
   const tab=tabs[i],user=users[i];await tab.bringToFront();await tab.goto('http://127.0.0.1:5183');await tab.getByLabel('PLAYER ID',{exact:true}).fill(user.username);await tab.getByLabel('PASSWORD',{exact:true}).fill(user.password);await tab.getByRole('button',{name:'SIGN IN',exact:true}).click();await tab.getByRole('button',{name:'Explore Reef Party',exact:true}).click();
   await expect(tab.getByRole('heading',{name:'Choose your table'})).toBeVisible({timeout:20000});const joined=tab.waitForResponse('**/v1/practice/reef/join');
   if(i===0)await tab.getByRole('button',{name:'New table seat 1 open',exact:true}).click();else await tab.locator(`[data-table-id="${roomId}"]`).locator(`.position-${i+1}`).click();
   const snapshot=await (await joined).json();if(!roomId)roomId=snapshot.id;expect(snapshot.id).toBe(roomId);expect(snapshot.seat).toBe(i+1);seated.push(i);
   await expect(tab.locator('.reef-seat-plaque.yours')).toContainText(user.name,{timeout:20000});await expect(tab.locator('.reef-seat-plaque')).toHaveCount(4);
  }
  await page.bringToFront();for(const user of users)await expect(page.locator('.reef-deluxe')).toContainText(user.name,{timeout:10000});
  await mkdir('reports/screenshots-v8',{recursive:true});await page.screenshot({path:'reports/screenshots-v8/four-real-players.png',fullPage:true});
  for(const seat of [1,2,3,4]){const plaque=page.locator(`.reef-seat-plaque.seat-${seat}`);await expect(plaque).toBeVisible();const box=(await plaque.boundingBox())!;expect(box.y).toBeGreaterThanOrEqual(0);expect(box.y+box.height).toBeLessThanOrEqual(1000);}
  seated.splice(seated.indexOf(0),1);await page.getByRole('button',{name:'Back to fishing lobby'}).click();const table=page.locator(`[data-table-id="${roomId}"]`);await expect(table.locator('.table-occupancy')).toContainText('3 / 4');await expect(table.locator('.position-1')).toBeEnabled();
  await page.screenshot({path:'reports/screenshots-v8/table-selection.png',fullPage:true});
 }finally{
  clearInterval(heartbeats);await Promise.all(contexts.map(c=>c.close()));
  for(const user of users){if(roomId)await call('practice/reef/leave',{roomId},user.auth).catch(()=>{});await call('auth/logout',{},user.auth).catch(()=>{});await call(`admin/accounts/${user.id}/manage`,{action:'SET_ACTIVE',active:false,reason:'Completed four-seat browser test; no test funding or game stakes'},admin);}
  await call('auth/logout',{},admin);
 }
});
