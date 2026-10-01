import {describe,it,expect} from 'vitest';
import {bossReveal} from '../../apps/player/src/boss-reveal';
describe('Abyss wheel consumes paid boss receipts',()=>{
 it('preserves an exact committed award for each real cannon',()=>{
  for(let seat=1;seat<=4;seat++)expect(bossReveal('receipt',seat,23,true,'40000')).toEqual({id:'receipt',seat,award:'40000'});
 });
 it('cannot turn a miss, unpaid hit, treasure or smaller catch into a jackpot',()=>{
  expect(bossReveal('miss',1,23,false,'40000')).toBeNull();
  expect(bossReveal('unpaid',1,23,true,'0')).toBeNull();
  for(const species of [0,1,16,18,20,21,22])expect(bossReveal('small',1,species,true,'100')).toBeNull();
  for(const award of ['-1','1.2','NaN',''])expect(bossReveal('bad',1,23,true,award)).toBeNull();
  expect(bossReveal('seat',5,23,true,'40000')).toBeNull();
 });
});
