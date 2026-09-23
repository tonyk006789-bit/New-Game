<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref } from 'vue';
import ArcadeSymbol from './ArcadeSymbol.vue';
import { previewGrid, symbols } from '@new-game/game-math';
const props = defineProps<{ reducedMotion: boolean; initialGrid?: string[][]; stripSymbols?: readonly string[]; highlighted?: number[]; locked?: number[] }>();
const root = ref<HTMLElement>();
const initial = props.initialGrid || previewGrid(0);
const columns = ref(Array.from({ length: initial[0].length }, (_, column) => initial.map(row => row[column] as string)));
const rolling = ref(false), landed = ref<number[]>([]), lines = ref<{ row: number; count: number }[]>([]);
let animations: Animation[] = [], generation = 0, target = initial as string[][];
function settle(grid = target, matches: { row: number; count: number }[] = []) {
  generation++; animations.forEach(animation => animation.cancel()); animations = [];
  target = grid; columns.value = Array.from({ length: grid[0].length }, (_, column) => grid.map(row => row[column]));
  rolling.value = false; lines.value = matches; landed.value = props.reducedMotion ? [] : columns.value.map((_,index)=>index);
}
async function play(grid: string[][], matches: { row: number; count: number }[], fast = false, held: number[] = []) {
  settle(); target = grid;
  if (props.reducedMotion) { settle(grid, matches); return; }
  const token = generation; rolling.value = true; lines.value = []; landed.value = [];
  const stripSymbols = props.stripSymbols || symbols;
  columns.value = columns.value.map((column, index) => held.includes(index) ? grid.map(row => row[index]) : [...column, ...Array.from({ length: 20 + index * 3 }, (_, n) => stripSymbols[(n * 2 + index) % stripSymbols.length]), ...grid.map(row => row[index])]);
  await nextTick();
  if (token !== generation || !root.value) return;
  const strips = root.value.querySelectorAll<HTMLElement>('.reel-strip');
  await Promise.all(Array.from(strips, async (strip, index) => {
    if (held.includes(index)) return;
    const distance = (columns.value[index].length - 3) * strip.parentElement!.clientHeight / 3;
    const animation = strip.animate([
      { transform: 'translateY(0)', filter: 'blur(0px)', offset: 0, easing: 'ease-out' },
      { transform: 'translateY(9px)', filter: 'blur(0px)', offset: .045, easing: 'ease-in' },
      { transform: `translateY(${-distance * .08}px)`, filter: 'blur(2px)', offset: .17, easing: 'linear' },
      { transform: `translateY(${-distance * .89}px)`, filter: 'blur(2px)', offset: .77, easing: 'cubic-bezier(.12,.5,.3,1)' },
      { transform: `translateY(${-distance - 8}px)`, filter: 'blur(0px)', offset: .96, easing: 'ease-out' },
      { transform: `translateY(${-distance}px)`, filter: 'blur(0px)', offset: 1 }
    ], { duration: (1100 + index * 170) / (fast ? 1.8 : 1), delay:index*35/(fast?1.8:1), easing:'linear', fill: 'both' });
    animations.push(animation);
    try { await animation.finished; if (token === generation) landed.value.push(index); } catch { /* Paused, resized or unmounted. */ }
  }));
  if (token === generation) settle(grid, matches);
}
defineExpose({ play, settle });
onBeforeUnmount(() => settle());
</script>
<template><div ref="root" class="reel-frame kinetic-reels" :style="{gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`}" :class="{ 'reels-rolling': rolling }" role="img" :aria-label="`${columns.length} reel three row result`"><div v-for="(column, c) in columns" :key="c" class="reel-window" :class="{ 'reel-landed': landed.includes(c), 'reel-locked': locked?.includes(c) }"><div class="reel-strip"><div v-for="(symbol, r) in column" :key="r" class="symbol reel-symbol" :data-symbol="symbol" :class="[symbol, { 'matching-symbol': !rolling && (lines.some(line => line.row === r && c < line.count) || highlighted?.includes(r * columns.length + c)) }]"><ArcadeSymbol :symbol="symbol" /></div></div><span v-if="locked?.includes(c)" class="reel-lock-label">LOCKED</span></div><div class="reel-glass" aria-hidden="true"></div></div></template>
