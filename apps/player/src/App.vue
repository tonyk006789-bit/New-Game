<script setup lang="ts">
import { computed, defineAsyncComponent, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
import { App as NativeApp } from '@capacitor/app';
import { Capacitor, type PluginListenerHandle } from '@capacitor/core';
import Icon from '@new-game/ui/Icon.vue';
import { catalog, isPremiumGame, type GameId } from '@new-game/contracts';
import GamePreview from './GamePreview.vue';
import BlackjackGame from './BlackjackGame.vue';
import BlackjackRules from './BlackjackRules.vue';
import PremiumSpotlight from './PremiumSpotlight.vue';
import GameRules from './GameRules.vue';
import FeatureGame from './FeatureGame.vue';
import CabinetGame from './CabinetGame.vue';
import ArcadeLobby from './ArcadeLobby.vue';
import GameShelf from './GameShelf.vue';
import {isCabinetGame,isFishGame} from '@new-game/game-math';
import {isPortraitGame,portraitRotationQuery} from './cabinet-layout';
import FishingLobby from './FishingLobby.vue';
import type {ReefRoom} from './reef-room';
import LoginScreen from './LoginScreen.vue';
import SettingsPanel from './SettingsPanel.vue';
import SharePanel from './SharePanel.vue';
import DailyWheel from './DailyWheel.vue';
import {creditPresentation,revealCredits} from './credit-presentation';
import {unlockAudio,playSound,setAudioActive,setMusicScene} from './audio';
import MusicControls from './MusicControls.vue';
const loginNotice=ref('');
const onGesture=(event:Event)=>{void unlockAudio();if((event.target as Element)?.closest('button'))playSound('click');};
function passwordChanged(){clearAccount();loginNotice.value='Password changed. Sign in with your new password.';}
import { api, session, refreshAccount, expiredSession, loadEnvironment, recoverRound, type Account } from './api';
import { formatCredits } from '@new-game/domain';
import {stage,restorePending,restoreFishPending} from './staging-state';
const FishScene = defineAsyncComponent(() => import('./FishScene.vue'));
type Page = 'lobby' | 'history' | 'wallet' | 'settings';
const entered = ref(false);
const account = ref<Account|null>(null);
const accountError = ref('');
const creditHistory = ref<{id:string;kind:string;units:string;reason:string;created_at:string}[]>([]);
const practiceHistory = ref<{result:{id:string;game:string;description:string};created_at:string}[]>([]);
const credits = computed(() => formatCredits(creditPresentation.accountId===account.value?.id&&creditPresentation.held!==null?creditPresentation.held:account.value?.wallet.available || '0'));
async function authenticated(){account.value=session.current;if(account.value){restorePending(account.value.id);restoreFishPending(account.value.id);}entered.value=true;navigate('lobby');await loadHistory();}
async function loadHistory(){if(!account.value)return;try{[creditHistory.value,practiceHistory.value]=await Promise.all([api<typeof creditHistory.value>('history'),api<typeof practiceHistory.value>('practice/history')]);}catch(error){accountError.value=(error as Error).message;}}
async function syncAccount(){if(!account.value||!ready.value)return;try{account.value=await refreshAccount();accountError.value='';}catch(error){accountError.value=(error as Error).message;if(expiredSession(error))clearAccount();}}
function clearAccount(){revealCredits();session.current=null;stage.pending=null;stage.fishPending=[];stage.needsRecovery=false;stage.last=null;account.value=null;entered.value=false;activeGame.value=null;selectedTable.value=null;atFishTable.value=false;modal.value=null;creditHistory.value=[];practiceHistory.value=[];}
let syncTimer:ReturnType<typeof setInterval>|undefined,recoveryTimer:ReturnType<typeof setInterval>|undefined,nextRecoveryAt=0;
async function reconcileRound(){if(!ready.value||!account.value||!recovering.value||stage.busy||Date.now()<nextRecoveryAt)return;nextRecoveryAt=Date.now()+3000;try{await recoverRound();}catch(error){if(expiredSession(error))clearAccount();}}
const recovering=computed(()=>stage.needsRecovery||stage.fishPending.some(p=>p.recover));
const page = ref<Page>('lobby');
const category = ref('All games');
const lobbyView=ref<'shelf'|'floor'>('shelf');
const query = ref('');
const activeGame = ref<GameId | null>(null);
const modal = ref<'about' | 'support' | 'share' | 'wheel' | 'rules' | null>(null);
const selectedTable=ref<ReefRoom|null>(null),atFishTable=ref(false),fishLeaving=ref(false);
function joinTable(room:ReefRoom|null){selectedTable.value=room;atFishTable.value=true;}
async function leaveTable(){if(!atFishTable.value||fishLeaving.value)return;fishLeaving.value=true;try{if(selectedTable.value&&account.value&&online.value)await api('practice/reef/leave',{roomId:selectedTable.value.id});}catch{/* A disconnected seat expires on the server. */}finally{selectedTable.value=null;atFishTable.value=false;fishLeaving.value=false;}}
async function backFromGame(){if(isFishGame(activeGame.value)&&atFishTable.value)await leaveTable();else activeGame.value=null;}
const favorites = ref<string[]>([]);
const reducedMotion = ref(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
const foreground = ref(!document.hidden);
const online = ref(navigator.onLine);
const ready = computed(() => foreground.value && online.value);
const currentGame = computed(() => catalog.find(game => game.id === activeGame.value));
const portraitGame=computed(()=>!!activeGame.value&&isPortraitGame(activeGame.value));
const portraitMedia=window.matchMedia(portraitRotationQuery),rotatePortrait=ref(portraitMedia.matches);
const onPortraitOrientation=()=>{rotatePortrait.value=portraitMedia.matches;};
const cabinetReady=computed(()=>ready.value&&!(portraitGame.value&&rotatePortrait.value));
const visibleGames = computed(() => catalog.filter(game =>
  (category.value === 'All games' || category.value === 'Favorites' || category.value==='Premium'&&isPremiumGame(game.id) || game.category === category.value) &&
  (category.value !== 'Favorites' || favorites.value.includes(game.id)) &&
  `${game.name} ${game.category}`.toLowerCase().includes(query.value.toLowerCase())));
const categories = [
  { label:'Premium',title:'PREMIUM',subtitle:'ROYAL BLACKJACK',icon:'star',theme:'gold' },
  { label:'Table',title:'TABLES',subtitle:'BLACKJACK',icon:'gem',theme:'green' },
  { label: 'All games', title: 'THE ARCADE', subtitle: 'ALL GAMES', icon: 'grid', theme: 'pink' },
  { label: 'Slots', title: 'SLOTS', subtitle: 'REELS & FEATURES', icon: 'gem', theme: 'gold' },
  { label: 'Keno', title: 'KENO', subtitle: 'KENO', icon: 'leaf', theme: 'green' },
  { label: 'Fish', title: 'REEF', subtitle: 'FISHING', icon: 'fish', theme: 'blue' },
  { label: 'Favorites', title: 'FAVORITES', subtitle: 'YOUR COLLECTION', icon: 'star', theme: 'violet' }
];

async function navigate(target: Page) { await leaveTable();page.value = target; activeGame.value = null; query.value = ''; }
function chooseCategory(value: string) { navigate('lobby'); category.value = value; }
function toggleFavorite(id: string) { favorites.value = favorites.value.includes(id) ? favorites.value.filter(item => item !== id) : [...favorites.value, id]; }
function openGame(id: GameId) { activeGame.value = id; window.scrollTo({ top: 0, behavior: 'instant' }); }
function enterPreview() { entered.value = true; navigate('lobby'); }
async function leavePreview() { await leaveTable();if(account.value){try{await api('auth/logout',{});}catch(error){if(!expiredSession(error)){accountError.value=(error as Error).message;return;}}}clearAccount();accountError.value=''; }
const onVisibility = () => { foreground.value = !document.hidden; };
const onNetwork = () => { online.value = navigator.onLine; };
const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { if (modal.value) modal.value = null; else void backFromGame(); } };
function trapFocus(event: KeyboardEvent) {
  if (event.key !== 'Tab') return;
  const items = Array.from(document.querySelectorAll<HTMLElement>('.player-modal button:not([disabled]), .player-modal input, .player-modal a[href], .player-modal select'));
  if (event.shiftKey && event.target === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
  if (!event.shiftKey && event.target === items.at(-1)) { event.preventDefault(); items[0]?.focus(); }
}
const nativeListeners: PluginListenerHandle[] = [];
watch(()=>stage.revision,()=>{if(session.current?.id===account.value?.id&&session.current)account.value={...session.current};else void syncAccount();});
watch(()=>[recovering.value,stage.busy,ready.value,account.value?.id],()=>void reconcileRound());
onMounted(async () => {
  portraitMedia.addEventListener('change',onPortraitOrientation);
  setAudioActive(ready.value);
  try{await loadEnvironment();}catch{/* Unavailable config keeps staking closed. */}
  try{const restored=await refreshAccount();if(restored.role==='PLAYER')await authenticated();}catch{/* No authenticated session yet. */}
  syncTimer=setInterval(()=>void syncAccount(),5000);
  recoveryTimer=setInterval(()=>void reconcileRound(),3000);
  try {
    const saved = JSON.parse(localStorage.getItem('new-game-presentation') || '{}');
    if (Array.isArray(saved.favorites)) favorites.value = saved.favorites.filter((id: string) => catalog.some(game => game.id === id));
    if (typeof saved.reducedMotion === 'boolean') reducedMotion.value = saved.reducedMotion;
  } catch { /* Optional presentation preferences, never credentials. */ }
  document.addEventListener('visibilitychange', onVisibility);
  document.addEventListener('pointerdown',onGesture);document.addEventListener('keydown',onGesture);
  window.addEventListener('online', onNetwork); window.addEventListener('offline', onNetwork); window.addEventListener('keydown', onKey);
  if (Capacitor.isNativePlatform()) {
    nativeListeners.push(await NativeApp.addListener('appStateChange', state => { foreground.value = state.isActive; }));
    nativeListeners.push(await NativeApp.addListener('backButton', () => {
      if (modal.value) modal.value = null;
      else if (activeGame.value) void backFromGame();
      else if (page.value !== 'lobby') navigate('lobby');
      else if (entered.value) leavePreview();
      else void NativeApp.minimizeApp();
    }));
  }
});
watch([favorites, reducedMotion], () => {
  try { localStorage.setItem('new-game-presentation', JSON.stringify({ favorites: favorites.value, reducedMotion: reducedMotion.value })); } catch { /* Optional preferences. */ }
}, { deep: true });
let focusBeforeModal: HTMLElement | null = null;
watch(modal, async value => {
  if (value) { focusBeforeModal = document.activeElement as HTMLElement; await nextTick(); document.querySelector<HTMLButtonElement>('.player-modal .round-control')?.focus(); }
  else focusBeforeModal?.focus();
});
onBeforeUnmount(() => {
  portraitMedia.removeEventListener('change',onPortraitOrientation);
  clearInterval(syncTimer);
  clearInterval(recoveryTimer);
  document.removeEventListener('visibilitychange', onVisibility);
  document.removeEventListener('pointerdown',onGesture);document.removeEventListener('keydown',onGesture);setAudioActive(false);
  window.removeEventListener('online', onNetwork); window.removeEventListener('offline', onNetwork); window.removeEventListener('keydown', onKey);
  nativeListeners.forEach(listener => void listener.remove());
});
watch(ready,value=>setAudioActive(value));
watch(activeGame,game=>setMusicScene(game||'lobby'),{immediate:true});
watch(page,()=>{void syncAccount();void loadHistory();});
</script>
<template>
  <div class="arcade-app" :class="{ 'reduce-motion': reducedMotion, 'in-game': currentGame, 'at-login': !entered }">
    <LoginScreen v-if="!entered" :notice="loginNotice" @authenticated="authenticated" @preview="enterPreview" @help="modal = 'support'" />
    <template v-else>
      <header class="arcade-header">
        <button class="compact-brand" aria-label="New Game home" @click="navigate('lobby')"><span class="brand-medallion">N<span>G</span></span><span>NEW GAME<small>{{account?.displayName || 'THE PRIVATE ARCADE'}}</small></span></button>
        <span class="guest-tag"><i></i> {{ account ? account.displayName : 'GUEST PREVIEW' }}</span>
        <div class="header-controls"><button class="credit-meter" :aria-label="`My credits, ${credits}`" @click="navigate('wallet')"><span class="coin-token">N</span><span><small>PLAY CREDITS</small><strong>{{ credits }}</strong></span><Icon name="chevron" :size="14" /></button><MusicControls /><button class="round-control" aria-label="Settings" @click="navigate('settings')"><Icon name="settings" /></button><button class="round-control exit-control" aria-label="Return to login" @click="leavePreview"><Icon name="close" /></button></div>
      </header>
      <p v-if="accountError" class="connection-banner" role="alert">{{accountError}}</p><div v-if="!online" class="connection-banner" role="status"><Icon name="info" :size="16" />You’re offline. Preview actions are paused until you reconnect.</div>
      <span v-if="recovering" class="round-sync-status" role="status">{{online?'Reconnecting…':'Waiting for connection…'}}</span>
      <main v-if="currentGame" class="immersive-game" :class="{'portrait-cabinet':portraitGame,'portrait-blocked':portraitGame&&rotatePortrait}" :data-layout="portraitGame?'portrait':'wide'">
        <div class="game-topline"><button class="round-control" :aria-label="isFishGame(activeGame)&&atFishTable?'Back to fishing lobby':'Back to arcade'" :disabled="fishLeaving" @click="backFromGame"><Icon name="back" /></button><div><small>{{isFishGame(activeGame)&&!atFishTable?'THE OCEAN LOUNGE':'NEW GAME ORIGINAL'}}</small><h1>{{ currentGame.name }}</h1></div><span v-if="isFishGame(activeGame)&&atFishTable" class="four-player-badge">4 PLAYER TABLE</span><MusicControls /><button class="game-rules-button" @click="modal='rules'">RULES <Icon name="info" :size="16" /></button></div>
        <template v-if="isFishGame(activeGame)"><FishScene v-if="atFishTable" :game="activeGame!" :running="ready && !modal && !fishLeaving" :reduced-motion="reducedMotion" :authenticated="!!account" :balance="credits" :initial-room="selectedTable"/><FishingLobby v-else :game="activeGame!" :running="ready && !modal" :authenticated="!!account" @join="joinTable"/></template>
        <BlackjackGame v-else-if="activeGame==='royal-blackjack'" :running="ready&&!modal" :reduced-motion="reducedMotion" :authenticated="!!account" :balance="credits"/><FeatureGame v-else-if="activeGame === 'aurora-vault' || activeGame === 'ember-relics'" :key="`${activeGame}-${stage.recovered}`" :game="activeGame" :running="cabinetReady && !modal" :reduced-motion="reducedMotion" :authenticated="!!account" :balance="credits" />
        <CabinetGame v-else-if="activeGame && isCabinetGame(activeGame)" :key="`${activeGame}-${stage.recovered}`" :game="activeGame" :running="cabinetReady && !modal" :reduced-motion="reducedMotion" :authenticated="!!account" :balance="credits" />
        <GamePreview v-else :key="`${activeGame}-${stage.recovered}`" :game="activeGame!" :running="ready && !modal" :reduced-motion="reducedMotion" :authenticated="!!account" :balance="credits" />
        <section v-if="portraitGame&&rotatePortrait" class="portrait-rotation" role="status"><i aria-hidden="true"></i><h2>Turn to portrait</h2><p>{{currentGame.name}} plays in an upright cabinet.</p><button @click="backFromGame">BACK TO LOBBY</button></section>

      </main>
      <template v-else-if="page === 'lobby'">
        <nav class="district-nav" aria-label="Game categories"><button v-for="item in categories" :key="item.label" :class="[item.theme, { selected: category === item.label }]" :aria-label="item.label" :aria-pressed="category === item.label" @click="chooseCategory(item.label)"><span class="district-roof"></span><Icon :name="item.icon" :size="26" /><strong>{{ item.title }}</strong><small>{{ item.subtitle }}</small><span class="district-plinth"></span></button></nav>
        <main class="arcade-lobby"><PremiumSpotlight :premium-only="category==='Premium'" v-if="category==='All games'||category==='Premium'" :running="ready&&!modal" @open="openGame" @premium="chooseCategory('Premium')"/>
          <div class="lobby-heading"><span class="heading-rule"></span><div><span>{{catalog.length}} ORIGINALS. ONE PRIVATE ARCADE.</span><h1>{{ category === 'Favorites' ? 'YOUR FAVORITES' : category === 'All games' ? 'CHOOSE YOUR GAME' : `${category.toUpperCase()} COLLECTION` }}</h1></div><span class="heading-rule"></span></div>
          <section class="collection-cabinet" aria-label="Game collection">
            <div class="neon-bar top"></div><div class="neon-bar bottom"></div>
            <div class="shelf-toolbar"><span><span class="live-spark">✦</span> NEW GAME ORIGINALS <small>{{ visibleGames.length }} / {{ catalog.length }}</small></span><label class="search-games"><Icon name="search" :size="15" /><input v-model="query" aria-label="Search games" placeholder="Find a game"></label></div>
            <div class="lobby-view-switch" role="group" aria-label="Lobby view"><button :aria-pressed="lobbyView==='shelf'" @click="lobbyView='shelf'">GAME SHELF</button><button :aria-pressed="lobbyView==='floor'" @click="lobbyView='floor'">WALK THE FLOOR</button></div>
            <GameShelf v-if="lobbyView==='shelf'" :games="visibleGames" :favorites="favorites" :running="ready && !modal" @open="openGame" @favorite="toggleFavorite"/>
            <ArcadeLobby v-else :games="visibleGames" :favorites="favorites" :running="ready && !modal" :reduced-motion="reducedMotion" :player-name="account?.displayName || 'YOU'" @open="openGame" @favorite="toggleFavorite" />
            <div class="shelf-bottom"><i></i><span>BLACKJACK • SLOTS • KENO • FISHING</span><i></i></div>
          </section>
          <div class="lobby-extras"><button class="daily-wheel-entry" @click="modal='wheel'"><span aria-hidden="true">✺</span><b>DAILY SPIN</b><small>A little luck, every day</small></button><button class="share-entry" @click="modal='share'"><span aria-hidden="true">▦</span><b>SHARE ARCADE</b><small>Invite your friends</small></button></div><div class="credit-note"><Icon name="info" :size="15" /><p>{{ credits === '0.00' ? 'No credits available. Contact your administrator.' : stage.enabled ? 'Choose your game. Make your next play.' : 'Your current play-credit balance.' }}</p><button @click="modal = 'about'">How credits work <Icon name="chevron" :size="13" /></button></div>
        </main>
      </template>
      <main v-else class="utility-page">
        <button class="back-text" @click="navigate('lobby')"><Icon name="back" :size="18" /> BACK TO ARCADE</button>
        <template v-if="page === 'wallet'"><h1>MY CREDITS</h1><p class="utility-lead">Your play credits. All in one place.</p><section class="arcade-panel wallet-panel"><span class="coin-token">N</span><span class="eyebrow">AVAILABLE PLAY CREDITS</span><strong class="wallet-amount">{{credits}}</strong><p>{{ credits === '0.00' ? 'No credits available. Contact your administrator.' : 'Your current play-credit balance.' }}</p><div class="balance-breakdown"><span>Settled<strong>{{formatCredits(account?.wallet.settled || '0')}}</strong></span><span>Reserved<strong>{{formatCredits(account?.wallet.reserved || '0')}}</strong></span><span>Available<strong>{{credits}}</strong></span></div></section><section class="arcade-panel"><h2>Credit history</h2><p v-if="!creditHistory.length">No credit activity yet.</p><article v-for="entry in creditHistory" :key="entry.id" class="player-history-row"><div><b>{{entry.kind}}</b><p>{{entry.reason}}</p><small>{{new Date(entry.created_at).toLocaleString()}}</small></div><strong>{{formatCredits(entry.units)}}</strong></article></section></template>
        <template v-else-if="page === 'history'"><h1>PLAY HISTORY</h1><p class="utility-lead">Every adventure has a story.</p><section v-if="!practiceHistory.length" class="arcade-panel utility-empty"><Icon name="clock" :size="39" /><h2>Your first chapter is waiting.</h2><p>No credit-staked rounds have been played. Visual previews do not create real rounds.</p><button class="gold-button" @click="navigate('lobby')">EXPLORE THE ARCADE</button></section><section v-else class="arcade-panel"><article v-for="round in practiceHistory" :key="round.result.id" class="player-history-row"><div><b>{{round.result.game}}</b><p>{{round.result.description}}</p><small>{{new Date(round.created_at).toLocaleString()}} · {{stage.enabled ? 'Saved round' : 'Free practice'}}</small></div></article></section></template>
        <template v-else><h1>SETTINGS</h1><SettingsPanel :account="account" v-model:reduced-motion="reducedMotion" @logout="leavePreview" @password-changed="passwordChanged" /></template>
      </main>
      <footer v-if="!currentGame" class="arcade-bottom"><button :class="{ active: page === 'lobby' }" @click="navigate('lobby')"><Icon name="grid" :size="18" />LOBBY</button><button :class="{ active: page === 'history' }" @click="navigate('history')"><Icon name="clock" :size="18" />HISTORY</button><span class="footer-motto">PRIVATE GROUP <i>✦</i> JUST FOR FUN</span><button @click="modal = 'support'"><Icon name="help" :size="18" />SUPPORT</button><button @click="modal = 'about'"><Icon name="shield" :size="18" />ABOUT</button></footer>
    </template>
    <div v-if="modal" class="player-modal-backdrop" @click.self="modal=null"><section class="player-modal" role="dialog" aria-modal="true" aria-labelledby="modal-title" @keydown="trapFocus">
      <header><h2 id="modal-title">{{modal==='support'?'NEED A HAND?':modal==='share'?'SHARE NEW GAME':modal==='wheel'?'DAILY SPIN':modal==='rules'?`${currentGame?.name} · RULES`:'WELCOME TO NEW GAME'}}</h2><button class="round-control" aria-label="Close dialog" @click="modal=null"><Icon name="close"/></button></header>
      <BlackjackRules v-if="modal==='rules'&&activeGame==='royal-blackjack'"/><GameRules v-else-if="modal==='rules' && activeGame && activeGame!=='royal-blackjack'" :game="activeGame" :staked="stage.enabled && !!account"/><SharePanel v-else-if="modal==='share'"/><DailyWheel v-else-if="modal==='wheel'" :authenticated="!!account" :ready="ready" :reduced-motion="reducedMotion" @settled="syncAccount"/><template v-else-if="modal==='support'"><p>For your player ID, an invitation, a password reset, or help with credits, contact your group’s Main Admin through your usual contact method.</p><p>Sign in with the player ID and password provided by your administrator. Guest previews are also available.</p></template>
      <template v-else><p>An invitation-only arcade for your circle. Play credits cannot be purchased, cashed out, or redeemed for prizes of value.</p><p>Your administrator manages your play credits.</p></template>
      <button v-if="modal==='support'||modal==='about'" class="gold-button" @click="modal=null">GOT IT <Icon name="check" :size="17"/></button>
    </section></div>
  </div>
</template>
