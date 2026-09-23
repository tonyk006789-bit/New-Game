import {describe,it,expect} from 'vitest';
import {stagingOutcome,stagingMultiplier,stagingProfile,storyboardRandom,reefTarget,reefSpecies,type StagingGame} from '@new-game/game-math';
describe('explicit experimental staging math',()=>{
 for(const game of Object.keys(stagingProfile.rules) as StagingGame[])it(`${game}: independent paying target and visible outcomes agree`,()=>{
  const rng=storyboardRandom(923455),count=4000;let paying=0;
  for(let i=0;i<count;i++){
   const result=stagingOutcome(game,String(i),rng,[1,2,3,4,5,6]);const multiplier=stagingMultiplier(result);
   expect(Number.isInteger(multiplier)&&multiplier>=0).toBe(true);if(multiplier>0)paying++;
   if(result.drawn)expect(new Set(result.drawn).size).toBe(20);
   if(result.frames&&game==='coin-carnival')for(let f=1;f<result.frames.length;f++)for(const col of result.frames[f-1].locked)expect(result.frames[f].grid.map(r=>r[col])).toEqual(result.frames[f-1].grid.map(r=>r[col]));
  }
  expect(paying/count).toBeGreaterThan(.27);expect(paying/count).toBeLessThan(.33);
 });
 it('every allowed keno pick count has a valid paying and nonpaying distribution',()=>{for(let n=4;n<=10;n++){let pay=0;const rng=storyboardRandom(n);for(let i=0;i<300;i++)pay+=Number(stagingMultiplier(stagingOutcome('orchard-numbers','keno',rng,Array.from({length:n},(_,k)=>k+1)))>0);expect(pay).toBeGreaterThan(50);expect(pay).toBeLessThan(130);}});
 it('reef world positions are deterministic and contain eight species',()=>{const species=new Set();for(let id=1;id<=80;id++){const p=reefTarget(id,100);species.add(p.species);expect(p).toEqual(reefTarget(id,100));expect(p.y).toBeGreaterThan(0);expect(p.y).toBeLessThan(600);}expect(species.size).toBe(reefSpecies.length);});
});
