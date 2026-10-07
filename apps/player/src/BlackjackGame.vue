<script setup lang="ts">
import GameCharacter from './GameCharacter.vue';
import {catalog} from '@new-game/contracts';
import WinBurst from './WinBurst.vue';
import {computed,onBeforeUnmount,onMounted,ref,watch} from 'vue';
import {blackjackCreditApproved,blackjackProfileFor,blackjackGameForProfile,type BlackjackGame,blackjackDeal,blackjackShoe,blackjackAct,blackjackPublic,handValue,type BlackjackState,type Card} from '@new-game/game-math';
import {api,session} from './api';
import {stage} from './staging-state';
import {holdStake,holdAward,revealCredits,creditPresentation} from './credit-presentation';
import {formatCredits} from '@new-game/domain';
import {playSound} from './audio';
const props=defineProps<{game:BlackjackGame;running:boolean;reducedMotion:boolean;authenticated:boolean;balance:string}>();
defineEmits<{resume:[game:BlackjackGame]}>();
const profile=blackjackProfileFor(props.game);
const foreignHand=ref<BlackjackGame|null>(null);
const gameName=(id:string)=>catalog.find(g=>g.id===id)?.name||id;
type View=ReturnType<typeof blackjackPublic>&{game:BlackjackGame;id:string;revision:number;expiresAt?:string;wallet?:NonNullable<typeof session.current>['wallet']};
type Command={action:string;requestKey:string;profileId:string;stake?:string;id?:string;revision?:number};
const hand=ref<View|null>(null),stake=ref('50'),busy=ref(false),loading=ref(true),error=ref(''),revealing=ref(false),pending=ref<Command|null>(null),now=ref(Date.now());
const dealerVisible=ref(1),showResult=ref(false);
const dealerCards=computed(()=>hand.value?.dealer.slice(0,Math.max(props.game==='european-blackjack'?1:2,dealerVisible.value)).map((card,index)=>index<dealerVisible.value?card:null)||[]);
const active=computed(()=>!!hand.value&&!hand.value.settled),staked=computed(()=>props.authenticated&&stage.enabled&&blackjackCreditApproved(props.game));
const timeLeft=computed(()=>Math.max(0,Math.min(profile.idleMs/1000,Math.ceil(((hand.value?.expiresAt?Date.parse(hand.value.expiresAt):0)-now.value)/1000))));
const available=computed(()=>BigInt(session.current?.wallet.available||'0'));
const suits=['♠','♥','♦','♣'],rank=(c:Card)=>c.rank===1?'A':c.rank===11?'J':c.rank===12?'Q':c.rank===13?'K':String(c.rank);
let preview:BlackjackState|null=null,disposed=false,poll:ReturnType<typeof setInterval>|undefined,revealTimer:ReturnType<typeof setTimeout>|undefined;
const motionTimers=new Set<ReturnType<typeof setTimeout>>();
function later(fn:()=>void,delay:number){const timer=setTimeout(()=>{motionTimers.delete(timer);if(!disposed)fn();},delay);motionTimers.add(timer);}
function clearMotion(){for(const timer of motionTimers)clearTimeout(timer);motionTimers.clear();}
const key=()=>`new-game-blackjack-${session.current?.id}`;
function savePending(){if(!staked.value)return;try{if(pending.value)localStorage.setItem(key(),JSON.stringify(pending.value));else localStorage.removeItem(key());}catch{/* Server receipt still survives a storage failure. */}}
function finishReveal(){clearTimeout(revealTimer);clearMotion();revealing.value=false;showResult.value=!!hand.value?.settled;dealerVisible.value=hand.value?.settled?hand.value.dealer.length:1;revealCredits(props.game);}
function present(value:View,animate=true){
 if(value.game!==props.game){foreignHand.value=value.settled?null:value.game;return;}foreignHand.value=null;
 clearMotion();hand.value=value;now.value=Date.now();error.value='';showResult.value=false;dealerVisible.value=1;
 if(value.wallet&&session.current){if(BigInt(value.wallet.version)>=BigInt(session.current.wallet.version))session.current.wallet=value.wallet;holdAward(props.game,session.current.id,session.current.wallet.available,value.settled?value.award:'0');stage.revision++;}
 if(!animate||props.reducedMotion||!props.running){finishReveal();return;}
 revealing.value=true;playSound('click');clearTimeout(revealTimer);
 if(value.settled){
  for(let i=2;i<=value.dealer.length;i++)later(()=>{dealerVisible.value=i;playSound('click');},420+(i-2)*360);
  const resultAt=780+Math.max(0,value.dealer.length-2)*360;
  later(()=>{showResult.value=true;if(Number(value.award)>0)playSound('win');},resultAt);
  revealTimer=setTimeout(finishReveal,resultAt+1200);
 }else revealTimer=setTimeout(finishReveal,750);
}
async function sync(){if(!staked.value||!props.running||busy.value||pending.value||revealing.value)return;try{const result=await api<{hand:View|null}>('blackjack');if(!disposed&&result.hand&&(!hand.value||result.hand.id!==hand.value.id||result.hand.revision!==hand.value.revision||result.hand.settled!==hand.value.settled))present(result.hand);}catch(e){if(!disposed)error.value=(e as Error).message;}}
async function act(action:string){
 if(!props.running||!navigator.onLine||document.hidden||busy.value||revealing.value||stage.busy||stage.pending||stage.fishPending.length)return;
 busy.value=true;error.value='';
 try{
  if(staked.value){
   // A restored command may already be reserved on the server and has no local
   // hand yet. Only a newly submitted action previews an additional deduction.
   if(session.current&&creditPresentation.game!==props.game)holdStake(props.game,session.current.id,session.current.wallet.available,pending.value?'0':action==='DEAL'?stake.value:['DOUBLE','SPLIT'].includes(action)?String(hand.value!.hands[hand.value!.active].stake):'0');
   pending.value??={action,requestKey:crypto.randomUUID(),profileId:profile.id,...(action==='DEAL'?{stake:stake.value}:{id:hand.value!.id,revision:hand.value!.revision})};savePending();
   const result=await api<View>('blackjack',pending.value);pending.value=null;savePending();if(disposed)return;present(result);
  }else{
   preview=action==='DEAL'?blackjackDeal(Number(stake.value),blackjackShoe(max=>Math.floor(Math.random()*max),props.game),props.game):blackjackAct(preview!,action);
   present({...blackjackPublic(preview),game:props.game,id:'preview',revision:(hand.value?.revision||0)+1});
  }
 }catch(e){if(disposed)return;const code=(e as {status?:number}).status;if(code&&[400,403,404,409,429].includes(code)){pending.value=null;savePending();finishReveal();if(code===409)hand.value=null;}error.value=(e as Error).message;}
 finally{busy.value=false;}
}
const canAct=(action:string)=>!foreignHand.value&&props.running&&!loading.value&&!busy.value&&!revealing.value&&!pending.value&&(!active.value?action==='DEAL':hand.value!.actions.includes(action))&&(!staked.value||!['DEAL','DOUBLE','SPLIT'].includes(action)||available.value>=BigInt(action==='DEAL'?stake.value:hand.value!.hands[hand.value!.active].stake));
onMounted(async()=>{if(staked.value){try{pending.value=JSON.parse(localStorage.getItem(key())||'null');}catch{/* Optional saved transport request. */}if(pending.value){const savedGame=blackjackGameForProfile(pending.value.profileId);if(savedGame!==props.game){foreignHand.value=savedGame;pending.value=null;}else await act(pending.value.action);}else await sync();}loading.value=false;poll=setInterval(()=>{now.value=Date.now();if(!pending.value)void sync();else if(props.running&&!busy.value)void act(pending.value.action);},2000);});
watch(()=>props.running,r=>{if(!r)finishReveal();else void sync();});watch(()=>props.reducedMotion,r=>{if(r)finishReveal();});
onBeforeUnmount(()=>{disposed=true;clearInterval(poll);finishReveal();});
</script>
<template><section class="blackjack-cabinet" :data-game="game" :class="{'cards-still':reducedMotion,'hand-revealing':revealing}">
 <p v-if="!blackjackCreditApproved(game)" class="blackjack-variant-note">FREE PREVIEW · No credits spent or awarded. Test rules awaiting owner approval.</p><div class="blackjack-rail"><span>♠ {{gameName(game).toUpperCase()}}</span><b>PREMIUM</b><span>{{staked?'PLAY CREDITS':'FREE PREVIEW'}}</span></div>
 <div class="blackjack-felt"><WinBurst v-if="hand?.settled&&showResult&&hand.hands.some(h=>h.result==='WIN'||h.result==='BLACKJACK')" :key="hand.id" :game="game" :id="hand.id" :award="hand.award" :stake="String(hand.hands.reduce((sum,h)=>sum+h.stake,0))" :running="running" :reduced-motion="reducedMotion"/>
  <div class="card-shoe" aria-hidden="true"><span>♠</span><b>{{profile.decks}} DECKS</b></div><div class="table-chip-rack" aria-hidden="true"><i></i><i></i><i></i><i></i></div><GameCharacter :game="game" compact/><div class="dealer-emblem" aria-label="Automated dealer"><span>♠</span><b>THE DEALER</b><small>{{profile.standSoft17?'STANDS ON ALL 17s':'HITS SOFT 17'}}</small></div>
  <div class="dealer-cards" aria-label="Dealer hand"><template v-if="hand"><div v-for="(card,i) in dealerCards" :key="`${hand.id}-dealer-${i}-${card?.rank}`" class="playing-card" :class="{red:card&&(card.suit===1||card.suit===2),back:!card}" :style="{'--deal-index':i}"><template v-if="card"><b>{{rank(card)}}<small>{{suits[card.suit]}}</small></b><strong :class="{'court-card':card.rank>10}"><em v-if="card.rank>10">♛</em>{{suits[card.suit]}}</strong><b class="card-bottom">{{rank(card)}}<small>{{suits[card.suit]}}</small></b></template><span v-else>♠</span></div></template><div v-else class="card-space">♠</div><span v-if="hand?.dealerValue&&showResult" class="hand-total">{{hand.dealerValue.total}}</span></div>
  <div class="felt-lettering"><strong>BLACKJACK PAYS 3 TO 2</strong><small>{{profile.decks}} DECKS · {{game==='european-blackjack'?'DEALER SECOND CARD AFTER YOUR TURN':game==='double-deck-blackjack'?'DOUBLE ON 9, 10 OR 11':'HIT / STAND / DOUBLE / SPLIT'}}</small></div>
  <div v-if="hand" class="blackjack-player-hands"><article v-for="(h,index) in hand.hands" :key="`${hand.id}-${index}`" class="blackjack-hand" :class="{current:!hand.settled&&hand.active===index}"><span class="hand-label">{{hand.hands.length>1?`HAND ${index+1}`:'YOUR HAND'}} <b>{{handValue(h.cards).total}}{{handValue(h.cards).soft?' · SOFT':''}}</b></span><div class="hand-cards" :style="{'--cards':h.cards.length}"><div v-for="(card,i) in h.cards" :key="`${hand.id}-${index}-${i}`" class="playing-card" :class="{red:card.suit===1||card.suit===2}" :style="{'--deal-index':i+2}"><b>{{rank(card)}}<small>{{suits[card.suit]}}</small></b><strong :class="{'court-card':card.rank>10}"><em v-if="card.rank>10">♛</em>{{suits[card.suit]}}</strong><b class="card-bottom">{{rank(card)}}<small>{{suits[card.suit]}}</small></b></div></div><span class="bet-chip">{{formatCredits(String(h.stake))}}</span><strong v-if="h.result&&showResult" class="hand-result" :class="h.result.toLowerCase()">{{h.result}}</strong></article></div>
  <div v-else class="blackjack-welcome"><h2>Your seat is ready</h2><p>Choose a stake and let the dealer deal.</p><div class="empty-bet-circle">♠</div></div>
  <div v-if="hand?.settled&&showResult" class="blackjack-return" role="status"><small>{{staked?'TOTAL RETURN':'PREVIEW RETURN'}}</small><strong>{{formatCredits(hand.award)}}</strong></div>
 </div>
 <p v-if="foreignHand" class="blackjack-error">You have an unfinished hand in {{gameName(foreignHand)}}. <button @click="$emit('resume',foreignHand)">RESUME HAND</button></p><p v-if="error" role="alert" class="blackjack-error">{{error}}</p><p v-if="pending" role="status" class="blackjack-error">Reconnecting to your saved hand…</p>
 <p v-if="game==='european-blackjack'" class="blackjack-variant-note">Dealer blackjack takes all committed bets, including doubles and splits.</p><div class="blackjack-controls"><div class="blackjack-meter"><small>CREDITS</small><strong>{{balance}}</strong></div><label>STAKE<select v-model="stake" aria-label="Blackjack stake" :disabled="active||busy||revealing||!!pending"><option v-for="n in 40" :key="n" :value="String(n*50)">{{(n*.5).toFixed(2)}}</option></select></label><div class="blackjack-actions"><button v-if="!active" class="deal-button" :disabled="!canAct('DEAL')" @click="act('DEAL')">{{loading?'LOADING…':busy?'DEALING…':'DEAL'}}</button><template v-else><button :disabled="!canAct('HIT')" @click="act('HIT')">HIT <b>＋</b></button><button :disabled="!canAct('STAND')" @click="act('STAND')">STAND <b>✋</b></button><button :disabled="!canAct('DOUBLE')" @click="act('DOUBLE')">DOUBLE <b>2×</b></button><button :disabled="!canAct('SPLIT')" @click="act('SPLIT')">SPLIT <b>Ⅱ</b></button></template></div></div>
 <p class="blackjack-status">{{revealing&&hand?.settled&&!showResult?'Dealer reveals…':active?(staked?`Your move · auto-stand in ${Math.floor(timeLeft/60)}:${String(timeLeft%60).padStart(2,'0')}`:'Your move · free preview'):hand?'Hand complete. Choose your next stake.':'Natural 3:2 · Win 1:1 · Tie returns your stake'}}</p>
</section></template>
