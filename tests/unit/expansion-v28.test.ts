import {describe,it,expect} from 'vitest';
import {catalog,GameId,premiumGames} from '@new-game/contracts';
import {expansionAliases,stagingOutcome,stagingMultiplier,stagingGameProfileId,storyboardRandom,blackjackShoe,blackjackDeal,blackjackAct,blackjackPublic,blackjackFinish,blackjackProfiles,fishGuide,reefTarget,reefTier,reefLeadAngle,reefFlight} from '@new-game/game-math';
const shoe=(...ranks:number[])=>[...ranks,...Array(100).fill(10)].map((rank,i)=>({rank,suit:i%4}));
describe('thirty-game expansion',()=>{
 it('contains thirty unique playable identities, six fish worlds, five kenos and three premium blackjack tables',()=>{
  expect(catalog).toHaveLength(30);expect(new Set(catalog.map(g=>g.id)).size).toBe(30);
  expect(catalog.filter(g=>g.category==='Fish')).toHaveLength(6);expect(catalog.filter(g=>g.category==='Keno')).toHaveLength(5);
  expect(premiumGames).toHaveLength(3);for(const g of catalog)expect(GameId.parse(g.id)).toBe(g.id);
 });
 it('keeps reused profiles and their complete displayed outcomes equivalent without changing historical profile IDs',()=>{
  for(const [game,base] of Object.entries(expansionAliases))for(let seed=1;seed<100;seed++){
   const next=stagingOutcome(game as keyof typeof expansionAliases,'round',storyboardRandom(seed),[1,7,19,25,40,72]);
   const original=stagingOutcome(base,'round',storyboardRandom(seed),[1,7,19,25,40,72]);
   expect({...next,game:base}).toEqual(original);expect(stagingMultiplier(next)).toBe(stagingMultiplier(original));expect(stagingGameProfileId(game)).toBe('stage-expansion-v28');
  }
  expect(stagingGameProfileId('disco-diamonds')).toBe('stage-cabinets-v23');expect(stagingGameProfileId('neon-numbers')).toBe('stage-keno-cabinets-v1');
 });
 it('uses unique fish pools with collidable convoy/orbit paths and all four size tiers',()=>{
  for(const game of ['corsair-cove','cosmic-tides'] as const){
   expect(new Set(fishGuide(game).map(reefTier)).size).toBe(4);
   for(const species of fishGuide(game)){
    const id=Array.from({length:80},(_,i)=>i+1).find(id=>reefTarget(id,0,game).species===species)!;
    const at=reefTarget(id,0,game).spawnAt+15;
    expect(reefFlight(1,reefLeadAngle(1,id,at,game),at,[id],game).targetId).toBe(id);
   }
  }
  expect(reefTarget(2,20,'corsair-cove').y).not.toBe(reefTarget(2,20,'cosmic-tides').y);
 });
});
describe('distinct blackjack variants',()=>{
 it('uses exactly two decks and hits soft 17 only in Double Deck',()=>{
  expect(blackjackShoe(storyboardRandom(4),'double-deck-blackjack')).toHaveLength(104);
  const royal=blackjackAct(blackjackDeal(50,shoe(10,1,8,6,2)),'STAND');
  const two=blackjackAct(blackjackDeal(50,shoe(10,1,8,6,2),'double-deck-blackjack'),'STAND');
  expect(royal.award).toBe(100);expect(royal.dealer).toHaveLength(2);expect(two.award).toBe(0);expect(two.dealer).toHaveLength(3);
 });
 it('restricts Double Deck doubles to two-card totals 9–11',()=>{
  for(const [a,b] of [[4,5],[5,5],[5,6]])expect(blackjackPublic(blackjackDeal(50,shoe(a,10,b,7),'double-deck-blackjack')).actions).toContain('DOUBLE');
  for(const [a,b] of [[4,4],[6,6],[1,8]])expect(()=>blackjackAct(blackjackDeal(50,shoe(a,10,b,7),'double-deck-blackjack'),'DOUBLE')).toThrow();
 });
 it('European dealer takes no hidden card until after player decisions; dealer natural loses the double',()=>{
  const s=blackjackDeal(50,shoe(5,1,6,10,13),'european-blackjack');
  expect(s.cursor).toBe(3);expect(blackjackPublic(s).dealer).toHaveLength(1);expect(s.settled).toBe(false);
  const done=blackjackAct(s,'DOUBLE');expect(done.hands[0].stake).toBe(100);expect(done.hands[0].cards[2].rank).toBe(10);expect(done.dealer[1].rank).toBe(13);expect(done.award).toBe(0);
 });
 it('European split stakes also lose against dealer natural, and original naturals push',()=>{
  let s=blackjackDeal(50,shoe(8,1,8,3,2,13),'european-blackjack');s=blackjackAct(s,'SPLIT');s=blackjackAct(s,'STAND');s=blackjackAct(s,'STAND');expect(s.award).toBe(0);expect(s.hands.every(h=>h.result==='LOSE')).toBe(true);
  expect(blackjackDeal(50,shoe(1,1,13,10),'european-blackjack').award).toBe(50);
  expect(blackjackDeal(50,shoe(1,9,13,8),'european-blackjack').award).toBe(125);
 });
 it('settles saved variants deterministically and keeps hidden shoe data out of responses',()=>{
  for(const game of Object.keys(blackjackProfiles) as (keyof typeof blackjackProfiles)[]){
   const s=blackjackDeal(50,shoe(10,6,8,10,10),game),view=blackjackPublic(s);expect(view).not.toHaveProperty('shoe');
   const done=blackjackFinish(structuredClone(s));expect(blackjackFinish(done)).toEqual(done);expect(done.game).toBe(game);expect(Number.isInteger(done.award)).toBe(true);
  }
 });
});
