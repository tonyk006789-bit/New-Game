import {describe,it,expect} from 'vitest';
import {blackjackDealPlan,CARD_LAND,DEAL_STEP,type DealSnapshot} from '../../apps/player/src/blackjack-dealing';
const card={rank:4,suit:0};
const view=(extra:Partial<DealSnapshot>={}):DealSnapshot=>({id:'round',settled:false,dealer:[card,null],hands:[{cards:[card,card]}],...extra});
describe('blackjack dealer presentation',()=>{
 it('deals alternating hands and keeps the hole card face down',()=>{
  const plan=blackjackDealPlan(null,view());
  expect(plan.playerCounts).toEqual([0]);expect(plan.dealerCount).toBe(0);
  expect(plan.cues.map(c=>[c.target,c.index,c.faceUp])).toEqual([['player',0,true],['dealer',0,true],['player',1,true],['dealer',1,false]]);
  expect(plan.cues.every((c,i)=>c.at===i*DEAL_STEP)).toBe(true);expect(CARD_LAND).toBeLessThan(DEAL_STEP);
 });
 it('animates only the new hit, never the previously visible cards',()=>{
  const plan=blackjackDealPlan(view(),view({hands:[{cards:[card,card,card]}]}));
  expect(plan.playerCounts).toEqual([2]);expect(plan.cues.map(c=>[c.target,c.index])).toEqual([['player',2]]);
 });
 it('turns the existing hole card before dealing dealer hits',()=>{
  const plan=blackjackDealPlan(view(),view({settled:true,dealer:[card,card,card,card]}));
  expect(plan.cues.map(c=>[c.kind,c.target,c.index])).toEqual([['turn','dealer',1],['deal','dealer',2],['deal','dealer',3]]);
 });
 it('deals the European second card only after the player turn',()=>{
  const previous=view({dealer:[card]});
  expect(blackjackDealPlan(null,previous).cues).toHaveLength(3);
  expect(blackjackDealPlan(previous,view({settled:true,dealer:[card,card,card]})).cues.map(c=>[c.kind,c.index])).toEqual([['deal',1],['deal',2]]);
 });
 it('moves the split cards into two hands and deals one new card to each',()=>{
  const plan=blackjackDealPlan(view(),view({hands:[{cards:[card,card]},{cards:[card,card]}]}));
  expect(plan.playerCounts).toEqual([1,1]);expect(plan.cues.map(c=>[c.hand,c.index])).toEqual([[0,1],[1,1]]);
 });
 it('handles a natural, a new preview round with the same id and an unchanged hand',()=>{
  const settled=view({settled:true,dealer:[card,card]});
  expect(blackjackDealPlan(null,settled).cues.at(-1)?.kind).toBe('turn');
  expect(blackjackDealPlan(settled,view()).cues).toHaveLength(4);
  expect(blackjackDealPlan(view(),view()).cues).toHaveLength(0);
 });
 it('deals a European natural without inventing a face-down hole card',()=>{
  const plan=blackjackDealPlan(null,view({settled:true,dealer:[card,card]}),false);
  expect(plan.cues.map(c=>[c.target,c.index,c.faceUp,c.kind])).toEqual([['player',0,true,'deal'],['dealer',0,true,'deal'],['player',1,true,'deal'],['dealer',1,true,'deal']]);
 });
});
