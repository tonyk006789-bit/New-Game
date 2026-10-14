<script setup lang="ts">
import {computed,onBeforeUnmount,onMounted,ref,watch} from 'vue';
import type {BlackjackGame} from '@new-game/game-math';
import type {DealerDelivery,DealerRig} from './dealer-rig';
import assets from './presentation-assets.json';
import {DEAL_STEP} from './blackjack-dealing';
const props=defineProps<{game:BlackjackGame;delivery:DealerDelivery|null;active:boolean;running:boolean;reducedMotion:boolean}>();
const emit=defineEmits<{ready:[]}>();
const descriptions={'royal-blackjack':'Royal dealer, woman with long brown hair and a black waistcoat','double-deck-blackjack':'Double Deck dealer, man with parted dark hair, beard and burgundy waistcoat','european-blackjack':'European dealer, woman with dark hair buns and navy waistcoat'};
const fallback=computed(()=>assets[props.game==='royal-blackjack'?'dealer-royal':props.game==='double-deck-blackjack'?'dealer-double':'dealer-european'].url);
const host=ref<HTMLElement>(),painted=ref(false);
let rig:DealerRig|undefined,disposed=false,raf=0,start=0,resize:ResizeObserver|undefined,lastFrame=0;
function stop(){cancelAnimationFrame(raf);raf=0;rig?.rest();}
function frame(now:number){
 if(disposed||!props.running||props.reducedMotion)return;
 const elapsed=now-start;
 if(now-lastFrame>=1000/60-1){rig?.render(Math.min(elapsed,DEAL_STEP));lastFrame=now;}
 if(elapsed<DEAL_STEP)raf=requestAnimationFrame(frame);else raf=0;
}
function begin(){
 if(!painted.value||!rig||!props.delivery||!props.active||!props.running||props.reducedMotion)return;
 cancelAnimationFrame(raf);rig.start(props.delivery);start=props.delivery.startedAt??performance.now();lastFrame=0;raf=requestAnimationFrame(frame);
}
onMounted(async()=>{
 try{
  const {DealerRig:Renderer}=await import('./dealer-rig');if(disposed)return;
  rig=new Renderer(host.value!,props.game);await rig.load();if(disposed){rig.dispose();return;}
  painted.value=true;resize=new ResizeObserver(()=>{rig?.resize();if(!raf)rig?.rest();});resize.observe(host.value!);
  rig.renderer.domElement.addEventListener('webglcontextlost',(event)=>{event.preventDefault();if(disposed)return;stop();painted.value=false;});
  rig.renderer.domElement.addEventListener('webglcontextrestored',()=>{if(disposed)return;rig?.rest();painted.value=true;});
 }catch(error){if(!disposed){console.warn('Jointed dealer unavailable; using still artwork.',error);rig?.dispose();rig=undefined;}}
 if(!disposed)emit('ready');
});
watch(()=>props.delivery,begin,{flush:'post'});
watch(()=>props.active&&props.running&&!props.reducedMotion,value=>{if(!value)stop();});
onBeforeUnmount(()=>{disposed=true;cancelAnimationFrame(raf);resize?.disconnect();rig?.dispose();});
</script>
<template>
 <div class="dealer-character" :data-game="game" :data-renderer="painted?'jointed-3d':'still'" role="img" :aria-label="descriptions[game]">
  <div v-if="!painted" class="dealer-fallback"><img :src="fallback" alt="" decoding="async"/></div>
  <div ref="host" class="dealer-mesh" aria-hidden="true"/>
 </div>
</template>
