import {describe,it,expect} from 'vitest';
import {gameResolutions,renderDimensions,gameRenderDensity,fitGameFrame,gameFrame,validGameResolution} from '../../apps/player/src/game-screen';
import {musicCollections,validMusicCollection} from '../../apps/player/src/music-collections';
import {musicScores,scoreEvents} from '../../apps/player/src/music-score';
describe('HD, Full HD and QHD game output',()=>{
 it('uses exact output sizes, fits both orientations, and scales raster density without changing game coordinates',()=>{
  expect(gameResolutions.map(r=>[r.width,r.height])).toEqual([[1280,720],[1920,1080],[2560,1440]]);
  expect(gameResolutions.map(r=>gameRenderDensity(r.id))).toEqual([1,1.5,2]);
  for(const r of gameResolutions)for(const portrait of [true,false]){
   const out=renderDimensions(r.id,portrait),base=gameFrame(portrait),scale=fitGameFrame(out.width,out.height,portrait,r.id);
   expect(base.width*scale).toBeCloseTo(out.width);expect(base.height*scale).toBeCloseTo(out.height);
   for(const [w,h] of [[844,390],[390,844],[1180,820],[2560,1440]]){const fit=fitGameFrame(w,h,portrait,r.id);expect(base.width*fit).toBeLessThanOrEqual(w);expect(base.height*fit).toBeLessThanOrEqual(h);}
  }
  expect(fitGameFrame(0,0,false)).toBe(0);expect(validGameResolution('4k')).toBe(false);expect(validGameResolution('2k')).toBe(true);
 });
});
describe('five additional original music collections',()=>{
 it('has ten distinct, schedulable scores, with unique rhythmic and melodic fingerprints across all 41 tracks',()=>{
  expect(Object.keys(musicCollections)).toHaveLength(5);
  const extra=Object.values(musicCollections).flatMap(c=>c.tracks),all=[...Object.values(musicScores),...extra];
  expect(extra).toHaveLength(10);expect(new Set(all.map(t=>t.name)).size).toBe(41);
  expect(new Set(all.map(t=>JSON.stringify([t.barSteps,t.kick,t.snare,t.hat,t.bassHits,t.chordHits]))).size).toBe(41);
  expect(new Set(all.map(t=>JSON.stringify([t.melody,t.answer]))).size).toBe(41);
  for(const track of extra){
   expect(track.melody).toHaveLength(track.barSteps);expect(track.answer).toHaveLength(track.barSteps);
   for(const hits of [track.kick,track.snare,track.hat,track.bassHits,track.chordHits])expect(hits.every(n=>n>=0&&n<track.barSteps)).toBe(true);
   const events=Array.from({length:track.barSteps*64},(_,i)=>scoreEvents(track,i)).flat();
   expect(events.length).toBeGreaterThan(1000);expect(new Set(events.map(e=>e.kind)).size).toBeGreaterThanOrEqual(6);
   expect(events.every(e=>Number.isFinite(e.note)&&e.note>=0&&e.note<128&&e.duration>0&&e.level>0&&e.level<=.35)).toBe(true);
  }
  expect(validMusicCollection('game')).toBe(true);expect(validMusicCollection('neon-drive')).toBe(true);expect(validMusicCollection('__proto__')).toBe(false);
 });
});
