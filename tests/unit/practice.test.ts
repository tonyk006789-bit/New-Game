import { describe, expect, it } from 'vitest';
import { cascadeSequence, collapseGrid, featurePractice, findClusters, storyboardRandom, vaultSequence } from '@new-game/game-math';
describe('nonpayable feature sequences', () => {
  it('connects edges, never diagonals or the opposite edge of a row', () => {
    expect(findClusters([['a','b','a'],['b','a','b'],['a','b','a']])).toEqual([]);
    expect(findClusters([['a','a','b'],['a','a','b'],['c','b','b']])).toEqual([[0,1,3,4],[2,5,7,8]]);
  });
  it('preserves survivor order while refilling only cleared cells', () => {
    const grid = [['a','b'],['c','d'],['e','f']];
    const next = collapseGrid(grid,[0,2,3],()=>0);
    expect(next).toEqual([['ruby','ruby'],['ruby','b'],['e','f']]);
    expect(grid).toEqual([['a','b'],['c','d'],['e','f']]);
  });
  it('bounds a constantly matching cascade at six clears', () => {
    const sequence = cascadeSequence(()=>0);
    expect(sequence.cleared).toBe(180); expect(sequence.frames).toHaveLength(7); expect(sequence.capped).toBe(true);
    expect(sequence.frames.at(-1)?.removed).toEqual([]);
  });
  it('finishes after exactly three empty vault pulses', () => {
    let seeds = 0;
    const sequence = vaultSequence(max => seeds++ < 6 ? 0 : max-1);
    expect(sequence.collected).toBe(3); expect(sequence.frames.map(frame=>frame.remaining)).toEqual([3,2,1,0]);
  });
  it('a full vault stops immediately and never overwrites a locked crystal', () => {
    const sequence = vaultSequence(()=>0);
    expect(sequence.frames).toHaveLength(2); expect(sequence.collected).toBe(15);
    sequence.frames[0].cells.forEach((cell,index)=>{if(cell)expect(sequence.frames[1].cells[index]).toBe(cell);});
  });
  it('validates 400 complete sequences, including resets, termination and cluster accounting', () => {
    for (let seed=1;seed<=200;seed++) {
      const vault=vaultSequence(storyboardRandom(seed));
      expect(vault.frames.length).toBeLessThanOrEqual(40);
      for(let n=1;n<vault.frames.length;n++) {
        const before=vault.frames[n-1], after=vault.frames[n];
        before.cells.forEach((value,index)=>{if(value)expect(after.cells[index]).toBe(value);});
        expect(after.added).toEqual(after.cells.flatMap((value,index)=>value&&!before.cells[index]?[index]:[]));
        expect(after.remaining).toBe(after.added.length?3:before.remaining-1);
      }
      expect(vault.collected===15||vault.frames.at(-1)!.remaining===0).toBe(true);
      const cascade=cascadeSequence(storyboardRandom(seed));
      expect(cascade.frames.length).toBeLessThanOrEqual(7);
      expect(cascade.cleared).toBe(cascade.frames.reduce((sum,frame)=>sum+frame.removed.length,0));
      cascade.frames.slice(0,-1).forEach(frame=>expect(frame.clusters).toEqual(findClusters(frame.grid)));
      for(let n=0;n<cascade.frames.length-1;n++) for(let c=0;c<6;c++) {
        const before=cascade.frames[n], after=cascade.frames[n+1];
        const survivors=before.grid.map(row=>row[c]).filter((_,r)=>!before.removed.includes(r*6+c));
        if(survivors.length)expect(after.grid.map(row=>row[c]).slice(-survivors.length)).toEqual(survivors);
      }
    }
  });
  it.each(['aurora-vault','ember-relics'] as const)('marks %s practice and exposes no stake or award', game=>{
    const result=featurePractice(game,'test',storyboardRandom(9));
    expect(result.mode).toBe('PRACTICE'); expect(result.creditsChanged).toBe(false); expect(result.ruleVersion).toBe('practice-v1');
    expect(result).not.toHaveProperty('award'); expect(result).not.toHaveProperty('stake');
  });
});
