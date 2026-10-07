import {describe,it,expect} from 'vitest';
import {reefTarget,reefOutcome,reefTier,reefTierProfile,stagingMultiplier,reefFlight,fishGuide,type FishGame} from '@new-game/game-math';
describe('bounded richer reef migrations and tiered catches',()=>{
 it('never exceeds 31 targets or one boss and spaces arrivals 1.5 seconds apart',()=>{
  const species=new Set<number>();let smallest=100,largest=0;
  for(let t=0;t<960;t+=.5){const visible=Array.from({length:80},(_,i)=>reefTarget(i+1,t)).filter(p=>p.active);
   expect(visible.length).toBeLessThanOrEqual(31);expect(visible.filter(p=>p.tier==='boss').length).toBeLessThanOrEqual(1);
   for(const p of visible){species.add(p.species);smallest=Math.min(smallest,p.radius);largest=Math.max(largest,p.radius);expect(p.y).toBeGreaterThan(70);expect(p.y).toBeLessThan(510);}
  }
  for(let id=2;id<=80;id++)expect(reefTarget(id,0).spawnAt-reefTarget(id-1,0).spawnAt).toBe(1.5);
  expect(largest/smallest).toBeGreaterThanOrEqual(10);expect(species.size).toBe(fishGuide('reef-party').length);
 });
 it('cannot collide with a creature before its spawn window',()=>{
  expect(reefTarget(80,0).active).toBe(false);
  for(let a=-3;a<0;a+=.1)expect(reefFlight(1,a,0,[80]).targetId).toBeNull();
 });
 it('gives every world two original additions while bounding its population and boss count',()=>{
  for(const [world,first] of [['reef-party',40],['abyss-legends',42],['sunken-dynasty',44],['polar-odyssey',46]] as const){
   const seen=new Set<number>();let peak=0;
   for(let time=0;time<240;time+=1){const active=Array.from({length:80},(_,index)=>reefTarget(index+1,time,world as FishGame)).filter(p=>p.active);peak=Math.max(peak,active.length);expect(active.length).toBeLessThanOrEqual(31);expect(active.filter(p=>p.tier==='boss').length).toBeLessThanOrEqual(1);for(const fish of active)seen.add(fish.species);}
   expect(seen.has(first)).toBe(true);expect(seen.has(first+1)).toBe(true);expect(peak).toBeGreaterThanOrEqual(27);
  }
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
  expect(()=>reefOutcome('bad',81,()=>0)).toThrow();expect(()=>reefTier(65)).toThrow();
 });
});
