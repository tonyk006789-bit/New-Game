<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { featurePractice, storyboardRandom, type FeatureResult, type VaultFrame, type CascadeFrame } from '@new-game/game-math';
import ArcadeSymbol from './ArcadeSymbol.vue';
import Icon from '@new-game/ui/Icon.vue';
import { api } from './api';
import BetControls from './BetControls.vue';
import {stage} from './staging-state';
import {creditPresentation} from './credit-presentation';
const staked=computed(()=>stage.enabled&&props.authenticated);
const props = defineProps<{ game: 'aurora-vault' | 'ember-relics'; running: boolean; reducedMotion: boolean; authenticated: boolean; balance: string }>();
const isVault = computed(() => props.game === 'aurora-vault');
const initial = featurePractice(props.game, 'storyboard', storyboardRandom(isVault.value ? 23 : 14));
const result = ref<FeatureResult | null>(null);
const frame = ref(0), active = ref(false), saving = ref(false), loading = ref(!!props.authenticated), fast = ref(false);
const phase = ref('ready');
const notice = ref(staked.value?'Choose a stake. Start a sequence.':'No stake or award. Start a free sequence.');
const pendingKey = ref<string | null>(null);
let timer: ReturnType<typeof setTimeout> | undefined, disposed = false, generation = 0, demo = 0;
const sequence = computed(() => (result.value || initial).sequence);
const vault = computed(() => sequence.value.frames[frame.value] as VaultFrame);
const cascade = computed(() => sequence.value.frames[frame.value] as CascadeFrame);
const locked = computed(() => isVault.value ? vault.value.cells.filter(Boolean).length : 0);
const cleared = computed(() => !isVault.value ? sequence.value.frames.slice(0, frame.value).reduce((sum, item) => sum + (item as CascadeFrame).removed.length, 0) : 0);
const crystalNames = ['sapphire', 'amethyst', 'emerald', 'amber'];
function finish(interrupted = false) {
  clearTimeout(timer); generation++; active.value = false; phase.value = 'complete';
  if (result.value) frame.value = result.value.sequence.frames.length - 1;
  notice.value = `${interrupted ? 'Animation ended. ' : ''}${result.value?.description || 'Ready.'} ${staked.value ? '' : 'No credits changed.'}`;
}
function later(callback: () => void, delay: number, token: number) {
  clearTimeout(timer); timer = setTimeout(() => { if (!disposed && token === generation) callback(); }, fast.value ? delay / 2.2 : delay);
}
function reveal(token: number) {
  if (disposed || token !== generation) return;
  if (!props.running || props.reducedMotion) { finish(true); return; }
  if (isVault.value) {
    phase.value = 'pulse';
    notice.value = frame.value === 0 ? 'Three crystals open the vault.' : vault.value.added.length ? `${vault.value.added.length} new crystals locked. Pulses recharged.` : `${vault.value.remaining} pulses remaining.`;
    later(() => {
      if (frame.value >= sequence.value.frames.length - 1) { finish(); return; }
      frame.value++; reveal(token);
    }, 850, token);
  } else {
    phase.value = 'fall';
    if (!cascade.value.removed.length) { later(() => finish(), 450, token); return; }
    notice.value = `Cascade ${frame.value + 1} · ${cascade.value.removed.length} connected relics.`;
    later(() => { phase.value = 'highlight'; later(() => { phase.value = 'clear'; later(() => { frame.value++; reveal(token); }, 260, token); }, 500, token); }, 450, token);
  }
}
async function play() {
  if (creditPresentation.held!==null || !props.running || active.value || saving.value || loading.value) return;
  saving.value = true; phase.value = 'preparing'; notice.value = props.authenticated ? 'Preparing your saved sequence…' : 'Preparing storyboard…';
  try {
    let accepted: FeatureResult;
    if (props.authenticated) {
      pendingKey.value ||= crypto.randomUUID();
      accepted = await api<FeatureResult>(`practice/${props.game}/rounds`, { requestKey: pendingKey.value });
      pendingKey.value = null;
    } else accepted = featurePractice(props.game, `storyboard-${++demo}`, storyboardRandom((isVault.value ? 23 : 14) + demo - 1));
    if (disposed) return;
    result.value = accepted; frame.value = 0; active.value = true;
    if (!props.running || props.reducedMotion) finish(true); else reveal(++generation);
  } catch (error) { if (!disposed) { phase.value = result.value ? 'complete' : 'ready'; notice.value = `${(error as Error).message} Retry to recover the same sequence.`; } }
  finally { saving.value = false; }
}
watch(() => props.running, value => { if (!value && active.value) finish(true); });
watch(() => props.reducedMotion, value => { if (value && active.value) finish(true); });
onMounted(async () => {
  if (!props.authenticated) return;
  try {
    const history = await api<{ result: FeatureResult }[]>('practice/history');
    if (disposed) return;
    const saved = history.find(round => round.result.game === props.game)?.result;
    if (saved) { result.value = saved; finish(); notice.value = `Last saved round: ${saved.description}`; }
  } catch { notice.value = 'History unavailable. A new request will check your connection.'; }
  finally { loading.value = false; }
});
onBeforeUnmount(() => { disposed = true; generation++; clearTimeout(timer); });
</script>
<template>
  <section class="feature-stage" :class="[isVault ? 'aurora-stage' : 'ember-stage', `phase-${phase}`, { 'feature-active': active, 'stage-paused': !running }]" :data-phase="phase">
    <div class="stage-vignette"></div><div class="atmosphere" aria-hidden="true"><i v-for="n in 18" :key="n" :style="{ '--i': n }"></i></div>
    <div class="feature-top"><span>NEW GAME ORIGINALS</span><span>{{ authenticated ? (staked ? 'PLAY' : 'FREE PRACTICE') : 'GUEST STORYBOARD' }}</span></div>
    <div class="feature-marquee"><small>{{ isVault ? 'LOCK THE LIGHT' : 'AWAKEN THE FIRE' }}</small><h2>{{ isVault ? 'AURORA VAULT' : 'EMBER RELICS' }}</h2><p>{{ isVault ? 'Crystals stay. The vault awakens.' : 'Connect. Clear. Cascade.' }}</p></div>
    <div class="feature-playfield">
      <aside class="feature-meter"><Icon :name="isVault ? 'gem' : 'sun'" :size="30" /><small>{{ isVault ? 'CRYSTALS LOCKED' : 'RELICS CLEARED' }}</small><strong>{{ isVault ? locked : cleared }}<em v-if="isVault"> / 15</em></strong><div v-if="isVault" class="vault-progress"><i v-for="n in 15" :key="n" :class="{ lit: n <= locked }"></i></div><span>{{ isVault ? 'Collect all fifteen' : '4+ connected symbols' }}</span><p>{{ isVault ? 'Each new crystal resets three pulses.' : 'Up to six cascades in one sequence.' }}</p></aside>
      <div v-if="isVault" class="vault-machine">
        <div class="pulse-counter"><span>PULSES REMAINING</span><i v-for="n in 3" :key="n" :class="{ lit: n <= vault.remaining }">✦</i></div>
        <div class="vault-board" aria-label="Fifteen crystal vault cells"><div v-for="(cell, index) in vault.cells" :key="index" class="vault-cell" :class="{ locked: cell, 'just-locked': active && vault.added.includes(index) }" :style="{ '--cell-delay': `${index * 22}ms` }" :aria-label="`Cell ${index + 1}: ${cell ? 'locked' : 'empty'}`"><span class="cell-rune">✧</span><div v-if="cell" class="vault-crystal"><ArcadeSymbol :symbol="crystalNames[cell - 1]" /><small>LOCKED</small></div><i class="cell-corner"></i></div></div>
        <div class="board-engraving">✧ THE CELESTIAL COLLECTION ✧</div>
      </div>
      <div v-else class="cascade-machine"><div class="cascade-counter"><span>THE FALLING SANCTUARY</span><b>CASCADE {{ result ? Math.min(frame + 1, sequence.frames.length - 1) : 0 }} / 6</b></div><div class="cascade-board" aria-label="Six column five row relic board"><template v-for="(row, r) in cascade.grid" :key="r"><div v-for="(symbol, c) in row" :key="`${frame}-${r}-${c}`" class="relic-cell" :class="{ 'cluster-cell': cascade.removed.includes(r * 6 + c) }" :style="{ '--cell-delay': `${(r + c) * 22}ms` }" :data-symbol="symbol" :aria-label="`${symbol} relic`"><ArcadeSymbol :symbol="symbol" /></div></template></div><div class="board-engraving">✧ FOUR CONNECTED RELICS IGNITE ✧</div></div>
      <aside class="feature-guide"><strong>{{ phase === 'complete' ? 'SEQUENCE COMPLETE' : isVault ? 'LOCK & COLLECT' : 'CLUSTER CASCADES' }}</strong><span>{{ isVault ? '01' : '04' }}<small>{{ isVault ? 'CRYSTAL AT A TIME' : 'MATCH TO CLEAR' }}</small></span><p>{{ isVault ? 'Empty cells pulse with new possibilities.' : 'Relics drop into the spaces you clear.' }}</p><div class="no-award-tag">{{staked ? "WIN" : "NO STAKE"}}<br>{{staked ? "PLAY CREDITS" : "NO CREDIT AWARD"}}</div></aside>
    </div>
    <div class="feature-console"><BetControls :reduced-motion="reducedMotion" :game="game" :ready="running" :authenticated="!!authenticated" :busy="active||saving" /><div class="console-value"><small>PLAY CREDITS</small><strong>{{ balance }}</strong></div><button class="speed-control" :aria-pressed="fast" :disabled="saving" aria-label="Fast animations" @click="fast = !fast"><Icon name="chevron" :size="17" />{{ fast ? 'FAST' : 'NORMAL' }}</button><button v-if="active" class="feature-play" @click="finish()"><Icon name="arrow" />SHOW RESULT</button><button v-else class="feature-play" :disabled="creditPresentation.held!==null || !running || saving || loading" @click="play"><Icon :name="saving ? 'clock' : 'gem'" />{{ loading ? 'LOADING' : saving ? 'SAVING' : pendingKey ? 'RETRY SEQUENCE' : isVault ? 'OPEN VAULT' : 'START CASCADE' }}</button><div class="console-value practice-tag"><small>{{ authenticated ? 'SAVED ON SERVER' : 'LOCAL STORYBOARD' }}</small><strong>{{staked ? "PLAY" : "FREE PRACTICE"}}</strong></div></div>
    <p class="feature-notice" aria-live="polite">{{ notice }}</p>
  </section>
</template>
