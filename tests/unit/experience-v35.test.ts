import {describe,it,expect} from 'vitest';
import {Texture,TextureSource,RenderTexture} from 'pixi.js';
import {soundCue,allowSound,type SoundKind} from '../../apps/player/src/sound-design';
import {releaseReefTextures} from '../../apps/player/src/reef-textures';

describe('bounded action feedback',()=>{
 it('has distinct navigation, gameplay and family win cues with finite, bounded voices',()=>{
  const kinds:SoundKind[]=['click','navigate','page','enter','back','favorite','shot','impact','reel-start','reel-stop','keno-draw','keno-match','card-deal','feature','treasure'];
  const signatures=kinds.map(kind=>soundCue(kind));
  expect(new Set(signatures.map(s=>JSON.stringify(s))).size).toBe(kinds.length);
  for(const cue of [...signatures,...['neon-sevens','meteor-keno','reef-party','royal-blackjack'].map(scene=>soundCue('win',scene))]){
   expect(cue.length).toBeLessThanOrEqual(12);
   for(const note of cue){expect(Number.isFinite(note.note)).toBe(true);expect(note.volume).toBeGreaterThan(0);expect(note.volume).toBeLessThanOrEqual(.2);expect(note.duration).toBeGreaterThan(0);expect(note.at+note.duration).toBeLessThan(2);}
  }
  expect(new Set(['neon-sevens','meteor-keno','reef-party','royal-blackjack'].map(scene=>JSON.stringify(soundCue('win',scene)))).size).toBe(4);
 });
 it('coalesces rapid feedback without blocking different action types',()=>{
  const last=new Map<SoundKind,number>();
  expect(allowSound('shot',0,last)).toBe(true);expect(allowSound('shot',20,last)).toBe(false);expect(allowSound('impact',20,last)).toBe(true);expect(allowSound('shot',35,last)).toBe(true);
  expect(allowSound('win',40,last)).toBe(true);expect(allowSound('win',100,last)).toBe(false);expect(allowSound('win',440,last)).toBe(true);
 });
});
describe('fish atlas ownership',()=>{
 it('releases scene frames and generated textures but preserves cached atlas sources for the next visit',()=>{
  const source=new TextureSource({width:64,height:64}),first=new Texture({source}),second=new Texture({source}),generated=RenderTexture.create({width:32,height:32});
  const generatedSource=generated.source,creatures:Texture[]=[];creatures[4]=first;creatures[48]=generated;
  releaseReefTextures({creatures,cannons:[second,first]});releaseReefTextures({creatures,cannons:[second]});
  expect(first.destroyed).toBe(true);expect(second.destroyed).toBe(true);expect(source.destroyed).toBe(false);expect(generatedSource.destroyed).toBe(true);
  const nextVisit=new Texture({source});expect(nextVisit.width).toBe(64);nextVisit.destroy();source.destroy();
 });
});
