import {CARD_RELEASE,DEAL_STEP} from './blackjack-dealing';
const smooth=(t:number)=>{const x=Math.max(0,Math.min(1,t));return x*x*(3-2*x);};
/** One continuous gesture on one texture: no face swaps, seams or pose crossfades. */
export function dealerReach(elapsed:number){
 if(elapsed<=0||elapsed>=DEAL_STEP)return 0;
 return elapsed<CARD_RELEASE?smooth(elapsed/CARD_RELEASE):1-smooth((elapsed-CARD_RELEASE)/(DEAL_STEP-CARD_RELEASE));
}
export function dealerVertex(x:number,y:number,reach:number):[number,number]{
 // Shoulder and face stay pinned; the influence fades through the sleeve into the wrist.
 const arm=smooth((y-.36)/.34)*(1-smooth((x-.28)/.21))*smooth(x/.15);
 return [x+arm*reach*.045,y+arm*reach*.028];
}
