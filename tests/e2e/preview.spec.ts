import { test, expect } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
async function evidence(page: import('@playwright/test').Page, name: string) {
  await mkdir('reports/screenshots-v2', {recursive:true});
  await page.screenshot({path:`reports/screenshots-v2/${name}.png`,fullPage:!name.endsWith('phone'),animations:'disabled'});
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}
test('lobby, filters, favorites and persistent presentation preferences', async ({page}, info) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await page.goto('/'); await page.getByRole('button',{name:'Explore arcade preview'}).click();
  await expect(page.getByRole('heading',{name:'CHOOSE YOUR GAME'})).toBeVisible();
  await expect(page.getByText('No credits available. Contact your administrator.')).toBeVisible();
  await expect(page.locator('.game-card')).toHaveCount(8);
  await evidence(page, `player-lobby-${info.project.name}`);
  if(info.project.name==='landscape')expect(await page.evaluate(()=>document.documentElement.scrollHeight<=innerHeight)).toBe(true);
  await page.getByRole('button',{name:'Slots',exact:true}).click();
  await expect(page.locator('.game-card')).toHaveCount(6);
  await page.getByRole('button',{name:'Add Temple Lights to favorites'}).click();
  await page.getByRole('button',{name:/Favorites/}).filter({visible:true}).click();
  await expect(page.getByRole('heading',{name:'YOUR FAVORITES'})).toBeVisible();
  await expect(page.locator('.game-card')).toHaveCount(1);
  await page.reload(); await page.getByRole('button',{name:'Explore arcade preview'}).click();
  await page.getByRole('button',{name:/Favorites/}).filter({visible:true}).click();
  await expect(page.locator('.game-card')).toHaveCount(1);
  expect(errors).toEqual([]);
});
test('slot storyboard, zero credit balance and offline interruption', async ({page,context}, info) => {
  await page.goto('/'); await page.getByRole('button',{name:'Explore arcade preview'}).click(); await page.getByRole('button',{name:'Explore Temple Lights',exact:true}).click();
  await expect(page.locator('.symbol')).toHaveCount(15);
  await page.getByRole('button',{name:'Preview reels'}).click();
  await expect(page.getByText('Preview complete. No stake or payout.')).toBeVisible();
  await evidence(page,`slot-${info.project.name}`);
  await context.setOffline(true);
  await expect(page.getByRole('button',{name:'Preview reels'})).toBeDisabled();
  await expect(page.getByRole('status')).toContainText('offline');
  await context.setOffline(false);
  await expect(page.getByRole('button',{name:'Preview reels'})).toBeEnabled();
  await expect(page.getByRole('button',{name:'Game information'})).toHaveCount(0);
});
test('keno pick limits, reveal, reset and responsive controls', async ({page},info) => {
  await page.goto('/'); await page.getByRole('button',{name:'Explore arcade preview'}).click(); await page.getByRole('button',{name:'Explore Orchard Numbers',exact:true}).click();
  await expect(page.getByRole('button',{name:'Preview reveal'})).toBeDisabled();
  for (let number=1;number<=11;number++) await page.getByRole('button',{name:`Number ${number}`,exact:true}).click();
  await expect(page.locator('.keno-board .chosen')).toHaveCount(10);
  await page.getByRole('button',{name:'Quick pick'}).click();
  await expect(page.locator('.keno-board .chosen')).toHaveCount(6);
  await page.getByRole('button',{name:'Preview reveal'}).click();
  await expect(page.locator('.keno-board .drawn')).toHaveCount(20);
  await evidence(page,`keno-${info.project.name}`);
  await page.getByRole('button',{name:'Clear',exact:true}).click();
  await expect(page.locator('.keno-board .chosen')).toHaveCount(0);
});
test('painted fish renderer exposes species and is disposed on leaving', async ({page},info) => {
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/'); await page.getByRole('button',{name:'Explore arcade preview'}).click();await page.getByRole('button',{name:'Explore Reef Party',exact:true}).click();
  await page.getByRole('button',{name:'EXPLORE TABLE',exact:true}).click();
  await expect(page.getByRole('img',{name:'Illustrated reef with eight aquatic species'})).toBeVisible();
  await page.getByRole('button',{name:'SPECIES',exact:true}).click();await expect(page.locator('.reef-field-guide span')).toHaveCount(8);
  await page.locator('canvas').click({position:{x:150,y:180}});
  await evidence(page,`fish-${info.project.name}`);
  await page.getByRole('button',{name:'Back to fishing lobby'}).click();
  await expect(page.locator('canvas')).toHaveCount(0);
  expect(errors).toEqual([]);
});
