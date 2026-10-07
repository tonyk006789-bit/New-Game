/** Owner-approved test rules. The shuffled shoe stays on the server. */
export const blackjackProfile={id:'stage-blackjack-v1',decks:6,standSoft17:true,naturalProfit:[3,2],winProfit:[1,1],maxHands:2,splitAcesOneCard:true,minStake:50,maxStake:2000,stakeStep:50,idleMs:300000} as const;
// New variant mathematics remain a free preview until the owner's requested approval arrives.
export const blackjackCreditGames:readonly string[]=['royal-blackjack'];
export const blackjackCreditApproved=(game:string)=>blackjackCreditGames.includes(game);
export const blackjackGames=['royal-blackjack','double-deck-blackjack','european-blackjack'] as const;
export type BlackjackGame=typeof blackjackGames[number];
export const isBlackjackGame=(game:unknown):game is BlackjackGame=>typeof game==='string'&&(blackjackGames as readonly string[]).includes(game);
export const doubleDeckProfile={...blackjackProfile,id:'stage-double-deck-v1',decks:2,standSoft17:false,doubleTotals:[9,10,11]} as const;
export const europeanProfile={...blackjackProfile,id:'stage-european-v1',holeCard:false,dealerNaturalTakesAll:true} as const;
export const blackjackProfiles={'royal-blackjack':blackjackProfile,'double-deck-blackjack':doubleDeckProfile,'european-blackjack':europeanProfile} as const;
export function blackjackGameForProfile(profileId:string):BlackjackGame{const game=blackjackGames.find(game=>blackjackProfiles[game].id===profileId);if(!game)throw Error('Unknown blackjack profile');return game;}
export const blackjackProfileFor=(game:BlackjackGame='royal-blackjack')=>blackjackProfiles[game];
export type Card={rank:number;suit:number};
export type BlackjackHand={cards:Card[];stake:number;done:boolean;split:boolean;result?:'BLACKJACK'|'WIN'|'PUSH'|'LOSE';award?:number};
export type BlackjackState={game?:BlackjackGame;shoe:Card[];cursor:number;dealer:Card[];hands:BlackjackHand[];active:number;settled:boolean;award:number};
export function handValue(cards:readonly Card[]){let total=0,aces=0;for(const c of cards){total+=Math.min(10,c.rank);if(c.rank===1)aces++;}let soft=false;if(aces&&total+10<=21){total+=10;soft=true;}return {total,soft};}
export const natural=(cards:readonly Card[])=>cards.length===2&&handValue(cards).total===21;
export function blackjackShoe(random:(max:number)=>number,game:BlackjackGame='royal-blackjack'){const cards=Array.from({length:blackjackProfileFor(game).decks*52},(_,i)=>({rank:i%13+1,suit:Math.floor(i/13)%4}));for(let i=cards.length-1;i>0;i--){const j=random(i+1);[cards[i],cards[j]]=[cards[j],cards[i]];}return cards;}
const draw=(s:BlackjackState)=>{const c=s.shoe[s.cursor++];if(!c)throw Error('Shoe exhausted');return c;};
export function blackjackCost(s:BlackjackState){return s.hands.reduce((n,h)=>n+h.stake,0);}
export function blackjackFinish(s:BlackjackState){
 if(s.settled)return s;
 const profile=blackjackProfileFor(s.game);
 if(s.dealer.length===1)s.dealer.push(draw(s));
 if(s.hands.some(h=>handValue(h.cards).total<=21)&&!natural(s.dealer)&&!s.hands.every(h=>!h.split&&natural(h.cards)))while(handValue(s.dealer).total<17||(!profile.standSoft17&&handValue(s.dealer).total===17&&handValue(s.dealer).soft))s.dealer.push(draw(s));
 const dealer=handValue(s.dealer).total,dealerNatural=natural(s.dealer);
 for(const h of s.hands){const total=handValue(h.cards).total,bj=!h.split&&natural(h.cards);h.done=true;
  h.result=total>21?'LOSE':dealerNatural?(bj?'PUSH':'LOSE'):bj?'BLACKJACK':dealer>21||total>dealer?'WIN':total===dealer?'PUSH':'LOSE';
  h.award=h.result==='BLACKJACK'?h.stake*5/2:h.result==='WIN'?h.stake*2:h.result==='PUSH'?h.stake:0;
 }s.award=s.hands.reduce((n,h)=>n+(h.award||0),0);s.active=s.hands.length;s.settled=true;return s;
}
export function blackjackDeal(stake:number,shoe:Card[],game:BlackjackGame='royal-blackjack'):BlackjackState{
 if(!Number.isInteger(stake)||stake<50||stake>2000||stake%50)throw Error('Invalid blackjack stake');
 const s:BlackjackState={game,shoe,cursor:0,dealer:[],hands:[{cards:[],stake,done:false,split:false}],active:0,settled:false,award:0};
 s.hands[0].cards.push(draw(s));s.dealer.push(draw(s));s.hands[0].cards.push(draw(s));if(game!=='european-blackjack')s.dealer.push(draw(s));
 if(natural(s.dealer)||natural(s.hands[0].cards))blackjackFinish(s);return s;
}
export function blackjackActions(s:BlackjackState){if(s.settled)return [];const h=s.hands[s.active];return ['HIT','STAND',...(h.cards.length===2&&(s.game!=='double-deck-blackjack'||[9,10,11].includes(handValue(h.cards).total))?['DOUBLE']:[]),...(s.hands.length===1&&h.cards.length===2&&h.cards[0].rank===h.cards[1].rank?['SPLIT']:[])];}
export function blackjackAct(previous:BlackjackState,action:string){
 const s=structuredClone(previous);if(!blackjackActions(s).includes(action))throw Error('Action unavailable');const h=s.hands[s.active];
 if(action==='HIT'){h.cards.push(draw(s));if(handValue(h.cards).total>=21)h.done=true;}
 if(action==='STAND')h.done=true;
 if(action==='DOUBLE'){h.stake*=2;h.cards.push(draw(s));h.done=true;}
 if(action==='SPLIT'){
  const second=h.cards.pop()!,aces=h.cards[0].rank===1;h.split=true;h.cards.push(draw(s));
  s.hands.push({cards:[second,draw(s)],stake:h.stake,done:aces,split:true});h.done=aces;
  for(const hand of s.hands)if(handValue(hand.cards).total===21)hand.done=true;
 }
 while(s.active<s.hands.length&&s.hands[s.active].done)s.active++;
 if(s.active>=s.hands.length)blackjackFinish(s);return s;
}
export function blackjackPublic(s:BlackjackState){return {dealer:s.settled?s.dealer:s.dealer.length===1?[s.dealer[0]]:[s.dealer[0],null],hands:s.hands,active:s.active,settled:s.settled,award:String(s.award),stake:String(blackjackCost(s)),actions:blackjackActions(s),dealerValue:s.settled?handValue(s.dealer):null};}
