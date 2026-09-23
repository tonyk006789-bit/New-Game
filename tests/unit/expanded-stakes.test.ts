import {describe,it,expect} from 'vitest';
import {stagingProfile,validStake,stagingMultiplier,cabinetPractice,cabinetGames,storyboardRandom,reefLeadAngle,reefFlight,reefTarget} from '@new-game/game-math';
describe('quarter-credit stakes and five-reel outcomes',()=>{
 it('accepts precisely 80 canonical integer amounts and rejects off-step, out-of-range and malformed amounts',()=>{
  expect(stagingProfile.stakes).toHaveLength(80);expect(stagingProfile.stakes[0]).toBe('25');expect(stagingProfile.stakes.at(-1)).toBe('2000');
  for(let n=0;n<=2025;n++)expect(validStake(String(n))).toBe(n>=25&&n<=2000&&n%25===0);
  for(const invalid of ['025','25.0','0.25','2e3','+25','-25',' 25','20000000000000000000',''])expect(validStake(invalid)).toBe(false);
 });
 it('pays five-reel neon runs from the left, with different 3/4/5 awards',()=>{
  for(const [count,multiplier] of [[2,0],[3,1],[4,2],[5,4]]){
   const grid=[['bell','bar','gem','bar','gem'],Array.from({length:5},(_,i)=>i<count?'cherry':'seven'),['gem','bar','bell','gem','bar']];
   expect(stagingMultiplier({id:'test',game:'neon-sevens',description:'',frames:[{grid,locked:[],remaining:0}]})).toBe(multiplier);
  }
 });
 it('all cabinet frames have five columns, and only a full five-coin collection pays',()=>{
  for(const game of Object.keys(cabinetGames) as (keyof typeof cabinetGames)[])for(let seed=1;seed<100;seed++){
   const result=cabinetPractice(game,'test',storyboardRandom(seed));for(const frame of result.frames){expect(frame.grid).toHaveLength(3);for(const row of frame.grid)expect(row).toHaveLength(5);}
  }
  const full=cabinetPractice('coin-carnival','test',()=>0);expect(stagingMultiplier(full)).toBe(5);
  full.frames[0].grid[1][4]='bell';expect(stagingMultiplier(full)).toBe(0);
 });
 it('target lock leads moving fish without changing straight-ray physics',()=>{
  for(const id of [1,2,7,9,11,13,20]){const time=2,p=reefTarget(id,time);if(p.x<30||p.x>1170)continue;const angle=reefLeadAngle(1,id,time),flight=reefFlight(1,angle,time,[id]);expect(flight.targetId).toBe(id);expect(flight.x).toBeCloseTo(flight.origin.x+flight.vx*flight.time,5);}
 });
});
