import {test,expect} from '@playwright/test';
import {mkdir,readFile} from 'node:fs/promises';
test('sample login is visible, fills the form, and signs into the real test player',async({page},info)=>{
 const credentials=JSON.parse(await readFile('.local/staging/player-credentials.json','utf8')).accounts.find((account:{username:string})=>account.username==='stage.player');
 if(!credentials?.password)throw new Error('Configure the local sample player before running staging acceptance.');
 await page.goto('/');await expect(page.locator('.sample-login')).toBeVisible();await expect(page.locator('.sample-login')).toContainText('stage.player');
 await mkdir('reports/screenshots-v6',{recursive:true});await page.screenshot({path:`reports/screenshots-v6/login-${info.project.name}.png`,fullPage:true});
 await page.getByRole('button',{name:'USE LOGIN',exact:true}).click();await expect(page.getByLabel('PLAYER ID',{exact:true})).toHaveValue('stage.player');await expect(page.getByLabel('PASSWORD',{exact:true})).toHaveValue(credentials.password);
 await page.getByRole('button',{name:'SIGN IN',exact:true}).click();await expect(page.getByRole('button',{name:'Explore Reef Party',exact:true})).toBeVisible();await expect(page.locator('.stage-badge')).toHaveCount(0);
 await page.getByRole('button',{name:'Settings',exact:true}).click();await expect(page.getByText('Signed in as stage.player.',{exact:true})).toBeVisible();await page.getByRole('button',{name:'SIGN OUT',exact:true}).click();await expect(page.getByRole('button',{name:'USE LOGIN',exact:true})).toBeVisible();
});
