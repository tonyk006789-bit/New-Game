<script setup lang="ts">
import {computed,nextTick,onBeforeUnmount,onMounted,ref,watch} from 'vue';
import {Capacitor} from '@capacitor/core';
import {fitGameFrame,gameFrame,needsGameRotation,renderDimensions} from './game-screen';
import {displayPreferences} from './display-preferences';
import {lockGameOrientation} from './orientation';
const props=defineProps<{portrait:boolean;identity:string}>();
const emit=defineEmits<{orientationReady:[ready:boolean];back:[]}>();
const root=ref<HTMLElement>(),content=ref<HTMLElement>(),autoFit=ref(true),scale=ref(1),full=ref(false),rotate=ref(false),supported=ref(false);
const frameSize=computed(()=>gameFrame(props.portrait));
const outputSize=computed(()=>renderDimensions(displayPreferences.resolution,props.portrait));
const style=computed(()=>({width:`${frameSize.value.width}px`,height:`${frameSize.value.height}px`,transform:autoFit.value?`scale(${scale.value})`:undefined}));
let observer:ResizeObserver|undefined,frame=0;
function measure(){
 cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
  if(!root.value)return;
  const padding=getComputedStyle(root.value),w=root.value.clientWidth-parseFloat(padding.paddingLeft)-parseFloat(padding.paddingRight),h=root.value.clientHeight-parseFloat(padding.paddingTop)-parseFloat(padding.paddingBottom);
  scale.value=fitGameFrame(w,h,props.portrait,displayPreferences.resolution);
  const mobile=Capacitor.isNativePlatform()||matchMedia('(any-pointer: coarse)').matches;
  rotate.value=needsGameRotation(innerWidth,innerHeight,props.portrait,mobile);
  emit('orientationReady',!rotate.value);
 });
}
async function toggleFit(){autoFit.value=!autoFit.value;await nextTick();measure();}
async function toggleFullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await (root.value?.closest('.arcade-app') as HTMLElement|undefined)?.requestFullscreen();}catch{/* Rotation instructions remain usable without full screen. */}await lockGameOrientation(props.portrait?'portrait':'landscape');measure();}
function fullscreenChanged(){full.value=!!document.fullscreenElement;void lockGameOrientation(props.portrait?'portrait':'landscape');measure();}
watch(()=>[props.portrait,props.identity],async()=>{await lockGameOrientation(props.portrait?'portrait':'landscape');await nextTick();measure();});
watch(()=>displayPreferences.resolution,measure);
onMounted(()=>{supported.value=!!document.fullscreenEnabled;observer=new ResizeObserver(measure);if(root.value)observer.observe(root.value);window.addEventListener('resize',measure);window.visualViewport?.addEventListener('resize',measure);document.addEventListener('fullscreenchange',fullscreenChanged);void lockGameOrientation(props.portrait?'portrait':'landscape');measure();});
onBeforeUnmount(()=>{cancelAnimationFrame(frame);observer?.disconnect();window.removeEventListener('resize',measure);window.visualViewport?.removeEventListener('resize',measure);document.removeEventListener('fullscreenchange',fullscreenChanged);void lockGameOrientation(null);emit('orientationReady',true);});
</script>
<template><div ref="root" class="game-viewport fixed-game-frame" :class="{'auto-fit':autoFit,'natural-size':!autoFit,'needs-rotation':rotate}" :data-orientation="portrait?'portrait':'landscape'" :data-fit-scale="scale.toFixed(3)" :data-resolution="displayPreferences.resolution" :data-render-width="outputSize.width" :data-render-height="outputSize.height"><div ref="content" class="fit-content" :style="style" :inert="rotate"><slot :auto-fit="autoFit" :toggle-fit="toggleFit" :fullscreen="full" :toggle-fullscreen="toggleFullscreen" :fullscreen-supported="supported"/></div><section v-if="rotate" class="orientation-gate" aria-label="Rotate to play"><span aria-hidden="true">↻</span><h2>Turn your device {{portrait?'upright':'sideways'}}</h2><p>This game plays in {{portrait?'portrait':'landscape'}}.</p><button v-if="supported&&!full" @click="toggleFullscreen">FULL SCREEN</button><button @click="emit('back')">BACK TO LOBBY</button></section></div></template>
