<script setup lang="ts">
defineProps<{pose:number;running:boolean;reducedMotion:boolean}>();
</script>
<template>
 <div class="dealer-character" :class="{'dealer-resting':pose===0,'dealer-paused':!running||reducedMotion}" role="img" aria-label="Animated virtual dealer in a waistcoat and bow tie">
  <div class="dealer-halo" aria-hidden="true"></div>
  <div class="dealer-figure" aria-hidden="true"><span v-for="frame in 4" :key="frame" class="dealer-pose" :class="{'pose-active':pose===frame-1}" :style="{'background-position':`${(frame-1)%2*100}% ${Math.floor((frame-1)/2)*100}%`}"></span></div>
 </div>
</template>
