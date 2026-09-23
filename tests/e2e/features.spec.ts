import { test, expect } from '@playwright/test';
import { copyFile, mkdir, readFile } from 'node:fs/promises';
test.use({ video: 'on' });
test.afterEach(async ({page}, info) => {
  const video = page.video(); await page.close();
  if (video) { await mkdir('reports/recordings-v3',{recursive:true}); await copyFile(await video.path(),`reports/recordings-v3/${info.title.split(',')[0].replaceAll(' ','-')}-${info.project.name}.webm`); }
});
async function evidence(page: import('@playwright/test').Page, name: string) {
  await mkdir('reports/screenshots-v3', { recursive: true });
  await page.screenshot({ path: `reports/screenshots-v3/${name}.png`, fullPage: true, animations: 'disabled' });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  const machine=page.locator('.vault-machine,.cascade-machine');
  if(await machine.count()){
    const board=await machine.boundingBox(),controls=await page.locator('.feature-console').boundingBox();
    expect(board!.y+board!.height).toBeLessThanOrEqual(controls!.y+1);
  }
}
test('new catalog, vault progression and offline interruption', async ({ page, context }, info) => {
  const errors: string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');await page.getByRole('button',{name:'Explore arcade preview'}).click();
  await expect(page.locator('.game-card')).toHaveCount(8);await evidence(page,`catalog-${info.project.name}`);
  await page.getByRole('button',{name:'Explore Aurora Vault',exact:true}).click();
  await expect(page.locator('.vault-cell')).toHaveCount(15);await expect(page.locator('.vault-cell.locked')).toHaveCount(3);
  await page.getByRole('button',{name:'OPEN VAULT',exact:true}).click();
  await expect(page.getByRole('button',{name:'SHOW RESULT'})).toBeVisible();
  await expect.poll(()=>page.locator('.vault-cell.locked').count()).toBeGreaterThan(3);
  await evidence(page,`aurora-motion-${info.project.name}`);
  await context.setOffline(true);await expect(page.locator('.feature-stage')).toHaveAttribute('data-phase','complete');
  const count=await page.locator('.vault-cell.locked').count();await expect(page.locator('.feature-notice')).toContainText(`${count} of 15`);
  await expect(page.getByRole('button',{name:'OPEN VAULT',exact:true})).toBeDisabled();
  await context.setOffline(false);await expect(page.getByRole('button',{name:'OPEN VAULT',exact:true})).toBeEnabled();
  await evidence(page,`aurora-complete-${info.project.name}`);expect(errors).toEqual([]);
});
test('cascades remove clusters, finish and respect reduced motion', async ({ page }, info) => {
  await page.goto('/');await page.getByRole('button',{name:'Explore arcade preview'}).click();
  await page.getByRole('button',{name:'Explore Ember Relics'}).click();await expect(page.locator('.relic-cell')).toHaveCount(30);
  await page.getByRole('button',{name:'START CASCADE',exact:true}).click();
  await expect(page.locator('.feature-stage')).toHaveAttribute('data-phase',/fall|highlight|clear/);
  await expect(page.locator('.feature-stage')).toHaveAttribute('data-phase','complete',{timeout:12000});
  await expect(page.locator('.feature-notice')).toContainText('relics cleared');await evidence(page,`ember-${info.project.name}`);
  await page.getByRole('button',{name:'Back to arcade'}).click();await page.getByRole('button',{name:'Settings',exact:true}).click();
  await page.getByRole('switch',{name:'Reduced motion'}).click();await page.getByRole('button',{name:'BACK TO ARCADE',exact:true}).click();
  await page.getByRole('button',{name:'Explore Ember Relics'}).click();await page.getByRole('button',{name:'START CASCADE',exact:true}).click();
  await expect(page.locator('.feature-stage')).toHaveAttribute('data-phase','complete');
  await expect(page.getByRole('button',{name:'SHOW RESULT'})).toHaveCount(0);
});
test('signed-in feature sequence restores its exact final board without changing credits', async ({ page },info) => {
  test.setTimeout(60000);
  const accounts=JSON.parse(await readFile('.local/player-credentials.json','utf8')).accounts;
  const user=accounts.find((item:{username:string})=>item.username==='player.one');
  await page.goto('/');await page.getByLabel('PLAYER ID',{exact:true}).fill(user.username);await page.getByLabel('PASSWORD',{exact:true}).fill(user.password);await page.getByRole('button',{name:'SIGN IN',exact:true}).click();
  await expect(page.locator('.credit-meter strong')).toHaveText('0.00');
  for(const name of ['Aurora Vault','Ember Relics']){
    await page.getByRole('button',{name:`Explore ${name}`,exact:true}).click();
    const launch=page.getByRole('button',{name:name==='Aurora Vault'?'OPEN VAULT':'START CASCADE',exact:true});
    await expect(launch).toBeEnabled();await page.getByRole('button',{name:'Fast animations'}).click();await launch.click();
    // A random cascade can finish without a match. Wait for its result instead of racing an ephemeral skip button.
    await expect(page.locator('.feature-stage')).toHaveAttribute('data-phase','complete',{timeout:25000});
    const board=name==='Aurora Vault'?'.vault-cell':'.relic-cell';
    const snapshot=await page.locator(board).evaluateAll(nodes=>nodes.map(node=>[node.getAttribute('aria-label'),node.getAttribute('data-symbol')]));
    await evidence(page,`saved-${name.split(' ')[0].toLowerCase()}-${info.project.name}`);
    await page.reload();await page.getByRole('button',{name:`Explore ${name}`,exact:true}).click();await expect(page.locator('.feature-notice')).toContainText('Last saved round:');
    expect(await page.locator(board).evaluateAll(nodes=>nodes.map(node=>[node.getAttribute('aria-label'),node.getAttribute('data-symbol')]))).toEqual(snapshot);
    await page.getByRole('button',{name:'Back to arcade'}).click();await expect(page.locator('.credit-meter strong')).toHaveText('0.00');
  }
});
test('reels physically translate and settle after skip, then fishing disposes its effects',async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');await page.getByRole('button',{name:'Explore arcade preview'}).click();await page.getByRole('button',{name:'Explore Temple Lights'}).click();
  await page.getByRole('button',{name:'Preview reels'}).click();
  await expect(page.locator('.kinetic-reels')).toHaveClass(/reels-rolling/);
  await expect.poll(()=>page.locator('.reel-strip').first().evaluate(node=>getComputedStyle(node).transform)).not.toBe('none');
  await page.getByRole('button',{name:'Show result',exact:true}).click();await expect(page.locator('.symbol')).toHaveCount(15);
  await evidence(page,`temple-${info.project.name}`);
  await page.getByRole('button',{name:'Back to arcade'}).click();await page.getByRole('button',{name:'Explore Reef Party'}).click();
  await expect(page.locator('canvas')).toBeVisible();await page.locator('canvas').click({position:{x:150,y:180}});
  await evidence(page,`reef-${info.project.name}`);await page.getByRole('button',{name:'Back to arcade'}).click();await expect(page.locator('canvas')).toHaveCount(0);expect(errors).toEqual([]);
});
