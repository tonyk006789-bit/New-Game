import type { CascadeFrame } from '@new-game/game-math';

// Presentation only. Timelines never inspect an award or choose an outcome.
const clamp = (value: number) => Math.max(0, Math.min(1, value));
export function reelTravel(progress: number): number {
  const t = clamp(progress), acceleration = .14, braking = .43, stop = .93;
  const area = acceleration / 2 + braking - acceleration + (stop - braking) / 2;
  if (t < acceleration) {
    const u = t / acceleration;
    return acceleration * (u ** 3 - .5 * u ** 4) / area;
  }
  if (t < braking) return (acceleration / 2 + t - acceleration) / area;
  if (t < stop) {
    const u = (t - braking) / (stop - braking);
    return (acceleration / 2 + braking - acceleration + (stop - braking) * (u - u ** 3 + .5 * u ** 4)) / area;
  }
  return 1;
}
export function reelMotion(column: number, travelCells: number, totalCells: number, fast: boolean) {
  const speed = fast ? 1.85 : 1;
  const keyframes = Array.from({ length: 81 }, (_, index) => {
    const offset = index / 80, settle = clamp((offset - .93) / .07);
    const spring = offset > .93 ? .12 * Math.sin(settle * Math.PI) * (1 - settle) : 0;
    return { offset, transform: `translateY(${-100 * (travelCells * reelTravel(offset) + spring) / totalCells}%)` };
  });
  return { keyframes, duration: (2050 + column * 190) / speed, delay: column * 35 / speed };
}

export type CascadeTile = { id: string; symbol: string; row: number; column: number; drop: number };
export function cascadeMotion(frames: readonly CascadeFrame[]): CascadeTile[][] {
  return frames.reduce<CascadeTile[][]>((plans, frame, index) => {
    const height = frame.grid.length, width = frame.grid[0].length;
    const previous = plans[index - 1], removed = new Set(frames[index - 1]?.removed);
    const columns = Array.from({ length: width }, (_, column) => {
      const survivors = previous?.filter(tile => tile.column === column && !removed.has(tile.row * width + column)) || [];
      const added = height - survivors.length;
      return frame.grid.map((row, r) => {
        const survivor = r >= added ? survivors[r - added] : undefined;
        return { id: survivor?.id || `${index}:${r}:${column}`, symbol: row[column], row: r, column,
          drop: survivor ? r - survivor.row : added };
      });
    });
    plans.push(frame.grid.flatMap((row, r) => row.map((_, c) => columns[c][r])));
    return plans;
  }, []);
}
export const featureTiming = { fall: 900, highlight: 650, clear: 320, vault: 1150, speed: 2.2 } as const;
export function kenoDelay(index: number, count: number, fast: boolean): number {
  const remaining = count - index;
  const duration = index === 0 ? 360 : remaining <= 3 ? 300 + (4 - remaining) * 65 : 225;
  return duration / (fast ? 2 : 1);
}

// Exponential damping has the same response at 30, 60 or 120 Hz.
export function dampAngle(current: number, target: number, seconds: number): number {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * (1 - Math.exp(-24 * Math.max(0, seconds)));
}
export function recoilOffset(remaining: number): number {
  return 10 * clamp(remaining / .24) ** 3;
}
export function effectProgress(age: number, life: number): number {
  return 1 - (1 - clamp(age / life)) ** 3;
}
