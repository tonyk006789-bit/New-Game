import {reefTier,reefSpecies} from '@new-game/game-math';
export type BossReveal={id:string;seat:number;award:string};
// A visual receipt, never another outcome. Only accepted, paid boss catches qualify.
export function bossReveal(id:string,seat:number,species:number,captured:boolean,award:string):BossReveal|null{
 if(!captured||!Number.isInteger(species)||species<0||species>=reefSpecies.length||reefTier(species)!=='boss'||!/^[0-9]+$/.test(award)||BigInt(award)<=0n||!Number.isInteger(seat)||seat<1||seat>4)return null;
 return {id,seat,award};
}
