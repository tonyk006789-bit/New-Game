<script setup lang="ts">
import {computed,ref} from 'vue';
import {credentialHint,credentialPattern} from '@new-game/contracts';
import {api,type Account} from './api';
import {audioPreferences,unlockAudio,playSound,musicNow,selectMusicTrack} from './audio';
import {musicPlaylists} from './music-score';
const playlist=computed(()=>musicPlaylists[musicNow.scene]);
async function chooseTrack(event:Event){await unlockAudio();selectMusicTrack(Number((event.target as HTMLSelectElement).value));}
const props=defineProps<{account:Account|null;reducedMotion:boolean}>();
const emit=defineEmits<{'update:reducedMotion':[value:boolean];logout:[];passwordChanged:[]}>();
const changing=ref(false),busy=ref(false),error=ref(''),current=ref(''),password=ref(''),confirm=ref('');
async function change(){
 error.value='';if(password.value!==confirm.value){error.value='The new passwords do not match.';return;}
 busy.value=true;try{await api('auth/password',{currentPassword:current.value,newPassword:password.value});emit('passwordChanged');}catch(e){error.value=(e as Error).message;}finally{current.value='';password.value='';confirm.value='';busy.value=false;}
}
async function toggle(kind:'music'|'sound'){audioPreferences[kind]=!audioPreferences[kind];await unlockAudio();if(kind==='sound')playSound();}
</script>
<template><section class="arcade-panel settings-panel simple-settings">
 <div><span><strong>Music</strong><p>Original casino tracks · Changes with each game</p></span><button class="toggle" :class="{on:audioPreferences.music}" role="switch" :aria-checked="audioPreferences.music" aria-label="Music" @click="toggle('music')"><i></i></button></div>
 <p v-if="musicNow.status==='loading'" class="music-load-status" role="status">Loading instruments…</p><p v-if="musicNow.status==='unavailable'" class="music-load-status" role="status">Music could not load. Toggle Music to retry.</p><div class="music-library"><span><strong>Casino playlist</strong><p>31 original game scores · A different composition for every scene</p></span><select aria-label="Music track" :value="musicNow.index" @change="chooseTrack"><option v-for="(track,index) in playlist" :key="track.name" :value="index">{{track.name}}</option></select></div>
 <div><span><strong>Sound</strong><p>Buttons, cannons and wins</p></span><button class="toggle" :class="{on:audioPreferences.sound}" role="switch" :aria-checked="audioPreferences.sound" aria-label="Sound effects" @click="toggle('sound')"><i></i></button></div>
 <div><span><strong>Reduced motion</strong><p>Shorter reveals and calmer effects</p></span><button class="toggle" :class="{on:reducedMotion}" role="switch" :aria-checked="reducedMotion" aria-label="Reduced motion" @click="emit('update:reducedMotion',!props.reducedMotion)"><i></i></button></div>
 <div v-if="account"><span><strong>{{account.displayName}}</strong><p>{{account.username}}</p></span><button class="secondary" :aria-expanded="changing" @click="changing=!changing">Change password</button></div>
 <form v-if="changing&&account" class="password-form" @submit.prevent="change">
  <label>Current password<input v-model="current" type="password" autocomplete="current-password" required maxlength="256"></label>
  <label>New password<input v-model="password" type="password" autocomplete="new-password" required minlength="6" :pattern="credentialPattern" :title="credentialHint" maxlength="256" :placeholder="credentialHint"></label>
  <label>Confirm new password<input v-model="confirm" type="password" autocomplete="new-password" required minlength="6" :pattern="credentialPattern" :title="credentialHint" maxlength="256"></label>
  <p>Changing your password signs out all your devices.</p><p v-if="error" role="alert" class="error">{{error}}</p>
  <button class="gold-button" :disabled="busy">{{busy?'SAVING…':'SAVE PASSWORD'}}</button>
 </form>
 <div><span>{{account?'Signed in':'Guest preview'}}</span><button class="secondary" @click="emit('logout')">{{account?'SIGN OUT':'LOGIN'}}</button></div>
</section></template>
