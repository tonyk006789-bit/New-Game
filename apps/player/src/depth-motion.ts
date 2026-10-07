import {onBeforeUnmount,onMounted,watch,type Ref} from 'vue';

/** One spring loop for the hovered cabinet. Touch scrolling and game aim stay native. */
export function useDepthMotion(root:Ref<HTMLElement|undefined>,enabled:Ref<boolean>){
 let card:HTMLElement|null=null,frame=0,last=0,x=0,y=0,targetX=0,targetY=0,leaving=false;
 function reset(){cancelAnimationFrame(frame);frame=0;last=0;if(card){card.style.removeProperty('--lean-x');card.style.removeProperty('--lean-y');card.removeAttribute('data-tilting');}card=null;x=0;y=0;}
 function tick(now:number){
  if(!enabled.value||!card?.isConnected){reset();return;}
  const dt=last?Math.min(.05,(now-last)/1000):1/60;last=now;
  const blend=1-Math.exp(-14*dt);x+=(targetX-x)*blend;y+=(targetY-y)*blend;
  card.style.setProperty('--lean-x',`${x.toFixed(3)}deg`);card.style.setProperty('--lean-y',`${y.toFixed(3)}deg`);
  if(Math.abs(x-targetX)+Math.abs(y-targetY)>.015)frame=requestAnimationFrame(tick);else{frame=0;last=0;if(leaving)reset();}
 }
 function move(event:PointerEvent){
  if(!enabled.value||event.pointerType==='touch')return;
  const next=(event.target as Element).closest<HTMLElement>('[data-depth-card]');
  if(!next||!root.value?.contains(next)){leave();return;}
  if(next!==card){reset();card=next;card.setAttribute('data-tilting','true');}
  leaving=false;
  const box=card.getBoundingClientRect();
  targetX=Math.max(-1,Math.min(1,(event.clientY-box.top)/box.height*2-1))*-4;
  targetY=Math.max(-1,Math.min(1,(event.clientX-box.left)/box.width*2-1))*5;
  if(!frame)frame=requestAnimationFrame(tick);
 }
 function leave(){leaving=true;targetX=targetY=0;if(card&&!frame)frame=requestAnimationFrame(tick);}
 onMounted(()=>{root.value?.addEventListener('pointermove',move,{passive:true});root.value?.addEventListener('pointerleave',leave);});
 watch(enabled,on=>{if(!on)reset();});
 onBeforeUnmount(()=>{reset();root.value?.removeEventListener('pointermove',move);root.value?.removeEventListener('pointerleave',leave);});
}
