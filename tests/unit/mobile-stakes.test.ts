import {describe,it,expect} from 'vitest';
import {catalog} from '@new-game/contracts';
import {lowStakeGames,stakesForGame,validGameStake,configuredGameProfileId,isFishGame,isKenoGame,stagingOutcome,stagingMultiplier,storyboardRandom} from '@new-game/game-math';
import {fitGameFrame,gameFrame,needsGameRotation} from '../../apps/player/src/game-screen';
import {isPortraitGame} from '../../apps/player/src/cabinet-layout';
describe('V32 mobile cabinets and half-catalog lower stakes',()=>{
 it('offers ten-cent stakes on exactly 15 games with whole-unit settlement and immutable old choices',()=>{
  expect(lowStakeGames).toHaveLength(15);expect(new Set(lowStakeGames).size).toBe(15);
  expect(catalog.filter(g=>validGameStake(g.id,'10'))).toHaveLength(15);
  for(const game of lowStakeGames){
   expect(stakesForGame(game).slice(0,4)).toEqual(['10','20','25','50']);
   expect(configuredGameProfileId(game,{revision:'1',payingPercent:20})).toMatch(/-stakes-v32$/);
   for(const bad of ['0','1','9','11','15','21','010','0.10','10.0','2001'])expect(validGameStake(game,bad)).toBe(false);
   if(!isFishGame(game))for(let seed=1;seed<=25;seed++){
    const out=stagingOutcome(game,'exact',storyboardRandom(seed),isKenoGame(game)?[1,2,3,4,5]:undefined,20);
    expect(Number.isInteger(stagingMultiplier(out))).toBe(true);expect(BigInt(10*stagingMultiplier(out))).toBe(10n*BigInt(stagingMultiplier(out)));
   }
  }
  for(const game of catalog.filter(g=>!validGameStake(g.id,'10')))expect(stakesForGame(game.id)[0]).toBe(game.category==='Table'?'50':'25');
 });
 it('keeps 25 landscapes at 16:9 and five portraits at 9:16 without cropping',()=>{
  expect(catalog.filter(g=>isPortraitGame(g.id))).toHaveLength(5);
  for(const portrait of [true,false])for(const [w,h] of [[390,844],[844,390],[1180,820],[1920,1080]]){
   const frame=gameFrame(portrait),s=fitGameFrame(w,h,portrait);
   expect(frame.width/frame.height).toBe(portrait?9/16:16/9);expect(frame.width*s).toBeLessThanOrEqual(w);expect(frame.height*s).toBeLessThanOrEqual(h);
  }
 });
 it('gates the wrong mobile orientation and never blocks desktop input',()=>{
  expect(needsGameRotation(390,844,false,true)).toBe(true);expect(needsGameRotation(844,390,true,true)).toBe(true);
  expect(needsGameRotation(844,390,false,true)).toBe(false);expect(needsGameRotation(390,844,true,true)).toBe(false);
  expect(needsGameRotation(390,844,false,false)).toBe(false);
 });
});
