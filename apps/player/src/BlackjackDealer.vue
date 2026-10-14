<script setup lang="ts">
import {computed,onBeforeUnmount,onMounted,ref,watch} from 'vue';
import type {Application,MeshPlane} from 'pixi.js';
import type {BlackjackGame} from '@new-game/game-math';
import assets from './presentation-assets.json';
import {dealerReach,dealerVertex} from './dealer-motion';
import {DEAL_STEP} from './blackjack-dealing';
const props=defineProps<{game:BlackjackGame;cue:number;active:boolean;running:boolean;reducedMotion:boolean}>();
const emit=defineEmits<{ready:[]}>();
const dealers={
 'royal-blackjack':{art:assets['dealer-royal'].url,description:'Royal Blackjack virtual dealer: woman with a brown bob, black waistcoat and bow tie'},
 'double-deck-blackjack':{art:assets['dealer-double'].url,description:'Double Deck Blackjack virtual dealer: man with short dark hair, a neat beard and burgundy waistcoat'},
 'european-blackjack':{art:assets['dealer-european'].url,description:'European Blackjack virtual dealer: woman with a black hair bun, navy waistcoat and necktie'}
};
const dealer=computed(()=>dealers[props.game]),host=ref<HTMLElement>(),painted=ref(false);
let app:Application|undefined,plane:MeshPlane|undefined,base:Float32Array|undefined,started=0,disposed=false,destroyed=false,ready=false;
function disposeRenderer(){if(app?.renderer&&!destroyed){destroyed=true;app.destroy(true,{children:true});}}
function imageReady(){if(!ready){ready=true;emit('ready');}}
function draw(reach:number){
 if(!app||!plane||!base)return;
 const positions=plane.geometry.positions;
 for(let i=0;i<positions.length;i+=2){const [x,y]=dealerVertex(base[i]/640,base[i+1]/640,reach);positions[i]=x*640;positions[i+1]=y*640;}
 plane.geometry.getBuffer('aPosition').update();
}
function stop(){if(destroyed||!app?.renderer)return;app.stop();draw(0);app.render();}
function begin(){
 if(!painted.value||!plane||!app?.renderer||!props.active||!props.running||props.reducedMotion)return;
 started=performance.now();app.start();
}
onMounted(async()=>{
 try{
  const {Application,Assets,MeshPlane}=await import('pixi.js');if(disposed)return;
  const instance=new Application();app=instance;
  await instance.init({width:640,height:640,resolution:1,backgroundAlpha:0,antialias:true,autoStart:false,preference:'webgl',powerPreference:'low-power'});
  if(disposed){disposeRenderer();return;}
  const texture=await Assets.load(dealer.value.art);if(disposed){disposeRenderer();return;}
  plane=new MeshPlane({texture,verticesX:25,verticesY:25});base=new Float32Array(plane.geometry.positions);
  instance.stage.addChild(plane);host.value?.append(instance.canvas);draw(0);instance.render();painted.value=true;imageReady();
  instance.canvas.addEventListener('webglcontextlost',()=>{if(disposed||destroyed)return;painted.value=false;instance.stop();});
  instance.ticker.add(()=>{const elapsed=performance.now()-started;draw(dealerReach(elapsed));if(elapsed>=DEAL_STEP)instance.stop();});
 }catch{if(!disposed){painted.value=false;imageReady();}disposeRenderer();/* A static fallback remains available. */}
});
watch(()=>props.cue,begin);
watch(()=>props.active&&props.running&&!props.reducedMotion,enabled=>{if(!enabled)stop();});
onBeforeUnmount(()=>{disposed=true;disposeRenderer();});
</script>
<template>
 <div class="dealer-character" :data-game="game" :class="{'dealer-paused':!running||reducedMotion}" role="img" :aria-label="dealer.description">
  <div class="dealer-halo" aria-hidden="true"></div>
  <div class="dealer-figure" aria-hidden="true"><img class="dealer-still" :class="{'dealer-covered':painted}" :src="dealer.art" alt="" decoding="async" fetchpriority="high"/><div ref="host" class="dealer-mesh"/></div>
 </div>
</template>
