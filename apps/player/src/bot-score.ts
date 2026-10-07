import {reefTier,type FishGame} from '@new-game/game-math';
export type BotScore={points:number;combos:number;hits:number;lastGain:number};
const goals={small:8,medium:14,large:24,boss:40},points={small:10,medium:30,large:80,boss:200};
/** AI hit-combo points only. No wallet, payout request or shared target mutation. */
export class BotScoreboard{
 private scores=new Map<number,BotScore>();
 private chains=new Map<string,{hits:number;last:number}>();
 hit(seat:number,target:number,species:number,now:number){
  if(!Number.isInteger(seat)||seat<1||seat>4||!Number.isInteger(target)||target<1||target>80||!Number.isFinite(now))throw new Error('Invalid AI impact');
  const tier=reefTier(species),key=`${seat}:${target}`,previous=this.chains.get(key),chain=previous&&now>=previous.last&&now-previous.last<12000?previous:{hits:0,last:now};
  chain.hits++;chain.last=now;
  const gain=chain.hits>=goals[tier]?points[tier]:0;if(gain)chain.hits=0;this.chains.set(key,chain);
  const old=this.scores.get(seat)||{points:0,combos:0,hits:0,lastGain:0},next={points:Math.min(Number.MAX_SAFE_INTEGER,old.points+gain),combos:old.combos+Number(gain>0),hits:old.hits+1,lastGain:gain};this.scores.set(seat,next);
  return {score:{...next},gain,progress:chain.hits,goal:goals[tier]};
 }
 reset(){this.scores.clear();this.chains.clear();}
}
const names:Record<FishGame,readonly string[]>={'corsair-cove':['Rook','Sable','Flint','Pearl'],'cosmic-tides':['Vega','Lyra','Orion','Sol'],'reef-party':['Coral','Finn','Marina','Kai'],'abyss-legends':['Ember','Nova','Atlas','Onyx'],'sunken-dynasty':['Jade','Lotus','River','Pearl'],'polar-odyssey':['Frost','Aurora','Skye','Glacier']};
export const botName=(game:FishGame,seat:number)=>names[game][seat-1]||'Crew';
export function botCadence(seat:number,shot:number,reducedMotion=false){
 if(reducedMotion)return 700+(seat*31+shot*17)%160;
 return shot%(4+seat%2)===0?410+(shot*29+seat*43)%230:150+(seat*37+shot*23)%140;
}
