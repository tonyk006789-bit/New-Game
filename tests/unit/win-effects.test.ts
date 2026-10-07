import {describe,it,expect} from 'vitest';
import {catalog} from '@new-game/contracts';
import {winParticles,winStyles} from '../../apps/player/src/win-effects';
import {BotScoreboard,botCadence,botName} from '../../apps/player/src/bot-score';
import {fishGames,fishGuide,reefTarget,reefTier,reefOutcome,reefLeadAngle,reefFlight,stagingMultiplier} from '@new-game/game-math';

describe('bounded original win presentations',()=>{
 it('gives all thirty games a distinct effect composition',()=>{
  expect(catalog).toHaveLength(30);expect(new Set(catalog.map(game=>JSON.stringify(winStyles[game.id]))).size).toBe(30);
  for(const game of catalog)expect(winStyles[game.id]).toBeDefined();
 });
 it('requires a positive recorded award, uses stable decoration and bounds particle count/lifetime',()=>{
  expect(winParticles('neon-sevens','no-win','0','25')).toEqual([]);
  for(const award of ['25','250','25000']){const p=winParticles('neon-sevens','round',award,'25');expect(p).toEqual(winParticles('neon-sevens','round',award,'25'));expect(p.length).toBeLessThanOrEqual(62);expect(p.every(p=>p.delay+p.duration<=3320)).toBe(true);expect(p.every(p=>Number.isFinite(p.dx+p.dy+p.spin))).toBe(true);}
  expect(winParticles('abyss-legends','catch','500','25',true)).toHaveLength(18);
 });
});
describe('AI score combos without credit awards',()=>{
 it('counts actual hit inputs, separates seats and targets, then resets per table',()=>{
  const board=new BotScoreboard();for(let i=0;i<7;i++)expect(board.hit(2,1,0,i*200).gain).toBe(0);
  expect(board.hit(3,1,0,600).gain).toBe(0);expect(board.hit(2,2,0,600).gain).toBe(0);
  const r=board.hit(2,1,0,1600);expect(r.gain).toBe(10);expect(r.score).toEqual({points:10,combos:1,hits:9,lastGain:10});expect(r).not.toHaveProperty('award');expect(r).not.toHaveProperty('captured');
  board.reset();expect(board.hit(2,1,0,1000).score.points).toBe(0);
 });
 it('requires more hits for large targets and expires interrupted combos',()=>{
  for(const [species,hits,points] of [[0,8,10],[2,14,30],[3,24,80],[48,40,200]]){const board=new BotScoreboard();for(let i=0;i<hits-1;i++)expect(board.hit(2,5,species,i*200).gain).toBe(0);expect(board.hit(2,5,species,hits*200).gain).toBe(points);}
  const board=new BotScoreboard();for(let i=0;i<3;i++)board.hit(2,1,0,i*200);expect(board.hit(2,1,0,13000).gain).toBe(0);
 });
 it('varies short bursts with pauses and names every AI explicitly in the UI',()=>{
  const cadence=Array.from({length:40},(_,i)=>botCadence(2,i));expect(new Set(cadence).size).toBeGreaterThan(8);expect(Math.min(...cadence)).toBeGreaterThanOrEqual(150);expect(Math.max(...cadence)).toBeLessThanOrEqual(640);expect(cadence.some(ms=>ms>400)).toBe(true);
  for(const game of fishGames)for(const seat of [2,3,4])expect(botName(game,seat).length).toBeGreaterThan(2);
 });
});
describe('shootable jackpot wheel',()=>{
 it.each(fishGames)('%s exposes a collidable boss using only the existing 20x/4%% tier',game=>{
  expect(fishGuide(game)).toContain(48);expect(reefTier(48)).toBe('boss');
  const id=Array.from({length:80},(_,i)=>i+1).find(id=>reefTarget(id,0,game).species===48)!;
  const time=reefTarget(id,0,game).spawnAt+15;expect(reefFlight(1,reefLeadAngle(1,id,time,game),time,[id],game).targetId).toBe(id);
  let captures=0;for(let ticket=0;ticket<10000;ticket++){const r=reefOutcome('wheel',id,()=>ticket,game);if(r.captured){captures++;expect(stagingMultiplier(r)).toBe(20);}}
  expect(captures).toBe(400);
 });
});
