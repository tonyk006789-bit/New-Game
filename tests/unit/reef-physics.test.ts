import {describe,it,expect} from 'vitest';
import {reefFlight,reefCannon,reefTarget,sweptCircle,reefBallistics} from '@new-game/game-math';
describe('cannon collision physics',()=>{
 it('detects a fast projectile crossing a target between frames',()=>{expect(sweptCircle(-100,0,100,0,10)).toBeCloseTo(.45);expect(sweptCircle(-100,11,100,11,10)).toBeNull();expect(sweptCircle(0,0,100,0,10)).toBe(0);});
 it('has no impact and no target when a shot leaves an empty reef',()=>{const f=reefFlight(1,-Math.PI/2,10,[]);expect(f.targetId).toBeNull();expect(f.y).toBeLessThan(0);expect(f.time).toBeLessThan(reefBallistics.lifetime);});
 it('returns the earliest moving target collision, independent of target enumeration order',()=>{
  const ids=Array.from({length:80},(_,i)=>i+1);let hits=0;
  for(let angle=-Math.PI+.1;angle<-.1;angle+=.15){const f=reefFlight(1,angle,73,ids);expect(f).toEqual(reefFlight(1,angle,73,[...ids].reverse()));if(f.targetId!==null){hits++;const p=reefTarget(f.targetId,73+f.time);expect(Math.hypot(p.x-f.x,p.y-f.y)).toBeLessThan(p.radius+reefBallistics.radius+.02);expect(f.x).toBeCloseTo(f.origin.x+f.vx*f.time);}}
  expect(hits).toBeGreaterThan(0);
 });
 it('fires from each actual seat and skips captured targets',()=>{for(let seat=1;seat<=4;seat++){const angle=seat<=2?-Math.PI/2:Math.PI/2,f=reefFlight(seat,angle,50,[]),base=reefCannon(seat);expect(Math.hypot(f.origin.x-base.x,f.origin.y-base.y)).toBeCloseTo(56);expect(f.targetId).toBeNull();}});
});
