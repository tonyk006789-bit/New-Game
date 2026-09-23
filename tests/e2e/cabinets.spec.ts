import { test, expect, type Page } from '@playwright/test';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
import type { CabinetResult } from '@new-game/game-math';
test.use({video:'on'});
test.afterEach(async({page},info)=>{const video=page.video();await page.close();if(video){await mkdir('reports/recordings-v7',{recursive:true});await copyFile(await video.path(),`reports/recordings-v7/${info.title.split(',')[0].replaceAll(' ','-')}-${info.project.name}.webm`);}});
async function evidence(page:Page,name:string){
  await mkdir('reports/screenshots-v7',{recursive:true});
  await page.screenshot({path:`reports/screenshots-v7/${name}.png`,fullPage:true,animations:'disabled'});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  if(await page.locator('.slot-reel-surround').count()){
    const reels=await page.locator('.slot-reel-surround').boundingBox(), controls=await page.locator('.cabinet-controls').boundingBox();
    expect(reels!.y+reels!.height).toBeLessThanOrEqual(controls!.y+1);
    const symbols=await page.locator('.reel-window').first().locator('.symbol').all();
    const cell=await symbols[0].boundingBox();expect(cell!.height).toBeGreaterThan(35);
  }
}
async function login(page:Page){
  const data=JSON.parse(await readFile('.local/player-credentials.json','utf8'));
  const user=data.accounts.find((account:{username:string})=>account.username==='player.one');
  await page.goto('/');await page.getByLabel('PLAYER ID',{exact:true}).fill(user.username);await page.getByLabel('PASSWORD',{exact:true}).fill(user.password);await page.getByRole('button',{name:'SIGN IN',exact:true}).click();
  await expect(page.locator('.credit-meter strong')).toHaveText('0.00');
}
async function board(page:Page){return page.locator('.reel-window').evaluateAll(columns=>columns.map(col=>Array.from(col.querySelectorAll('.symbol')).map(cell=>cell.getAttribute('data-symbol'))));}
const games=[['Neon Sevens','neon-sevens',5],['Jade Fortune','jade-fortune',5],['Coin Carnival','coin-carnival',5]] as const;
test('eight arcade tiles, new cabinets animate and stop at their result',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');await page.getByRole('button',{name:'Explore arcade preview'}).click();
  await expect(page.locator('.game-card')).toHaveCount(8);await evidence(page,`lobby-${info.project.name}`);
  if(info.project.name==='landscape')expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
  for(const [name,,columns] of games){
    await page.getByRole('button',{name:`Explore ${name}`,exact:true}).click();
    await expect(page.locator('.reel-window')).toHaveCount(columns);
    await page.getByRole('button',{name:'SPIN FREE PRACTICE',exact:true}).click();
    await expect(page.locator('.kinetic-reels')).toHaveClass(/reels-rolling/);
    await expect.poll(()=>page.locator('.reel-strip').first().evaluate(node=>getComputedStyle(node).transform)).not.toBe('none');
    await page.getByRole('button',{name:'STOP SHOW RESULT',exact:true}).click();
    await expect(page.locator('.slot-cabinet')).toHaveAttribute('data-phase','complete');
    await expect(page.locator('.symbol')).toHaveCount(columns*3);
    await evidence(page,`${name.replaceAll(' ','-')}-${info.project.name}`);
    await page.getByRole('button',{name:'Back to arcade'}).click();
  }
  expect(errors).toEqual([]);
});
test('coin sequence holds reels and finishes all respins',async({page},info)=>{
  await page.goto('/');await page.getByRole('button',{name:'Explore arcade preview'}).click();await page.getByRole('button',{name:'Explore Coin Carnival',exact:true}).click();
  await page.getByRole('button',{name:'SPIN FREE PRACTICE',exact:true}).click();
  await expect(page.locator('.slot-cabinet')).toHaveAttribute('data-phase','complete',{timeout:15000});
  await expect(page.locator('.cabinet-notice')).toContainText('coin reels locked');
  const locked=await page.locator('.reel-window.reel-locked').count();await expect(page.locator('.cabinet-notice')).toContainText(`${locked} of 5`);
  await evidence(page,`coin-sequence-${info.project.name}`);
});
test('saved cabinet results survive reload with exact grids and unchanged credits',async({page},info)=>{
  test.setTimeout(60000);await login(page);
  for(const [name,id,columns] of games){
    await page.getByRole('button',{name:`Explore ${name}`,exact:true}).click();
    const response=page.waitForResponse(r=>r.url().endsWith(`/practice/${id}/rounds`)&&r.request().method()==='POST');
    await page.getByRole('button',{name:'SPIN FREE PRACTICE',exact:true}).click();
    const saved=await (await response).json() as CabinetResult;
    await page.getByRole('button',{name:'STOP SHOW RESULT',exact:true}).click();
    const expected=Array.from({length:columns},(_,col)=>saved.frames.at(-1)!.grid.map(row=>row[col]));
    expect(await board(page)).toEqual(expected);await evidence(page,`saved-${id}-${info.project.name}`);
    await page.reload();await page.getByRole('button',{name:`Explore ${name}`,exact:true}).click();await expect(page.locator('.cabinet-notice')).toContainText('Last saved round:');
    expect(await board(page)).toEqual(expected);await expect(page.locator('.credit-meter strong')).toHaveText('0.00');
    await page.getByRole('button',{name:'Back to arcade'}).click();
  }
});
test('lost response retries the accepted cabinet round without resampling',async({page})=>{
  await login(page);await page.getByRole('button',{name:'Explore Jade Fortune',exact:true}).click();
  let committed:CabinetResult|undefined,requestKey:string|undefined;
  const endpoint='**/practice/jade-fortune/rounds';
  await page.route(endpoint,async route=>{requestKey=route.request().postDataJSON().requestKey;const response=await route.fetch();expect(response.status()).toBe(201);committed=await response.json();await route.abort('connectionfailed');});
  await page.getByRole('button',{name:'SPIN FREE PRACTICE',exact:true}).click();await expect(page.locator('.slot-cabinet')).toHaveAttribute('data-phase','error');
  await page.unroute(endpoint);
  const response=page.waitForResponse(r=>r.url().endsWith('/practice/jade-fortune/rounds')&&r.request().method()==='POST');
  await page.getByRole('button',{name:'RETRY FREE PRACTICE',exact:true}).click();
  const retry=await response;expect(retry.request().postDataJSON().requestKey).toBe(requestKey);expect(await retry.json()).toEqual(committed);
  await page.getByRole('button',{name:'STOP SHOW RESULT',exact:true}).click();await expect(page.locator('.credit-meter strong')).toHaveText('0.00');
});
test('offline and reduced motion finish the committed presentation and prevent extra actions',async({page,context})=>{
  await page.goto('/');await page.getByRole('button',{name:'Explore arcade preview'}).click();await page.getByRole('button',{name:'Explore Coin Carnival',exact:true}).click();
  await page.getByRole('button',{name:'SPIN FREE PRACTICE',exact:true}).click();await context.setOffline(true);
  await expect(page.locator('.slot-cabinet')).toHaveAttribute('data-phase','complete');await expect(page.getByRole('button',{name:'SPIN FREE PRACTICE',exact:true})).toBeDisabled();
  await context.setOffline(false);await page.getByRole('button',{name:'Back to arcade'}).click();await page.getByRole('button',{name:'Settings',exact:true}).click();await page.getByRole('switch',{name:'Reduced motion'}).click();await page.getByRole('button',{name:'BACK TO ARCADE',exact:true}).click();
  await page.getByRole('button',{name:'Explore Neon Sevens',exact:true}).click();await page.getByRole('button',{name:'SPIN FREE PRACTICE',exact:true}).click();
  await expect(page.locator('.slot-cabinet')).toHaveAttribute('data-phase','complete');await expect(page.locator('.kinetic-reels')).not.toHaveClass(/reels-rolling/);
});
