import {CARD_RELEASE,CARD_LAND,DEAL_STEP} from './blackjack-dealing';
export const CARD_PICKUP=260;
export type Point3=[number,number,number];
export const HAND_REST:Point3=[.29,1.17,.18],HAND_PICKUP:Point3=[.38,1.18,.15],HAND_RELEASE:Point3=[.08,1.16,.34];
export const ease=(t:number)=>{const x=Math.max(0,Math.min(1,t));return x*x*x*(x*(x*6-15)+10);};
const between=(a:Point3,b:Point3,t:number):Point3=>a.map((v,i)=>v+(b[i]-v)*ease(t)) as Point3;
const curve=(a:Point3,b:Point3,va:Point3,vb:Point3,t:number):Point3=>{
 const u=Math.max(0,Math.min(1,t)),u2=u*u,u3=u2*u;
 return a.map((v,i)=>(2*u3-3*u2+1)*v+(u3-2*u2+u)*va[i]+(-2*u3+3*u2)*b[i]+(u3-u2)*vb[i]) as Point3;
};
/** Small independent biological motion; never derived from cards or outcomes. */
export function dealerLife(ms:number,phase=0){
 const seconds=Math.max(0,ms)/1000+phase,blinkPhase=(seconds%5.3);
 const blink=blinkPhase<.18?Math.sin(Math.PI*blinkPhase/.18)**2:0;
 return {breath:Math.sin(seconds*1.35)*.003,look:Math.sin(seconds*.63)*.008,blink};
}
/** One shared clock: reach, pinch, carry, release, recovery. Metres, not image warping. */
export function dealerPose(ms:number,release:Point3=HAND_RELEASE,turn=false){
 const t=Math.max(0,Math.min(DEAL_STEP,ms));let wrist:Point3;
 if(turn&&t<CARD_RELEASE)wrist=between(HAND_REST,release,t/CARD_RELEASE);
 else if(t<CARD_PICKUP)wrist=between(HAND_REST,HAND_PICKUP,t/CARD_PICKUP);
 else if(t<CARD_RELEASE){wrist=curve(HAND_PICKUP,release,[0,0,0],release.map((v,i)=>(v-HAND_PICKUP[i])*.35) as Point3,(t-CARD_PICKUP)/(CARD_RELEASE-CARD_PICKUP));wrist[1]+=.018*Math.sin(Math.PI*(t-CARD_PICKUP)/(CARD_RELEASE-CARD_PICKUP))**2;}
 else if(turn)wrist=between(release,HAND_REST,(t-CARD_RELEASE)/(DEAL_STEP-CARD_RELEASE));
 else wrist=curve(release,HAND_REST,release.map((v,i)=>(v-HAND_PICKUP[i])*.35*(DEAL_STEP-CARD_RELEASE)/(CARD_RELEASE-CARD_PICKUP)) as Point3,[0,0,0],(t-CARD_RELEASE)/(DEAL_STEP-CARD_RELEASE));
 const grip=t<CARD_PICKUP?ease((t-150)/110):1-ease((t-CARD_RELEASE+30)/120);
 return {wrist,grip,roll:-.04+.13*Math.sin(Math.PI*t/DEAL_STEP)**2,held:t>=CARD_PICKUP&&t<CARD_RELEASE,flying:t>=CARD_RELEASE&&t<CARD_LAND,flight:ease((t-CARD_RELEASE)/(CARD_LAND-CARD_RELEASE)),follow:.025*Math.sin(Math.PI*t/DEAL_STEP)**2};
}
