import {describe,it,expect} from 'vitest';
import {Vector3} from 'three';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {elbowFor} from '../../apps/player/src/dealer-rig';
import {dealerPose,HAND_REST,HAND_PICKUP,CARD_PICKUP} from '../../apps/player/src/dealer-motion';
import {CARD_RELEASE,CARD_LAND,DEAL_STEP} from '../../apps/player/src/blackjack-dealing';
import manifest from '../../reports/dealer-models-v40.json';
describe('jointed dealer motion',()=>{
 it('keeps limb lengths fixed and reachable, including out-of-reach card positions',()=>{
  const shoulder=new Vector3(.152,1.418,-.054),pole=new Vector3(.28,.95,-.08);
  for(const target of [...Array.from({length:DEAL_STEP+1},(_,t)=>new Vector3(...dealerPose(t).wrist)),new Vector3(9,9,9),shoulder.clone().addScalar(.0001)]){
   const {elbow,wrist}=elbowFor(shoulder,target,pole,.240342,.249304);
   expect(elbow.distanceTo(shoulder)).toBeCloseTo(.240342,6);expect(wrist.distanceTo(elbow)).toBeCloseTo(.249304,6);
   expect(wrist.distanceTo(shoulder)).toBeLessThan(.489647);
  }
 });
 it('keeps a continuous grip through pickup/carry and returns to exactly the same rest',()=>{
  expect(dealerPose(0).wrist).toEqual(HAND_REST);expect(dealerPose(CARD_PICKUP).wrist).toEqual(HAND_PICKUP);expect(dealerPose(DEAL_STEP).wrist).toEqual(HAND_REST);
  expect(dealerPose(CARD_PICKUP-1).held).toBe(false);expect(dealerPose(CARD_PICKUP).held).toBe(true);
  expect(dealerPose(CARD_RELEASE-1).held).toBe(true);expect(dealerPose(CARD_RELEASE).held).toBe(false);
  expect(dealerPose(CARD_RELEASE).flight).toBe(0);expect(dealerPose(CARD_LAND).flight).toBe(1);
  for(let t=1;t<=DEAL_STEP;t++){
   const p=dealerPose(t),last=dealerPose(t-1);expect(new Vector3(...p.wrist).distanceTo(new Vector3(...last.wrist))).toBeLessThan(.002);
   expect(Math.abs(p.grip-last.grip)).toBeLessThan(.02);
  }
 });
 it('reaches directly for the existing hole card rather than drawing another card',()=>{
  const direct=dealerPose(CARD_PICKUP,[.08,1.16,.34],true);
  expect(direct.wrist).not.toEqual(HAND_PICKUP);
  expect(dealerPose(DEAL_STEP,[.08,1.16,.34],true).wrist).toEqual(HAND_REST);
 });
 it('ships intact licensed models with finger skeletons and bounded delivery size',()=>{
  expect(manifest.license).toBe('CC0-1.0');
  for(const asset of manifest.assets){const file=readFileSync(`apps/player/public${asset.url}`);expect(file.length).toBe(asset.bytes);expect(createHash('sha256').update(file).digest('hex')).toBe(asset.sha256);expect(file.toString('ascii',0,4)).toBe('glTF');expect(file.length).toBeLessThan(2_000_000);
   if(['female','male'].includes(asset.key)){const j=JSON.parse(file.toString('utf8',20,20+file.readUInt32LE(12)));const names=j.nodes.map((n:{name:string})=>n.name);for(const name of ['upperarm_l','lowerarm_l','hand_l','thumb_03_l','index_03_l'])expect(names).toContain(name);}
  }
 });
});
