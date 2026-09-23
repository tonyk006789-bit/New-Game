import { describe, expect, it } from 'vitest';
import { cabinetGames, cabinetMatches, cabinetPractice, storyboardRandom, type CabinetGameId } from '@new-game/game-math';
describe('original nonpayable cabinet mechanics', () => {
  it('checks straight and diagonal lines independently, without counting partial triples', () => {
    const grid = [['seven','bar','bell','bar','seven'],['bar','seven','bar','seven','bell'],['bell','bar','seven','bell','bar']];
    expect(cabinetMatches('neon-sevens',grid)).toEqual([{line:4,rows:[0,1,2,1,0],symbol:'seven',count:5}]);
    expect(cabinetMatches('neon-sevens',[['seven','seven','bar','bell','bell'],['bar','bell','seven','bar','bar'],['bell','bar','cherry','seven','seven']])).toEqual([]);
  });
  it('wilds extend a left-origin run, stop at mismatch and never count it twice', () => {
    const grid = [['bell','leaf','seven','coin','lotus'],['dragon','gem','dragon','gem','bell'],['leaf','seven','coin','lotus','seven']];
    expect(cabinetMatches('jade-fortune',grid).find(line=>line.line===1)).toEqual({line:1,rows:[1,1,1,1,1],symbol:'gem',count:4});
    grid[1]=['dragon','dragon','dragon','dragon','dragon'];
    expect(cabinetMatches('jade-fortune',grid).filter(line=>line.line===1)).toEqual([{line:1,rows:[1,1,1,1,1],symbol:'dragon',count:5}]);
    grid[1]=['bell','gem','gem','gem','gem'];
    expect(cabinetMatches('jade-fortune',grid).some(line=>line.line===1)).toBe(false);
  });
  it('rejects malformed grids and symbols', () => {
    expect(()=>cabinetMatches('jade-fortune',[['seven']])).toThrow();
    expect(()=>cabinetMatches('neon-sevens',Array.from({length:3},()=>['dragon','seven','seven']))).toThrow();
  });
  it('stops a full collection immediately, and an empty collection after three respins', () => {
    const full = cabinetPractice('coin-carnival','full',()=>0);
    expect(full.frames).toHaveLength(1);expect(full.collected).toBe(5);
    const empty = cabinetPractice('coin-carnival','empty',()=>1);
    expect(empty.frames.map(frame=>frame.remaining)).toEqual([3,2,1,0]);expect(empty.collected).toBe(0);
  });
  it('preserves whole locked reels and result counts over 900 sequences', () => {
    for (const game of Object.keys(cabinetGames) as CabinetGameId[]) for (let seed=1;seed<=300;seed++) {
      const result = cabinetPractice(game,'test',storyboardRandom(seed));
      expect(result.mode).toBe('PRACTICE');expect(result.creditsChanged).toBe(false);
      expect(result).not.toHaveProperty('award');expect(result).not.toHaveProperty('stake');
      expect(result.frames.length).toBeLessThanOrEqual(game==='coin-carnival'?4:1);
      for (let n=1;n<result.frames.length;n++) {
        const before=result.frames[n-1], after=result.frames[n];
        for(const col of before.locked){expect(after.locked).toContain(col);expect(after.grid.map(row=>row[col])).toEqual(before.grid.map(row=>row[col]));}
        expect(after.remaining).toBe(before.remaining-1);
      }
      const end=result.frames.at(-1)!;
      expect(result.matches).toEqual(cabinetMatches(game,end.grid));
      if(game==='coin-carnival') {
        expect(result.collected).toBe(end.grid[1].filter(symbol=>symbol==='coin').length);
        expect(result.collected===5 || end.remaining===0).toBe(true);
      }
    }
  });
});
