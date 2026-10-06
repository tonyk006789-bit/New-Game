import {describe,it,expect} from 'vitest';
import {catalog} from '@new-game/contracts';
import {fishGuide,reefTarget,reefTier,reefTierProfile,reefOutcome,stagingMultiplier,reefFlight,reefLeadAngle,isFishGame} from '@new-game/game-math';
import {musicScores,musicPlaylists,scoreStep,TRACK_STEPS,type MusicScene} from '../../apps/player/src/music-score';
describe('distinct music and fish worlds',()=>{
 it('provides 54 distinct complete tracks with bounded levels and changing arrangements',()=>{
  const names=new Set<string>(),signatures=new Set<string>();
  for(const scene of Object.keys(musicPlaylists) as MusicScene[]) {
   expect(musicPlaylists[scene]).toHaveLength(3);
   musicPlaylists[scene].forEach((track,index)=>{
    names.add(track.name);const events=Array.from({length:TRACK_STEPS},(_,step)=>scoreStep(scene,step,index));
    signatures.add(JSON.stringify(events));expect(new Set(events.flat().map(e=>e.kind)).size).toBe(6);
    expect(events.flat().every(e=>Number.isFinite(e.note)&&e.note>=0&&e.note<128&&e.duration>0&&e.level>0&&e.level<=.35)).toBe(true);
    expect(events.slice(0,32)).not.toEqual(events.slice(128,160));
   });
  }
  expect(names.size).toBe(54);expect(signatures.size).toBe(54);
 });
 it('gives every catalog game its own complete original rhythm arrangement',()=>{
  const signatures=new Set<string>();
  for(const game of catalog){const score=musicScores[game.id];expect(score.bpm).toBeGreaterThanOrEqual(116);const events=Array.from({length:128},(_,s)=>scoreStep(game.id,s)).flat();
   expect(new Set(events.map(e=>e.kind)).size).toBe(6);expect(events.every(e=>e.duration>0&&Number.isFinite(e.note)&&e.level<=.35)).toBe(true);signatures.add(JSON.stringify({bpm:score.bpm,events}));
  }expect(signatures.size).toBe(catalog.length);
 });
 it('both games expose varied sizes, treasure targets, and a bounded shared population',()=>{
  for(const game of ['reef-party','abyss-legends'] as const){const species=new Set<number>();
   for(let t=0;t<480;t+=.5){const active=Array.from({length:80},(_,i)=>reefTarget(i+1,t,game)).filter(p=>p.active);expect(active.length).toBeLessThanOrEqual(20);expect(active.filter(p=>p.tier==='boss').length).toBeLessThanOrEqual(1);active.forEach(p=>species.add(p.species));}
   expect([...species].sort()).toEqual([...fishGuide(game)].sort());expect(species.has(22)).toBe(true);
  }expect(isFishGame('abyss-legends')).toBe(true);expect(isFishGame('unknown')).toBe(false);
 });
 it('new creature awards use exactly the approved tier tickets and actual trajectories',()=>{
  for(const species of fishGuide('abyss-legends')){
   const id=Array.from({length:80},(_,i)=>i+1).find(id=>reefTarget(id,0,'abyss-legends').species===species)!;
   const target=reefTarget(id,0,'abyss-legends'),tier=reefTierProfile.tiers[reefTier(target.species)];
   expect(stagingMultiplier(reefOutcome('win',id,()=>tier.captureTickets-1,'abyss-legends'))).toBe(tier.multiplier);
   expect(stagingMultiplier(reefOutcome('loss',id,()=>tier.captureTickets,'abyss-legends'))).toBe(0);
   const time=target.spawnAt+15,angle=reefLeadAngle(1,id,time,'abyss-legends'),flight=reefFlight(1,angle,time,[id],'abyss-legends');expect(flight.targetId).toBe(id);
  }
 });
});
