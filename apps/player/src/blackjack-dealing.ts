/** Presentation only. The server's cards and awards are never changed here. */
export type DealSnapshot={id:string;settled:boolean;dealer:readonly unknown[];hands:readonly {cards:readonly unknown[]}[]};
export type DealCue={target:'player'|'dealer';hand:number;index:number;kind:'deal'|'turn';at:number;faceUp:boolean};
export const DEAL_STEP=1120, CARD_RELEASE=650, CARD_LAND=990;
export function blackjackDealPlan(previous:DealSnapshot|null,next:DealSnapshot,holeCard=true){
 const opening=!previous||previous.id!==next.id||previous.settled;
 const split=!opening&&next.hands.length>previous.hands.length;
 const playerCounts=next.hands.map((_,i)=>opening?0:split?1:previous.hands[i]?.cards.length||0);
 const dealerCount=opening?0:previous.dealer.length;
 const cues:DealCue[]=[];
 const add=(target:'player'|'dealer',hand:number,index:number,faceUp=true,kind:'deal'|'turn'='deal')=>cues.push({target,hand,index,faceUp,kind,at:cues.length*DEAL_STEP});
 if(opening){
  // Standard opening order; the second dealer card stays face down until settlement.
  for(let i=0;i<2;i++){if(next.hands[0]?.cards[i])add('player',0,i);if(next.dealer.length>i&&(i===0||holeCard))add('dealer',0,i,i===0);}
 }
 for(let h=0;h<next.hands.length;h++)for(let i=opening?2:playerCounts[h];i<next.hands[h].cards.length;i++)add('player',h,i);
 const alreadyDealt=opening?Math.min(holeCard?2:1,next.dealer.length):dealerCount;
 if(next.settled){
  if(alreadyDealt>1)add('dealer',0,1,true,'turn');
  for(let i=alreadyDealt;i<next.dealer.length;i++)add('dealer',0,i);
 }
 return {playerCounts,dealerCount,cues,duration:cues.length*DEAL_STEP};
}
