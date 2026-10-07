<script setup lang="ts">
import {computed,nextTick,onBeforeUnmount,onMounted,ref,watch} from 'vue';
const props=defineProps<{portrait:boolean;identity:string}>();
const root=ref<HTMLElement>(),content=ref<HTMLElement>(),autoFit=ref(true),scale=ref(1),width=ref(1280),full=ref(false);
const supported=ref(false);let observer:ResizeObserver|undefined,frame=0;
const style=computed(()=>({width:`${width.value}px`,transform:autoFit.value?`scale(${scale.value})`:undefined}));
function measure(){
 cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
  if(!root.value||!content.value)return;
  const room=root.value.clientWidth;
  width.value=Math.min(room,props.portrait?460:1440);
  const natural=content.value.scrollHeight;
  const padding=getComputedStyle(root.value);
  scale.value=Math.min(1,(root.value.clientHeight-parseFloat(padding.paddingTop)-parseFloat(padding.paddingBottom))/Math.max(1,natural));
 });
}
async function toggleFit(){autoFit.value=!autoFit.value;await nextTick();measure();}
async function toggleFullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await (root.value?.closest('.arcade-app') as HTMLElement|undefined)?.requestFullscreen();}catch{/* Unsupported full screen keeps automatic fitting available. */}}
function fullscreenChanged(){full.value=!!document.fullscreenElement;measure();}
watch(()=>[props.portrait,props.identity],async()=>{await nextTick();measure();});
onMounted(()=>{supported.value=!!document.fullscreenEnabled;observer=new ResizeObserver(measure);if(root.value)observer.observe(root.value);if(content.value)observer.observe(content.value);window.visualViewport?.addEventListener('resize',measure);document.addEventListener('fullscreenchange',fullscreenChanged);measure();});
onBeforeUnmount(()=>{cancelAnimationFrame(frame);observer?.disconnect();window.visualViewport?.removeEventListener('resize',measure);document.removeEventListener('fullscreenchange',fullscreenChanged);});
</script>
<template><div ref="root" class="game-viewport" :class="{'auto-fit':autoFit,'natural-size':!autoFit}" :data-fit-scale="scale.toFixed(3)"><div ref="content" class="fit-content" :style="style"><slot :auto-fit="autoFit" :toggle-fit="toggleFit" :fullscreen="full" :toggle-fullscreen="toggleFullscreen" :fullscreen-supported="supported"/></div></div></template>
