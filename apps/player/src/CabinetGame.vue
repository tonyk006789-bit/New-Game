<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { cabinetGames, cabinetPractice, storyboardRandom, type CabinetGameId, type CabinetResult } from '@new-game/game-math';
import { catalog } from '@new-game/contracts';
import ReelStage from './ReelStage.vue';
import ArcadeSymbol from './ArcadeSymbol.vue';
import { api } from './api';
import BetControls from './BetControls.vue';
import {stage} from './staging-state';

const staked=computed(()=>stage.enabled&&props.authenticated);
const props = defineProps<{ game: CabinetGameId; running: boolean; reducedMotion: boolean; authenticated: boolean; balance: string }>();
const profile = cabinetGames[props.game], game = catalog.find(item => item.id === props.game)!;
const coinGame = props.game === 'coin-carnival';
const initialGrid = Array.from({length:3}, (_, r) => Array.from({length:profile.columns}, (_, c) => profile.symbols[(r + c) % profile.symbols.length]));
const reels = ref<InstanceType<typeof ReelStage>>();
const result = ref<CabinetResult | null>(null), frame = ref(0), active = ref(false), saving = ref(false), loading = ref(props.authenticated);
const fast = ref(false), showLines = ref(false), phase = ref('ready');
const notice = ref(coinGame ? 'Middle-row coins lock their reel. Collect all five!' : 'Line up the symbols. Light up the cabinet!');
const pendingKey = ref<string | null>(null);
const locked = computed(() => result.value?.frames[frame.value]?.locked || []);
const remaining = computed(() => result.value?.frames[frame.value]?.remaining ?? 3);
const highlighted = computed(() => phase.value === 'complete' ? result.value?.matches.flatMap(match => match.rows.slice(0, match.count).map((row,col) => row * profile.columns + col)) || [] : []);
const visibleLines = computed(() => showLines.value ? profile.lines.map((rows,line) => ({rows, line:line+1,count:profile.columns})) : phase.value === 'complete' ? result.value?.matches || [] : []);
const lineColors = ['#ff2d69','#00a8ff','#5ecf26','#c957ff','#ff9517','#06c9aa','#ed48bf','#417eff','#edbd16'];
let generation = 0, disposed = false, demo = 0, timer: ReturnType<typeof setTimeout> | undefined, release: (() => void) | undefined;
function cancelDelay() { clearTimeout(timer); release?.(); release = undefined; }
function delay(ms: number) { return new Promise<void>(resolve => { release = resolve; timer = setTimeout(() => { release = undefined; resolve(); }, ms); }); }
function finish() {
  generation++; cancelDelay();
  if (!result.value) return;
  frame.value = result.value.frames.length - 1;
  reels.value?.settle(result.value.frames[frame.value].grid);
  active.value = false; phase.value = 'complete';
  notice.value = `${result.value.description} ${staked.value ? '' : 'No credits changed.'}`;
}
async function play() {
  if (!props.running || active.value || saving.value || loading.value) return;
  saving.value = true; phase.value = 'preparing'; showLines.value = false;
  notice.value = props.authenticated ? 'Saving your round…' : 'Starting a free preview…';
  try {
    let accepted: CabinetResult;
    if (props.authenticated) {
      pendingKey.value ||= crypto.randomUUID();
      accepted = await api<CabinetResult>(`practice/${props.game}/rounds`, {requestKey:pendingKey.value});
      pendingKey.value = null;
    } else accepted = cabinetPractice(props.game, `storyboard-${++demo}`, storyboardRandom(71 + demo));
    if (disposed) return;
    result.value = accepted; active.value = true; frame.value = -1; saving.value = false;
    if (!props.running || props.reducedMotion) { finish(); return; }
    const token = ++generation;
    for (let index = 0; index < accepted.frames.length; index++) {
      if (disposed || generation !== token) return;
      phase.value = 'spinning';
      notice.value = index === 0 ? 'Reels rolling…' : `Respin ${index} of 3 · ${accepted.frames[index - 1].locked.length} reels held`;
      await reels.value?.play(accepted.frames[index].grid, [], fast.value, index ? accepted.frames[index - 1].locked : []);
      if (disposed || generation !== token) return;
      frame.value = index; phase.value = 'landed';
      if (index < accepted.frames.length - 1) await delay(fast.value ? 250 : 650);
    }
    if (!disposed && generation === token) finish();
  } catch (error) {
    if (!disposed) { active.value = false; phase.value = 'error'; notice.value = `${(error as Error).message} Retry to recover this round.`; }
  } finally { saving.value = false; }
}
watch(() => props.running, running => { if (!running && active.value) finish(); });
watch(() => props.reducedMotion, reduced => { if (reduced && active.value) finish(); });
onMounted(async () => {
  if (!props.authenticated) return;
  try {
    const history = await api<{result: CabinetResult}[]>('practice/history');
    if (disposed) return;
    const saved = history.find(item => item.result.game === props.game && item.result.frames?.every(frame => frame.grid.every(row => row.length === profile.columns)))?.result;
    if (saved) { result.value = saved; await nextTick(); if (disposed) return; finish(); notice.value = `Last saved round: ${saved.description}`; }
  } catch { notice.value = 'History unavailable. Your next spin will check the connection.'; }
  finally { loading.value = false; }
});
onBeforeUnmount(() => { disposed = true; generation++; cancelDelay(); });
</script>

