<script setup lang="ts">
import {onMounted,onBeforeUnmount,ref} from 'vue';
import {isNewRelease} from './client-release';
defineProps<{safe:boolean}>();
const available=ref(false);
let timer:ReturnType<typeof setInterval>|undefined,checking=false,disposed=false;
const current=document.querySelector<HTMLScriptElement>('script[type="module"][src^="/assets/index-"]')?.getAttribute('src')||null;
async function check(){
 if(!current||checking||disposed||document.hidden||!navigator.onLine)return;
 checking=true;
 try{const response=await fetch('/',{cache:'no-store',credentials:'same-origin',headers:{Accept:'text/html'},signal:AbortSignal.timeout(8000)});if(response.ok){const html=await response.text();if(!disposed)available.value=isNewRelease(current,html);}}catch{/* Offline checks never block account operations or games. */}finally{checking=false;}
}
function reload(){location.reload();}
onMounted(()=>{void check();timer=setInterval(()=>void check(),60000);document.addEventListener('visibilitychange',check);window.addEventListener('online',check);});
onBeforeUnmount(()=>{disposed=true;clearInterval(timer);document.removeEventListener('visibilitychange',check);window.removeEventListener('online',check);});
</script>
<template><aside v-if="available" class="client-update-notice" role="status"><span>An updated version is ready.<small v-if="!safe">Finish your current action and return to the lobby or close the form to reload.</small></span><button :disabled="!safe" @click="reload">Reload update</button></aside></template>
<style scoped>.client-update-notice{position:fixed;z-index:100000;left:12px;right:12px;bottom:72px;max-width:620px;margin:auto;display:flex;align-items:center;gap:16px;padding:14px 18px;background:#152238;color:#fff;border:1px solid #9ac8ff;border-radius:10px;box-shadow:0 5px 24px #0005;font:14px/1.4 Arial}.client-update-notice small{display:block;margin-top:5px;color:#d0e0f6;font-size:12px}.client-update-notice button{flex-shrink:0;min-height:44px;border:0;border-radius:7px;padding:8px 12px;background:#cee5ff;color:#10233a;cursor:pointer}.client-update-notice button:disabled{opacity:.55;cursor:default}</style>
