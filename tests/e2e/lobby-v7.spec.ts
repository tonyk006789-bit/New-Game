import {test,expect} from '@playwright/test';
test('walking character responds to floor keys and opens a chosen cabinet',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:'Explore arcade preview'}).click();
 const floor=page.getByLabel('Walk around the arcade with arrow keys or WASD. Enter plays the nearest cabinet.'),avatar=page.locator('.hall-avatar');
 await floor.focus();await floor.press('ArrowLeft');await expect(avatar).toHaveAttribute('data-x','41.0');await expect(avatar).not.toHaveClass(/walking/);
 await floor.press('ArrowUp');await expect(avatar).toHaveAttribute('data-y','85.0');
 await page.getByRole('button',{name:'Explore Neon Sevens',exact:true}).click();await expect(page.locator('.reel-window')).toHaveCount(5);
 await page.getByRole('button',{name:'Back to arcade'}).click();await page.getByLabel('Search games').fill('reef');await expect(page.locator('.hall-machine')).toHaveCount(1);
});
