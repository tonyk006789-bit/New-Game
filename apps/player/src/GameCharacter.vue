<script setup lang="ts">
import {characterCell,characterBox,characterNames} from './expansion-theme';
defineProps<{game:string;compact?:boolean}>();
</script>
<template><figure v-if="characterCell(game)>=0" class="game-character" :class="{'character-compact':compact}"><svg :viewBox="characterBox(game)" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><image href="/art/expansion-posters-v28.png" width="1536" height="1024"/></svg><figcaption>{{characterNames[characterCell(game)]}}</figcaption></figure></template>
