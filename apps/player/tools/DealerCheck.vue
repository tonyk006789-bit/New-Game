<script setup lang="ts">
import {onMounted,onBeforeUnmount,ref,watch} from 'vue';
import type {BlackjackGame} from '@new-game/game-math';
import {DealerRig} from '../src/dealer-rig';
import {DEAL_STEP} from '../src/blackjack-dealing';
const host=ref<HTMLElement>(),game=ref<BlackjackGame>('royal-blackjack'),time=ref(0),status=ref('Loading'),loop=ref(false);let rig:DealerRig|undefined,raf=0,started=0,generation=0;
async function load(){const gen=++generation;cancelAnimationFrame(raf);loop.value=false;rig?.dispose();status.value='Loading';rig=new DealerRig(host.value!,game.value);await rig.load();if(gen!==generation)return;rig.start({id:1,kind:'deal',card:{rank:1,suit:0},target:{x:.5,y:.82,width:58/1280,height:82/500}});rig.render(time.value);status.value='Ready';}
function render(){rig?.render(Number(time.value));}
function tick(now:number){time.value=Math.round((now-started)%(DEAL_STEP+400));rig?.render(Math.min(time.value,DEAL_STEP));if(loop.value)raf=requestAnimationFrame(tick);}
function play(){loop.value=!loop.value;if(loop.value){started=performance.now();raf=requestAnimationFrame(tick);}else cancelAnimationFrame(raf);}
watch(game,load);onMounted(load);onBeforeUnmount(()=>{generation++;cancelAnimationFrame(raf);rig?.dispose();});
</script>
<template><main><h1>Dealer motion acceptance</h1><p>Local presentation fixture · no account, stake or credit action</p><nav><select v-model="game" aria-label="Dealer"><option value="royal-blackjack">Royal</option><option value="double-deck-blackjack">Double Deck</option><option value="european-blackjack">European</option></select><button @click="play">{{loop?'Pause':'Play loop'}}</button><button v-for="n in [0,180,260,450,650,760,890,1120]" :key="n" @click="time=n;render()">{{n}} ms</button></nav><label>Timeline <input v-model="time" aria-label="Timeline" type="range" min="0" :max="DEAL_STEP" @input="render"/> {{time}} ms · {{status}}</label><div class="stage"><div class="felt"/><div ref="host" class="host"/></div></main></template>
<style>body{margin:0;background:#10101c;color:#e7e2d4;font:14px system-ui}main{padding:16px}h1{font-size:20px;margin:0}p{color:#a9a1bc}nav{display:flex;gap:8px;margin:12px 0}button,select{padding:8px;background:#29253e;color:white;border:1px solid #665678;border-radius:6px}label{display:flex;gap:12px;align-items:center}input{width:500px}.stage{width:1280px;height:500px;position:relative;background:radial-gradient(ellipse at top,#443454,#0d101f);overflow:hidden;margin-top:12px}.felt{position:absolute;inset:41% -5% -30%;border:7px solid #14131e;border-top:8px solid #a89060;border-radius:50% 50% 0 0/15% 15% 0 0;background:radial-gradient(ellipse at 50% 0%,#2e375e,#11182b 77%)}.host{position:absolute;inset:0}.host canvas{width:100%;height:100%}</style>
