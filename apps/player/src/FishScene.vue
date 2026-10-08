<script setup lang="ts">
import {computed,onBeforeUnmount,onMounted,ref,watch} from 'vue';
import {displayPreferences} from './display-preferences';
import {gameRenderDensity} from './game-screen';
import {Application,Container,Graphics,Sprite,MeshPlane,Text,type RenderTexture} from 'pixi.js';
// Pixi's static shader/uniform polyfills avoid eval under the shared site's CSP.
import 'pixi.js/unsafe-eval';
import {reefTarget,reefBallistics,reefSpecies,reefTier,reefTierProfile,reefCannon,reefFlight,reefLeadAngle,fishGuide,reefBotSeats,type ReefAssistance,type FishGame} from '@new-game/game-math';
import {api,session} from './api';
import {formatCredits} from '@new-game/domain';
import {stage} from './staging-state';
import {catalog} from '@new-game/contracts';
import {fishWorlds} from './fish-worlds';
import {chooseBotFlight} from './bot-targeting';
import {BotScoreboard,botName,botCadence,type BotScore} from './bot-score';
import {reefTextures} from './reef-textures';
import BetControls from './BetControls.vue';
import AquaticSprite from './AquaticSprite.vue';
import {holdCredits,revealCredits} from './credit-presentation';
import {FishWalletPresentation} from './fish-wallet';
import {playSound} from './audio';
import {dampAngle, recoilOffset, effectProgress} from './game-motion';
import AbyssJackpotWheel from './AbyssJackpotWheel.vue';
import {bossReveal,type BossReveal} from './boss-reveal';
const jackpotReward=ref<BossReveal|null>(null);
import FishRewardReveal from './FishRewardReveal.vue';
import type {ReefImpact} from './reef-room';
const rewardReveals=ref<{id:number;species:number;award:string}[]>([]);let revealId=0;
const revealTimers=new Set<ReturnType<typeof setTimeout>>();
function wheelReveal(reward:BossReveal){
 jackpotReward.value=reward;
 const timer=setTimeout(()=>{if(jackpotReward.value?.id===reward.id)jackpotReward.value=null;revealTimers.delete(timer);},3200);revealTimers.add(timer);
}
function catchParticles(species:number,x:number,y:number,seat:number){
 if(props.reducedMotion)return;
 const origin=reefCannon(seat),tier=reefTier(species),count={small:16,medium:26,large:40,boss:60}[tier];
 const colors:Record<FishGame,number[]>={'corsair-cove':[0xffcd74,0x6bddd9],'cosmic-tides':[0xb3a3ff,0x6cfcff],'reef-party':[0xffd94c,0x7cffff],'abyss-legends':[0xffad39,0xff615a],'sunken-dynasty':[0xffe09a,0x62ffbb],'polar-odyssey':[0xf0ffff,0x88cdff]},[gold,accent]=colors[props.game];
 for(let i=0;i<count;i++){const a=i*2.399,r=18+i*1.5,dx=Math.cos(a)*r,dy=Math.sin(a)*r;
  const coin=new Graphics().circle(1,2,8).fill(0x805021).circle(0,0,8).fill(gold).circle(0,0,6).stroke({color:0xfff3bc,width:1.4}).moveTo(-2,-4).lineTo(2,4).stroke({color:0x9c641d,width:1.5});
  effect(coin,x+dx,y+dy,1.5,'coin',(origin.x-x-dx)/1.5,(origin.y-y-dy)/1.5-111);
 }
 for(let i=0;i<(tier==='boss'?28:14);i++){const a=i*2.399;const shard=props.game==='polar-odyssey'?new Graphics().poly([0,-9,4,0,0,9,-4,0]).fill(accent):props.game==='sunken-dynasty'?new Graphics().star(0,0,4,8,2).fill(accent):new Graphics().star(0,0,5,5,1).fill(accent);effect(shard,x,y,1.2,'particle',Math.cos(a)*(90+i*4),Math.sin(a)*(90+i*4)-25);}
 const ring=new Graphics().circle(0,0,45).stroke({color:accent,width:tier==='boss'?5:2,alpha:.8});effect(ring,x,y,1.2,'burst');
}
function celebrate(species:number,award:string,x:number,y:number){
 const id=++revealId;const boss=species===48?bossReveal(`own-${id}`,room.value?.seat||1,species,true,award):null;
 if(boss)wheelReveal(boss);else rewardReveals.value=[...rewardReveals.value.slice(-2),{id,species,award}];
 const timer=setTimeout(()=>{rewardReveals.value=rewardReveals.value.filter(r=>r.id!==id);revealTimers.delete(timer);},2800);revealTimers.add(timer);
 playSound(species===22||reefTier(species)==='boss'?'treasure':'win');catchParticles(species,x,y,room.value?.seat||1);
}
import type {ReefRoom as Room} from './reef-room';
const props=defineProps<{running:boolean;reducedMotion:boolean;authenticated?:boolean;balance?:string;initialRoom?:Room|null;game:FishGame}>();
const targetAt=(id:number,time:number)=>reefTarget(id,time,props.game);
type Flight=ReturnType<typeof reefFlight>;
const host=ref<HTMLDivElement>(),room=ref<Room|null>(props.initialRoom||null),error=ref(''),notice=ref('Aim into the reef. Tap to fire.'),firing=ref(false),guide=ref(false);
const firedCount=ref(0);
const botShots=ref(0),botSeats=computed(()=>props.authenticated?(room.value?.bots||[]).map(bot=>bot.seat):reefBotSeats([1]));
const presentingTargets=new Set<number>();
const botBolts:{view:Graphics;seat:number;targetId:number;x:number;y:number;origin:{x:number;y:number};start:number;duration:number;launched:boolean}[]=[];
const aiScores=ref<Record<number,BotScore>>({}),aiGains=ref<Record<number,number>>({}),aiScoreboard=new BotScoreboard(),botFocus=new Map<number,number>(),botRest=new Map<number,{target:number;until:number}>(),botSeatShots=new Map<number,number>();
const botTargets=ref(''),botDeadline=new Map<number,number>();let botSequence=0,lastHumanTarget:number|null=null,lastHumanUntil=0;
function humanTargets(){return new Set([lockedTarget.value,performance.now()<lastHumanUntil?lastHumanTarget:null,...projectiles.map(p=>p.flight.targetId),...presentingTargets].filter((id):id is number=>id!==null));}
function independentBots(time:number,now:number){
 const humans=humanTargets(),chosen=new Set<number>();
 for(let i=botBolts.length-1;i>=0;i--)if(!botSeats.value.includes(botBolts[i].seat)||humans.has(botBolts[i].targetId)){botBolts[i].view.destroy();botBolts.splice(i,1);}
 if(!error.value&&!disposed)for(const seat of botSeats.value){
  const ownBolts=botBolts.filter(b=>b.seat===seat);
  if(ownBolts.length>=4)continue;
  if(!botDeadline.has(seat)){botDeadline.set(seat,now+seat*90);continue;}
  if(now<botDeadline.get(seat)!)continue;
  const seatShots=(botSeatShots.get(seat)||0)+1;botSeatShots.set(seat,seatShots);botDeadline.set(seat,now+botCadence(seat,seatShots,props.reducedMotion));
  const rest=botRest.get(seat),excluded=new Set([...humans,...chosen,...(rest&&now<rest.until?[rest.target]:[]),...botBolts.filter(b=>b.seat!==seat).map(b=>b.targetId)]),flight=chooseBotFlight(props.game,seat,time,alive(),excluded,botSequence++,botFocus.get(seat)??ownBolts[0]?.targetId);
  if(!flight||flight.targetId===null)continue;chosen.add(flight.targetId);botFocus.set(seat,flight.targetId);
  const cannon=cannons[seat-1];cannon.angle=flight.angle;cannon.recoil=props.reducedMotion?0:.24;botShots.value++;
  const view=new Graphics().ellipse(-7,0,12,3).fill({color:[0xffd978,0x78c8ff,0xff9e8a,0xc7a0ff][seat-1],alpha:.7}).circle(0,0,3).fill(0xd9fff7);
  view.position.set(flight.origin.x,flight.origin.y);view.visible=!props.reducedMotion;world.addChild(view);
  botBolts.push({view,seat,targetId:flight.targetId,x:flight.x,y:flight.y,origin:flight.origin,start:now,duration:Math.max(40,flight.time*1000),launched:true});
 }
 botTargets.value=botBolts.map(b=>`${b.seat}:${b.targetId}`).join(',');
}
function scoreBotImpact(seat:number,targetId:number,x:number,y:number){
 const fish=creatures.find(f=>f.id===targetId);if(error.value||disposed||!props.running||!botSeats.value.includes(seat)||!fish||fish.captured||humanTargets().has(targetId)||!alive().includes(targetId))return;
 const species=targetAt(targetId,0).species,result=aiScoreboard.hit(seat,targetId,species,performance.now());aiScores.value={...aiScores.value,[seat]:result.score};fish.hit=.09;
 if(!result.gain)return;
 botFocus.delete(seat);botRest.set(seat,{target:targetId,until:performance.now()+4000});aiGains.value={...aiGains.value,[seat]:result.gain};
 const timer=setTimeout(()=>{aiGains.value={...aiGains.value,[seat]:0};revealTimers.delete(timer);},1500);revealTimers.add(timer);
 const base=reefCannon(seat),label=new Text({text:`+${result.gain} PTS`,style:{fontFamily:'Georgia',fontSize:18,fontWeight:'bold',fill:0xffdf7f,stroke:{color:0x182842,width:3}}});label.anchor.set(.5);effect(label,base.x,base.y+(seat<3?-65:65),1.5,'particle',0,seat<3?-12:12);
 if(!props.reducedMotion){
  const ring=new Graphics().circle(0,0,24).stroke({color:0xffdf7f,width:2,alpha:.65});effect(ring,x,y,.7,'burst');
  for(let i=0;i<6;i++){const token=new Graphics().star(0,0,4,5,2).fill(0xffe594);effect(token,x+i*3,y,1,'coin',base.x-x-i*3,base.y-y-74);}
 }
}
const autoOn=ref(false),lockOn=ref(false),fast=ref(false),lockedTarget=ref<number|null>(null);
let reticle:Graphics,nextAutoAt=0;
let walletPresentation:FishWalletPresentation|undefined;
const shots=new Map<string,string>();
function stopAuto(message?:string){autoOn.value=false;if(message)notice.value=message;}
function finishedShot(key:string){shots.delete(key);firing.value=shots.size>0;}
function enoughCredits(){const inFlight=[...shots.values()].reduce((sum,stake)=>sum+BigInt(stake),0n);return !stage.enabled||!props.authenticated||BigInt(session.current?.wallet.available||'0')-inFlight>=BigInt(stage.stake);}
function toggleAuto(){if(autoOn.value){stopAuto('Auto fire stopped.');return;}if(!props.running||stage.pending||!enoughCredits()){notice.value='Check your connection and available credits.';return;}autoOn.value=true;nextAutoAt=performance.now();notice.value='Auto fire on. Tap to aim.';}
function selectTarget(x=600,y=300){const time=(Date.now()+clockOffset-epoch)/1000;lockedTarget.value=alive().filter(id=>{const p=targetAt(id,time);return p.x>20&&p.x<1180;}).sort((a,b)=>{const p=targetAt(a,time),q=targetAt(b,time);return Math.hypot(p.x-x,p.y-y)-Math.hypot(q.x-x,q.y-y);})[0]??null;}
function toggleLock(){lockOn.value=!lockOn.value;if(lockOn.value){selectTarget();notice.value='Target lock on. Tap a creature to change target.';}else{lockedTarget.value=null;notice.value='Free aim.';}}
let app:Application|undefined,world:Container,art:Awaited<ReturnType<typeof reefTextures>>,disposed=false,polling=false,clockOffset=0,epoch=Date.now(),poll:ReturnType<typeof setInterval>|undefined,observer:ResizeObserver|undefined;
const creatures:{id:number;view:Container;sprite:MeshPlane;shadow:Sprite;vertices:Float32Array;hit:number;captured:boolean}[]=[],cannons:{view:Container;barrel:Sprite;recoil:number;angle:number;visualAngle:number}[]=[],effects:{view:Container;age:number;life:number;kind:string;vx:number;vy:number;x:number;y:number}[]=[];
const bubbles:Graphics[]=[];let waterLight:Container;
type Projectile={view:Graphics;flight:Flight;firedAt:number;roomId?:string;requestKey:string;age:number;stake:string};
const projectiles:Projectile[]=[];
function alive(){const caught=new Set(creatures.filter(f=>f.captured).map(f=>f.id));return room.value?room.value.targets.filter(t=>!t.captured&&!caught.has(t.target_id)).map(t=>t.target_id):creatures.filter(f=>!f.captured).map(f=>f.id);}
async function syncRoom(){
 if(!props.authenticated||!props.running||polling||disposed)return;polling=true;
 try{const snapshot=await api<Room>('practice/reef/join',{game:props.game,...(props.initialRoom?{roomId:props.initialRoom.id}:{})});if(disposed)return;
  const sameRoom=room.value?.id===snapshot.id;if(!sameRoom){aiScoreboard.reset();aiScores.value={};aiGains.value={};botFocus.clear();botRest.clear();botSeatShots.clear();}room.value=snapshot;clockOffset=snapshot.serverTime-Date.now();epoch=new Date(snapshot.startedAt).getTime();
  for(const fish of creatures){fish.captured=(sameRoom&&fish.captured)||(!presentingTargets.has(fish.id)&&!!snapshot.targets.find(t=>t.target_id===fish.id)?.captured);fish.view.visible=!fish.captured;}
  for(const event of snapshot.impacts||[])showPeerImpact(event);
  error.value='';
 }catch(e){error.value=(e as Error).message;stopAuto();}finally{polling=false;}
}
const seenImpacts=new Set<string>();
function showPeerImpact(event:ReefImpact){
 if(seenImpacts.has(event.id))return;seenImpacts.add(event.id);if(seenImpacts.size>512)seenImpacts.delete(seenImpacts.values().next().value!);
 if(event.seat===room.value?.seat||!world)return;
 const origin=reefCannon(event.seat),cannon=cannons[event.seat-1];if(!cannon)return;
 cannon.angle=event.flight.angle;cannon.visualAngle=cannon.angle;cannon.recoil=.24;
 impact(event.flight.x,event.flight.y,event.captured);
 if(!props.reducedMotion){
  const trail=new Graphics().moveTo(origin.x,origin.y).lineTo(event.flight.x,event.flight.y).stroke({color:[0xffd774,0x76d9ff,0xff978d,0xd5a0ff][event.seat-1],width:2,alpha:.6});effect(trail,0,0,.25,'trail');
 }
 if(event.captured){const boss=targetAt(event.targetId,0).species===48?bossReveal(event.id,event.seat,48,event.captured,event.award):null;if(boss)wheelReveal(boss);catchParticles(targetAt(event.targetId,0).species,event.flight.x,event.flight.y,event.seat);const label=new Text({text:`P${event.seat} +${formatCredits(event.award)}`,style:{fontFamily:'Georgia',fontSize:23,fontWeight:'bold',fill:0xffe28c,stroke:{color:0x152344,width:3}}});label.anchor.set(.5);effect(label,event.flight.x,event.flight.y,1.1,'particle',0,-24);}
}
function effect(view:Container,x:number,y:number,life:number,kind='burst',vx=0,vy=0){view.position.set(x,y);world.addChild(view);if(effects.length>=400)effects.shift()!.view.destroy();effects.push({view,age:0,life,kind,vx,vy,x,y});}
function impact(x:number,y:number,win=false){
 const net=new Graphics();for(const r of [14,30,48])net.circle(0,0,r).stroke({color:win?0xffdf70:0xafffff,width:1.5,alpha:.85});
 for(let a=0;a<Math.PI*2;a+=Math.PI/6)net.moveTo(0,0).lineTo(Math.cos(a)*48,Math.sin(a)*48).stroke({color:0xffffff,width:1,alpha:.7});effect(net,x,y,.65);
 if(!props.reducedMotion)for(let i=0;i<12;i++){const a=i*Math.PI/6,r=win?4:2.5;effect(new Graphics().circle(0,0,r).fill(win?0xffd455:0xc5fbff).circle(-1,-1,r*.4).fill(0xffffff),x,y,.65,'particle',Math.cos(a)*(65+i*4),Math.sin(a)*(65+i*4));}
}
async function settleShot(shot:Projectile){
 const flight=shot.flight;if(flight.targetId===null){finishedShot(shot.requestKey);return;}
 const fish=creatures.find(f=>f.id===flight.targetId);if(fish)fish.hit=.4;
 impact(flight.x,flight.y);playSound('impact');notice.value='Impact';
 if(!props.authenticated||!shot.roomId){finishedShot(shot.requestKey);return;}
 presentingTargets.add(flight.targetId);
 try{
  const result=await api<{description:string;captured:boolean;assistance?:ReefAssistance;award?:string;before?:{available:string;version:string};after?:{available:string;version:string}}>('practice/reef/shots',{game:props.game,roomId:shot.roomId,targetId:flight.targetId,requestKey:shot.requestKey,...(stage.enabled?{trajectoryVersion:reefBallistics.version,stake:shot.stake,aimX:flight.x,aimY:flight.y,observedAt:Math.round(shot.firedAt+flight.time*1000),firedAt:shot.firedAt,angle:flight.angle}:{})});
  if(disposed)return;
  if(result.before&&result.after)walletPresentation?.accept(result.before,result.after,result.award||'0',performance.now());
  notice.value=result.captured?(result.assistance?.attempts.some(a=>a.captured)?'Solo support catch!':'Captured!'):`${reefSpecies[targetAt(flight.targetId,0).species]} resisted the hit.`;
  if(result.captured){if(fish){fish.captured=true;fish.view.visible=false;}impact(flight.x,flight.y,true);if(result.award)celebrate(targetAt(flight.targetId,0).species,result.award,flight.x,flight.y);
   const label=new Text({text:result.award?`+${(Number(result.award)/100).toFixed(2)}`:'CAUGHT',style:{fontFamily:'Georgia',fontSize:32,fontWeight:'bold',fill:0xffef98,stroke:{color:0x44240c,width:4}}});label.anchor.set(.5);effect(label,flight.x,flight.y,1.1,'particle',0,-38);
  }if(result.after&&BigInt(result.after.available)<BigInt(stage.stake))stopAuto('Auto stopped: insufficient credits for the next shot.');
 }catch(e){if(!disposed){const code=(e as {code?:string}).code;if(code==='AIM_MISSED'||code==='TARGET_UNAVAILABLE')notice.value='Target already cleared. Aim at another creature.';else stopAuto((e as Error).message);}}finally{presentingTargets.delete(flight.targetId);finishedShot(shot.requestKey);}
}
function point(event:PointerEvent){const rect=app!.canvas.getBoundingClientRect();return{x:(event.clientX-rect.left)*1200/rect.width,y:(event.clientY-rect.top)*600/rect.height};}
function aimAt(event:PointerEvent){if(!app||!cannons.length||!props.running||lockOn.value)return;const p=point(event),seat=room.value?.seat||1,origin=reefCannon(seat);cannons[seat-1].angle=Math.atan2(p.y-origin.y,p.x-origin.x);}
function fire(event:PointerEvent){
 if(lockOn.value){const p=point(event);selectTarget(p.x,p.y);}else aimAt(event);fireCannon();
}
function trackTarget(){
 if(!lockOn.value)return;
 const time=(Date.now()+clockOffset-epoch)/1000;
 if(lockedTarget.value===null||!alive().includes(lockedTarget.value)||targetAt(lockedTarget.value,time).x<0||targetAt(lockedTarget.value,time).x>1200)selectTarget();
 if(lockedTarget.value!==null)cannons[(room.value?.seat||1)-1].angle=reefLeadAngle(room.value?.seat||1,lockedTarget.value,time,props.game);
}
function fireCannon(){
 if(error.value||!app||!props.running||disposed||stage.busy||stage.pending||stage.fishPending.some(p=>p.recover)||props.authenticated&&!room.value)return;
 if(shots.size>=48){notice.value='Shots are still arriving. Please wait a moment.';return;}
 if(!enoughCredits()){stopAuto('Insufficient available credits for this stake.');return;}
 trackTarget();const seat=room.value?.seat||1,cannon=cannons[seat-1],firedAt=Date.now()+clockOffset,flight=reefFlight(seat,cannon.angle,(firedAt-epoch)/1000,alive(),props.game);
 lastHumanTarget=flight.targetId;lastHumanUntil=performance.now()+3000;
 const shotColor=props.game==='abyss-legends'?[0x42e8ff,0xff9a25,0xf365ff,0x8eff47][seat-1]:0x1bdfff;
 const view=new Graphics().ellipse(-9,0,15,5).fill({color:shotColor,alpha:.5}).circle(0,0,5).fill(0xfff7bd).circle(0,0,2).fill(0xffffff);
 view.rotation=flight.angle;view.position.set(flight.origin.x,flight.origin.y);world.addChild(view);
 const requestKey=crypto.randomUUID();projectiles.push({view,flight,firedAt,roomId:room.value?.id,requestKey,age:0,stake:stage.stake});shots.set(requestKey,stage.stake);firedCount.value++;firing.value=true;nextAutoAt=performance.now()+(fast.value?125:250);cannon.visualAngle=cannon.angle;cannon.recoil=.24;notice.value='';playSound('shot');
 if(!props.reducedMotion)effect(new Graphics().star(0,0,8,20,5).fill({color:0xffe795,alpha:.9}),flight.origin.x,flight.origin.y,.12);
}
function resize(){if(!app||!host.value)return;app.renderer.resolution=gameRenderDensity(displayPreferences.resolution);app.renderer.resize(host.value.clientWidth,host.value.clientHeight);world.scale.set(app.screen.width/1200,app.screen.height/600);}
onMounted(async()=>{
 try{
  app=new Application();await app.init({width:1200,height:600,backgroundAlpha:0,antialias:true,resolution:gameRenderDensity(displayPreferences.resolution),autoDensity:true,preference:'webgl'});
  if(disposed){app.destroy(true);return;}art=await reefTextures(app,props.game);if(disposed){Object.values(art).flat().forEach(t=>t.destroy(true));app.destroy(true);return;}
  world=new Container();app.stage.addChild(world);host.value!.appendChild(app.canvas);app.canvas.setAttribute('aria-label',`${catalog.find(g=>g.id===props.game)?.name} four-cannon table with varied creatures and treasure chests`);app.canvas.setAttribute('role','img');
  waterLight=new Container();waterLight.eventMode='none';world.addChild(waterLight);
  for(let i=0;i<5;i++){const beam=new Graphics().poly([i*270-100,-40,i*270+10,-40,i*270+260,640,i*270+20,640]).fill({color:0xc8f8ff,alpha:.027});waterLight.addChild(beam);}
  for(let i=0;i<18;i++){const bubble=new Graphics().circle(0,0,2+i%4).stroke({color:0xc8f4ff,width:.7,alpha:.3}).circle(-1,-1,1).fill({color:0xe8ffff,alpha:.4});bubble.eventMode='none';waterLight.addChild(bubble);bubbles.push(bubble);}
  for(let id=1;id<=80;id++){
   const p=targetAt(id,0),view=new Container(),texture=art.creatures[p.species],sprite=new MeshPlane({texture,verticesX:8,verticesY:3});sprite.pivot.set(texture.width/2,texture.height/2);sprite.scale.set(p.radius*2.8/texture.width);
   const vertices=new Float32Array(sprite.geometry.getAttribute('aPosition').buffer.data as Float32Array);
   const shadow=new Sprite(art.creatures[p.species]);shadow.anchor.set(.5);shadow.scale.copyFrom(sprite.scale);shadow.tint=0x001825;shadow.alpha=.29;shadow.position.set(7,12);view.addChild(shadow,sprite);world.addChild(view);creatures.push({id,view,sprite,shadow,vertices,hit:0,captured:false});
  }
  for(let seat=1;seat<=4;seat++){
   const view=new Container(),base=reefCannon(seat),barrel=new Sprite(art.cannons[seat-1]);
   view.position.set(base.x,base.y);view.addChild(new Graphics().circle(0,0,42).fill({color:0x001b31,alpha:.85}).circle(0,0,38).stroke({color:[0xecc772,0x74bbf3,0xe86860,0xcf8dfd][seat-1],width:3}));
   barrel.anchor.set(.5,.76);barrel.width=props.game!=='reef-party'?132:170;barrel.height=props.game!=='reef-party'?145:114;view.addChild(barrel);world.addChild(view);cannons.push({view,barrel,recoil:0,angle:seat<=2?-Math.PI/2:Math.PI/2,visualAngle:seat<=2?-Math.PI/2:Math.PI/2});
  }
  reticle=new Graphics().circle(0,0,45).stroke({color:0xffef7e,width:2}).moveTo(-58,0).lineTo(-32,0).moveTo(32,0).lineTo(58,0).moveTo(0,-58).lineTo(0,-32).moveTo(0,32).lineTo(0,58).stroke({color:0xffef7e,width:3});reticle.visible=false;world.addChild(reticle);
  resize();observer=new ResizeObserver(resize);observer.observe(host.value!);app.canvas.addEventListener('pointerdown',fire);app.canvas.addEventListener('pointermove',aimAt);
  await syncRoom();if(disposed)return;poll=setInterval(()=>void syncRoom(),750);
  if(stage.enabled&&props.authenticated&&session.current){walletPresentation=new FishWalletPresentation(session.current.wallet);holdCredits(props.game,session.current.id,session.current.wallet.available);}
  app.ticker.add(ticker=>{
   if(!props.running)return;const dt=Math.min(ticker.deltaMS,50)/1000,time=(Date.now()+clockOffset-epoch)/1000;
   waterLight.visible=!props.reducedMotion;if(waterLight.visible){waterLight.x=Math.sin(time*.09)*24;for(let i=0;i<bubbles.length;i++)bubbles[i].position.set(45+(i*67)%1120+Math.sin(time*.45+i)*9,610-((time*(8+i%5)+i*37)%640));}
   for(const fish of creatures){const p=targetAt(fish.id,time);fish.hit=Math.max(0,fish.hit-dt);fish.view.position.set(p.x+(props.reducedMotion?0:Math.sin(fish.hit*50)*fish.hit*14),p.y);fish.view.scale.set(p.species===48?1:p.direction,Math.min(1,world.scale.x/world.scale.y));fish.sprite.tint=fish.hit>.2?0xc6f5ff:0xffffff;
    fish.view.rotation=props.reducedMotion?0:Math.sin(time*2+fish.id)*.035;fish.view.visible=!fish.captured&&p.active&&p.x>-200&&p.x<1400;
    if(fish.view.visible){fish.shadow.position.set(7+(props.reducedMotion?0:Math.sin(time*.8+fish.id)*2),12+(props.reducedMotion?0:Math.cos(time*.8+fish.id)*3));const buffer=fish.sprite.geometry.getAttribute('aPosition').buffer,positions=buffer.data as Float32Array,width=fish.sprite.texture.width;
     for(let i=0;i<positions.length;i+=2){const along=fish.vertices[i]/width,tail=(1-along)**2;positions[i+1]=fish.vertices[i+1]+(props.reducedMotion||p.species===48?0:Math.sin(time*(p.radius<20?8:4.2)-along*5+fish.id)*width*.035*tail);}
     buffer.update();
    }
   }
   trackTarget();independentBots(time,performance.now());reticle.visible=lockOn.value&&lockedTarget.value!==null;if(reticle.visible){const p=targetAt(lockedTarget.value!,time);reticle.position.set(p.x,p.y);reticle.rotation=props.reducedMotion?0:time*.5;}
   if(walletPresentation&&session.current){const displayed=walletPresentation.reconcile(session.current.wallet,performance.now(),!firing.value&&!stage.fishPending.length);holdCredits(props.game,session.current.id,displayed.available);}
   if(autoOn.value&&performance.now()>=nextAutoAt){if(stage.pending||stage.busy||stage.fishPending.some(p=>p.recover))stopAuto('Reconnecting. Auto fire is off.');else fireCannon();}
   for(let i=0;i<cannons.length;i++){const c=cannons[i];c.recoil=Math.max(0,c.recoil-dt);c.visualAngle=props.reducedMotion?c.angle:dampAngle(c.visualAngle,c.angle,dt);c.barrel.rotation=c.visualAngle+Math.PI/2;const kick=props.reducedMotion?0:recoilOffset(c.recoil);c.barrel.position.set(-Math.cos(c.visualAngle)*kick,-Math.sin(c.visualAngle)*kick);c.view.scale.y=Math.min(1,world.scale.x/world.scale.y);c.view.alpha=!room.value||room.value.seat===i+1||botSeats.value.includes(i+1)||room.value.seats.some(s=>s.seat===i+1)?1:.6;}
   for(let i=botBolts.length-1;i>=0;i--){const b=botBolts[i],age=performance.now()-b.start;if(age<0)continue;
    if(!b.launched){b.launched=true;const c=cannons[b.seat-1];c.angle=Math.atan2(b.y-b.origin.y,b.x-b.origin.x);c.recoil=.24;botShots.value++;}
    const progress=Math.min(1,age/b.duration);b.view.visible=!props.reducedMotion;b.view.rotation=Math.atan2(b.y-b.origin.y,b.x-b.origin.x);b.view.position.set(b.origin.x+(b.x-b.origin.x)*progress,b.origin.y+(b.y-b.origin.y)*progress);
    if(progress>=1){scoreBotImpact(b.seat,b.targetId,b.x,b.y);const spark=new Graphics().circle(0,0,9).stroke({color:0x85deef,width:1.5,alpha:.6});effect(spark,b.x,b.y,.22,'bot-impact');b.view.destroy();botBolts.splice(i,1);}
   }
   for(let i=projectiles.length-1;i>=0;i--){const s=projectiles[i];s.age=(Date.now()+clockOffset-s.firedAt)/1000;const t=Math.min(s.age,s.flight.time);s.view.position.set(s.flight.origin.x+s.flight.vx*t,s.flight.origin.y+s.flight.vy*t);
    if(s.age>=s.flight.time){s.view.destroy();projectiles.splice(i,1);void settleShot(s);}
   }
   for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.age+=dt;const progress=Math.min(1,e.age/e.life);e.view.alpha=1-progress**2;if(e.kind==='particle'||e.kind==='coin'){e.view.x=e.x+e.vx*e.age;e.view.y=e.y+e.vy*e.age+(e.kind==='coin'?74*e.age**2:0);if(e.kind==='coin'){e.view.scale.x=Math.cos(e.age*12);e.view.rotation=e.age*.6;}}else if(e.kind!=='trail')e.view.scale.set(props.reducedMotion?1:.3+effectProgress(e.age,e.life)*1.05);if(e.age>=e.life){e.view.destroy({children:true});effects.splice(i,1);}}
  });if(!props.running)app.stop();
 }catch(e){error.value=`The reef renderer could not start: ${(e as Error).message}`;}
});
watch(()=>displayPreferences.resolution,()=>{if(app?.renderer)resize();});
function cancelFlight(){for(const shot of projectiles){shot.view.destroy();finishedShot(shot.requestKey);}projectiles.length=0;for(const bolt of botBolts)bolt.view.destroy();botBolts.length=0;botDeadline.clear();botFocus.clear();botTargets.value='';}
watch(()=>props.running,running=>{if(!running){stopAuto('Paused. Auto fire is off.');cancelFlight();}if(!app?.renderer)return;if(running){app.start();void syncRoom();}else app.stop();});
watch(()=>stage.stake,()=>{stopAuto('Stake changed. Auto fire is off.');cancelFlight();});
watch(()=>stage.recovered,()=>{stopAuto('Connection restored. Ready to fire.');void syncRoom();});
watch(()=>props.authenticated,()=>stopAuto());
onBeforeUnmount(()=>{for(const timer of revealTimers)clearTimeout(timer);stopAuto();disposed=true;cancelFlight();revealCredits(props.game);clearInterval(poll);observer?.disconnect();if(app?.renderer){app.canvas.removeEventListener('pointerdown',fire);app.canvas.removeEventListener('pointermove',aimAt);app.destroy(true,{children:true});if(art)Object.values(art).flat().forEach((t:RenderTexture)=>t.destroy(true));}});
</script>
<template><section class="reef-preview reef-deluxe" :class="game" :style="fishWorlds[game]?{backgroundImage:`url(${fishWorlds[game]!.background})`}:{}"><div ref="host" class="fish-canvas" :data-target="lockedTarget ?? ''" :data-shots-fired="firedCount" :data-bot-shots="botShots" :data-bot-count="botSeats.length" :data-ai-scores="JSON.stringify(aiScores)" :data-bot-targets="botTargets" :data-human-targets="[...humanTargets()].join(',')"><p v-if="error" class="error" role="alert">{{error}}</p><div v-if="!running" class="paused-overlay">Paused</div></div><div class="reef-seat-plaque" :data-seat="seat" v-for="seat in 4" :key="seat" :class="[`seat-${seat}`,{yours:(room?.seat||1)===seat,bot:botSeats.includes(seat)}]"><small>{{botSeats.includes(seat)?'AI CREW':(room?.seat||1)===seat?'YOUR CANNON':`CANNON ${seat}`}}</small><b>{{room?.seats.find(s=>s.seat===seat)?.display_name || (botSeats.includes(seat)?botName(game,seat):!authenticated&&seat===1?'You':'Open seat')}}</b><em v-if="botSeats.includes(seat)" class="ai-score" :data-score="aiScores[seat]?.points||0">{{(aiScores[seat]?.points||0).toLocaleString()}} PTS <span v-if="aiGains[seat]" :key="aiScores[seat]?.combos" class="ai-score-gain">+{{aiGains[seat]}}</span></em><em v-else-if="room?.seat===seat && stage.enabled">{{formatCredits(stage.stake)}} / SHOT</em></div><span class="jackpot-target-hint">SHOOT THE GOLD WHEEL · 20×</span><AbyssJackpotWheel v-if="jackpotReward" :game="game" :running="running" :title="catalog.find(g=>g.id===game)?.name.split(' ')[0]" :reward="jackpotReward" :reduced-motion="reducedMotion"/><div class="fish-reward-stack"><FishRewardReveal v-for="reward in rewardReveals" :key="reward.id" :id="String(reward.id)" :game="game" :running="running" :species="reward.species" :award="reward.award" :reduced-motion="reducedMotion"/></div><p class="reef-shot-notice" role="status">{{notice}}</p><div class="reef-console"><div class="led-meter"><small>CREDITS</small><strong>{{balance||'0.00'}}</strong></div><BetControls :reduced-motion="reducedMotion" :game="game" :ready="running" :authenticated="!!authenticated" :busy="firing" continuous/><div class="fish-actions"><button :aria-pressed="autoOn" aria-label="Auto fire" :disabled="!running||!!stage.pending||!!error" @click="toggleAuto"><b>⟳</b><span>AUTO {{autoOn?'ON':'OFF'}}</span></button><button :aria-pressed="lockOn" aria-label="Target lock" :disabled="!running" @click="toggleLock"><b>⌖</b><span>LOCK {{lockOn?'ON':'OFF'}}</span></button><button :aria-pressed="fast" aria-label="Fast fire cadence" :disabled="!running" @click="fast=!fast"><b>▶▶</b><span>{{fast?'FAST 2×':'NORMAL 1×'}}</span></button></div><span class="cannon-ready" :class="{busy:firing}">{{firing?'● FIRING':'● CANNON READY'}}</span><button class="line-map-button" :aria-expanded="guide" @click="guide=!guide">SPECIES</button></div><div v-if="guide" class="reef-field-guide" aria-label="Fish species"><span v-for="index in fishGuide(game)" :key="index"><AquaticSprite :species="index"/><b>{{reefSpecies[index]}}</b><small>{{reefTierProfile.tiers[reefTier(index)].label}} · {{reefTierProfile.tiers[reefTier(index)].multiplier}}× shot</small></span></div></section></template>

<style>.reef-seat-plaque.bot{border-color:#80e8c0}.reef-seat-plaque.bot small,.reef-seat-plaque.bot em{color:#a5ffda}</style>
