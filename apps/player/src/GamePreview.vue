<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import {catalog} from '@new-game/contracts';
import Icon from '@new-game/ui/Icon.vue';
import ReelStage from './ReelStage.vue';
import WinAward from './WinAward.vue';
import { previewGrid, isKenoGame } from '@new-game/game-math';
import { api } from './api';
import BetControls from './BetControls.vue';
import {stage} from './staging-state';
import {creditPresentation} from './credit-presentation';
import {kenoDelay} from './game-motion';
import {playSound} from './audio';
const staked=computed(()=>stage.enabled&&props.authenticated);
const props = defineProps<{ game: string; running: boolean; reducedMotion: boolean; authenticated?: boolean; balance?: string }>();
type PracticeResult = { id: string; game: string; grid?: string[][]; drawn?: number[]; picks?: number[]; description: string; lines?: { row: number; count: number }[] };
const result = ref<PracticeResult | null>(null), pendingKey = ref<string | null>(null);
const requestBusy = ref(false), loading = ref(!!props.authenticated), selected = ref<number[]>([]), drawn = ref<number[]>([]);
const animating = ref(false), fast = ref(false), notice = ref(staked.value?'Select a stake and play.':'A visual preview. No stake or credit award.');
const reels = ref<InstanceType<typeof ReelStage>>();
const recentBalls = computed(() => drawn.value.slice(-7));
const matched = computed(() => selected.value.filter(n => drawn.value.includes(n)).length);
let timer: ReturnType<typeof setTimeout> | undefined, disposed = false, frame = 0, generation = 0;
const sampleDraw = [7, 24, 51, 13, 36, 68, 42, 2, 75, 18, 30, 59, 46, 80, 5, 63, 22, 39, 54, 71];
function stop() { clearTimeout(timer); generation++; animating.value = false; }
function finish(interrupted = false) {
  stop();
  if (props.game === 'temple-lights') reels.value?.settle(result.value?.grid || previewGrid(frame), result.value?.lines || []);
  else drawn.value = [...(result.value?.drawn || sampleDraw)];
  notice.value = `${interrupted ? 'Animation ended. ' : ''}${result.value?.description || (props.game === 'temple-lights' ? 'Preview complete. No stake or payout.' : 'Sample reveal complete. No credits were used or awarded.')}`;
}
function toggleNumber(number: number) {
  if (animating.value || !props.running || pendingKey.value || loading.value) return;
  drawn.value = [];
  if (selected.value.includes(number)) selected.value = selected.value.filter(item => item !== number);
  else if (selected.value.length < 10) selected.value.push(number);
  else notice.value = 'You can choose up to 10 numbers. Tap a selected number to replace it.';
}
function quickPick() { if (pendingKey.value) return; selected.value = [7, 12, 24, 38, 51, 63]; drawn.value = []; notice.value = 'Six example picks selected. Change any number you like.'; }
async function animate() {
  if (creditPresentation.held!==null || !props.running || animating.value || requestBusy.value || loading.value) return;
  if (props.authenticated) {
    requestBusy.value = true; pendingKey.value ||= crypto.randomUUID();
    try { const saved = await api<PracticeResult>(`practice/${props.game}/rounds`, { requestKey: pendingKey.value, ...(isKenoGame(props.game) ? { picks: [...selected.value] } : {}) }); if (disposed) return; result.value = saved; pendingKey.value = null; }
    catch (error) { if (!disposed) notice.value = (error as Error).message; return; }
    finally { requestBusy.value = false; }
  }
  if (disposed) return;
  frame++; stop(); animating.value = true; const token = generation;
  if (!props.running || props.reducedMotion) { finish(); return; }
  if (props.game === 'temple-lights') {
    notice.value = 'Reels in motion…';
    await reels.value?.play(result.value?.grid || previewGrid(frame), result.value?.lines || [], fast.value);
    if (!disposed && token === generation) finish();
  } else {
    drawn.value = []; const numbers = result.value?.drawn || sampleDraw; let step = 0;
    const reveal = () => {
      timer = setTimeout(() => {
        if (disposed || token !== generation) return;
        drawn.value.push(numbers[step++]); playSound('click');
        notice.value = `${step} of ${numbers.length} drawn · ${matched.value} matched`;
        if (step < numbers.length) reveal();
        else timer = setTimeout(() => { if (!disposed && token === generation) finish(); }, fast.value ? 250 : 500);
      }, kenoDelay(step, numbers.length, fast.value));
    };
    reveal();
  }
}
watch(() => props.running, value => { if (!value && animating.value) finish(true); });
watch(() => props.reducedMotion, value => { if (value && animating.value) finish(true); });
onBeforeUnmount(() => { disposed = true; stop(); });
onMounted(async () => {
  if (!props.authenticated) return;
  notice.value = staked.value?'Select a stake. Results and credits are saved.':'Free practice. Your credits stay unchanged.';
  try {
    const rounds = await api<{ result: PracticeResult }[]>('practice/history');
    if (disposed) return;
    result.value = rounds.find(round => round.result.game === props.game)?.result || null;
    if (result.value) {
      selected.value = result.value.picks || []; drawn.value = result.value.drawn || [];
      await nextTick(); if (disposed) return;
      if (result.value.grid) reels.value?.settle(result.value.grid, result.value.lines || []);
      notice.value = `Last saved round: ${result.value.description}`;
    }
  } catch { /* Next request surfaces connection errors. */ }
  finally { loading.value = false; }
});
</script>
<template>
  <section class="game-preview" :class="[game,game === 'temple-lights' ? 'temple-game' : 'keno-game']" :style="{'--motion-rate':fast ? .5 : 1}">
    <div class="preview-hud"><span class="eyebrow">{{ game === 'temple-lights' ? 'Moonlit sanctuary' : 'Pick your possibilities' }}</span><span class="pill">{{ authenticated ? (staked ? 'PLAY' : 'FREE PRACTICE') : 'PREVIEW ONLY' }}</span></div>
    <template v-if="game === 'temple-lights'"><div class="temple-scene-title"><span>✧</span> TEMPLE LIGHTS <span>✧</span></div><ReelStage ref="reels" :reduced-motion="reducedMotion" /></template>
    <template v-else><div class="keno-intro"><h2>{{catalog.find(g=>g.id===game)?.name}}</h2><span>{{ selected.length }} / 10 selected · {{ matched }} matched</span></div><div class="keno-layout"><aside class="keno-wood-sign"><strong>{{game==='neon-numbers'?'NEON CIRCUIT':game==='pearl-keno'?'PEARL GARDEN':'ORCHARD HARVEST'}}</strong><span class="orchard-apples">{{game==='neon-numbers'?'✦':game==='pearl-keno'?'◉':'🍎'}}</span><small>Pick 4–10 numbers.<br>Watch twenty reveal.</small><strong class="harvest-count">{{ matched }}</strong><small>NUMBERS MATCHED</small></aside><div class="keno-board" aria-label="Keno number selection"><button v-for="number in 80" :key="number" :aria-label="`Number ${number}`" :aria-pressed="selected.includes(number)" :disabled="loading || !!pendingKey || requestBusy || animating || !running" :class="{ chosen: selected.includes(number), drawn: drawn.includes(number), matched: selected.includes(number) && drawn.includes(number), 'just-drawn': drawn.at(-1) === number }" @click="toggleNumber(number)">{{ number }}</button></div></div><div class="draw-track" aria-label="Most recent drawn numbers"><span>DRAW {{ drawn.length }} / 20</span><TransitionGroup name="draw-ball"><b v-for="number in recentBalls" :key="number" :class="{ hit: selected.includes(number) }">{{ number }}</b></TransitionGroup></div><div class="keno-tools"><span>Choose 4–10 numbers</span><button class="secondary" :disabled="loading || !!pendingKey || requestBusy || animating || !running" @click="quickPick">Quick pick</button><button class="secondary" :disabled="loading || !!pendingKey || requestBusy || animating || !running" @click="selected = []; drawn = []">Clear</button></div></template>
    <div class="preview-controls"><BetControls :reduced-motion="reducedMotion" :game="game" :ready="running" :authenticated="!!authenticated" :busy="animating||requestBusy" /><div><small>Available credits</small><strong>{{ balance || '0.00' }}</strong></div><button class="speed-control" :aria-pressed="fast" :disabled="animating || requestBusy" aria-label="Fast animations" @click="fast = !fast">{{ fast ? 'FAST' : 'NORMAL' }}</button><button v-if="animating" class="primary" @click="finish()">Show result</button><button v-else class="primary" :disabled="creditPresentation.held!==null || loading || requestBusy || !running || (game !== 'temple-lights' && selected.length < 4)" @click="animate"><Icon :name="requestBusy ? 'clock' : 'gem'" :size="18" />{{ loading ? 'Loading…' : requestBusy ? 'Saving…' : game === 'temple-lights' ? (authenticated ? (staked ? 'Spin' : 'Spin practice') : 'Preview reels') : (authenticated ? (staked ? 'Draw' : 'Draw practice') : 'Preview reveal') }}</button><div class="practice-only-meter"><small>Stake / Award</small><strong>{{staked ? (Number(stage.stake)/100).toFixed(2) : "—"}} / {{staked && stage.last?.game===game ? (Number(stage.last.award)/100).toFixed(2) : "—"}}</strong></div></div><p class="preview-notice" aria-live="polite">{{ notice }}</p>
    <WinAward v-if="staked&&!animating&&!requestBusy&&result&&stage.last?.id===result.id" :award="stage.last.award" :stake="stage.last.stake"/>
  </section>
</template>
