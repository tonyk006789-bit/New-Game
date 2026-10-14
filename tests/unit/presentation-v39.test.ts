import {describe,it,expect} from 'vitest';
import {readFileSync,statSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {catalog} from '@new-game/contracts';
import assets from '../../apps/player/src/presentation-assets.json';
import {dealerReach,dealerVertex} from '../../apps/player/src/dealer-motion';
import {CARD_RELEASE,DEAL_STEP} from '../../apps/player/src/blackjack-dealing';
describe('continuous dealer mesh',()=>{
 it('returns continuously to rest, with a smooth release and no face deformation',()=>{
  expect(dealerReach(0)).toBe(0);expect(dealerReach(CARD_RELEASE)).toBe(1);expect(dealerReach(DEAL_STEP)).toBe(0);
  for(let t=0;t<=DEAL_STEP;t++){
   const r=dealerReach(t);expect(r).toBeGreaterThanOrEqual(0);expect(r).toBeLessThanOrEqual(1);
   if(t)expect(Math.abs(r-dealerReach(t-1))).toBeLessThan(.007);
   for(const p of [[.5,.15],[.5,.3],[.7,.8]] as const)expect(dealerVertex(p[0],p[1],r)).toEqual(p);
  }
 });
 it('does not fold or invert the textured mesh throughout a deal',()=>{
  for(let t=0;t<=DEAL_STEP;t+=17)for(let y=0;y<24;y++)for(let x=0;x<24;x++){
   const r=dealerReach(t),a=dealerVertex(x/24,y/24,r),b=dealerVertex((x+1)/24,y/24,r),c=dealerVertex(x/24,(y+1)/24,r);
   expect((b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0])).toBeGreaterThan(0);
  }
 });
});
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
