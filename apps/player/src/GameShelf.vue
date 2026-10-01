<script setup lang="ts">
import {computed,ref,watch} from 'vue';
import {catalog,type GameId} from '@new-game/contracts';
import GamePoster from './GamePoster.vue';
const props=defineProps<{games:readonly (typeof catalog)[number][];favorites:string[];running:boolean}>();
const emit=defineEmits<{open:[id:GameId];favorite:[id:GameId]}>();
const page=ref(0),pages=computed(()=>Math.max(1,Math.ceil(props.games.length/8)));
const visible=computed(()=>props.games.slice(page.value*8,page.value*8+8));
watch(()=>props.games,()=>{page.value=0;});
function change(direction:number){page.value=Math.max(0,Math.min(pages.value-1,page.value+direction));}
let startX=0,startY=0,swiped=false;
function start(event:PointerEvent){startX=event.clientX;startY=event.clientY;swiped=false;}
function end(event:PointerEvent){const dx=event.clientX-startX,dy=event.clientY-startY;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.5){swiped=true;change(dx<0?1:-1);}}
function open(id:GameId){if(!swiped&&props.running)emit('open',id);swiped=false;}
</script>
<template>
 <section class="casino-shelf" aria-label="Game shelf" :class="{'shelf-paused':!running}" @pointerdown="start" @pointerup="end" @keydown.left.prevent="change(-1)" @keydown.right.prevent="change(1)">
  <div class="shelf-lights" aria-hidden="true"><i v-for="n in 24" :key="n" :style="{'--bulb':n}"/></div>
  <div class="casino-shelf-grid">
   <article v-for="game in visible" :key="game.id" class="shelf-game" :style="{'--tile-color':game.color}">
    <button class="shelf-play" :aria-label="`Play ${game.name}`" :disabled="!running" @click="open(game.id)">
     <GamePoster :game="game.id" :name="game.name"/>
     <span v-if="['abyss-legends','ruby-rush','sapphire-crown','solar-fortune'].includes(game.id)" class="new-ribbon">NEW</span>
     <span class="shelf-game-caption"><b>{{game.name}}</b><small>{{game.detail}}</small></span>
     <span class="shelf-enter">PLAY <span>▶</span></span>
    </button>
    <button class="shelf-favorite" :aria-label="`${favorites.includes(game.id)?'Remove':'Add'} ${game.name} ${favorites.includes(game.id)?'from':'to'} favorites`" :aria-pressed="favorites.includes(game.id)" @click="emit('favorite',game.id)">{{favorites.includes(game.id)?'♥':'♡'}}</button>
   </article>
  </div>
  <p v-if="!games.length" class="shelf-empty">No games in this collection. Try another category or search.</p>
  <nav class="shelf-pagination" aria-label="Game shelf pages"><button aria-label="Previous game page" :disabled="page===0" @click="change(-1)">❮</button><span role="status">{{games.length ? page*8+1 : 0}}–{{Math.min((page+1)*8,games.length)}} OF {{games.length}}</span><button v-for="(_,index) in pages" :key="index" class="shelf-dot" :aria-label="`Game page ${index+1}`" :aria-current="page===index?'page':undefined" @click="page=index"><span/></button><button aria-label="Next game page" :disabled="page>=pages-1" @click="change(1)">❯</button></nav>
 </section>
