<script setup lang="ts">
import {computed,onBeforeUnmount,onMounted,ref,watch} from 'vue';
import {formatCredits} from '@new-game/domain';
import {api,session} from './api';
import {holdCredits,revealCredits} from './credit-presentation';
import {playSound} from './audio';
const props=defineProps<{authenticated:boolean;ready:boolean;reducedMotion:boolean}>();
const emit=defineEmits<{settled:[]}>();
type Receipt={id:string;index:number;award:string;nextAt:number;createdAt:number};
type Status={rewards:string[];serverTime:number;nextAt:number;eligible:boolean;hasCredits:boolean;last:Receipt|null};
const rewards=['0','5','10','15','25','75','150','300','500'];
const status=ref<Status|null>(null),busy=ref(false),requesting=ref(false),message=ref(''),angle=ref(0),award=ref<string|null>(null),now=ref(Date.now());
let timer:ReturnType<typeof setTimeout>|undefined,clock:ReturnType<typeof setInterval>|undefined,disposed=false,offset=0;
const remaining=computed(()=>Math.max(0,(status.value?.nextAt||0)-now.value));
const countdown=computed(()=>{const s=Math.ceil(remaining.value/1000);return `${Math.floor(s/3600)}h ${Math.floor(s%3600/60)}m ${s%60}s`;});
const eligible=computed(()=>props.authenticated&&props.ready&&!!status.value?.hasCredits&&!remaining.value&&!busy.value&&!requesting.value);
function pendingKey(){return `ng-wheel-pending:${session.current?.id}`;}
async function load(){if(!props.authenticated)return;try{status.value=await api<Status>('daily-wheel');offset=status.value.serverTime-Date.now();now.value=Date.now()+offset;}catch(e){message.value=(e as Error).message;}}
function finish(){clearTimeout(timer);busy.value=false;revealCredits('daily-wheel');emit('settled');if(award.value&&award.value!=='0')playSound('win');}
async function spin(){
 if(!eligible.value||!session.current)return;message.value='';requesting.value=true;award.value=null;
 const storageKey=pendingKey();let key:string;
 try{key=localStorage.getItem(storageKey)||crypto.randomUUID();localStorage.setItem(storageKey,key);}catch{requesting.value=false;message.value='Enable local storage to safely retry your daily spin.';return;}
 holdCredits('daily-wheel',session.current.id,session.current.wallet.available);
 try{
  const receipt=await api<Receipt>('daily-wheel/spin',{requestKey:key});localStorage.removeItem(storageKey);
  if(disposed){revealCredits('daily-wheel');return;}
  award.value=receipt.award;status.value={rewards,serverTime:Date.now()+offset,nextAt:receipt.nextAt,eligible:false,hasCredits:true,last:receipt};
  busy.value=true;angle.value+=1800+((360-20-receipt.index*40-angle.value%360)+360)%360;
  if(props.reducedMotion||!props.ready)finish();else timer=setTimeout(finish,4300);
 }catch(e){revealCredits('daily-wheel');message.value=(e as Error).message;if('status' in (e as object)&&[400,403,409].includes(Number((e as {status:number}).status)))localStorage.removeItem(storageKey);await load();}
 finally{requesting.value=false;}
}
watch(()=>props.ready,v=>{if(!v&&busy.value)finish();if(v)void load();});
watch(()=>props.reducedMotion,v=>{if(v&&busy.value)finish();});
onMounted(()=>{void load();clock=setInterval(()=>{now.value=Date.now()+offset;},1000);});
onBeforeUnmount(()=>{disposed=true;clearTimeout(timer);clearInterval(clock);revealCredits('daily-wheel');emit('settled');});
</script>
<template><section class="daily-wheel-panel"><p class="wheel-tagline">A little luck. Once a day.</p><div class="wheel-surround"><div class="wheel-pointer" aria-hidden="true"></div><div class="daily-wheel" :class="{instant:reducedMotion}" :style="{transform:`rotate(${angle}deg)`}"><span v-for="(value,index) in rewards" :key="value" :style="{transform:`rotate(${index*40+20}deg)`}"><b>{{value==='0'?'GOOD LUCK':formatCredits(value)}}</b></span></div><button class="wheel-hub" :disabled="!eligible" @click="spin">{{requesting?'WAIT':busy?'…':'SPIN'}}</button></div><strong v-if="!busy&&award!==null" class="wheel-result" role="status">{{award==='0'?'Good luck next time!':`YOU WON ${formatCredits(award)}`}}</strong><p v-if="!authenticated">Sign in to use your daily spin.</p><p v-else-if="status&&!status.hasCredits">A positive credit balance is needed to spin.</p><p v-else-if="remaining&&!busy">Next spin in {{countdown}}</p><p v-else-if="!busy">One spin every 24 hours · Play credits</p><p class="error" role="alert" v-if="message">{{message}}</p></section></template>
