import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {dealerExpression} from '../../apps/player/src/dealer-motion';
import manifest from '../../reports/dealer-models-v44.json';
import prior from '../../reports/dealer-models-v41.json';
import models from '../../apps/player/src/dealer-models.json';

type Model={nodes:{name:string;translation?:number[];rotation?:number[];scale?:number[];matrix?:number[]}[];meshes:{extras:{targetNames:string[]}}[];materials:{name:string;normalTexture?:unknown;pbrMetallicRoughness:{metallicFactor:number;metallicRoughnessTexture?:unknown};extensions?:Record<string,unknown>}[];extensionsUsed:string[]};
function readModel(url:string){const bytes=readFileSync(`apps/player/public${url}`);return {bytes,json:JSON.parse(bytes.toString('utf8',20,20+bytes.readUInt32LE(12))) as Model};}
describe('refined dealer surfaces and expressions',()=>{
 for(const asset of manifest.assets)it(`${asset.key}: licensed surfaces preserve the hand skeleton and bounded delivery`,()=>{
  const {bytes,json}=readModel(asset.url),old=readModel(prior.assets.find(a=>a.key===asset.key)!.url).json;
  expect(models[asset.key as keyof typeof models]).toBe(asset.url);expect(manifest.license).toBe('MIT');
  expect(bytes.length).toBe(asset.bytes);expect(bytes.length).toBeLessThan(5_600_000);expect(createHash('sha256').update(bytes).digest('hex')).toBe(asset.sha256);
  const bones=(j:Model)=>j.nodes.filter(n=>n.name?.startsWith('Bip01')).map(({name,translation,rotation,scale,matrix})=>({name,translation,rotation,scale,matrix}));
  expect(bones(json)).toEqual(bones(old));
  for(const part of ['head','body']){const material=json.materials.find(m=>m.name.includes(part))!;expect(material.normalTexture).toBeDefined();expect(material.pbrMetallicRoughness.metallicRoughnessTexture).toBeDefined();expect(material.pbrMetallicRoughness.metallicFactor).toBe(0);expect(material.extensions?.KHR_materials_specular).toBeDefined();}
  expect(asset.surfaceChecks).toHaveLength(2);for(const check of asset.surfaceChecks){expect(check.minRoughness).toBeGreaterThan(0);expect(check.minRoughness).toBeLessThan(check.maxRoughness);expect(check.maxRoughness).toBeLessThan(256);}
  for(const shape of ['AK_09_EyeBlinkLeft','AK_13_EyeLookInLeft','AK_16_EyeLookOutRight','AK_17_EyeLookUpLeft'])expect(json.meshes.flatMap(m=>m.extras?.targetNames??[])).toContain(shape);
 });
 it('keeps paired eyes looking together, bounded and smoothly returning attention to the cards',()=>{
  for(let ms=0;ms<25000;ms+=16)for(const grip of [0,.5,1]){
   const weight=(name:string,t=ms)=>dealerExpression(name,t,1.7,grip);
   expect(weight('EyeLookInLeft')).toBe(weight('EyeLookOutRight'));expect(weight('EyeLookInRight')).toBe(weight('EyeLookOutLeft'));
   expect(weight('EyeLookInLeft')*weight('EyeLookOutLeft')).toBe(0);
   for(const name of ['EyeLookInLeft','EyeLookOutLeft','EyeLookDownLeft','EyeLookUpLeft','MouthSmileLeft']){expect(weight(name)).toBeGreaterThanOrEqual(0);expect(weight(name)).toBeLessThan(.3);expect(Math.abs(weight(name)-weight(name,ms+1))).toBeLessThan(.005);}
   if(grip===1){expect(weight('EyeLookInLeft')).toBe(0);expect(weight('EyeLookOutLeft')).toBe(0);expect(weight('EyeLookDownLeft')).toBeGreaterThan(.18);}
  }
 });
});
