import {test,expect,type Page} from '@playwright/test';
import {readFile,mkdir,copyFile} from 'node:fs/promises';
import {randomUUID} from 'node:crypto';
import {totp} from '../../apps/api/src/security';
import {reefTarget} from '@new-game/game-math';
let cookie='',csrf='',user:{username:string;password:string;id:string},adminCredentials:{username:string;password:string;totpSecret:string};
async function request(path:string,body?:unknown){const res=await fetch(`http://127.0.0.1:3001/v1/${path}`,{method:body===undefined?'GET':'POST',headers:{Origin:'http://127.0.0.1:5184','Content-Type':'application/json',Cookie:cookie,'X-CSRF-Token':csrf},...(body===undefined?{}:{body:JSON.stringify(body)})});const data=await res.json();if(!res.ok)throw new Error(data.message||data.code);if(res.headers.get('set-cookie'))cookie=res.headers.get('set-cookie')!.split(';')[0];return data;}
test.beforeAll(async()=>{
 adminCredentials=JSON.parse(await readFile('.local/staging/admin-credentials.json','utf8'));csrf=(await request('auth/login',{username:adminCredentials.username,password:adminCredentials.password,code:totp(adminCredentials.totpSecret)})).csrf;
 const branch=JSON.parse(await readFile('.local/staging/player-credentials.json','utf8')).accounts.find((a:{role:string})=>a.role==='AGENT');
 const username=`qa.${randomUUID().slice(0,12)}`,password=randomUUID();const account=await request('admin/accounts',{parentId:branch.id,username,password,displayName:'Staging QA'});user={username,password,id:account.id};
 await request('admin/credit-adjustments',{targetId:user.id,direction:'ADD',amount:'10000',expectedVersion:'0',requestKey:randomUUID(),reason:'Manual isolated UI test funding; separate from owner balance'});
});
test.afterAll(async()=>{
 if(!user)return;await request('auth/verify',{password:adminCredentials.password,code:totp(adminCredentials.totpSecret)});
 const wallet=(await request('admin/accounts')).find((a:{id:string})=>a.id===user.id).wallet;
 if(BigInt(wallet.available)>0n)await request('admin/credit-adjustments',{targetId:user.id,direction:'REMOVE',amount:wallet.available,expectedVersion:wallet.version,requestKey:randomUUID(),reason:'Retire remaining UI test credits after verification'});
 await request(`admin/accounts/${user.id}/manage`,{action:'SET_ACTIVE',active:false,reason:'Completed automated staging UI verification'});await request('auth/logout',{});
});
test.afterEach(async({page},info)=>{const video=page.video();await page.close();if(video){await mkdir('reports/recordings-v8',{recursive:true});await copyFile(await video.path(),`reports/recordings-v8/${info.title.split(',')[0].replaceAll(' ','-')}-${info.project.name}.webm`);}});
async function login(page:Page){await page.goto('/');await page.getByLabel('PLAYER ID',{exact:true}).fill(user.username);await page.getByLabel('PASSWORD',{exact:true}).fill(user.password);await page.getByRole('button',{name:'SIGN IN',exact:true}).click();await expect(page.getByRole('button',{name:'Explore Neon Sevens',exact:true})).toBeVisible();}
async function evidence(page:Page,name:string){await mkdir('reports/screenshots-v8',{recursive:true});await page.screenshot({path:`reports/screenshots-v8/${name}.png`,fullPage:true,animations:'disabled'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);const board=page.locator('.vault-machine,.cascade-machine,.temple-game .kinetic-reels');if(await board.count()){const b=(await board.boundingBox())!,c=(await page.locator('.feature-console,.temple-game .preview-controls').boundingBox())!;expect(b.y+b.height).toBeLessThanOrEqual(c.y+1);}}
test('all seven machines settle selected stakes and show saved results',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.emulateMedia({reducedMotion:'reduce'});await login(page);await evidence(page,`lobby-${info.project.name}`);
 const games=[['Neon Sevens','neon-sevens'],['Jade Fortune','jade-fortune'],['Coin Carnival','coin-carnival'],['Aurora Vault','aurora-vault'],['Ember Relics','ember-relics'],['Temple Lights','temple-lights'],['Orchard Numbers','orchard-numbers']];
 for(let i=0;i<games.length;i++){
  const [name,id]=games[i];await page.getByRole('button',{name:`Explore ${name}`,exact:true}).click();const stake=['0.25','1.00','2.75','5.00','10.00','20.00','0.75'][i];await page.getByLabel('Stake',{exact:true}).selectOption(String(Math.round(Number(stake)*100)));
  if(id==='orchard-numbers')await page.getByRole('button',{name:'Quick pick',exact:true}).click();
  const response=page.waitForResponse(r=>r.url().endsWith(`/staging/${id}/rounds`)&&r.request().method()==='POST');
  const button=id==='aurora-vault'?'OPEN VAULT':id==='ember-relics'?'START CASCADE':id==='temple-lights'?'Spin':id==='orchard-numbers'?'Draw':'SPIN PLAY';
  await page.getByRole('button',{name:button,exact:true}).click();const res=await response;expect(res.status()).toBe(201);const round=await res.json();expect(round.stake).toBe(String(Math.round(Number(stake)*100)));
  await expect(page.locator('.stage-return')).toContainText((Number(round.award)/100).toFixed(2));
  await expect(page.locator('.credit-meter strong')).toHaveText((Number(round.after.available)/100).toFixed(2));
  if(i<3)await expect(page.locator('.slot-cabinet')).toHaveAttribute('data-phase','complete');
  await evidence(page,`${id}-${info.project.name}`);await page.getByRole('button',{name:'Back to arcade'}).click();
 }
 await page.getByRole('button',{name:'HISTORY',exact:true}).click();await expect(page.locator('.player-history-row')).toHaveCount(7);await expect(page.getByText('PAYTABLE & STATISTICS',{exact:true})).toHaveCount(0);await evidence(page,`history-${info.project.name}`);expect(errors).toEqual([]);
});
test('lost response survives reload and recovers without another charge',async({page},info)=>{
 await login(page);await page.getByRole('button',{name:'Explore Neon Sevens',exact:true}).click();await page.getByLabel('Stake',{exact:true}).selectOption('75');
 let committed:{id:string;after:{available:string}}|undefined,markDropped:()=>void;
 const dropped=new Promise<void>(resolve=>{markDropped=resolve;});
 await page.route('**/v1/staging/neon-sevens/rounds',async route=>{const response=await route.fetch();committed=await response.json();await route.abort('failed');markDropped();});
 await page.route('**/v1/staging/recover',route=>route.abort('failed'));
 await page.getByRole('button',{name:'SPIN PLAY',exact:true}).click();await dropped;await expect(page.getByRole('button',{name:'RECOVER ROUND',exact:true})).toHaveCount(0);await page.unroute('**/v1/staging/neon-sevens/rounds');
 await page.unroute('**/v1/staging/recover');const replay=page.waitForResponse('**/v1/staging/recover');await page.reload();expect((await (await replay).json()).result.id).toBe(committed!.id);
 await expect(page.locator('.round-sync-status')).toHaveCount(0);await page.getByRole('button',{name:'Explore Neon Sevens',exact:true}).click();await expect(page.getByLabel('Stake',{exact:true})).toBeEnabled();
 await expect(page.getByRole('button',{name:'RECOVER ROUND',exact:true})).toHaveCount(0);await expect(page.getByRole('button',{name:'Game information',exact:true})).toHaveCount(0);await expect(page.locator('.credit-meter strong')).toHaveText((Number(committed!.after.available)/100).toFixed(2));await evidence(page,`recovered-${info.project.name}`);
});
test('an unsent round clears automatically without charging when the connection returns',async({page,context})=>{
 await login(page);const balance=await page.locator('.credit-meter strong').innerText();await page.getByRole('button',{name:'Explore Neon Sevens',exact:true}).click();
 await page.route('**/v1/staging/neon-sevens/rounds',async route=>{await context.setOffline(true);await route.abort('failed');});
 await page.getByRole('button',{name:'SPIN PLAY',exact:true}).click();await expect(page.getByRole('button',{name:'RECOVER ROUND',exact:true})).toHaveCount(0);
 const recovered=page.waitForResponse('**/v1/staging/recover');await context.setOffline(false);expect((await (await recovered).json()).status).toBe('NOT_PLAYED');
 await expect(page.locator('.credit-meter strong')).toHaveText(balance);await expect(page.getByRole('button',{name:'SPIN PLAY',exact:true})).toBeEnabled();await expect(page.locator('.round-sync-status')).toHaveCount(0);
});
test('reef renders eight species and accepts a server-validated targeted shot',async({page},info)=>{
 await login(page);await page.getByRole('button',{name:'Explore Reef Party',exact:true}).click();await expect(page.getByRole('heading',{name:'Choose your table'})).toBeVisible();await evidence(page,`fishing-lobby-${info.project.name}`);const joining=page.waitForResponse('**/v1/practice/reef/join');await page.getByRole('button',{name:'OPEN TABLE',exact:true}).click();const room=await (await joining).json();
 await expect(page.locator('.fish-canvas canvas')).toBeVisible();await page.getByRole('button',{name:'SPECIES',exact:true}).click();await expect(page.locator('.reef-field-guide span')).toHaveCount(8);await page.getByRole('button',{name:'SPECIES',exact:true}).click();await expect(page.locator('.fish-canvas .error')).toHaveCount(0);
 const canvas=page.locator('.fish-canvas canvas');await canvas.scrollIntoViewIfNeeded();await evidence(page,`reef-${info.project.name}`);
 // Test cursor follows the public deterministic room world; outcome remains server-owned.
 let settled=false;
 for(let attempt=0;attempt<6&&!settled;attempt++){
  const bounds=(await canvas.boundingBox())!,now=Date.now(),target=Array.from({length:80},(_,i)=>reefTarget(i+1,(now-new Date(room.startedAt).getTime())/1000)).find(p=>p.x>200&&p.x<950&&p.y>180&&p.y<350)!;
  const response=page.waitForResponse(r=>r.url().endsWith('/staging/reef-party/rounds'),{timeout:3000}).catch(()=>null);
  await canvas.click({position:{x:target.x*bounds.width/1200,y:target.y*bounds.height/600}});const res=await response;settled=!!res&&res.status()===201;
 }
 expect(settled).toBe(true);await expect(page.locator('.stage-return')).toBeVisible();await evidence(page,`reef-shot-${info.project.name}`);
});

