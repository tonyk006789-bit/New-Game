import {describe,it,expect} from 'vitest';
import {reefTarget,reefSpecies,reefOutcome,reefTier,reefTierProfile,stagingMultiplier,reefFlight} from '@new-game/game-math';
describe('sparse reef migrations and tiered catches',()=>{
 it('never exceeds nine targets or one boss and spaces arrivals six seconds apart',()=>{
  const species=new Set<number>();let smallest=100,largest=0;
  for(let t=0;t<960;t+=.5){const visible=Array.from({length:80},(_,i)=>reefTarget(i+1,t)).filter(p=>p.active);
   expect(visible.length).toBeLessThanOrEqual(9);expect(visible.filter(p=>p.tier==='boss').length).toBeLessThanOrEqual(1);
   for(const p of visible){species.add(p.species);smallest=Math.min(smallest,p.radius);largest=Math.max(largest,p.radius);expect(p.y).toBeGreaterThan(70);expect(p.y).toBeLessThan(510);}
  }
  for(let id=2;id<=80;id++)expect(reefTarget(id,0).spawnAt-reefTarget(id-1,0).spawnAt).toBe(6);
  expect(largest/smallest).toBeGreaterThanOrEqual(10);expect(species.size).toBe(reefSpecies.length);
 });
 it('cannot collide with a creature before its spawn window',()=>{
  expect(reefTarget(80,0).active).toBe(false);
  for(let a=-3;a<0;a+=.1)expect(reefFlight(1,a,0,[80]).targetId).toBeNull();
 });
 it('exhausts every tier ticket and evaluates awards using the target species',()=>{
  const ids=new Map<string,number>();for(let id=1;id<=80;id++)ids.set(reefTier(reefTarget(id,0).species),id);
  for(const [tier,id]of ids){let captures=0,total=0;const rule=reefTierProfile.tiers[tier as keyof typeof reefTierProfile.tiers];
   for(let ticket=0;ticket<10000;ticket++){const result=reefOutcome('test',id,()=>ticket);captures+=Number(result.captured);total+=stagingMultiplier(result);}
   expect(captures).toBe(rule.captureTickets);expect(total).toBe(rule.captureTickets*rule.multiplier);
  }expect(ids.size).toBe(4);
 });
 it('keeps legacy 3x receipts evaluable and rejects invented species',()=>{
  expect(stagingMultiplier({id:'old',game:'reef-party',description:'',captured:true})).toBe(3);
  expect(()=>reefOutcome('bad',81,()=>0)).toThrow();expect(()=>reefTier(16)).toThrow();
 });
});
