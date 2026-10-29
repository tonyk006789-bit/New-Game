import {describe,it,expect} from 'vitest';
import {catalog} from '@new-game/contracts';
import {straightLineGames,straightLineProfile,cabinetGames,cabinetMatches,stagingMultiplier,stagingOutcome,storyboardRandom,configuredGameProfileId,type CabinetGameId} from '@new-game/game-math';
import {virtualPools,virtualPoolCycleMs} from '../../apps/player/src/virtual-pools';
describe('V50 straight rows and decorative pools',()=>{
 it('uses exactly eight of sixteen slot cabinets and only horizontal payline paths',()=>{
  expect(catalog.filter(g=>g.category==='Slots')).toHaveLength(16);expect(straightLineGames).toHaveLength(8);
  for(const game of straightLineGames){if(game==='temple-lights')continue;expect(cabinetGames[game].lines).toHaveLength(3);expect(cabinetGames[game].lines.every(line=>line.every(row=>row===line[0]))).toBe(true);}
  expect(cabinetGames['celestial-wilds'].lines).toHaveLength(9);
 });
 it('rejects a diagonal-only triple for new rounds, preserving its historical return',()=>{
  const grid=[['seven','bell','cherry'],['bar','seven','bell'],['cherry','bar','seven']];
  const old={id:'old',game:'neon-sevens' as const,description:'',frames:[{grid,locked:[],remaining:0}],ruleVersion:'stage-classic3-v1'};
  expect(stagingMultiplier(old)).toBe(5);expect(cabinetMatches('neon-sevens',grid,old.ruleVersion)).toHaveLength(1);
  expect(stagingMultiplier({...old,ruleVersion:straightLineProfile.id})).toBe(0);
 });
 it('preserves old five-reel zigzags and excludes them from new Jade rounds',()=>{
  const grid=[['gem','leaf','coin','lotus','gem'],['leaf','gem','leaf','gem','leaf'],['coin','lotus','gem','coin','lotus']];
  const old={id:'old',game:'jade-fortune' as const,description:'',frames:[{grid,locked:[],remaining:0}],ruleVersion:'stage-paying30-v2'};
  expect(stagingMultiplier(old)).toBe(8);expect(stagingMultiplier({...old,ruleVersion:straightLineProfile.id})).toBe(0);
  expect(stagingMultiplier({...old,game:'celestial-wilds',ruleVersion:'stage-expansion-v28'})).toBe(8);
 });
 it('keeps configured paying rates and receipt evaluation consistent in all changed cabinets',()=>{
  for(const game of straightLineGames.filter(g=>g!=='temple-lights') as CabinetGameId[]){
   const rng=storyboardRandom(50037);let paid=0;
   for(let i=0;i<1000;i++){
    const result=stagingOutcome(game,`${i}`,rng,undefined,20),value=stagingMultiplier(result);
    const receipt={...result,ruleVersion:configuredGameProfileId(game,{revision:'1',payingPercent:20})};
    expect(stagingMultiplier(receipt)).toBe(value);expect(result.matches!.every(m=>m.rows.every(r=>r===m.rows[0]))).toBe(true);paid+=Number(value>0);
   }
   expect(paid).toBeGreaterThan(155);expect(paid).toBeLessThan(245);
  }
 });
 it('virtual amounts vary only with time, with an explicit cycle and exact decimal strings',()=>{
  expect(virtualPools(0)).toEqual({minor:'2500',major:'50000',jackpot:'500000'});
  expect(virtualPools(3000)).toEqual({minor:'2501',major:'50007',jackpot:'500025'});
  expect(virtualPools(virtualPoolCycleMs)).toEqual(virtualPools(0));
 });
});
