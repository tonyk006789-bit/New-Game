import * as T from 'three';
import {CARD_RELEASE,DEAL_STEP} from './blackjack-dealing';
import {CARD_PICKUP,ease} from './dealer-motion';

type Joint={bone:T.Object3D;rest:T.Quaternion;flex:T.Vector3;splay:T.Vector3;angle:number;spread:number};
type Finger={joints:Joint[];tip:T.Object3D;rest:number[];grip:number[];spread:number};
export type HandCalibration={contact:number[];grips:number[][];spreads:number[]};
/** Critically damped step response: no oscillation, no frame-rate dependent integration. */
export const tendonResponse=(ms:number,tau:number)=>{const t=Math.max(0,ms)/tau;return 1-(1+t)*Math.exp(-t);};
/** Independent tendons: index leads release, thumb follows, ring/little settle last. */
export function fingerMotion(ms:number,finger:number,joint:number){
 const t=T.MathUtils.clamp(ms,0,DEAL_STEP),delay=[8,0,12,22,32][finger]+joint*5;
 const approach=ease((t-65-delay)/100),close=ease((t-150-delay)/(CARD_PICKUP-150-delay));
 const release=tendonResponse(t-CARD_RELEASE-delay,[23,17,29,35,41][finger]+joint*4);
 const settle=ease((t-810-delay)/(DEAL_STEP-810-delay));
 return {open:approach*(1-close)*(1-settle),hold:close*(1-release)*(1-settle),release:release*(1-settle),settle};
}

