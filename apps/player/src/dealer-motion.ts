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
// A glance settles, holds, then shifts; eyes do not orbit continuously. Both eyes
// share one gaze direction, with the accepted card carry getting their attention.
const gazeStops=[{x:0,y:0},{x:.12,y:.025},{x:0,y:0},{x:-.09,y:.04},{x:.035,y:-.035},{x:0,y:0}] as const;
export function dealerExpression(name:string,ms:number,phase=0,grip=0){
 const t=Math.max(0,ms)/1000+phase,cycle=t/3.7,index=Math.floor(cycle)%gazeStops.length;
 const from=gazeStops[(index+gazeStops.length-1)%gazeStops.length],to=gazeStops[index],blend=ease((cycle%1)*3.7/.18);
 const x=(from.x+(to.x-from.x)*blend)*(1-grip),y=from.y+(to.y-from.y)*blend+grip*.22;
 if(name.includes('Blink'))return dealerLife(ms,phase).blink;
 if(name.includes('LookDown'))return Math.max(0,y);
 if(name.includes('LookUp'))return Math.max(0,-y);
 if(name.includes('LookInLeft')||name.includes('LookOutRight'))return Math.max(0,x);
 if(name.includes('LookInRight')||name.includes('LookOutLeft'))return Math.max(0,-x);
 if(name.includes('Smile'))return .065+.018*Math.sin(t*.38+(name.endsWith('Left')?0:.3));
 return 0;
}
/** Release inherits the hand's velocity and brakes smoothly at its card slot. */
export function cardFlight(start:Point3,end:Point3,velocity:Point3,ms:number):Point3{
 const duration=CARD_LAND-CARD_RELEASE,u=Math.max(0,Math.min(1,(ms-CARD_RELEASE)/duration));
 const p=curve(start,end,velocity.map(v=>v*duration) as Point3,[0,0,0],u);
 p[1]+=.004*Math.sin(Math.PI*u)**2;return p;
}
/** One shared clock: reach, pinch, carry, release, recovery. Metres, not image warping. */
export function dealerPose(ms:number,release:Point3=HAND_RELEASE,turn=false){
 const t=Math.max(0,Math.min(DEAL_STEP,ms));let wrist:Point3;
 if(turn&&t<CARD_RELEASE)wrist=between(HAND_REST,release,t/CARD_RELEASE);
 else if(t<CARD_PICKUP)wrist=between(HAND_REST,HAND_PICKUP,t/CARD_PICKUP);
 else if(t<CARD_RELEASE){wrist=curve(HAND_PICKUP,release,[0,0,0],release.map((v,i)=>(v-HAND_PICKUP[i])*.35) as Point3,(t-CARD_PICKUP)/(CARD_RELEASE-CARD_PICKUP));wrist[1]+=.018*Math.sin(Math.PI*(t-CARD_PICKUP)/(CARD_RELEASE-CARD_PICKUP))**2;}
 else if(turn)wrist=between(release,HAND_REST,(t-CARD_RELEASE)/(DEAL_STEP-CARD_RELEASE));
 else wrist=curve(release,HAND_REST,release.map((v,i)=>(v-HAND_PICKUP[i])*.35*(DEAL_STEP-CARD_RELEASE)/(CARD_RELEASE-CARD_PICKUP)) as Point3,[0,0,0],(t-CARD_RELEASE)/(DEAL_STEP-CARD_RELEASE));
 // Make room for the fingers to unfurl after the flick instead of forcing them
 // through the felt while the wrist is still low at its release position.
 if(!turn)wrist[1]+=.022*ease((t-360)/210)*(1-ease((t-800)/(DEAL_STEP-800)));
 const grip=t<CARD_PICKUP?ease((t-150)/110):1-ease((t-CARD_RELEASE+30)/120);
 return {wrist,grip,roll:-.04+.13*Math.sin(Math.PI*t/DEAL_STEP)**2,held:t>=CARD_PICKUP&&t<CARD_RELEASE,flying:t>=CARD_RELEASE&&t<CARD_LAND,flight:ease((t-CARD_RELEASE)/(CARD_LAND-CARD_RELEASE)),follow:.025*Math.sin(Math.PI*t/DEAL_STEP)**2};
}