<template>
  <section class="slot-cabinet" :class="[game.id, {'cabinet-active':active, 'stage-paused':!running}]" :data-phase="phase" :style="{'--game-color':game.color}">
    <div class="cabinet-bulbs" aria-hidden="true"><i v-for="n in 36" :key="n" :style="{'--lamp': n}"></i></div>
    <header class="slot-marquee"><span class="marquee-wing">✦ ✦ ✦</span><div><small>NEW GAME ORIGINAL</small><h2>{{ game.name }}</h2><p>{{ game.detail }}</p></div><span class="marquee-wing">✦ ✦ ✦</span></header>
    <div class="cabinet-game-body">
      <aside class="cabinet-side left"><ArcadeSymbol :symbol="coinGame ? 'coin' : game.id === 'jade-fortune' ? 'dragon' : 'seven'" /><b>{{ coinGame ? 'COIN COLLECTOR' : game.id === 'jade-fortune' ? 'DRAGON WILD' : 'CLASSIC SEVENS' }}</b><p>{{ coinGame ? 'Coins in the center lock the entire reel.' : game.id === 'jade-fortune' ? 'Dragons stand in for any symbol.' : 'Match 3, 4 or 5 from the left.' }}</p><div class="cabinet-readout"><small>{{ coinGame ? 'REELS LOCKED' : 'MATCHING LINES' }}</small><strong>{{ coinGame ? locked.length : phase === 'complete' ? result?.matches.length || 0 : '—' }}<em v-if="coinGame"> / 5</em></strong></div></aside>
      <div class="slot-reel-surround">
        <div class="reel-banner"><span>{{ coinGame ? 'LOCK A COIN • HOLD THE REEL' : `${profile.lines.length} LINES • LEFT TO RIGHT` }}</span><span>{{ coinGame ? `${remaining} RESPINS LEFT` : (staked ? 'PLAY' : 'FREE PRACTICE') }}</span></div>
        <div class="reel-playfield">
          <ReelStage ref="reels" :initial-grid="initialGrid" :strip-symbols="profile.symbols" :reduced-motion="reducedMotion" :highlighted="highlighted" :locked="coinGame ? locked : []" />
          <svg v-if="!coinGame" class="payline-overlay" :viewBox="`0 0 ${profile.columns * 100} 300`" preserveAspectRatio="none" aria-hidden="true"><polyline v-for="line in visibleLines" :key="line.line" :points="line.rows.slice(0,line.count).map((row,col) => `${col*100+50},${row*100+50}`).join(' ')" :stroke="lineColors[(line.line-1)%lineColors.length]" fill="none" stroke-width="5" stroke-linejoin="round" stroke-linecap="round" /><text v-for="line in visibleLines" :key="`label-${line.line}`" x="10" :y="line.rows[0]*100+43" :fill="lineColors[(line.line-1)%lineColors.length]" stroke="#fff9dc" stroke-width=".7" font-size="18" font-weight="900">{{line.line}}</text></svg>
        </div>
        <div class="reel-tray"><span v-if="coinGame" class="coin-lamps"><i v-for="n in profile.columns" :key="n" :class="{lit:locked.includes(n-1)}">{{ locked.includes(n-1) ? '★ LOCKED' : '☆ REEL ' + n }}</i></span><span v-else>✦ {{ phase === 'complete' && result?.matches.length ? 'MATCHING LINES LIT' : 'SPIN • MATCH • LIGHT IT UP' }} ✦</span></div>
      </div>
      <aside class="cabinet-side right"><strong>{{ coinGame ? '3' : profile.lines.length }}</strong><b>{{ coinGame ? 'RESPINS' : 'PLAY LINES' }}</b><div class="symbol-legend"><ArcadeSymbol v-for="symbol in profile.symbols.slice(0,4)" :key="symbol" :symbol="symbol" /></div><p>{{ coinGame ? 'Only unlocked reels move. Three chances to fill the collection.' : game.id === 'jade-fortune' ? 'Match 3 or more from the left. Wilds extend your line.' : 'Straight lines and diagonals. Every match lights up.' }}</p><button v-if="!coinGame" :disabled="active || saving" :aria-pressed="showLines" class="line-map-button" @click="showLines=!showLines">{{ showLines ? 'HIDE LINES' : 'LINE MAP' }}</button></aside>
    </div>
    <div class="cabinet-controls"><BetControls :game="game.id" :ready="running" :authenticated="!!authenticated" :busy="active||saving" /><div class="led-meter"><small>PLAY CREDITS</small><strong>{{balance}}</strong></div><button class="cabinet-speed" :aria-pressed="fast" aria-label="Fast animations" :disabled="active || saving" @click="fast=!fast">⚡<small>{{fast?'FAST':'NORMAL'}}</small></button><div class="cabinet-status"><b>{{ active ? coinGame ? 'COLLECTING' : 'REELS ROLLING' : 'READY TO PLAY' }}</b><small>{{staked ? '' : 'NO STAKE · NO CREDIT AWARD'}}</small></div><button v-if="active" class="cabinet-spin" @click="finish">STOP<small>SHOW RESULT</small></button><button v-else class="cabinet-spin" :disabled="!running || saving || loading" @click="play">{{ loading ? 'WAIT' : saving ? 'WAIT' : pendingKey ? 'RETRY' : 'SPIN' }}<small>{{ loading ? 'LOADING' : saving ? 'SAVING' : (staked ? 'PLAY' : 'FREE PRACTICE') }}</small></button></div>
    <p class="cabinet-notice" role="status">{{notice}}</p>
  </section>
</template>
