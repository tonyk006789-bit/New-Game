<script setup lang="ts">
import {computed} from 'vue';
import {winParticles,winStyles} from './win-effects';
const props=defineProps<{game:string;id:string;award:string;stake:string;running:boolean;reducedMotion:boolean;compact?:boolean;numbers?:number[]}>();
const theme=computed(()=>winStyles[props.game]||winStyles['coin-carnival']);
const particles=computed(()=>props.reducedMotion?[]:winParticles(props.game,props.id,props.award,props.stake,props.compact));
function finished(event:AnimationEvent){const target=event.target as HTMLElement;if(target.classList.contains('win-particle')){target.style.willChange='auto';target.hidden=true;}}
</script>
<template><div class="win-burst" @animationend="finished" :class="[`burst-${theme.motion}`,`motif-${theme.motif}`,{'burst-paused':!running,'burst-still':reducedMotion,'burst-compact':compact}]" :style="{'--burst-color':theme.color,'--burst-accent':theme.accent}" aria-hidden="true" :data-theme="game">
 <div class="win-aura"></div><div class="win-shockwave"></div><div class="win-shockwave second"></div>
 <span v-for="p in particles" :key="`${id}-${p.id}`" class="win-particle" :class="p.coin?'token':'spark'" :style="{'--dx':`${p.dx}px`,'--dy':`${p.dy}px`,'--rise':`${p.rise}px`,'--spin':`${p.spin}deg`,'--size':`${p.size}px`,'--delay':`${p.delay}ms`,'--duration':`${p.duration}ms`,'--angle':`${p.angle}deg`}"><i>{{p.coin?(numbers?.length?numbers[p.id%numbers.length]:theme.glyph):'✦'}}</i></span>
</div></template>
