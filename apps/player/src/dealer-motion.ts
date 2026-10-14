import {CARD_RELEASE,CARD_LAND,DEAL_STEP} from './blackjack-dealing';
export const CARD_PICKUP=260;
export type Point3=[number,number,number];
export const HAND_REST:Point3=[.29,1.17,.18],HAND_PICKUP:Point3=[.38,1.18,.15],HAND_RELEASE:Point3=[.08,1.16,.34];
export const ease=(t:number)=>{const x=Math.max(0,Math.min(1,t));return x*x*x*(x*(x*6-15)+10);};
const between=(a:Point3,b:Point3,t:number):Point3=>a.map((v,i)=>v+(b[i]-v)*ease(t)) as Point3;
/** One shared clock: reach, pinch, carry, release, recovery. Metres, not image warping. */
export function dealerPose(ms:number,release:Point3=HAND_RELEASE,turn=false){
 const t=Math.max(0,Math.min(DEAL_STEP,ms));let wrist:Point3;
 if(turn&&t<CARD_RELEASE)wrist=between(HAND_REST,release,t/CARD_RELEASE);
 else if(t<CARD_PICKUP)wrist=between(HAND_REST,HAND_PICKUP,t/CARD_PICKUP);
 else if(t<CARD_RELEASE){wrist=between(HAND_PICKUP,release,(t-CARD_PICKUP)/(CARD_RELEASE-CARD_PICKUP));wrist[1]+=.035*Math.sin(Math.PI*(t-CARD_PICKUP)/(CARD_RELEASE-CARD_PICKUP))**2;}
 else wrist=between(release,HAND_REST,(t-CARD_RELEASE)/(DEAL_STEP-CARD_RELEASE));
 const grip=t<CARD_PICKUP?ease((t-150)/110):1-ease((t-CARD_RELEASE+30)/120);
 return {wrist,grip,held:t>=CARD_PICKUP&&t<CARD_RELEASE,flying:t>=CARD_RELEASE&&t<CARD_LAND,flight:ease((t-CARD_RELEASE)/(CARD_LAND-CARD_RELEASE)),follow:.025*Math.sin(Math.PI*t/DEAL_STEP)**2};
}
