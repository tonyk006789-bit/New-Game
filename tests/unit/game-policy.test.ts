import {describe,it,expect} from 'vitest';
import {stagingRules,isFishGame,isKenoGame,stagingOutcome,stagingMultiplier,configuredGameProfileId,reefChallengeProfile,reefChallengeOutcome,reefTarget,reefTier,fishGames,storyboardRandom,type StagingGame} from '@new-game/game-math';
describe('approved configurable global test distribution',()=>{
 it('conditions every slot/keno result at both endpoints and the 20% initial setting without changing evaluation',()=>{
  for(const game of Object.keys(stagingRules).filter(g=>!isFishGame(g)) as StagingGame[])for(const rate of [5,20,50])for(const ticket of [0,rate*100-1,rate*100,9999]){
   let first=true;const random=storyboardRandom(913+ticket),result=stagingOutcome(game,'test',max=>{if(first){first=false;expect(max).toBe(10000);return ticket;}return random(max);},isKenoGame(game)?[1,2,3,4,5,6]:undefined,rate);
   expect(stagingMultiplier(result)>0,`${game} ${rate}% ticket ${ticket}`).toBe(ticket<rate*100);
  }
 });
 it('versions changes, isolates fish, and rejects rates outside the approved range',()=>{
  const a={revision:'1',payingPercent:20},b={revision:'2',payingPercent:20};
  expect(configuredGameProfileId('neon-sevens',a)).not.toBe(configuredGameProfileId('neon-sevens',b));
  expect(configuredGameProfileId('reef-party',a)).toBe(reefChallengeProfile.id);
  for(const value of [0,4,51,100,20.5,NaN])expect(()=>stagingOutcome('neon-sevens','test',storyboardRandom(1),undefined,value)).toThrow();
 });
});
describe('one harder capture attempt per paid hit',()=>{
 it.each(fishGames)('%s exhausts all tier tickets with unchanged award amounts and no free assists',game=>{
  const ids=new Map<string,number>();for(let id=1;id<=80;id++)ids.set(reefTier(reefTarget(id,0,game).species),id);
  for(const [tier,id] of ids){let captures=0;const rule=reefChallengeProfile.tiers[tier as keyof typeof reefChallengeProfile.tiers];
   for(let ticket=0;ticket<10000;ticket++){let calls=0;const result=reefChallengeOutcome('test',id,()=>{calls++;return ticket;},game);expect(calls).toBe(1);captures+=Number(result.captured);expect(stagingMultiplier(result)).toBe(result.captured?rule.multiplier:0);expect(result).not.toHaveProperty('assistance');}
   expect(captures).toBe(rule.captureTickets);
  }expect(ids.size).toBe(4);
 });
});