</template>
<style scoped>
.casino-shelf{position:relative;padding:20px 20px 8px;border:2px solid #c889ff;border-radius:12px;background:radial-gradient(ellipse at top,#45134888,transparent 60%),#0d071f;box-shadow:inset 0 0 0 4px #161030,inset 0 0 30px #b030ff30,0 0 10px #a839ff44;touch-action:pan-y}
.shelf-lights{position:absolute;inset:5px 15px auto;display:flex;justify-content:space-between;pointer-events:none}.shelf-lights i{width:4px;height:4px;border-radius:50%;background:#ffe3a2;box-shadow:0 0 7px #ffbc51;animation:bulb-glimmer 2s infinite;animation-delay:calc(var(--bulb)*.12s)}
.casino-shelf-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:18px}.shelf-game{position:relative;min-width:0;border-radius:12px;container-type:inline-size}.shelf-play{display:block;width:100%;padding:0;position:relative;aspect-ratio:1.36;border:2px solid #e4be75;border-radius:12px;background:#140b23;box-shadow:0 0 0 2px #613a59,0 0 12px color-mix(in srgb,var(--tile-color) 35%,transparent);overflow:hidden;cursor:pointer;text-align:center;transition:transform .16s,box-shadow .16s}.shelf-play:hover{transform:translateY(-3px);box-shadow:0 0 0 2px #ffeda6,0 0 22px color-mix(in srgb,var(--tile-color) 60%,transparent)}.shelf-play:focus-visible{outline:3px solid #fff6b2;outline-offset:5px}.shelf-play:disabled{opacity:.65}.shelf-play :deep(.arcade-poster){position:absolute;inset:0 0 27%;height:auto}.shelf-play :deep(.machine-title){font-size:clamp(23px,15cqw,43px);bottom:9%;line-height:.84;z-index:2}.shelf-play :deep(.poster-ribbon){display:none}.shelf-play :deep(.poster-symbols){inset:-15% 5% 27%}.shelf-play :deep(.painted-poster-art){inset:0;width:100%;height:100%}.shelf-game-caption{position:absolute;bottom:0;left:0;right:0;height:28%;display:flex;flex-direction:column;justify-content:center;gap:3px;background:linear-gradient(#422347,#170c29);border-top:1px solid #c49861;color:#ffe2a4}.shelf-game-caption b{font:800 clamp(10px,5.8cqw,17px) Georgia;letter-spacing:.04em}.shelf-game-caption small{font:600 clamp(7px,3.6cqw,11px) Arial;color:#cfbedc;letter-spacing:.07em}.shelf-enter{position:absolute;inset:auto 0 28%;background:#120b23d9;padding:7px;color:#ffe69b;opacity:0;transform:translateY(100%);transition:.15s;font:800 11px Arial;letter-spacing:.2em}.shelf-play:hover .shelf-enter,.shelf-play:focus-visible .shelf-enter{opacity:1;transform:none}.new-ribbon{position:absolute;top:9px;left:-4px;padding:4px 14px 4px 9px;border-radius:0 4px 4px 0;background:linear-gradient(#ffef99,#e39b31);color:#601929;font:900 10px Arial;letter-spacing:.12em;box-shadow:0 2px 5px #0008}.shelf-favorite{position:absolute;top:5px;right:5px;width:36px;height:36px;min-height:0;padding:0;border:1px solid #e0b574;border-radius:8px;background:#241243db;color:#ffdda9;font-size:24px;cursor:pointer;line-height:1;z-index:3}.shelf-favorite[aria-pressed=true]{color:#ff689c;background:#511944}.shelf-pagination{display:flex;align-items:center;justify-content:center;gap:12px;margin-top:10px}.shelf-pagination>button{background:transparent;border:0;color:#f6d5ff;min-width:40px;min-height:36px;font-size:21px;cursor:pointer}.shelf-pagination>button:disabled{opacity:.25;cursor:default}.shelf-pagination>span{font:700 9px Arial;letter-spacing:.14em;color:#baaccd}.shelf-pagination .shelf-dot{min-width:20px;padding:0}.shelf-dot span{display:block;width:10px;height:10px;border:1px solid #7c53ae;border-radius:50%}.shelf-dot[aria-current] span{background:#84eaff;border-color:#c4f8ff;box-shadow:0 0 10px #38cfff}.shelf-empty{padding:60px 20px;text-align:center;color:#c8b2d8}.shelf-paused *{animation-play-state:paused!important}@keyframes bulb-glimmer{50%{opacity:.4}}
@media(max-width:650px){.casino-shelf{padding:17px 9px 5px}.casino-shelf-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.shelf-play{aspect-ratio:1.16}.shelf-favorite{width:32px;height:32px;font-size:21px}.shelf-pagination{gap:5px}.new-ribbon{font-size:8px;padding-right:9px}}
@media(max-height:600px) and (min-width:651px){.casino-shelf{padding:13px 12px 3px}.casino-shelf-grid{gap:10px}.shelf-play{aspect-ratio:1.58}.shelf-pagination{margin-top:3px}.shelf-play :deep(.machine-title){font-size:clamp(18px,12cqw,31px)}}
@media(prefers-reduced-motion:reduce){.casino-shelf *{animation:none;transition:none}}
</style>
