<script setup lang="ts">
import {audioPreferences,musicNow,nextMusicTrack,unlockAudio} from './audio';
async function toggle(){audioPreferences.music=!audioPreferences.music;await unlockAudio();}
</script>
<template><div class="music-controls" :data-audio-status="musicNow.status"><button class="game-music-button" :aria-pressed="audioPreferences.music" :aria-label="`Music ${audioPreferences.music?'on':'off'}: ${musicNow.title}`" :title="`${musicNow.title} · ${musicNow.index+1}/${musicNow.total}`" :data-track="musicNow.scene" @click="toggle">♫</button><button v-if="audioPreferences.music" class="game-music-button music-next" aria-label="Next music track" :title="`Next track · playing ${musicNow.title}`" @click="nextMusicTrack">⏭</button></div></template>
