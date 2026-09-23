<script setup lang="ts">
import {computed,onBeforeUnmount,onMounted,ref,watch} from 'vue';
import {catalog,type GameId} from '@new-game/contracts';
import Icon from '@new-game/ui/Icon.vue';
import GamePoster from './GamePoster.vue';
const props=defineProps<{games:readonly (typeof catalog)[number][];favorites:string[];running:boolean;reducedMotion:boolean;playerName:string}>();
const emit=defineEmits<{open:[id:GameId];favorite:[id:GameId]}>();
const floor=ref<HTMLElement>(),x=ref(50),y=ref(92),walking=ref(false),facing=ref(1),pose=ref(0),destination=ref({x:50,y:92}),selected=ref<GameId|null>(null);
const spots=[{x:18,y:48},{x:39,y:45},{x:61,y:45},{x:82,y:48},{x:12,y:77},{x:34,y:74},{x:66,y:74},{x:88,y:77}];
const machines=computed(()=>props.games.map(game=>({...game,spot:spots[catalog.findIndex(item=>item.id===game.id)]})));
let raf=0,last=0,walkTime=0;
const status=computed(()=>selected.value?`Walking to ${catalog.find(game=>game.id===selected.value)?.name}`:walking.value?'Exploring the arcade':'Tap the floor to walk · Choose a cabinet to play');
function arrive(){walking.value=false;pose.value=0;const id=selected.value;selected.value=null;if(id&&props.running)emit('open',id);}
function walkTo(px:number,py:number,id:GameId|null=null){
 if(!props.running)return;
 destination.value={x:Math.max(4,Math.min(96,px)),y:Math.max(49,Math.min(94,py))};selected.value=id;facing.value=px<x.value?-1:1;walking.value=true;walkTime=0;
 if(props.reducedMotion){x.value=destination.value.x;y.value=destination.value.y;arrive();}
}
function choose(id:GameId){const machine=machines.value.find(game=>game.id===id);if(machine)walkTo(machine.spot.x,machine.spot.y+9,id);}
function walkFloor(event:PointerEvent){if((event.target as HTMLElement).closest('button'))return;const rect=floor.value!.getBoundingClientRect();floor.value?.focus({preventScroll:true});walkTo((event.clientX-rect.left)/rect.width*100,(event.clientY-rect.top)/rect.height*100);}
function keyboard(event:KeyboardEvent){
 if(event.target!==floor.value)return;
 const directions:Record<string,[number,number]>={ArrowLeft:[-9,0],a:[-9,0],ArrowRight:[9,0],d:[9,0],ArrowUp:[0,-7],w:[0,-7],ArrowDown:[0,7],s:[0,7]};
 if(directions[event.key]){event.preventDefault();const [dx,dy]=directions[event.key];walkTo(x.value+dx,y.value+dy);}
 if(event.key==='Enter'&&machines.value.length){event.preventDefault();const nearest=[...machines.value].sort((a,b)=>Math.hypot(a.spot.x-x.value,a.spot.y+9-y.value)-Math.hypot(b.spot.x-x.value,b.spot.y+9-y.value))[0];choose(nearest.id);}
}
function tick(now:number){const dt=Math.max(0,now-last)/1000;last=now;
 if(walking.value&&props.running){const dx=destination.value.x-x.value,dy=destination.value.y-y.value,d=Math.hypot(dx,dy),step=dt*55;walkTime+=dt;pose.value=1+Math.floor(walkTime*7)%2;if(d<=step){x.value=destination.value.x;y.value=destination.value.y;arrive();}else{x.value+=dx/d*step;y.value+=dy/d*step;}}
 raf=requestAnimationFrame(tick);
}
watch(()=>props.running,running=>{if(!running){walking.value=false;selected.value=null;pose.value=0;}});
watch(()=>props.games,()=>{walking.value=false;selected.value=null;pose.value=0;});
onMounted(()=>{raf=requestAnimationFrame(tick);});onBeforeUnmount(()=>cancelAnimationFrame(raf));
</script>
<template>
 <section class="interactive-hall" aria-label="Interactive arcade lobby">
  <div class="hall-marquee"><span>✦</span> NEW GAME GRAND ARCADE <span>✦</span></div>
  <div ref="floor" class="hall-floor" tabindex="0" aria-label="Walk around the arcade with arrow keys or WASD. Enter plays the nearest cabinet." @pointerdown="walkFloor" @keydown="keyboard">
   <article v-for="game in machines" :key="game.id" class="game-card hall-machine" :class="[game.category.toLowerCase(),game.id,{approaching:selected===game.id}]" :style="{'--tile-color':game.color,left:`${game.spot.x}%`,top:`${game.spot.y}%`,zIndex:Math.round(game.spot.y)}">
    <button class="hall-cabinet-button" :aria-label="`Explore ${game.name}`" :disabled="!running" @click="choose(game.id)">
     <span class="machine-crown">{{game.category==='Fish'?'FISH TABLE':game.category==='Keno'?'LUCKY NUMBERS':'REELS & FEATURES'}}</span>
     <span class="machine-screen"><GamePoster :game="game.id" :name="game.name" /></span>
     <span class="machine-deck"><i></i><b>{{game.name}}</b><i></i></span>
     <span class="machine-pedestal"><em>PLAY</em><span>✦</span><em>ENTER</em></span>
    </button>
    <button class="favorite-control" :class="{saved:favorites.includes(game.id)}" :aria-label="`${favorites.includes(game.id)?'Remove':'Add'} ${game.name} ${favorites.includes(game.id)?'from':'to'} favorites`" :aria-pressed="favorites.includes(game.id)" @click="emit('favorite',game.id)"><Icon name="star" :size="16" /></button>
   </article>
   <div v-if="walking" class="walk-marker" :style="{left:`${destination.x}%`,top:`${destination.y}%`}" aria-hidden="true"></div>
   <div class="hall-avatar" :class="{walking}" :data-x="x.toFixed(1)" :data-y="y.toFixed(1)" :style="{left:`${x}%`,top:`${y}%`,zIndex:Math.round(y)}" aria-label="Your walking character">
    <span class="avatar-ring"></span>
    <svg class="avatar-art" viewBox="0 0 512 1024" :style="{transform:`scaleX(${facing})`}" aria-hidden="true"><defs><filter id="avatar-key" color-interpolation-filters="sRGB"><feColorMatrix type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  3 -3 0 0 1" /><feComponentTransfer><feFuncA type="discrete" tableValues="0 0 0 1 1"/></feComponentTransfer></filter><clipPath id="avatar-crop"><rect width="512" height="1024"/></clipPath></defs><g clip-path="url(#avatar-crop)"><image href="/art/arcade-host-v7.png" :x="-pose*512" width="1536" height="1024" filter="url(#avatar-key)" /></g></svg>
    <span class="avatar-name">{{playerName}}</span>
   </div>
   <div v-if="!games.length" class="hall-empty">No cabinets in this collection.<small>Choose another category or search.</small></div>
  </div>
  <div class="hall-guide"><span class="hall-status" role="status">{{status}}</span><span>WALK <kbd>↑</kbd><kbd>←</kbd><kbd>↓</kbd><kbd>→</kbd> <b>↵</b> PLAY</span></div>
 </section>
</template>