/** Calibrated three-joint fingers with opposed thumb/index pad contacts. */
export class DealerHand{
 readonly fingers:Finger[]=[];
 readonly lateral:T.Vector3;readonly normal:T.Vector3;readonly forward:T.Vector3;
 readonly contact:T.Vector3;readonly cardRotation:T.Quaternion;
 private radius:number;private cardLead:number;
 constructor(readonly hand:T.Object3D,root:T.Object3D,side:'L'|'R',calibration?:HandCalibration){
  const bone=(finger:number,joint=0)=>root.getObjectByName(`Bip01_${side}_Finger${finger}${joint||''}`)!;
  const wrist=hand.getWorldPosition(new T.Vector3()),at=(f:number)=>bone(f).getWorldPosition(new T.Vector3());
  const forward=at(2).sub(wrist).normalize(),lateral=at(1).sub(at(4));lateral.addScaledVector(forward,-lateral.dot(forward)).normalize();
  const normal=forward.clone().cross(lateral).multiplyScalar(side==='L'?1:-1).normalize();
  const inverse=hand.getWorldQuaternion(new T.Quaternion()).invert();
  this.forward=forward.clone().applyQuaternion(inverse);this.lateral=lateral.clone().applyQuaternion(inverse);this.normal=normal.clone().applyQuaternion(inverse);
  const length=at(2).distanceTo(wrist),scale=hand.getWorldScale(new T.Vector3()).x;this.radius=length*.048/scale;this.cardLead=.038/scale;
  // A thin card is pinched between the index pad above and thumb pad below.
  this.contact=this.lateral.clone().multiplyScalar(length*.21).addScaledVector(this.normal,length*.40).addScaledVector(this.forward,length*1.25).divide(hand.getWorldScale(new T.Vector3()));
  const up=this.normal.clone().negate(),right=this.forward.clone().cross(up).normalize();
  this.cardRotation=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(right,this.forward,up));
  for(let f=0;f<5;f++){
   const joints:Joint[]=[];
   for(let j=0;j<3;j++){
    const b=bone(f,j),next=j<2?bone(f,j+1):undefined;
    const direction=(next?next.getWorldPosition(new T.Vector3()).sub(b.getWorldPosition(new T.Vector3())):b.getWorldPosition(new T.Vector3()).sub(b.parent!.getWorldPosition(new T.Vector3()))).normalize();
    const inv=b.getWorldQuaternion(new T.Quaternion()).invert();
    const flex=direction.clone().cross(normal).normalize().applyQuaternion(inv),splay=normal.clone().applyQuaternion(inv);
    joints.push({bone:b,rest:b.quaternion.clone(),flex,splay,angle:0,spread:0});
   }
   const last=joints[2].bone,previous=joints[1].bone;
   const tip=new T.Object3D(),tipWorld=last.getWorldPosition(new T.Vector3()).sub(previous.getWorldPosition(new T.Vector3())).multiplyScalar(f===0?.65:.72).add(last.getWorldPosition(new T.Vector3()));
   tip.position.copy(last.worldToLocal(tipWorld));last.add(tip);
   const rest=f===0?[.04,.08,.10]:[.02,.10+(f-1)*.025,.08+(f-1)*.02];
   this.fingers.push({joints,tip,rest,grip:f===0?[.2,.24,.15]:[.22,.4,.28],spread:0});
  }
  // Solve in the source pose once. Playback interpolates bounded joint angles,
  // preserving bone lengths and avoiding a frame-to-frame iterative IK jitter.
  for(let f=0;f<5;f++)this.apply(f,this.fingers[f].rest,0);
  // Alternate the two pads to find a reachable contact for this hand's actual
  // proportions; do not force every character into a generic finger pose.
  for(let pass=0;!calibration&&pass<12;pass++){
   this.solve(0,this.contact.clone().addScaledVector(this.normal,this.radius));
   this.solve(1,this.contact.clone().addScaledVector(this.normal,-this.radius));
   const thumb=this.hand.worldToLocal(this.fingers[0].tip.getWorldPosition(new T.Vector3())).addScaledVector(this.normal,-this.radius);
   const index=this.hand.worldToLocal(this.fingers[1].tip.getWorldPosition(new T.Vector3())).addScaledVector(this.normal,this.radius);
   this.contact.copy(thumb.add(index).multiplyScalar(.5));
   if(this.contactError().every(error=>error<.0005))break;
  }
  for(let f=2;f<5;f++)this.fingers[f].grip=[.19+(f-2)*.07,.44+(f-2)*.10,.27+(f-2)*.07];
  if(calibration){this.contact.fromArray(calibration.contact);this.fingers.forEach((finger,f)=>{finger.grip=[...calibration.grips[f]];finger.spread=calibration.spreads[f];});}
  this.pose(0);
 }
 calibration():HandCalibration{return {contact:this.contact.toArray(),grips:this.fingers.map(f=>[...f.grip]),spreads:this.fingers.map(f=>f.spread)};}
 private apply(f:number,angles:number[],spread:number){
  const finger=this.fingers[f];
  for(let j=0;j<3;j++){const a=finger.joints[j];a.angle=angles[j];a.spread=j===0?spread:0;a.bone.quaternion.copy(a.rest).multiply(new T.Quaternion().setFromAxisAngle(a.splay,a.spread)).multiply(new T.Quaternion().setFromAxisAngle(a.flex,a.angle)).normalize();a.bone.updateWorldMatrix(false,true);}
 }
 private solve(f:number,targetLocal:T.Vector3){
  const finger=this.fingers[f],target=this.hand.localToWorld(targetLocal.clone());
  const angles=finger.joints.map(j=>j.angle);let spread=finger.joints[0].spread;
  // Bounded coordinate descent permits base opposition/splay and flexion only.
  const error=()=>finger.tip.getWorldPosition(new T.Vector3()).distanceToSquared(target);
  for(let pass=0;pass<80;pass++){
   const step=.18*(1-pass/80)+.003;
   for(let axis=-1;axis<3;axis++){
    const before=axis===-1?spread:angles[axis];let best=before,bestError=error();
    for(const sign of [-1,1]){
     const value=T.MathUtils.clamp(before+step*sign,axis===-1?-.95:-.35,axis===-1?.95:1.35);
     if(axis===-1)spread=value;else angles[axis]=value;
     this.apply(f,angles,spread);const candidate=error();if(candidate<bestError){best=value;bestError=candidate;}
    }
    if(axis===-1)spread=best;else angles[axis]=best;this.apply(f,angles,spread);
   }
  }
  finger.grip=[...angles];finger.spread=spread;
 }
 pose(ms:number,active=true,tableY?:number){
  for(let f=0;f<5;f++){
   const finger=this.fingers[f],angles=finger.rest.map((rest,j)=>{
    if(!active)return rest;
    const p=fingerMotion(ms,f,j);
    return rest+(finger.grip[j]-rest)*p.hold-rest*.7*p.open-(f===1?.11:.045)*p.release;
   });
   const p=fingerMotion(ms,f,0),spread=active?finger.spread*p.hold+(f-2)*.025*(p.open+p.release):0;
   this.apply(f,angles,spread);
   if(tableY!==undefined){const contact=active&&f>=2?ease((ms-200)/60)*(1-ease((ms-CARD_RELEASE)/120)):0;this.contactLimit(f,angles,spread,tableY,contact);}
  }
 }
 private contactLimit(f:number,angles:number[],spread:number,tableY:number,cardContact:number){
  const finger=this.fingers[f],scale=this.hand.getWorldScale(new T.Vector3()).x,radius=this.radius*scale;
  const clear=()=>{
   for(const point of [finger.joints[2].bone,finger.tip]){
    const world=point.getWorldPosition(new T.Vector3());if(world.y<tableY+radius)return false;
    if(cardContact>0){const p=this.hand.worldToLocal(world).sub(this.contact),across=p.dot(this.lateral)*scale,along=p.dot(this.forward)*scale;
     if(Math.abs(across)<.041&&along>-.019&&along<.095&&p.dot(this.normal)*scale>-radius)return false;
    }
   }return true;
  };
  if(clear())return;
  // Uncurl toward an open hand until fingertip capsules clear the felt/card.
  // The limiting pose is found afresh, so pauses or dropped frames cannot leave
  // residual penetration or accumulate spring energy.
  const open=f===0?[-.24,-.15,-.10]:[-.24,-.17,-.10];let low=0,high=1;
  this.apply(f,open,spread);if(!clear()){this.apply(f,angles,spread);return;}
  for(let i=0;i<9;i++){const mid=(low+high)/2;this.apply(f,angles.map((a,j)=>T.MathUtils.lerp(a,open[j],mid)),spread);if(clear())high=mid;else low=mid;}
  const constrained=angles.map((a,j)=>T.MathUtils.lerp(a,open[j],high*(cardContact>0?cardContact:1)));
  this.apply(f,constrained,spread);
  if(cardContact>0&&cardContact<1)this.contactLimit(f,constrained,spread,tableY,0);
 }
 /** Contact midpoint remains fixed in the palm while the card is carried. */
 cardPosition(){return this.hand.localToWorld(this.contact.clone().addScaledVector(this.forward,this.cardLead));}
 cardQuaternion(){return this.hand.getWorldQuaternion(new T.Quaternion()).multiply(this.cardRotation);}
 /** Measurements used by the local fixture/tests, never gameplay authority. */
 contactError(){return [1,0].map((f,i)=>{const target=this.hand.localToWorld(this.contact.clone().addScaledVector(this.normal,(i===0?-1:1)*this.radius));return this.fingers[f].tip.getWorldPosition(new T.Vector3()).distanceTo(target);});}
}
