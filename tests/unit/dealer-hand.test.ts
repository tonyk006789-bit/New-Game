import {describe,it,expect} from 'vitest';
import * as T from 'three';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import models from '../../apps/player/src/dealer-models.json';
import calibrations from '../../apps/player/src/dealer-hands.json';
import {DealerHand,fingerMotion,tendonResponse} from '../../apps/player/src/dealer-hand';
import {CARD_RELEASE,CARD_LAND,DEAL_STEP} from '../../apps/player/src/blackjack-dealing';
import {CARD_PICKUP,dealerPose,cardFlight} from '../../apps/player/src/dealer-motion';
// Actual shipped bone transforms, without a WebGL context or texture loading.
function skeleton(url:string){
 const b=readFileSync(`apps/player/public${url}`);
 type Node={name:string;matrix?:number[];translation?:number[];rotation?:number[];scale?:number[];children?:number[]};
 const j=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12))) as {nodes:Node[];scene:number;scenes:{nodes:number[]}[]};
 const nodes=j.nodes.map(n=>{const o=new T.Object3D();o.name=n.name;if(n.matrix)o.applyMatrix4(new T.Matrix4().fromArray(n.matrix));else{if(n.translation)o.position.fromArray(n.translation);if(n.rotation)o.quaternion.fromArray(n.rotation);if(n.scale)o.scale.fromArray(n.scale);}return o;});
 j.nodes.forEach((n,i)=>n.children?.forEach(c=>nodes[i].add(nodes[c])));const root=new T.Group();j.scenes[j.scene||0].nodes.forEach(i=>root.add(nodes[i]));root.updateMatrixWorld(true);return root;
}
describe('articulated dealer fingers',()=>{
 it('carries hand velocity into the released card and settles at the exact destination',()=>{
  const from:[number,number,number]=[.1,1.15,.46],to:[number,number,number]=[-.1,1.115,.8],velocity:[number,number,number]=[-.0002,0,.0003];
  expect(cardFlight(from,to,velocity,CARD_RELEASE)).toEqual(from);expect(cardFlight(from,to,velocity,CARD_LAND)).toEqual(to);
  const after=new T.Vector3(...cardFlight(from,to,velocity,CARD_RELEASE+.01)).sub(new T.Vector3(...from)).multiplyScalar(100);
  expect(after.distanceTo(new T.Vector3(...velocity))).toBeLessThan(.000001);
  for(let ms=CARD_RELEASE;ms<=CARD_LAND;ms++)expect(cardFlight(from,to,velocity,ms)[1]).toBeGreaterThanOrEqual(1.115);
 });
 it('uses bounded damped recovery with an index-led release and no overshoot',()=>{
  let previous=0;
  for(let t=0;t<1500;t++){const r=tendonResponse(t,30);expect(r).toBeGreaterThanOrEqual(previous);expect(r).toBeLessThanOrEqual(1);previous=r;}
  expect(fingerMotion(700,1,0).hold).toBeLessThan(fingerMotion(700,0,0).hold);
  expect(fingerMotion(700,0,0).hold).toBeLessThan(fingerMotion(700,4,0).hold);
 });
 for(const [game,url] of Object.entries(models))it(`${game}: opposed pad contact, fixed bone lengths and deterministic recovery`,()=>{
  const root=skeleton(url),handBone=root.getObjectByName('Bip01_L_Hand')!,hand=new DealerHand(handBone,root,'L');
  const cached=calibrations[game as keyof typeof calibrations];
  expect(cached.sha256).toBe(createHash('sha256').update(readFileSync(`apps/player/public${url}`)).digest('hex'));
  expect(cached.L).toEqual(hand.calibration());
  const rest=hand.fingers.flatMap(f=>f.joints.map(j=>j.bone.quaternion.clone()));
  const lengths=hand.fingers.flatMap(f=>f.joints.map(j=>j.bone.position.length()));
  for(const ms of [CARD_PICKUP,450,CARD_RELEASE]){hand.pose(ms);for(const error of hand.contactError())expect(error).toBeLessThan(.002);}
  let prior=rest;
  for(let ms=0;ms<=DEAL_STEP;ms+=8){
   hand.pose(ms);const joints=hand.fingers.flatMap(f=>f.joints);
   joints.forEach((j,i)=>{expect(j.bone.position.length()).toBe(lengths[i]);expect(j.bone.quaternion.angleTo(prior[i])).toBeLessThan(.2);expect(Math.abs(j.angle)).toBeLessThan(1.5);});
   prior=joints.map(j=>j.bone.quaternion.clone());
  }
  hand.pose(DEAL_STEP);hand.fingers.flatMap(f=>f.joints).forEach((j,i)=>expect(j.bone.quaternion.angleTo(rest[i])).toBeLessThan(.000001));
  hand.pose(450);const carried=hand.fingers.map(f=>f.tip.getWorldPosition(new T.Vector3()));hand.pose(760);hand.pose(450);
  hand.fingers.forEach((f,i)=>expect(f.tip.getWorldPosition(new T.Vector3()).distanceTo(carried[i])).toBeLessThan(1e-8));
 });
 for(const [game,url] of Object.entries(models))it(`${game}: palm orientation follows the card and fingers clear the table`,()=>{
  const root=skeleton(url),bone=root.getObjectByName('Bip01_L_Hand')!,hand=new DealerHand(bone,root,'L',calibrations[game as keyof typeof calibrations].L);
  const local=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(hand.lateral,hand.normal,hand.forward));
  const desired=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(new T.Vector3(-1,0,0),new T.Vector3(0,-1,0),new T.Vector3(0,0,1)));
  bone.quaternion.copy(bone.parent!.getWorldQuaternion(new T.Quaternion()).invert().multiply(desired).multiply(local.invert()));
  let prior:T.Quaternion[]|undefined;
  for(let ms=0;ms<=DEAL_STEP;ms+=8){
   bone.position.copy(bone.parent!.worldToLocal(new T.Vector3(...dealerPose(ms).wrist)));bone.updateWorldMatrix(false,true);hand.pose(ms,true,1.108);
   for(const f of hand.fingers)expect(f.tip.getWorldPosition(new T.Vector3()).y).toBeGreaterThanOrEqual(1.108);
   if(ms>=CARD_PICKUP&&ms<=CARD_RELEASE)for(const error of hand.contactError())expect(error).toBeLessThan(.002);
   expect(new T.Vector3(0,0,1).applyQuaternion(hand.cardQuaternion()).y).toBeCloseTo(1,5);
   const joints=hand.fingers.flatMap(f=>f.joints);if(prior)joints.forEach((j,i)=>expect(j.bone.quaternion.angleTo(prior![i]),`${ms}ms joint ${i}`).toBeLessThan(.2));prior=joints.map(j=>j.bone.quaternion.clone());
  }
 });
});
