<script setup lang="ts">
import {onMounted,ref} from 'vue';
import QRCode from 'qrcode';
const link=import.meta.env.VITE_PUBLIC_ARCADE_URL || (location.hostname==='localhost'||location.hostname==='127.0.0.1'?location.origin+'/':new URL('/',location.href).href);
const qr=ref(''),message=ref('');
onMounted(async()=>{try{qr.value=await QRCode.toDataURL(link,{width:320,margin:4,errorCorrectionLevel:'M',color:{dark:'#062f2b',light:'#ffffff'}});}catch{message.value='Use the link below to share.';}});
async function copy(){try{await navigator.clipboard.writeText(link);message.value='Link copied.';}catch{message.value='Select and copy the link below.';}}
async function share(){try{if(navigator.share)await navigator.share({title:'New Game',text:'Join our private arcade.',url:link});else await copy();}catch(e){if((e as Error).name!=='AbortError')await copy();}}
</script>
<template><div class="share-panel"><p>Scan to open New Game</p><img v-if="qr" :src="qr" alt="QR code linking to the New Game login page" width="280" height="280"><input :value="link" readonly aria-label="Platform link" @focus="($event.target as HTMLInputElement).select()"><div><button class="gold-button" @click="share">SHARE LINK</button><button class="secondary" @click="copy">COPY</button><a v-if="qr" :href="qr" download="new-game-qr.png" class="secondary">SAVE QR</a></div><p class="share-hint">Your friends will need their own player login.</p><p role="status">{{message}}</p></div></template>
