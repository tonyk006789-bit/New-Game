import {describe,it,expect} from 'vitest';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {catalog} from '@new-game/contracts';
import assets from '../../apps/player/src/presentation-assets.json';
describe('catalog delivery budget',()=>{
 it('ships a verified compact thumbnail for all 30 games',()=>{
  let total=0;expect(catalog).toHaveLength(30);
  for(const game of catalog){const asset=assets[game.id],path=`apps/player/public${asset.url}`;const file=readFileSync(path);
   expect(file.subarray(8,12).toString()).toBe('WEBP');expect(statSync(path).size).toBe(asset.bytes);
   expect(createHash('sha256').update(file).digest('hex')).toBe(asset.sha256);
   expect(asset.bytes).toBeLessThan(100_000);total+=asset.bytes;
  }
  expect(total).toBeLessThan(1_600_000);
 });
 it('keeps three distinct, compact dealer assets',()=>{
  const dealers=[assets['dealer-royal'],assets['dealer-double'],assets['dealer-european']];
  expect(new Set(dealers.map(d=>d.sha256)).size).toBe(3);
  for(const dealer of dealers)expect(dealer.bytes).toBeLessThan(100_000);
 });
});
