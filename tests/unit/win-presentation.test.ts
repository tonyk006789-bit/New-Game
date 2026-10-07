import {describe,it,expect} from 'vitest';
import {winTier} from '../../apps/player/src/win-presentation';
import {bossReveal} from '../../apps/player/src/boss-reveal';
import {fishBosses} from '@new-game/game-math';
describe('win presentations never generate an award',()=>{
 it('classifies exact existing return boundaries without floating-point rounding',()=>{
  expect(winTier('1','25')).toBe('minor');expect(winTier('124','25')).toBe('minor');
  expect(winTier('125','25')).toBe('major');expect(winTier('499','25')).toBe('major');expect(winTier('500','25')).toBe('jackpot');
  expect(winTier('200000000000000000000','10000000000000000000')).toBe('jackpot');
  for(const [award,stake] of [['0','25'],['-1','25'],['0.5','25'],['500','0'],['NaN','25']])expect(winTier(award,stake)).toBeNull();
 });
 it('validates exact paid boss receipts across all four worlds',()=>{
  for(const species of new Set(Object.values(fishBosses).flat())){
   expect(bossReveal('committed-id',2,species,true,'500')).toEqual({id:'committed-id',seat:2,award:'500'});
   expect(bossReveal('miss',2,species,false,'500')).toBeNull();
  }
  expect(bossReveal('invalid',1,48,true,'500')).toBeNull();
 });
});
