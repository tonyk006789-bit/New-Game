<script setup lang="ts">
import {computed} from 'vue';
import {cabinetGames,reefTierProfile,stagingProfile,stakeLimits,type StagingGame} from '@new-game/game-math';
const props=defineProps<{game:StagingGame;staked:boolean}>();
const instructions:Record<StagingGame,string[]>={
 'neon-sevens':['Choose your stake, then press SPIN. All five paylines are active on every spin.','Matches start on the leftmost reel and continue across adjacent reels. Use LINES to see the five paths.'],
 'jade-fortune':['Choose your stake, then press SPIN. All nine paylines are active.','The dragon is wild and substitutes for any matching symbol. Matches run from the leftmost reel across adjacent reels.'],
 'coin-carnival':['Choose your stake and start a spin. A coin in the middle row locks its whole reel.','The unlocked reels respin up to three times at no additional stake. Collect coins on all five reels to win.'],
 'temple-lights':['Choose your stake and press SPIN. The three horizontal rows are active.','Match three or more of the same symbol on adjacent reels, starting at the left edge.'],
 'aurora-vault':['Start a sequence with three crystals already locked in a 5 × 3 vault.','You have three pulses. New crystals stay locked and reset the remaining pulses to three. The sequence ends when the vault is full or no pulses remain.'],
 'ember-relics':['Start a sequence on the 6 × 5 relic board. Groups of four or more matching relics connected horizontally or vertically clear together.','New relics fall into the gaps. The sequence continues until no group remains, with a maximum of six clearing cascades. Diagonal connections do not count.'],
 'orchard-numbers':['Select 4–10 different numbers from 1–80, then press DRAW. Twenty different numbers are drawn.','QUICK PICK selects six numbers you can change. CLEAR removes your selection. A hit is one of your selected numbers appearing in the draw.'],
 'reef-party':['Choose a table and one of four player seats. Aim and click or tap for each shot. Several shots can travel at once; each valid hit uses the cannon stake selected when it was fired.','AUTO keeps firing in your aim direction. LOCK tracks a creature; tap another creature to change targets. FAST doubles the automatic firing cadence. Turning it on does not change capture chances or rewards.','Only a server-validated hit spends credits. Shots that miss, expire, or reach an already-caught creature cost nothing. A resisted hit still spends its stake.','Each valid hit has an independent capture chance. Larger creatures pay more and usually need more hits, but there is no fixed health bar or guaranteed number of shots.','Auto fire stops when you pause, leave the table, change stake, lose connection, or have insufficient credits. Catch celebrations show the existing award; there is no separate progressive jackpot.']
};
const lines=computed(()=>props.game==='neon-sevens'||props.game==='jade-fortune'?cabinetGames[props.game].lines:props.game==='temple-lights'?[[0,0,0,0,0],[1,1,1,1,1],[2,2,2,2,2]]:[]);
const tiers=Object.values(reefTierProfile.tiers);
</script>
<template>
 <div class="game-rules">
  <p class="rules-mode">{{staked?'PLAY CREDITS':'GUEST / FREE PREVIEW'}} <span>• No cash or prizes of value</span></p>
  <h3>HOW TO PLAY</h3>
  <ol><li v-for="instruction in instructions[game]" :key="instruction">{{instruction}}</li></ol>
  <section class="rules-return"><h3>{{game==='reef-party'?'CREATURE RETURNS':'WINNING RETURNS'}}</h3>
   <template v-if="game==='reef-party'">
    <table><thead><tr><th>Size</th><th>Return</th><th>Capture / hit</th></tr></thead><tbody><tr v-for="tier in tiers" :key="tier.label"><th>{{tier.label}}</th><td>{{tier.multiplier}}× stake</td><td>{{tier.captureTickets/100}}%</td></tr></tbody></table>
    <p>At a 0.25 stake, a successful small, medium, large or boss catch returns 0.25, 0.75, 2.00 or 5.00 credits respectively. Open SPECIES at the table to see each creature’s size tier.</p>
   </template>
   <p v-else>{{stagingProfile.rules[game]}}</p>
   <p>Multipliers apply to the total selected stake. Returns include any returned stake; they are not extra profit on top of it. An unsuccessful paid play returns zero.</p>
  </section>
  <div v-if="lines.length" class="rules-lines" aria-label="Active payline paths"><figure v-for="(line,index) in lines" :key="index"><svg viewBox="0 0 100 60" role="img" :aria-label="`Line ${index+1}: rows ${line.map(row=>row+1).join(', ')}`"><path d="M0 20H100M0 40H100M20 0V60M40 0V60M60 0V60M80 0V60" stroke="#ffffff25" fill="none"/><polyline :points="line.map((row,col)=>`${col*20+10},${row*20+10}`).join(' ')" fill="none" stroke="#ffd76c" stroke-width="3"/></svg><figcaption>LINE {{index+1}}</figcaption></figure></div>
  <h3>STAKE & CONTROLS</h3>
  <p>Use −, +, the stake menu or MAX to choose {{(stakeLimits.min/100).toFixed(2)}}–{{(stakeLimits.max/100).toFixed(2)}} credits in {{(stakeLimits.step/100).toFixed(2)}} steps. {{game==='reef-party'?'The stake is per valid hit.':'One stake pays for the complete spin, draw or feature sequence. Fast animation and Show result do not alter the outcome.'}}</p>
  <p>{{staked?'Plays require an online session and enough available credits. Accepted results are saved; reconnecting restores them without charging for a new play.':'Guest previews and free practice do not spend or award credits. The returns above describe the play-credit games.'}}</p>
 </div>
</template>
<style>
.game-rules-button{margin-left:auto;display:flex;align-items:center;gap:8px;padding:10px 18px;border:1px solid #d8b764;border-radius:22px;background:#172732;color:#ffe29d;font-weight:800;cursor:pointer}
.game-rules{font-size:15px;line-height:1.6}.game-rules h3{font-size:13px;letter-spacing:.15em;color:#ffe29d;margin:24px 0 10px}.game-rules li{padding-left:5px;margin:10px 0}.game-rules ol{padding-left:22px}.game-rules .rules-mode{font-size:12px;letter-spacing:.06em;color:#8de4d5}.rules-mode span{color:#bbc6d4}.rules-return{padding:1px 18px 12px;border:1px solid #ae8b4566;border-radius:14px;background:#060c1f80}.game-rules table{width:100%;border-collapse:collapse;text-align:left;font-size:14px}.game-rules td,.game-rules th{padding:10px 6px;border-bottom:1px solid #ffffff20}.rules-lines{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-top:20px}.rules-lines figure{margin:0;padding:8px;border-radius:8px;background:#080d1c;text-align:center}.rules-lines svg{width:100%;max-width:120px}.rules-lines figcaption{font-size:10px;color:#dbc894}
@media(max-width:600px){.game-rules-button{padding:9px 11px;font-size:12px}.game-rules{font-size:14px}.game-rules table{font-size:12px}.rules-return{padding:1px 12px 10px}}
</style>
