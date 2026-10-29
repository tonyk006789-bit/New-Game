import {describe,expect,it} from 'vitest';
import {catalog} from '@new-game/contracts';
import {stagingMultiplier,kenoGames,type StagingGame} from '@new-game/game-math';
import {gameFacts} from '../../apps/player/src/game-facts';
import {kenoTicketRows,quickKenoPick} from '../../apps/player/src/keno-ticket';
describe('ticket presentation agrees with authoritative game evaluator',()=>{
 it('matches every possible hit count for 4–10 picks, all five Keno games and supported stake precisions',()=>{
  for(const game of kenoGames)for(let count=4;count<=10;count++)for(const stake of ['10','25','150','2000']){
   const picks=Array.from({length:count},(_,i)=>i+1);
   for(const row of kenoTicketRows(count,stake)){
    const drawn=[...picks.slice(0,row.hits),...Array.from({length:20-row.hits},(_,i)=>30+i)];
    const multiplier=stagingMultiplier({id:'ticket',game:game as StagingGame,picks,drawn,description:''});
    expect(row.multiplier).toBe(multiplier);expect(row.award).toBe((BigInt(stake)*BigInt(multiplier)).toString());
   }
  }
 });
 it('selects unique in-range numbers at both shuffle boundaries and does not hardcode a ticket',()=>{
  for(let count=4;count<=10;count++)for(const random of [(max:number)=>max-1,()=>0]){
   const picks=quickKenoPick(count,random);expect(picks).toHaveLength(count);expect(new Set(picks).size).toBe(count);expect(picks.every(n=>n>=1&&n<=80)).toBe(true);
  }
  expect(quickKenoPick(6,()=>0)).not.toEqual(quickKenoPick(6,max=>max-1));
  expect(()=>quickKenoPick(11)).toThrow();expect(()=>quickKenoPick(6,max=>max)).toThrow();
 });
 it('covers every cabinet and does not advertise pending blackjack variants as credit play',()=>{
  expect(catalog).toHaveLength(31);
  const facts=catalog.map(g=>gameFacts(g.id));expect(facts.filter(g=>g.preview)).toHaveLength(2);expect(facts.filter(g=>g.orientation.startsWith('Portrait'))).toHaveLength(5);
  expect(gameFacts('royal-blackjack').mode).toBe('Play credits');
  expect(gameFacts('double-deck-blackjack').mode).toBe('Free preview');
  expect(gameFacts('european-blackjack').mode).toBe('Free preview');
  expect(facts.every(g=>g.mechanic.length>0&&Number(g.minimum)>0)).toBe(true);
 });
});
