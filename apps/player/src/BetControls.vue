<script setup lang="ts">
import {computed} from 'vue';
import {stage} from './staging-state';
import {stakeLimits,stagingProfile} from '@new-game/game-math';
import {formatCredits} from '@new-game/domain';
const props=defineProps<{game:string;ready:boolean;authenticated:boolean;busy?:boolean}>();
const disabled=computed(()=>!props.ready||props.busy||stage.busy||!!stage.pending);
function step(direction:number){if(!disabled.value)stage.stake=String(Math.max(stakeLimits.min,Math.min(stakeLimits.max,Number(stage.stake)+direction*stakeLimits.step)));}
</script>
<template><div v-if="stage.enabled && authenticated" class="bet-console" aria-label="Stake and return"><div class="bet-options incremental-stake"><small>STAKE</small><button aria-label="Decrease stake" :disabled="disabled||Number(stage.stake)<=stakeLimits.min" @click="step(-1)">−</button><label class="stake-dial"><span>PLAY CREDITS</span><select v-model="stage.stake" aria-label="Stake" :disabled="disabled"><option v-for="value in stagingProfile.stakes" :key="value" :value="value">{{formatCredits(value)}}</option></select></label><button aria-label="Increase stake" :disabled="disabled||Number(stage.stake)>=stakeLimits.max" @click="step(1)">+</button><button class="stake-max" aria-label="Maximum stake, 20 credits" :disabled="disabled||stage.stake==='2000'" @click="stage.stake='2000'">MAX</button></div><div class="stage-return"><small>{{busy?'PLAYING':'WIN'}}</small><b>{{busy?'—':stage.last?.game===game?formatCredits(stage.last.award):'0.00'}}</b><small v-if="!busy && stage.last?.game===game">NET {{formatCredits(stage.last.net)}}</small></div></div></template>
