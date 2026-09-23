import {describe,it,expect} from 'vitest';
import {reefTarget,reefSpecies} from '@new-game/game-math';
describe('reef migration and silhouette scale',()=>{
 it('has small fish, large characters and open water throughout the migration cycle',()=>{
  const species=new Set<number>();let smallest=100,largest=0;
  for(let t=0;t<600;t+=5){const visible=Array.from({length:80},(_,i)=>reefTarget(i+1,t)).filter(p=>p.x>=-60&&p.x<=1260);
   expect(visible.length).toBeLessThanOrEqual(34);expect(visible.length).toBeGreaterThanOrEqual(10);
   for(const p of visible){species.add(p.species);smallest=Math.min(smallest,p.radius);largest=Math.max(largest,p.radius);expect(p.y).toBeGreaterThan(60);expect(p.y).toBeLessThan(530);}
  }
  expect(largest/smallest).toBeGreaterThan(5);expect(species.has(8)).toBe(true);expect(species.has(9)).toBe(true);expect(species.has(10)).toBe(true);expect(reefSpecies[14]).toBe('Silver sardine');
 });
});
