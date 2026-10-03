<script setup lang="ts">
import {computed,onBeforeUnmount,onMounted,ref,watch} from 'vue';
import {fishGuide,type FishGame} from '@new-game/game-math';
import {catalog} from '@new-game/contracts';
import Icon from '@new-game/ui/Icon.vue';
import AquaticSprite from './AquaticSprite.vue';
import {api} from './api';
import type {ReefRoom,ReefTable} from './reef-room';
const props=defineProps<{running:boolean;authenticated:boolean;game:FishGame}>();
const emit=defineEmits<{join:[room:ReefRoom|null]}>();
const tables=ref<ReefTable[]>([]),loading=ref(true),busy=ref(false),error=ref('');
const gameInfo=computed(()=>catalog.find(g=>g.id===props.game)!);
const cards=computed(()=>[...tables.value.filter(t=>(t.game||'reef-party')===props.game),{id:'new',number:tables.value.length+1,capacity:4,seats:[]}]);
let disposed=false,poll:ReturnType<typeof setInterval>|undefined,refreshing=false;
async function refresh(){
 if(disposed||!props.running||refreshing)return;
 if(!props.authenticated){loading.value=false;return;}
 refreshing=true;
 try{const result=await api<{tables:ReefTable[]}>('practice/reef/tables');if(!disposed){tables.value=result.tables;error.value='';}}
 catch(e){if(!disposed)error.value=(e as Error).message;}finally{refreshing=false;loading.value=false;}
}
async function join(table:ReefTable,seat?:number){
 if(busy.value||!props.running)return;
 if(!props.authenticated){emit('join',null);return;}
 busy.value=true;error.value='';
 try{
  const room=await api<ReefRoom>('practice/reef/join',{game:props.game,...(table.id==='new'?{newTable:true}:{roomId:table.id}),...(seat?{seat}:{})});
  if(disposed){await api('practice/reef/leave',{roomId:room.id});return;}emit('join',room);
 }catch(e){await refresh();error.value=(e as Error).message;}finally{busy.value=false;}
}
onMounted(()=>{void refresh();poll=setInterval(()=>void refresh(),3000);});
watch(()=>props.running,value=>{if(value)void refresh();});
onBeforeUnmount(()=>{disposed=true;clearInterval(poll);});
</script>
<template>
 <section class="fishing-lobby" :class="[game,{'stage-paused':!running}]" aria-label="Fishing table lobby">
  <header class="fishing-lobby-title"><span>{{game==='abyss-legends'?'THE ABYSS LOUNGE':'THE OCEAN LOUNGE'}}</span><h2>Choose your table</h2><p>Four seats. Solo players get three bot teammates.</p></header>
  <p v-if="error" class="fishing-lobby-error" role="alert">{{error}}</p>
  <p v-if="loading" class="fishing-loading" role="status">Finding open tables…</p>
  <div v-else class="fishing-tables">
   <article v-for="table in cards" :key="table.id" class="fish-table-card" :data-table-id="table.id">
    <header><div><small>{{gameInfo.name}}</small><h3>{{table.id==='new'?'OPEN A TABLE':`TABLE ${String(table.number).padStart(2,'0')}`}}</h3></div><span class="table-occupancy">{{table.seats.length}} / 4 <Icon name="user" :size="14"/></span></header>
    <div class="lounge-table">
     <div class="table-water" aria-hidden="true"><span class="table-caustics"></span><AquaticSprite v-for="(species,index) in fishGuide(game).slice(0,6)" :key="index" :species="species" class="table-creature" :class="`creature-${index}`"/><div class="table-emblem">{{gameInfo.name.split(' ')[0]}} <b>{{gameInfo.name.split(' ')[1]}}</b></div></div>
     <div class="table-machine-front" aria-hidden="true"><i></i><span>NEW GAME<br><b>OCEAN SERIES</b></span><i></i></div>
     <AquaticSprite v-for="seat in 4" :key="`cannon-${seat}`" :cannon="seat-1" :game="game" class="table-cannon" :class="`position-${seat}`"/>
     <button v-for="seat in 4" :key="seat" class="lounge-seat" :class="[`position-${seat}`,{occupied:table.seats.some(s=>s.seat===seat),yours:table.seats.some(s=>s.seat===seat&&s.yours)}]" :disabled="busy||!running||table.seats.some(s=>s.seat===seat&&!s.yours)" :aria-label="`${table.id==='new'?'New table':`Table ${table.number}`} seat ${seat}${table.seats.some(s=>s.seat===seat)?' occupied':' open'}`" @click="join(table,seat)">
      <span class="seat-chair"><Icon name="user" :size="25"/><i>{{seat}}</i></span><b>{{table.seats.find(s=>s.seat===seat)?.display_name||'OPEN SEAT'}}</b>
     </button>
    </div>
    <footer><span>{{table.seats.length===4?'TABLE FULL':`${4-table.seats.length} SEATS OPEN`}}</span><button class="gold-button" :disabled="busy||!running||table.seats.length===4&&!table.seats.some(s=>s.yours)" @click="join(table)">{{!authenticated?'EXPLORE TABLE':table.seats.some(s=>s.yours)?'RETURN TO TABLE':table.id==='new'?'OPEN TABLE':'JOIN TABLE'}}<Icon name="arrow" :size="16"/></button></footer>
   </article>
  </div>
 </section>
</template>