test('fish auto fire is serial and stops on stake changes, offline and leaving',async({page,context},info)=>{
 await login(page);await page.getByRole('button',{name:'Explore Reef Party',exact:true}).click();await page.getByRole('button',{name:'OPEN TABLE',exact:true}).click();await expect(page.locator('.reef-seat-plaque.yours')).toBeVisible({timeout:20000});
 let activeRequests=0,maxRequests=0,rounds=0;page.on('request',r=>{if(r.url().endsWith('/staging/reef-party/rounds')){activeRequests++;maxRequests=Math.max(maxRequests,activeRequests);}});page.on('requestfinished',r=>{if(r.url().endsWith('/staging/reef-party/rounds')){activeRequests--;rounds++;}});
 const auto=page.getByRole('button',{name:'Auto fire',exact:true}),lock=page.getByRole('button',{name:'Target lock',exact:true}),fast=page.getByRole('button',{name:'Fast fire cadence',exact:true});
 await lock.click();await fast.click();await expect(lock).toHaveAttribute('aria-pressed','true');await expect(fast).toHaveAttribute('aria-pressed','true');
 await auto.click();await expect.poll(()=>rounds,{timeout:15000}).toBeGreaterThanOrEqual(2);expect(maxRequests).toBe(1);await auto.click();await expect(page.locator('.cannon-ready')).toContainText('READY');
 await page.getByLabel('Stake',{exact:true}).selectOption('1975');await page.getByRole('button',{name:'Increase stake',exact:true}).click();await expect(page.getByLabel('Stake',{exact:true})).toHaveValue('2000');await expect(page.getByRole('button',{name:'Increase stake',exact:true})).toBeDisabled();await page.getByRole('button',{name:'Decrease stake',exact:true}).click();await expect(page.getByLabel('Stake',{exact:true})).toHaveValue('1975');
 await page.getByLabel('Stake',{exact:true}).selectOption('25');await auto.click();await page.getByLabel('Stake',{exact:true}).selectOption('50');await expect(auto).toHaveAttribute('aria-pressed','false');
 await auto.click();await context.setOffline(true);await expect(auto).toHaveAttribute('aria-pressed','false');await context.setOffline(false);await expect(auto).toHaveAttribute('aria-pressed','false');await evidence(page,`fish-controls-${info.project.name}`);
 await page.getByRole('button',{name:'Back to fishing lobby'}).click();await expect(page.getByRole('heading',{name:'Choose your table'})).toBeVisible();const after=rounds;await page.waitForTimeout(1500);expect(rounds).toBe(after);
});
