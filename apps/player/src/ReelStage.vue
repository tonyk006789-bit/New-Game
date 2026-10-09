<script setup lang="ts">
import { nextTick, onBeforeUnmount, ref, watch } from 'vue';
import ArcadeSymbol from './ArcadeSymbol.vue';
import {playSound} from './audio';
import { previewGrid, symbols } from '@new-game/game-math';
import { reelMotion } from './game-motion';
const props = defineProps<{ reducedMotion: boolean; initialGrid?: string[][]; stripSymbols?: readonly string[]; highlighted?: number[]; locked?: number[]; theme?:string }>();
const root = ref<HTMLElement>();
const initial = props.initialGrid || previewGrid(0);
const rows=ref(initial.length);
const columns = ref(Array.from({ length: initial[0].length }, (_, column) => initial.map(row => row[column] as string)));
const rolling = ref(false), landed = ref<number[]>([]), lines = ref<{ row: number; count: number }[]>([]);
let animations: Animation[] = [], generation = 0, target = initial as string[][];
function settle(grid = target, matches: { row: number; count: number }[] = []) {
  generation++; animations.forEach(animation => animation.cancel()); animations = [];
  target = grid;rows.value=grid.length; columns.value = Array.from({ length: grid[0].length }, (_, column) => grid.map(row => row[column]));
  rolling.value = false; lines.value = matches; landed.value = props.reducedMotion ? [] : columns.value.map((_,index)=>index);
}
async function play(grid: string[][], matches: { row: number; count: number }[], fast = false, held: number[] = []) {
  settle(); target = grid;
  if (props.reducedMotion) { settle(grid, matches); return; }
  const token = generation; rolling.value = true; lines.value = []; landed.value = [];
  playSound('reel-start');
  const stripSymbols = props.stripSymbols || symbols;
  const previousColumns = columns.value;
  rows.value = grid.length;
  columns.value = Array.from({ length: grid[0].length }, (_, index) => {
    const column = previousColumns[index] || grid.map(row => row[index]);
    return held.includes(index) ? grid.map(row => row[index]) : [...column, ...Array.from({ length: 10 + index * 2 }, (_, n) => stripSymbols[(n * 2 + index) % stripSymbols.length]), ...grid.map(row => row[index])];
  });
  await nextTick();
  if (token !== generation || !root.value) return;
  const strips = root.value.querySelectorAll<HTMLElement>('.reel-strip');
  await Promise.all(Array.from(strips, async (strip, index) => {
    if (held.includes(index)) return;
    // Percent transforms track the strip's live height, including an orientation change.
    const motion = reelMotion(index, columns.value[index].length - rows.value, columns.value[index].length, fast);
    const animation = strip.animate(motion.keyframes, { duration: motion.duration, delay: motion.delay, easing: 'linear', fill: 'both' });
    animations.push(animation);
    try { await animation.finished; if (token === generation) {landed.value.push(index);playSound('reel-stop');} } catch { /* Paused, resized or unmounted. */ }
  }));
  if (token === generation) settle(grid, matches);
}
defineExpose({ play, settle });
watch(() => props.reducedMotion, value => { if (value && rolling.value) settle(); });
onBeforeUnmount(() => settle());
</script>
<template><div ref="root" class="reel-frame kinetic-reels" :style="{gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))`, '--visible-rows':rows}" :class="{ 'reels-rolling': rolling }" role="img" :aria-label="`${columns.length} reel ${rows} row result`"><div v-for="(column, c) in columns" :key="c" class="reel-window" :class="{ 'reel-landed': landed.includes(c), 'reel-locked': locked?.includes(c) }"><div class="reel-strip"><div v-for="(symbol, r) in column" :key="r" class="symbol reel-symbol" :data-symbol="symbol" :class="[symbol, { 'matching-symbol': !rolling && (lines.some(line => line.row === r && c < line.count) || highlighted?.includes(r * columns.length + c)) }]"><ArcadeSymbol :symbol="symbol" :theme="theme" /></div></div><span v-if="locked?.includes(c)" class="reel-lock-label">LOCKED</span></div><div class="reel-glass" aria-hidden="true"></div></div></template>
