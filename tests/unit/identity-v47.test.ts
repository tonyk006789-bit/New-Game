import {describe,it,expect} from 'vitest';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {catalog} from '@new-game/contracts';
import {cabinetGames,isCabinetGame} from '@new-game/game-math';
import {gameIdentities,identityArt,symbolPresentation} from '../../apps/player/src/game-identity';
import {newMusicCollections} from '../../apps/player/src/music-v47';
import {scoreEvents} from '../../apps/player/src/music-score';
import {kenoPageSize,kenoPageNumbers} from '../../apps/player/src/keno-pages';
describe('distinct game identity delivery',()=>{
 it('keeps every keno number selectable once across compact pages',()=>{
  for(const [scale,size] of [[.44,20],[.54,40],[.75,40]]){
   expect(kenoPageSize(true,scale)).toBe(size);
   expect(Array.from({length:80/size},(_,p)=>kenoPageNumbers(p,size)).flat()).toEqual(Array.from({length:80},(_,i)=>i+1));
  }expect(kenoPageSize(false,1)).toBe(80);expect(kenoPageNumbers(99,20)[0]).toBe(61);
 });
 it('covers all 31 games and all actual reel symbols, without reusing a symbol image across games',()=>{
  expect(Object.keys(gameIdentities).sort()).toEqual(catalog.map(g=>g.id).sort());
  const symbols=new Set<string>(),hosts=new Set<string>();
  for(const game of catalog){
   hosts.add(gameIdentities[game.id].host);
   if(game.category!=='Slots')continue;
   const keys=isCabinetGame(game.id)?cabinetGames[game.id].symbols:game.id==='temple-lights'?['moon','lotus','gem','sun','leaf']:game.id.includes('vault')?['sapphire','amethyst','emerald','amber']:['ruby','sapphire','emerald','amber','amethyst'];
   for(const key of keys){const p=symbolPresentation(game.id,key)!;expect(p,`${game.id}/${key}`).toBeDefined();expect(p.cell).toBeLessThan(p.host);const image=`${p.url}#${p.cell}`;expect(symbols.has(image)).toBe(false);symbols.add(image);expect(p.name).not.toMatch(/cherr|BAR|seven|diamond|bell/i);}
  }
  expect(hosts.size).toBe(31);
 });
 it('ships only small per-game strips with verified hashes and valid crops',()=>{
  const urls=new Set<string>();
  for(const game of catalog){const a=identityArt(game.id);if(!a)continue;
   urls.add(a.url);expect(a.width).toBe(a.columns*256);expect(a.host).toBeLessThan(a.columns);
   const bytes=readFileSync(`apps/player/public${a.url}`);expect(bytes.length).toBe(a.bytes);expect(bytes.length).toBeLessThan(100000);expect(createHash('sha256').update(bytes).digest('hex')).toBe(a.sha256);
  }expect(urls.size).toBe(21);
 });
 it('new music has original extended phrases, safe notes, and intentional breathing spaces',()=>{
  const tracks=Object.values(newMusicCollections).flatMap(c=>c.tracks);
  expect(tracks).toHaveLength(12);expect(new Set(tracks.map(t=>JSON.stringify([t.melody,t.answer]))).size).toBe(12);
  for(const t of tracks){expect(t.melody.length).toBe(t.barSteps*2);expect(t.answer.length).toBe(t.barSteps*2);
   const events=Array.from({length:t.barSteps*64},(_,i)=>scoreEvents(t,i)).flat();
   expect(events.every(e=>e.note>=0&&e.note<128&&Number.isFinite(e.duration)&&e.duration>0&&e.level>0&&e.level<=.35)).toBe(true);
   expect(scoreEvents(t,t.barSteps*3+15).some(e=>e.kind===t.lead)).toBe(false);
  }
 });
});
