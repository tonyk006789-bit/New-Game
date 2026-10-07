import {describe,expect,it} from 'vitest';
import {catalog,premiumGames} from '@new-game/contracts';
import {stagingOutcome,stagingMultiplier,stagingGameProfileId,storyboardRandom,type StagingGame,reefTarget} from '@new-game/game-math';
import {chooseBotFlight} from '../../apps/player/src/bot-targeting';

describe('thirty-game collection and independent visual bots',()=>{
 it('contains thirty unique games and reserves Premium for Blackjack',()=>{
  expect(catalog).toHaveLength(30);expect(new Set(catalog.map(g=>g.id)).size).toBe(30);
  expect(premiumGames).toEqual(['royal-blackjack','double-deck-blackjack','european-blackjack']);
 });
 it.each([['disco-diamonds','neon-sevens'],['midnight-express','jade-fortune'],['pirate-gold','coin-carnival']] as const)('%s preserves %s approved outcome math', (game,base)=>{
  expect(stagingGameProfileId(game)).toBe('stage-cabinets-v23');
  for(let seed=1;seed<=160;seed++){
   const a=stagingOutcome(game,'same',storyboardRandom(seed)),b=stagingOutcome(base as StagingGame,'same',storyboardRandom(seed));
   expect('frames' in a&&a.frames).toEqual('frames' in b&&b.frames);
   expect(stagingMultiplier(a)).toBe(stagingMultiplier(b));
  }
 });
 it.each(['reef-party','abyss-legends','sunken-dynasty','polar-odyssey'] as const)('%s bot flights avoid the human and other bots at actual collision',game=>{
  let flights=0;
  for(let time=10;time<90;time+=2){
   const available=Array.from({length:80},(_,i)=>i+1).filter(id=>reefTarget(id,time,game).active);
   const excluded=new Set(available.slice(0,2));
   for(const seat of [2,3,4]){
    const flight=chooseBotFlight(game,seat,time,available,excluded,seat+time);
    if(flight){expect(flight.targetId).not.toBeNull();expect(excluded.has(flight.targetId!)).toBe(false);expect(flight.time).toBeGreaterThan(0);excluded.add(flight.targetId!);flights++;}
   }
   expect(chooseBotFlight(game,2,time,available,new Set(available),1)).toBeNull();
  }
  expect(flights).toBeGreaterThan(20);
 });
});
