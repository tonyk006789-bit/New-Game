import {describe,it,expect} from 'vitest';
import {catalog,GameId,expansionIds} from '@new-game/contracts';
import {fishGuide,reefTarget,reefTier,reefChallengeOutcome,reefChallengeProfile,stagingMultiplier,reefFlight,reefLeadAngle,configuredGameProfileId} from '@new-game/game-math';
import {fishWorlds} from '../../apps/player/src/fish-worlds';
import {chooseBotFlight} from '../../apps/player/src/bot-targeting';
const game='coral-rush' as const;
describe('Coral Rush original seventh fish world',()=>{
 it('is selectable in the shared catalog, arrivals and world atlas',()=>{
  expect(GameId.parse(game)).toBe(game);expect(expansionIds).toContain(game);
  expect(catalog.find(g=>g.id===game)?.category).toBe('Fish');
  const world=fishWorlds[game]!;expect(world.regions).toHaveLength(12);
  for(const [x,y,w,h] of world.regions){expect(x).toBeGreaterThanOrEqual(0);expect(y).toBeGreaterThanOrEqual(0);expect(x+w).toBeLessThanOrEqual(world.width);expect(y+h).toBeLessThanOrEqual(world.height);}
  expect(fishGuide(game).sort((a,b)=>a-b)).toEqual([48,65,66,67,68,69,70,71,72]);
 });
 it('uses exactly the approved ticket counts and never grants solo assists',()=>{
  const ids=new Map<string,number>();for(let id=1;id<=80;id++)ids.set(reefTier(reefTarget(id,0,game).species),id);
  expect(ids.size).toBe(4);
  for(const [tier,id] of ids){const rule=reefChallengeProfile.tiers[tier as keyof typeof reefChallengeProfile.tiers];let captures=0,total=0;
   for(let ticket=0;ticket<10000;ticket++){const result=reefChallengeOutcome('ticket',id,()=>ticket,game);captures+=Number(result.captured);total+=stagingMultiplier(result);expect(result).not.toHaveProperty('assistance');}
   expect(captures).toBe(rule.captureTickets);expect(total).toBe(rule.captureTickets*rule.multiplier);
  }
  expect(configuredGameProfileId(game,{revision:'1',payingPercent:5})).toBe(configuredGameProfileId(game,{revision:'2',payingPercent:50}));
 });
 it('keeps schooling paths bounded, hittable and separate from AI targets',()=>{
  let shots=0;
  for(let time=0;time<240;time+=2){const active=Array.from({length:80},(_,i)=>({id:i+1,...reefTarget(i+1,time,game)})).filter(p=>p.active);
   expect(active.length).toBeLessThanOrEqual(31);expect(active.filter(p=>p.tier==='boss').length).toBeLessThanOrEqual(1);
   for(const p of active){expect(p.y).toBeGreaterThan(90);expect(p.y).toBeLessThan(500);expect(p.radius).toBeGreaterThan(0);}
   const human=new Set(active.slice(0,2).map(p=>p.id)),flight=chooseBotFlight(game,2,time,active.map(p=>p.id),human,time);
   if(flight){expect(human.has(flight.targetId!)).toBe(false);shots++;}
  }
  expect(shots).toBeGreaterThan(20);
  for(const species of fishGuide(game)){const id=Array.from({length:80},(_,i)=>i+1).find(id=>reefTarget(id,0,game).species===species)!;
   const time=reefTarget(id,0,game).spawnAt+15;expect(reefFlight(1,reefLeadAngle(1,id,time,game),time,[id],game).targetId).toBe(id);
  }
 });
});
