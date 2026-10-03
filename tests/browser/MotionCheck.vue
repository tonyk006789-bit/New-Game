<script setup lang="ts">
import {nextTick, onBeforeUnmount, ref} from 'vue';
import ReelStage from '../../apps/player/src/ReelStage.vue';
const reels = ref<InstanceType<typeof ReelStage>>(), root = ref<HTMLElement>();
const reduced = ref(false), width = ref(640), height = ref(300), busy = ref(false), current = ref('Ready');
const reports = ref<object[]>([]);
let frame = 0, timer: ReturnType<typeof setTimeout> | undefined, disposed = false;
async function run() {
  busy.value = true; reports.value = [];
  for (const scenario of [
    {name:'three-reel normal', rows:3, columns:3},
    {name:'five-reel normal', rows:3, columns:5},
    {name:'single-row fast', rows:1, columns:5, fast:true},
    {name:'held columns', rows:3, columns:5, held:[1,3]},
    {name:'resize during braking', rows:3, columns:5, interrupt:'resize'},
    {name:'skip in flight', rows:3, columns:5, interrupt:'skip'},
    {name:'reduced during flight', rows:3, columns:5, interrupt:'reduced'},
    {name:'reduced initially', rows:3, columns:5, reduced:true}
  ]) {
    if (disposed) break;
    current.value = scenario.name; reduced.value = !!scenario.reduced; width.value = 640; height.value = 300;
    const symbols = ['cherry','bell','bar','gem','seven'];
    const target = Array.from({length:scenario.rows}, (_, r) => Array.from({length:scenario.columns}, (_, c) => symbols[(r+c)%5]));
    const previous = target.map(row => row.map((symbol, c) => scenario.held?.includes(c) ? symbol : 'bell'));
    reels.value!.settle(previous); await nextTick();
    const started = performance.now(), stops = new Map<number,number>(), intervals: number[] = [];
    let previousTime = started, heldMovement = 0;
    const observe = (now: number) => {
      intervals.push(now - previousTime); previousTime = now;
      root.value?.querySelectorAll<HTMLElement>('.reel-window').forEach((window, column) => {
        if (window.classList.contains('reel-landed') && !stops.has(column)) stops.set(column, Math.round(now-started));
        if (scenario.held?.includes(column)) heldMovement = Math.max(heldMovement, Math.abs(new DOMMatrix(getComputedStyle(window.querySelector('.reel-strip')!).transform).m42));
      });
      frame = requestAnimationFrame(observe);
    };
    const playing = reels.value!.play(target, [], scenario.fast, scenario.held);
    frame = requestAnimationFrame(observe);
    if (scenario.interrupt) timer = setTimeout(() => {
      if (scenario.interrupt === 'resize') { width.value=370; height.value=225; }
      else if (scenario.interrupt === 'skip') reels.value!.settle();
      else reduced.value = true;
    }, scenario.interrupt === 'resize' ? 1600 : 500);
    await playing; clearTimeout(timer); cancelAnimationFrame(frame); await nextTick();
    const windows = Array.from(root.value!.querySelectorAll<HTMLElement>('.reel-window'));
    const exact = windows.every((window, c) => Array.from(window.querySelectorAll<HTMLElement>('[data-symbol]')).every((el,r)=>el.dataset.symbol===target[r][c])) && windows.length===scenario.columns;
    const alignment = windows.every(window => Math.abs(window.querySelector('.reel-strip')!.getBoundingClientRect().top-window.getBoundingClientRect().top)<1);
    const noAnimations = windows.every(window => window.querySelector('.reel-strip')!.getAnimations().length === 0);
    const sorted = [...intervals].sort((a,b)=>a-b);
    reports.value.push({scenario:scenario.name,pass:exact&&alignment&&noAnimations&&heldMovement===0,exact,alignment,noAnimations,heldMovement,elapsed:Math.round(performance.now()-started),stops:Object.fromEntries(stops),frames:intervals.length,p95FrameMs:Math.round(sorted[Math.floor(sorted.length*.95)]||0)});
  }
  current.value = 'Complete'; busy.value = false;
}
onBeforeUnmount(()=>{disposed=true;clearTimeout(timer);cancelAnimationFrame(frame);});
</script>
<template><main style="padding:20px"><h1>Local motion acceptance</h1><p>No account, API, stake or credit changes.</p><button :disabled="busy" @click="run">Run motion checks</button><p role="status">{{current}}</p><div ref="root" :style="{width:`${width}px`,maxWidth:'100%'}"><ReelStage ref="reels" :reduced-motion="reduced" :style="{height:`${height}px`,width:'100%'}" /></div><pre data-testid="motion-report" style="white-space:pre-wrap">{{JSON.stringify(reports,null,2)}}</pre></main></template>
