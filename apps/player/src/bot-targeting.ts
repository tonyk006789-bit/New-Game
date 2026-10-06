import {reefTarget,reefLeadAngle,reefFlight,type FishGame} from '@new-game/game-math';
/** Visual targeting only. It never submits shots, captures a target or changes credits. */
export function chooseBotFlight(game:FishGame,seat:number,time:number,available:readonly number[],excluded:ReadonlySet<number>,sequence:number){
 const visible=available.filter(id=>{const p=reefTarget(id,time,game);return p.active&&p.x>40&&p.x<1160&&p.y>65&&p.y<535;});
 const candidates=visible.filter(id=>!excluded.has(id)).sort((a,b)=>((a*37+seat*13+sequence*19)%97)-((b*37+seat*13+sequence*19)%97));
 for(const id of candidates){
  const flight=reefFlight(seat,reefLeadAngle(seat,id,time,game),time,[...available],game);
  if(flight.targetId!==null&&visible.includes(flight.targetId)&&!excluded.has(flight.targetId)&&flight.time>.04)return flight;
 }return null;
}
