<script setup lang="ts">
import {onBeforeUnmount,onMounted,ref,watch} from 'vue';
import type {BlackjackGame} from '@new-game/game-math';
import type {DealerDelivery,DealerRig} from './dealer-rig';
import posters from './dealer-posters.json';
import {DEAL_STEP,CARD_LAND} from './blackjack-dealing';
const props=defineProps<{game:BlackjackGame;delivery:DealerDelivery|null;active:boolean;running:boolean;reducedMotion:boolean}>();
const emit=defineEmits<{ready:[];landed:[id:number]}>();
const descriptions={'royal-blackjack':'Royal dealer, brown-haired woman in a tailored pinstripe suit','double-deck-blackjack':'Double Deck dealer, dark-haired man in a charcoal suit and tie','european-blackjack':'European dealer, blonde woman with glasses and a burgundy jacket'};
const host=ref<HTMLElement>(),painted=ref(false);
let rig:DealerRig|undefined,disposed=false,raf=0,start=0,resize:ResizeObserver|undefined,lastFrame=0,landedId=0;
function stop(){cancelAnimationFrame(raf);raf=0;rig?.rest();}
function frame(now:number){
 if(disposed||!props.running||props.reducedMotion)return;
 const elapsed=now-start,dealing=props.active&&!!props.delivery&&elapsed<DEAL_STEP;
 if(now-lastFrame>=1000/(dealing?60:24)-1){
  // Hand over to the DOM card in the same paint as the 3D card disappears.
  if(props.active&&props.delivery&&elapsed>=CARD_LAND&&landedId!==props.delivery.id){landedId=props.delivery.id;emit('landed',landedId);}
  if(dealing)rig?.render(Math.min(elapsed,DEAL_STEP),now);else rig?.rest(now);lastFrame=now;
 }
 raf=requestAnimationFrame(frame);
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
  if(props.running&&!props.reducedMotion)raf=requestAnimationFrame(frame);
  rig.renderer.domElement.addEventListener('webglcontextlost',(event)=>{event.preventDefault();if(disposed)return;stop();painted.value=false;});
  rig.renderer.domElement.addEventListener('webglcontextrestored',()=>{if(disposed)return;rig?.rest();painted.value=true;if(props.running&&!props.reducedMotion&&!raf)raf=requestAnimationFrame(frame);});
 }catch(error){if(!disposed){console.warn('Jointed dealer unavailable; using still artwork.',error);rig?.dispose();rig=undefined;}}
 if(!disposed)emit('ready');
});
watch(()=>props.delivery,(value,previous)=>{if(value&&value.id===previous?.id)rig?.retarget(value);else begin();},{flush:'post'});
watch(()=>props.running&&!props.reducedMotion,value=>{if(!value)stop();else if(painted.value&&!raf)raf=requestAnimationFrame(frame);});
onBeforeUnmount(()=>{disposed=true;cancelAnimationFrame(raf);resize?.disconnect();rig?.dispose();});
</script>
<template>
 <div class="dealer-character" :data-game="game" :data-renderer="painted?'jointed-3d':'still'" role="img" :aria-label="descriptions[game]">
  <div v-if="!painted" class="dealer-fallback"><img :src="posters[game]" alt="" decoding="async"/></div>
  <div ref="host" class="dealer-mesh" aria-hidden="true"/>
 </div>
</template>
