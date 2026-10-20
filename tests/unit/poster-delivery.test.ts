import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {catalog} from '@new-game/contracts';
import posters from '../../apps/player/src/poster-assets.json';
import avatar from '../../apps/player/src/floor-avatar.json';
import {posterSource} from '../../apps/player/src/poster-source';
describe('full-cover thumbnail delivery',()=>{
 it('keeps the walking-floor sprite below a quarter of its original transfer size',()=>{
  const buffer=readFileSync(`apps/player/public${avatar.url}`);
  expect(buffer.length).toBe(avatar.bytes);
  expect(createHash('sha256').update(buffer).digest('hex')).toBe(avatar.sha256);
  expect(buffer.length).toBeLessThan(avatar.sourceBytes/4);
 });
 it('covers the whole catalog with valid, bounded responsive image variants',()=>{
  expect(Object.keys(posters).sort()).toEqual(catalog.map(g=>g.id).sort());
  for(const game of catalog){
   const poster=posters[game.id];
   expect(poster.variants[0].width).toBe(240);
   expect(poster.variants[1].width).toBeGreaterThanOrEqual(400);
   expect(poster.variants[1].width).toBeLessThanOrEqual(480);
   for(const variant of poster.variants){
    const buffer=readFileSync(`apps/player/public${variant.url}`);
    expect(buffer.byteLength).toBe(variant.bytes);
    expect(createHash('sha256').update(buffer).digest('hex')).toBe(variant.sha256);
    expect(variant.bytes).toBeLessThan(variant.width===240?30000:85000);
   }
   expect(poster.variants[0].bytes).toBeLessThan(poster.originalBytes*.5);
   expect(posterSource(game.id).srcset).toContain('240w');
   expect(posterSource(game.id).srcset).toContain(`${poster.variants[1].width}w`);
  }
 });
});
