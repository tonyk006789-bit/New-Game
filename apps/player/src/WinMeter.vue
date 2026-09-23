<script setup lang="ts">
import {computed,onBeforeUnmount,ref,watch} from 'vue';
import {playSound} from './audio';
import {formatCredits} from '@new-game/domain';
const props=defineProps<{amount:string;busy:boolean;reducedMotion?:boolean;running?:boolean}>();
const emit=defineEmits<{settled:[]}>();
const shown=ref(props.amount),counting=ref(false);
const positive=computed(()=>!props.busy&&BigInt(props.amount)>0n);
let animation=0;
function settle(){cancelAnimationFrame(animation);counting.value=false;shown.value=props.busy?'0':props.amount;if(!props.busy)emit('settled');}
watch(()=>[props.amount,props.busy,props.reducedMotion,props.running] as const,(_next,previous)=>{
 cancelAnimationFrame(animation);counting.value=false;shown.value=props.busy?'0':props.amount;
 // Count only a newly revealed, already committed return. Restored history is immediate.
 if(props.busy)return;
 if(!previous?.[1]||props.reducedMotion||props.running===false||!positive.value){settle();return;}
 playSound('win');const award=BigInt(props.amount),start=performance.now();counting.value=true;shown.value='0';
 function tick(now:number){
  const progress=Math.min(1,(now-start)/900),eased=1-(1-progress)**3;
  shown.value=(award*BigInt(Math.floor(eased*1000))/1000n).toString();
  if(progress<1)animation=requestAnimationFrame(tick);else settle();
 }
 animation=requestAnimationFrame(tick);
});
onBeforeUnmount(()=>cancelAnimationFrame(animation));
</script>
<template><div class="stage-return" :class="{'return-lit':positive,'return-counting':counting}" :aria-label="busy?'Round in progress':`Win ${formatCredits(amount)} play credits`"><small>{{busy?'PLAYING':'WIN'}}</small><b aria-hidden="true">{{busy?'—':formatCredits(shown)}}</b><span class="meter-reflection" aria-hidden="true"></span></div></template>
