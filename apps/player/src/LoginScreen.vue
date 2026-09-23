<script setup lang="ts">
import { ref } from 'vue';
import Icon from '@new-game/ui/Icon.vue';
import { signIn } from './api';
import {stage} from './staging-state';
const emit = defineEmits<{ preview: []; help: []; authenticated: [] }>();
const account = ref('');
const password = ref('');
const showPassword = ref(false);
const error = ref('');
const busy = ref(false);
async function submit() {
  busy.value=true;error.value='';
  try {const accountData=await signIn(account.value,password.value);if(accountData.role!=='PLAYER')throw new Error('Use the operator console for staff accounts.');emit('authenticated');}
  catch(problem){error.value=problem instanceof Error?problem.message:'Unable to sign in.';}
  finally{password.value='';busy.value=false;}
}
</script>
<template>
  <section class="login-world" aria-label="Player login">
    <div class="city-vignette"></div>
    <header class="login-top"><span class="private-club"><Icon name="shield" :size="15" /> PRIVATE ARCADE</span><button class="round-control" aria-label="Help with sign in" @click="emit('help')"><Icon name="help" /></button></header>
    <div class="login-content">
      <div class="login-brand"><span class="brand-crown">✦</span><div class="arcade-wordmark">NEW<span>GAME</span></div><p>YOUR PRIVATE ARCADE</p></div>
      <div class="login-cabinet">
        <div class="cabinet-corner top-left"></div><div class="cabinet-corner top-right"></div>
        <div class="login-marquee"><span></span><h1>WELCOME BACK</h1><span></span></div>
        <p class="login-lead">Your next adventure is waiting.</p>
        <form class="login-form" @submit.prevent="submit">
          <label for="player-account">PLAYER ID</label>
          <div class="arcade-input"><Icon name="user" :size="19" /><input id="player-account" v-model="account" name="username" autocomplete="username" placeholder="Enter your player ID" required maxlength="128" @input="error = ''"></div>
          <label for="player-password">PASSWORD</label>
          <div class="arcade-input"><Icon name="lock" :size="18" /><input id="player-password" v-model="password" name="password" :type="showPassword ? 'text' : 'password'" autocomplete="current-password" placeholder="Enter your password" required maxlength="256" @input="error = ''"><button type="button" class="password-toggle" :aria-label="showPassword ? 'Hide password' : 'Show password'" :aria-pressed="showPassword" @click="showPassword = !showPassword"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2 12s4-7 10-7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/><path v-if="showPassword" d="m3 3 18 18"/></svg></button></div>
          <button type="button" class="forgot-link" @click="emit('help')">Forgot your password?</button>
          <p v-if="error" class="login-error" role="alert">{{ error }}</p>
          <button type="submit" class="gold-button login-submit" :disabled="busy">{{busy ? 'SIGNING IN…' : 'SIGN IN'}} <Icon name="arrow" :size="19" /></button>
        </form>
        <div v-if="stage.enabled && stage.sampleLogin" class="sample-login"><strong>TRY THE SAMPLE ACCOUNT</strong><code>{{stage.sampleLogin.username}}</code><code>{{stage.sampleLogin.password}}</code><button @click="account=stage.sampleLogin.username;password=stage.sampleLogin.password">USE LOGIN</button></div><div class="login-separator"><span></span>NEW HERE?<span></span></div>
        <p class="invite-copy">Ask your group administrator for an invitation.</p>
        <button class="preview-entry" @click="emit('preview')">Explore arcade preview <Icon name="arrow" :size="16" /></button>
        <p class="login-build-note"><Icon name="lock" :size="13" /> Private accounts · Play credits only</p>
        <div class="cabinet-corner bottom-left"></div><div class="cabinet-corner bottom-right"></div>
      </div>
      <div class="login-values"><span><Icon name="shield" :size="14" />PRIVATE GROUP</span><i></i><span>JUST FOR FUN</span><i></i><span>NO CASH-OUT</span></div>
    </div>
    <footer class="login-bottom"><span>NEW GAME ORIGINALS</span><span>Eight arcade originals <i>·</i> Your private arcade</span><small>© 2026 New Game</small></footer>
  </section>
</template>
