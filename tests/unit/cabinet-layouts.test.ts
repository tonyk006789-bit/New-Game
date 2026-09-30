import {describe,it,expect} from 'vitest';
import {cabinetPractice,cabinetMatches,stagingMultiplier,stagingOutcome,storyboardRandom,classicReelsProfile,stagingGameProfileId,type CabinetGameId,type StagingVisual} from '@new-game/game-math';
import {displayedReelGrid,isPortraitGame} from '../../apps/player/src/cabinet-layout';

describe('distinct cabinet layouts and historical evaluation',()=>{
 for(const game of ['neon-sevens','ruby-rush'] as CabinetGameId[])it(`${game}: three physical reels and approved triple returns`,()=>{
  expect(stagingGameProfileId(game)).toBe(classicReelsProfile.id);
  for(const [symbol,award] of Object.entries(classicReelsProfile.rewards)){
   const grid=[[symbol,symbol,symbol],['bar',symbol==='bell'?'gem':'bell','cherry'],['seven','cherry','bar']];
   const matches=cabinetMatches(game,grid);
   expect(matches).toEqual([{line:2,rows:[0,0,0],symbol,count:3}]);
   expect(stagingMultiplier({id:'fixture',game,frames:[{grid,locked:[],remaining:0}],description:''})).toBe(award);
  }
  let wins=0;const rng=storyboardRandom(19237);
  for(let i=0;i<2000;i++){
   const result=stagingOutcome(game,`round-${i}`,rng);
   expect(result.frames![0].grid.map(row=>row.length)).toEqual([3,3,3]);
   expect(result.matches!.every(match=>match.count===3)).toBe(true);
   wins+=Number(stagingMultiplier(result)>0);
  }
  expect(wins/2000).toBeGreaterThan(.27);expect(wins/2000).toBeLessThan(.33);
 });
 it('evaluates saved five-reel outcomes with their original line lengths and multipliers',()=>{
  for(const game of ['neon-sevens','ruby-rush'] as const){
   const grid=Array.from({length:3},()=>Array.from({length:5},()=> 'seven'));
   const result:StagingVisual={id:'historical',game,frames:[{grid,locked:[],remaining:0}],description:''};
   expect(cabinetMatches(game,grid)).toHaveLength(5);
   expect(stagingMultiplier(result)).toBe(100);
  }
 });
 it('shows exactly the paying Solar row through every respin, preserving held columns',()=>{
  for(let seed=1;seed<=100;seed++){
   const result=cabinetPractice('solar-fortune','solar',storyboardRandom(seed));
   for(const frame of result.frames){
    expect(displayedReelGrid('solar-fortune',frame.grid)).toEqual([frame.grid[1]]);
    expect(displayedReelGrid('solar-fortune',frame.grid)[0].map((s,i)=>s==='coin'?i:-1).filter(i=>i>=0)).toEqual(frame.locked);
   }
  }
 });
 it('only the two upright cabinets require portrait and wide grids are untouched',()=>{
  expect(['sapphire-crown','aurora-vault'].every(isPortraitGame)).toBe(true);
  expect(['neon-sevens','ruby-rush','solar-fortune','ember-relics'].some(isPortraitGame)).toBe(false);
  const grid=[['a','b','c'],['d','e','f'],['g','h','i']];expect(displayedReelGrid('ruby-rush',grid)).toBe(grid);
 });
});
