import {describe,it,expect} from 'vitest';
import {cardPips,cardRank} from '../../apps/player/src/blackjack-cards';
describe('shared blackjack card artwork',()=>{
 it('shows the actual rank count without duplicate pips, inside the printable area',()=>{
  for(let rank=1;rank<=10;rank++){
   const pips=cardPips(rank);expect(pips).toHaveLength(rank);expect(new Set(pips.map(p=>`${p.x}:${p.y}`)).size).toBe(rank);
   for(const pip of pips){expect(pip.x).toBeGreaterThan(20);expect(pip.x).toBeLessThan(80);expect(pip.y).toBeGreaterThan(15);expect(pip.y).toBeLessThan(85);expect(pip.flipped).toBe(pip.y>50);}
  }
 });
 it('uses court indices instead of numbered pips for face cards',()=>{
  expect([1,10,11,12,13].map(cardRank)).toEqual(['A','10','J','Q','K']);
  for(const rank of [11,12,13])expect(cardPips(rank)).toEqual([]);
 });
});
