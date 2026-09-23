<script setup lang="ts">
import {ref} from 'vue';
import {api,type Account} from './api';
import {audioPreferences,unlockAudio,playSound} from './audio';
const props=defineProps<{account:Account|null;reducedMotion:boolean}>();
const emit=defineEmits<{'update:reducedMotion':[value:boolean];logout:[];passwordChanged:[]}>();
const changing=ref(false),busy=ref(false),error=ref(''),current=ref(''),password=ref(''),confirm=ref('');
async function change(){
 error.value='';if(password.value!==confirm.value){error.value='The new passwords do not match.';return;}
 busy.value=true;try{await api('auth/password',{currentPassword:current.value,newPassword:password.value});emit('passwordChanged');}catch(e){error.value=(e as Error).message;}finally{current.value='';password.value='';confirm.value='';busy.value=false;}
}
async function toggle(kind:'music'|'sound'){await unlockAudio();audioPreferences[kind]=!audioPreferences[kind];if(kind==='sound')playSound();}
</script>
<template><section class="arcade-panel settings-panel simple-settings">
 <div><span><strong>Music</strong><p>Arcade background music</p></span><button class="toggle" :class="{on:audioPreferences.music}" role="switch" :aria-checked="audioPreferences.music" aria-label="Music" @click="toggle('music')"><i></i></button></div>
 <div><span><strong>Sound</strong><p>Buttons, cannons and wins</p></span><button class="toggle" :class="{on:audioPreferences.sound}" role="switch" :aria-checked="audioPreferences.sound" aria-label="Sound effects" @click="toggle('sound')"><i></i></button></div>
 <div><span><strong>Reduced motion</strong><p>Shorter reveals and calmer effects</p></span><button class="toggle" :class="{on:reducedMotion}" role="switch" :aria-checked="reducedMotion" aria-label="Reduced motion" @click="emit('update:reducedMotion',!props.reducedMotion)"><i></i></button></div>
 <div v-if="account"><span><strong>{{account.displayName}}</strong><p>{{account.username}}</p></span><button class="secondary" :aria-expanded="changing" @click="changing=!changing">Change password</button></div>
 <form v-if="changing&&account" class="password-form" @submit.prevent="change">
  <label>Current password<input v-model="current" type="password" autocomplete="current-password" required maxlength="256"></label>
  <label>New password<input v-model="password" type="password" autocomplete="new-password" required minlength="12" maxlength="256" placeholder="At least 12 characters"></label>
  <label>Confirm new password<input v-model="confirm" type="password" autocomplete="new-password" required minlength="12" maxlength="256"></label>
  <p>Changing your password signs out all your devices.</p><p v-if="error" role="alert" class="error">{{error}}</p>
  <button class="gold-button" :disabled="busy">{{busy?'SAVING…':'SAVE PASSWORD'}}</button>
 </form>
 <div><span>{{account?'Signed in':'Guest preview'}}</span><button class="secondary" @click="emit('logout')">{{account?'SIGN OUT':'LOGIN'}}</button></div>
</section></template>
