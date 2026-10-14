import {watch,type Ref} from 'vue';
import type {GameId} from '@new-game/contracts';
import assets from './presentation-assets.json';
const cached=new Set<string>();
/** Only the adjacent page, at most two decodes at a time, while the lobby is active. */
export function usePosterPrefetch(ids:Ref<readonly GameId[]>,running:()=>boolean){
 watch([ids,running],([games,active],_,cleanup)=>{
  const connection=(navigator as Navigator&{connection?:{saveData?:boolean;effectiveType?:string}}).connection;
  if(!active||connection?.saveData||['slow-2g','2g'].includes(connection?.effectiveType||''))return;
  let cancelled=false,index=0;
  const queue=games.slice(0,8).map(id=>assets[id].url).filter(url=>!cached.has(url));
  async function worker(){
   while(!cancelled&&!document.hidden&&navigator.onLine&&index<queue.length){
    const url=queue[index++],image=new Image();image.decoding='async';image.fetchPriority='low';image.src=url;
    try{await image.decode();cached.add(url);}catch{/* Visible cards retry normally when opened. */}
   }
  }
  const timer=setTimeout(()=>{void worker();void worker();},800);
  cleanup(()=>{cancelled=true;clearTimeout(timer);});
 },{immediate:true});
}
