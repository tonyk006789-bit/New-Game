<script setup lang="ts">
import {onBeforeUnmount,onMounted,ref,watch} from 'vue';
import {Application,Container,Graphics,Sprite,MeshPlane,Text,type RenderTexture} from 'pixi.js';
// Pixi's static shader/uniform polyfills avoid eval under the shared site's CSP.
import 'pixi.js/unsafe-eval';
import {reefTarget,reefSpecies,reefCannon,reefFlight,reefLeadAngle} from '@new-game/game-math';
import {api,session} from './api';
import {formatCredits} from '@new-game/domain';
import {stage} from './staging-state';
import {reefTextures} from './reef-textures';
import BetControls from './BetControls.vue';
import AquaticSprite from './AquaticSprite.vue';
import {creditPresentation} from './credit-presentation';
import {playSound} from './audio';
const catchBanner=ref<null|{title:string;award:string;species:string}>(null);
let bannerTimer:ReturnType<typeof setTimeout>|undefined;
function celebrate(species:number,award:string,x:number,y:number){
 const title=species===8||species===7?'DRAGON CATCH':species===9?'PEARL MERMAID':species===10?'CROWN CRAB':'REEF CATCH';
 catchBanner.value={title,award:formatCredits(award),species:reefSpecies[species]};clearTimeout(bannerTimer);bannerTimer=setTimeout(()=>{catchBanner.value=null;},3000);
 if(props.reducedMotion)return;
 const origin=reefCannon(room.value?.seat||1);
 for(let i=0;i<24;i++){const a=i*2.399,r=22+i*2,dx=Math.cos(a)*r,dy=Math.sin(a)*r;
  const coin=new Graphics().circle(0,0,8).fill(0xffc632).circle(0,0,6).stroke({color:0xfff3a1,width:1.5}).moveTo(-2,-4).lineTo(2,-4).lineTo(-2,4).lineTo(2,4).stroke({color:0x996115,width:1.5});
  effect(coin,x+dx,y+dy,1.15,'coin',(origin.x-x-dx)/1.15,(origin.y-y-dy)/1.15-85);
 }
}
import type {ReefRoom as Room} from './reef-room';
const props=defineProps<{running:boolean;reducedMotion:boolean;authenticated?:boolean;balance?:string;initialRoom?:Room|null}>();
type Flight=ReturnType<typeof reefFlight>;
const host=ref<HTMLDivElement>(),room=ref<Room|null>(props.initialRoom||null),error=ref(''),notice=ref('Aim into the reef. Tap to fire.'),firing=ref(false),guide=ref(false);
const autoOn=ref(false),lockOn=ref(false),fast=ref(false),lockedTarget=ref<number|null>(null);
let reticle:Graphics,nextAutoAt=0;
function stopAuto(message?:string){autoOn.value=false;if(message)notice.value=message;}
function finishedShot(){firing.value=false;nextAutoAt=performance.now()+(fast.value?500:1000);}
function enoughCredits(){return !stage.enabled||!props.authenticated||BigInt(session.current?.wallet.available||'0')>=BigInt(stage.stake);}
function toggleAuto(){if(autoOn.value){stopAuto('Auto fire stopped.');return;}if(!props.running||stage.pending||!enoughCredits()){notice.value='Check your connection and available credits.';return;}autoOn.value=true;nextAutoAt=performance.now();notice.value='Auto fire on. Tap to aim.';}
function selectTarget(x=600,y=300){const time=(Date.now()+clockOffset-epoch)/1000;lockedTarget.value=alive().filter(id=>{const p=reefTarget(id,time);return p.x>20&&p.x<1180;}).sort((a,b)=>{const p=reefTarget(a,time),q=reefTarget(b,time);return Math.hypot(p.x-x,p.y-y)-Math.hypot(q.x-x,q.y-y);})[0]??null;}
function toggleLock(){lockOn.value=!lockOn.value;if(lockOn.value){selectTarget();notice.value='Target lock on. Tap a creature to change target.';}else{lockedTarget.value=null;notice.value='Free aim.';}}
let app:Application|undefined,world:Container,art:Awaited<ReturnType<typeof reefTextures>>,disposed=false,polling=false,clockOffset=0,epoch=Date.now(),poll:ReturnType<typeof setInterval>|undefined,observer:ResizeObserver|undefined;
const creatures:{id:number;view:Container;sprite:MeshPlane;vertices:Float32Array;hit:number;captured:boolean}[]=[],cannons:{view:Container;barrel:Sprite;recoil:number;angle:number}[]=[],effects:{view:Container;age:number;life:number;kind:string;vx:number;vy:number}[]=[];
let projectile:{view:Graphics;flight:Flight;firedAt:number;roomId?:string;requestKey:string;age:number}|null=null;
function alive(){return room.value?room.value.targets.filter(t=>!t.captured).map(t=>t.target_id):creatures.filter(f=>!f.captured).map(f=>f.id);}
async function syncRoom(){
 if(!props.authenticated||!props.running||polling||disposed)return;polling=true;
 try{const snapshot=await api<Room>('practice/reef/join',props.initialRoom?{roomId:props.initialRoom.id}:{});if(disposed)return;
  room.value=snapshot;clockOffset=snapshot.serverTime-Date.now();epoch=new Date(snapshot.startedAt).getTime();
  for(const fish of creatures){fish.captured=!!snapshot.targets.find(t=>t.target_id===fish.id)?.captured;fish.view.visible=!fish.captured;}
  error.value='';
 }catch(e){error.value=(e as Error).message;stopAuto();}finally{polling=false;}
}
function effect(view:Container,x:number,y:number,life:number,kind='burst',vx=0,vy=0){view.position.set(x,y);world.addChild(view);effects.push({view,age:0,life,kind,vx,vy});}
function impact(x:number,y:number,win=false){
 const net=new Graphics();for(const r of [14,30,48])net.circle(0,0,r).stroke({color:win?0xffdf70:0xafffff,width:1.5,alpha:.85});
 for(let a=0;a<Math.PI*2;a+=Math.PI/6)net.moveTo(0,0).lineTo(Math.cos(a)*48,Math.sin(a)*48).stroke({color:0xffffff,width:1,alpha:.7});effect(net,x,y,.65);
 if(!props.reducedMotion)for(let i=0;i<12;i++){const a=i*Math.PI/6,r=win?4:2.5;effect(new Graphics().circle(0,0,r).fill(win?0xffd455:0xc5fbff).circle(-1,-1,r*.4).fill(0xffffff),x,y,.65,'particle',Math.cos(a)*(65+i*4),Math.sin(a)*(65+i*4));}
}
async function settleShot(shot:NonNullable<typeof projectile>){
 const flight=shot.flight;if(flight.targetId===null){notice.value='Shot cleared the reef.';finishedShot();return;}
 const fish=creatures.find(f=>f.id===flight.targetId);if(fish)fish.hit=.4;
 impact(flight.x,flight.y);playSound('impact');notice.value='Impact';
 if(!props.authenticated||!shot.roomId){finishedShot();return;}
 try{
  const result=await api<{description:string;captured:boolean;award?:string;after?:{available:string}}>('practice/reef/shots',{roomId:shot.roomId,targetId:flight.targetId,requestKey:shot.requestKey,...(stage.enabled?{aimX:flight.x,aimY:flight.y,observedAt:Math.round(shot.firedAt+flight.time*1000),firedAt:shot.firedAt,angle:flight.angle}:{})});
  if(disposed)return;
  notice.value=result.captured?'Captured!':'The fish escaped.';
  if(result.captured){if(fish){fish.captured=true;fish.view.visible=false;}impact(flight.x,flight.y,true);if(result.award)celebrate(reefTarget(flight.targetId,0).species,result.award,flight.x,flight.y);
   const label=new Text({text:result.award?`+${(Number(result.award)/100).toFixed(2)}`:'CAUGHT',style:{fontFamily:'Georgia',fontSize:32,fontWeight:'bold',fill:0xffef98,stroke:{color:0x44240c,width:4}}});label.anchor.set(.5);effect(label,flight.x,flight.y,1.1,'particle',0,-38);
  }if(result.after&&BigInt(result.after.available)<BigInt(stage.stake))stopAuto('Auto stopped: insufficient credits for the next shot.');await syncRoom();
 }catch(e){if(!disposed)stopAuto((e as Error).message);}finally{finishedShot();}
}
function point(event:PointerEvent){const rect=app!.canvas.getBoundingClientRect();return{x:(event.clientX-rect.left)*1200/rect.width,y:(event.clientY-rect.top)*600/rect.height};}
function aimAt(event:PointerEvent){if(!app||!cannons.length||!props.running||lockOn.value)return;const p=point(event),seat=room.value?.seat||1,origin=reefCannon(seat);cannons[seat-1].angle=Math.atan2(p.y-origin.y,p.x-origin.x);}
function fire(event:PointerEvent){
 if(lockOn.value){const p=point(event);selectTarget(p.x,p.y);}else aimAt(event);fireCannon();
}
function trackTarget(){
 if(!lockOn.value)return;
 const time=(Date.now()+clockOffset-epoch)/1000;
 if(lockedTarget.value===null||!alive().includes(lockedTarget.value)||reefTarget(lockedTarget.value,time).x<0||reefTarget(lockedTarget.value,time).x>1200)selectTarget();
 if(lockedTarget.value!==null)cannons[(room.value?.seat||1)-1].angle=reefLeadAngle(room.value?.seat||1,lockedTarget.value,time);
}
function fireCannon(){
 if(error.value||creditPresentation.held!==null||!app||!props.running||firing.value||disposed||stage.busy||stage.pending||props.authenticated&&!room.value)return;
 if(!enoughCredits()){stopAuto('Insufficient available credits for this stake.');return;}
 trackTarget();const seat=room.value?.seat||1,cannon=cannons[seat-1],firedAt=Date.now()+clockOffset,flight=reefFlight(seat,cannon.angle,(firedAt-epoch)/1000,alive());
 const view=new Graphics().ellipse(-9,0,15,5).fill({color:0x1bdfff,alpha:.24}).circle(0,0,5).fill(0xfff7bd).circle(0,0,2).fill(0xffffff);
 view.rotation=flight.angle;view.position.set(flight.origin.x,flight.origin.y);world.addChild(view);
 projectile={view,flight,firedAt,roomId:room.value?.id,requestKey:crypto.randomUUID(),age:0};firing.value=true;cannon.recoil=.2;notice.value='';playSound('shot');
 if(!props.reducedMotion)effect(new Graphics().star(0,0,8,20,5).fill({color:0xffe795,alpha:.9}),flight.origin.x,flight.origin.y,.12);
}
function resize(){if(!app||!host.value)return;app.renderer.resize(host.value.clientWidth,host.value.clientHeight);world.scale.set(app.screen.width/1200,app.screen.height/600);}
onMounted(async()=>{
 try{
  app=new Application();await app.init({width:1200,height:600,backgroundAlpha:0,antialias:true,resolution:Math.min(devicePixelRatio,2),autoDensity:true,preference:'webgl'});
  if(disposed){app.destroy(true);return;}art=await reefTextures(app);if(disposed){Object.values(art).flat().forEach(t=>t.destroy(true));app.destroy(true);return;}
  world=new Container();app.stage.addChild(world);host.value!.appendChild(app.canvas);app.canvas.setAttribute('aria-label','Underwater table with sixteen species including dragons, mermaids, crabs and small schooling fish');app.canvas.setAttribute('role','img');
  for(let id=1;id<=80;id++){
   const p=reefTarget(id,0),view=new Container(),texture=art.creatures[p.species],sprite=new MeshPlane({texture,verticesX:8,verticesY:3});sprite.pivot.set(texture.width/2,texture.height/2);sprite.scale.set(p.radius*2.8/texture.width);
   const vertices=new Float32Array(sprite.geometry.getAttribute('aPosition').buffer.data as Float32Array);
   const shadow=new Sprite(art.creatures[p.species]);shadow.anchor.set(.5);shadow.scale.copyFrom(sprite.scale);shadow.tint=0x002641;shadow.alpha=.34;shadow.position.set(4,8);view.addChild(shadow,sprite);world.addChild(view);creatures.push({id,view,sprite,vertices,hit:0,captured:false});
  }
  for(let seat=1;seat<=4;seat++){
   const view=new Container(),base=reefCannon(seat),barrel=new Sprite(art.cannons[seat-1]);
   view.position.set(base.x,base.y);view.addChild(new Graphics().circle(0,0,42).fill({color:0x001b31,alpha:.85}).circle(0,0,38).stroke({color:[0xecc772,0x74bbf3,0xe86860,0xcf8dfd][seat-1],width:3}));
   barrel.anchor.set(.5,.76);barrel.width=170;barrel.height=114;view.addChild(barrel);world.addChild(view);cannons.push({view,barrel,recoil:0,angle:seat<=2?-Math.PI/2:Math.PI/2});
  }
  reticle=new Graphics().circle(0,0,45).stroke({color:0xffef7e,width:2}).moveTo(-58,0).lineTo(-32,0).moveTo(32,0).lineTo(58,0).moveTo(0,-58).lineTo(0,-32).moveTo(0,32).lineTo(0,58).stroke({color:0xffef7e,width:3});reticle.visible=false;world.addChild(reticle);
  resize();observer=new ResizeObserver(resize);observer.observe(host.value!);app.canvas.addEventListener('pointerdown',fire);app.canvas.addEventListener('pointermove',aimAt);
  await syncRoom();if(disposed)return;poll=setInterval(()=>void syncRoom(),2000);
  app.ticker.add(ticker=>{
   if(!props.running)return;const dt=Math.min(ticker.deltaMS,50)/1000,time=(Date.now()+clockOffset-epoch)/1000;
   for(const fish of creatures){const p=reefTarget(fish.id,time);fish.hit=Math.max(0,fish.hit-dt);fish.view.position.set(p.x+(props.reducedMotion?0:Math.sin(fish.hit*50)*fish.hit*14),p.y);fish.view.scale.set(p.direction,Math.min(1,world.scale.x/world.scale.y));fish.sprite.tint=fish.hit>.2?0xc6f5ff:0xffffff;
    fish.view.rotation=props.reducedMotion?0:Math.sin(time*2+fish.id)*.035;fish.view.visible=!fish.captured&&p.x>-180&&p.x<1380;
    if(fish.view.visible){const buffer=fish.sprite.geometry.getAttribute('aPosition').buffer,positions=buffer.data as Float32Array,width=fish.sprite.texture.width;
     for(let i=0;i<positions.length;i+=2){const along=fish.vertices[i]/width,tail=(1-along)**2;positions[i+1]=fish.vertices[i+1]+(props.reducedMotion?0:Math.sin(time*(p.radius<20?8:4.2)-along*5+fish.id)*width*.035*tail);}
     buffer.update();
    }
   }
   trackTarget();reticle.visible=lockOn.value&&lockedTarget.value!==null;if(reticle.visible){const p=reefTarget(lockedTarget.value!,time);reticle.position.set(p.x,p.y);reticle.rotation=props.reducedMotion?0:time*.5;}
   if(autoOn.value&&!firing.value&&performance.now()>=nextAutoAt){if(stage.pending||stage.busy)stopAuto('Reconnecting. Auto fire is off.');else fireCannon();}
   for(let i=0;i<cannons.length;i++){const c=cannons[i];c.recoil=Math.max(0,c.recoil-dt);c.barrel.rotation=c.angle+Math.PI/2;c.barrel.position.set(-Math.cos(c.angle)*c.recoil*45,-Math.sin(c.angle)*c.recoil*45);c.view.scale.y=Math.min(1,world.scale.x/world.scale.y);c.view.alpha=!room.value||room.value.seat===i+1||room.value.seats.some(s=>s.seat===i+1)?1:.6;}
   if(projectile){const s=projectile;s.age=(Date.now()+clockOffset-s.firedAt)/1000;const t=Math.min(s.age,s.flight.time);s.view.position.set(s.flight.origin.x+s.flight.vx*t,s.flight.origin.y+s.flight.vy*t);
    if(s.age>=s.flight.time){s.view.destroy();projectile=null;void settleShot(s);}
   }
   for(let i=effects.length-1;i>=0;i--){const e=effects[i];e.age+=dt;e.view.alpha=Math.max(0,1-e.age/e.life);if(e.kind==='particle'||e.kind==='coin'){e.view.x+=e.vx*dt;e.view.y+=e.vy*dt;if(e.kind==='coin'){e.vy+=148*dt;e.view.scale.x=Math.cos(e.age*12);e.view.rotation=e.age*.6;}}else e.view.scale.set(props.reducedMotion?1:.55+e.age/e.life*.8);if(e.age>=e.life){e.view.destroy({children:true});effects.splice(i,1);}}
  });if(!props.running)app.stop();
 }catch(e){error.value=`The reef renderer could not start: ${(e as Error).message}`;}
});
function cancelFlight(){if(projectile){projectile.view.destroy();projectile=null;finishedShot();}}
watch(()=>props.running,running=>{if(!running){stopAuto('Paused. Auto fire is off.');cancelFlight();}if(!app?.renderer)return;if(running){app.start();void syncRoom();}else app.stop();});
watch(()=>stage.stake,()=>{stopAuto('Stake changed. Auto fire is off.');cancelFlight();});
watch(()=>stage.recovered,()=>{stopAuto('Connection restored. Ready to fire.');void syncRoom();});
watch(()=>props.authenticated,()=>stopAuto());
onBeforeUnmount(()=>{clearTimeout(bannerTimer);stopAuto();disposed=true;clearInterval(poll);observer?.disconnect();if(app?.renderer){app.canvas.removeEventListener('pointerdown',fire);app.canvas.removeEventListener('pointermove',aimAt);app.destroy(true,{children:true});if(art)Object.values(art).flat().forEach((t:RenderTexture)=>t.destroy(true));}});
</script>
<template><section class="reef-preview reef-deluxe"><div ref="host" class="fish-canvas" :data-target="lockedTarget ?? ''"><p v-if="error" class="error" role="alert">{{error}}</p><div v-if="!running" class="paused-overlay">Paused</div></div><div class="reef-seat-plaque" :data-seat="seat" v-for="seat in 4" :key="seat" :class="[`seat-${seat}`,{yours:room?.seat===seat}]"><small>{{room?.seat===seat?'YOUR CANNON':`CANNON ${seat}`}}</small><b>{{room?.seats.find(s=>s.seat===seat)?.display_name || 'Open seat'}}</b><em v-if="room?.seat===seat && stage.enabled">{{formatCredits(stage.stake)}} / SHOT</em></div><Transition name="catch-banner"><div v-if="catchBanner" class="reef-catch-banner" role="status"><small>{{catchBanner.title}}</small><strong>+{{catchBanner.award}}</strong><span>{{catchBanner.species}} · PLAY CREDITS</span></div></Transition><p class="reef-shot-notice" role="status">{{notice}}</p><div class="reef-console"><div class="led-meter"><small>CREDITS</small><strong>{{balance||'0.00'}}</strong></div><BetControls :reduced-motion="reducedMotion" game="reef-party" :ready="running" :authenticated="!!authenticated" :busy="firing"/><div class="fish-actions"><button :aria-pressed="autoOn" aria-label="Auto fire" :disabled="!running||!!stage.pending||!!error" @click="toggleAuto"><b>⟳</b><span>AUTO {{autoOn?'ON':'OFF'}}</span></button><button :aria-pressed="lockOn" aria-label="Target lock" :disabled="!running" @click="toggleLock"><b>⌖</b><span>LOCK {{lockOn?'ON':'OFF'}}</span></button><button :aria-pressed="fast" aria-label="Fast fire cadence" :disabled="!running" @click="fast=!fast"><b>▶▶</b><span>{{fast?'FAST 2×':'NORMAL 1×'}}</span></button></div><span class="cannon-ready" :class="{busy:firing}">{{firing?'● FIRING':'● CANNON READY'}}</span><button class="line-map-button" :aria-expanded="guide" @click="guide=!guide">SPECIES</button></div><div v-if="guide" class="reef-field-guide" aria-label="Fish species"><span v-for="(species,index) in reefSpecies" :key="species"><AquaticSprite :species="index"/>{{species}}</span></div></section></template>
