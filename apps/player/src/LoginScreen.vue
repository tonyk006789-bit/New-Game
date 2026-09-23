<script setup lang="ts">
import { ref } from 'vue';

import { signIn } from './api';
import {stage} from './staging-state';
defineProps<{notice?:string}>();
const remember=ref(false);
const emit = defineEmits<{ preview: []; help: []; authenticated: [] }>();
const account = ref('');
try{account.value=localStorage.getItem('ng-remembered-player')||'';remember.value=!!account.value;}catch{/* Optional player ID only. */}
const password = ref('');
const showPassword = ref(false);
const error = ref('');
const busy = ref(false);
async function submit() {
  busy.value=true;error.value='';try{if(remember.value)localStorage.setItem('ng-remembered-player',account.value);else localStorage.removeItem('ng-remembered-player');}catch{/* Passwords are never persisted here. */}
  try {const accountData=await signIn(account.value,password.value);if(accountData.role!=='PLAYER')throw new Error('Use the operator console for staff accounts.');emit('authenticated');}
  catch(problem){error.value=problem instanceof Error?problem.message:'Unable to sign in.';}
  finally{password.value='';busy.value=false;}
}
</script>
<template>
 <section class="simple-login" aria-label="Player login">
  <div class="simple-login-card"><span class="login-monogram">NG</span><p class="login-name">NEW GAME</p><h1>WELCOME</h1>
   <form @submit.prevent="submit">
    <label class="sr-only" for="player-account">Player ID</label><input id="player-account" v-model="account" autocomplete="username" placeholder="Player ID" required maxlength="64">
    <label class="sr-only" for="player-password">Password</label><div class="simple-password"><input id="player-password" v-model="password" :type="showPassword?'text':'password'" autocomplete="current-password" placeholder="Password" required maxlength="256"><button type="button" :aria-label="showPassword?'Hide password':'Show password'" :aria-pressed="showPassword" @click="showPassword=!showPassword">{{showPassword?'HIDE':'SHOW'}}</button></div>
    <div class="login-options"><label><input v-model="remember" type="checkbox"> Remember ID</label><button type="button" @click="emit('help')">Forgot password?</button></div>
    <p v-if="error" class="error" role="alert">{{error}}</p><p v-if="notice" role="status">{{notice}}</p>
    <div class="login-buttons"><button type="button" class="guest-button" @click="emit('preview')">GUEST</button><button class="login-button" type="submit" :disabled="busy">{{busy?'SIGNING IN…':'LOGIN'}}</button></div>
   </form>
   <div v-if="stage.enabled&&stage.sampleLogin" class="simple-sample"><span>Sample: {{stage.sampleLogin.username}} / {{stage.sampleLogin.password}}</span><button @click="account=stage.sampleLogin.username;password=stage.sampleLogin.password">USE LOGIN</button></div>
  </div><small class="login-footnote">Private arcade · Play credits only</small>
 </section>
</template>
