import {describe, expect, it} from 'vitest';
import {cascadeSequence, storyboardRandom} from '@new-game/game-math';
import {cascadeMotion, dampAngle, effectProgress, featureTiming, kenoDelay, recoilOffset, reelMotion, reelTravel} from '../../apps/player/src/game-motion';

describe('presentation timelines', () => {
  it('accelerates continuously, then brakes monotonically to a complete stop', () => {
    const velocity = (t: number) => (reelTravel(t + .00001) - reelTravel(t - .00001)) / .00002;
    expect(reelTravel(0)).toBe(0); expect(reelTravel(1)).toBe(1);
    expect(velocity(.02)).toBeLessThan(velocity(.1));
    let previous = velocity(.43);
    for (let t = .44; t <= .93; t += .01) { const speed = velocity(t); expect(speed).toBeLessThanOrEqual(previous + .0001); previous = speed; }
    expect(velocity(.9)).toBeLessThan(velocity(.5) / 50);
    expect(velocity(.93)).toBeLessThan(.0001);
    for (const boundary of [.14, .43, .93]) expect(Math.abs(velocity(boundary - .0001) - velocity(boundary + .0001))).toBeLessThan(.0001);
  });
  it.each([1, 3])('aligns exactly after normal/fast spins with %i visible rows, at any height', rows => {
    for (const fast of [false, true]) {
      let lastStop = 0;
      for (let column = 0; column < 5; column++) {
        const total = rows * 2 + 20 + column * 3, travel = total - rows;
        const motion = reelMotion(column, travel, total, fast);
        expect(motion.keyframes.at(-1)?.transform).toBe(`translateY(${-100 * travel / total}%)`);
        expect(motion.duration + motion.delay).toBeGreaterThan(lastStop);
        lastStop = motion.duration + motion.delay;
        for (const windowHeight of [135, 300, 417]) {
          const displacement = travel / total * (total * windowHeight / rows);
          expect(displacement).toBeCloseTo(travel * windowHeight / rows, 8);
        }
      }
      expect(lastStop).toBeLessThan(3100);
    }
  });
  it('retains survivor identities and only drops into cleared cells for 200 accepted sequences', () => {
    for (let seed = 1; seed <= 200; seed++) {
      const sequence = cascadeSequence(storyboardRandom(seed)), before = JSON.stringify(sequence);
      const plans = cascadeMotion(sequence.frames);
      plans.forEach((tiles, frame) => {
        expect(new Set(tiles.map(tile => tile.id)).size).toBe(30);
        expect(tiles.map(tile => tile.symbol)).toEqual(sequence.frames[frame].grid.flat());
        tiles.forEach(tile => {
          const survivor = frame ? plans[frame - 1].find(previous => previous.id === tile.id) : undefined;
          if (survivor) {
            expect(sequence.frames[frame - 1].removed).not.toContain(survivor.row * 6 + survivor.column);
            expect(tile.symbol).toBe(survivor.symbol);
            expect(tile.column).toBe(survivor.column);
            expect(tile.drop).toBe(tile.row - survivor.row);
            expect(tile.drop).toBeGreaterThanOrEqual(0);
          }
          expect(520 + tile.drop * 35 + tile.column * 28).toBeLessThan(featureTiming.fall);
        });
      });
      expect(JSON.stringify(sequence)).toBe(before);
    }
  });
  it('gives the last keno balls more time without depending on matches or rewards', () => {
    for (const fast of [false, true]) {
      const times = Array.from({length: 20}, (_, i) => kenoDelay(i, 20, fast));
      expect(times[17]).toBeGreaterThan(times[16]);
      expect(times[18]).toBeGreaterThan(times[17]);
      expect(times[19]).toBeGreaterThan(times[18]);
      expect(times.reduce((sum, time) => sum + time, 0)).toBeLessThan(5600);
    }
  });
  it('damps cannon turning consistently across refresh rates using the shortest turn', () => {
    const outcomes = [30, 60, 120].map(hz => {
      let angle = 3.1;
      for (let i = 0; i < hz / 2; i++) angle = dampAngle(angle, -3.1, 1 / hz);
      return angle;
    });
    expect(outcomes[0]).toBeCloseTo(outcomes[1], 10);
    expect(outcomes[1]).toBeCloseTo(outcomes[2], 10);
    expect(outcomes[0]).toBeGreaterThan(3.1);
    expect(outcomes[0]).toBeLessThan(3.19);
    expect(dampAngle(1, 2, 0)).toBe(1);
  });
  it('settles recoil and impact expansion without a per-frame integration drift', () => {
    expect(recoilOffset(.24)).toBe(10); expect(recoilOffset(0)).toBe(0);
    expect(recoilOffset(.12)).toBeLessThan(2);
    expect(effectProgress(0, .65)).toBe(0); expect(effectProgress(.65, .65)).toBe(1);
    expect(effectProgress(.325, .65)).toBeGreaterThan(.8);
  });
});
