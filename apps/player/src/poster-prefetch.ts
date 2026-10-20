import {watch,type Ref} from 'vue';
import type {GameId} from '@new-game/contracts';
import {posterSource,posterSizes} from './poster-source';
const cached=new Set<string>();
/** Warm two adjacent covers only after visible images finish; one low-priority decode. */
export function usePosterPrefetch(ids:Ref<readonly GameId[]>,running:()=>boolean,floor=false){
 watch([ids,running],([games,active],_,cleanup)=>{
  const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;
  if(!active||connection?.saveData||['slow-2g','2g','3g'].includes(connection?.effectiveType||''))return;
  let cancelled=false,index=0;
  const queue=games.slice(0,2).filter(id=>!cached.has(id));
  async function worker(){
   if(Array.from(document.querySelectorAll<HTMLImageElement>('.poster-thumbnail')).some(img=>!img.complete&&img.getBoundingClientRect().top<innerHeight))return;
   while(!cancelled&&!document.hidden&&navigator.onLine&&index<queue.length){
    const id=queue[index++],source=posterSource(id),image=new Image();image.decoding='async';image.fetchPriority='low';image.sizes=floor?posterSizes.floor:posterSizes.shelf;image.srcset=source.srcset;image.src=source.src;
    try{await image.decode();cached.add(id);}catch{/* Visible cards retry normally when opened. */}
   }
  }
  const timer=setTimeout(()=>{void worker();},1800);
  cleanup(()=>{cancelled=true;clearTimeout(timer);});
 },{immediate:true});
}
