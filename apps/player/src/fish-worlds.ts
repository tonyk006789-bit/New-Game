import type {FishGame} from '@new-game/game-math';
type World={background:string;atlas:string;width:number;height:number;first:number;regions:number[][]};
// Atlas crops are shared by canvas meshes, posters and species rules.
const cannons=Array.from({length:4},(_,i)=>[i*362,680,362,406]);
const dynastyRegions=[[10,80,332,195],[392,85,315,220],[728,5,344,317],[1090,85,358,220],[3,375,375,287],[387,374,326,285],[720,324,365,340],[1088,310,360,368],...cannons];
const polarRegions=[[18,75,328,227],[384,64,328,244],[732,60,354,245],[1090,10,358,307],[0,386,447,264],[384,369,334,287],[726,349,358,322],[1083,336,365,341],...cannons];
export const fishWorlds:Partial<Record<FishGame,World>>={
 'sunken-dynasty':{background:'/art/dynasty-background-v22.png',atlas:'/art/dynasty-atlas-v22.png',width:1448,height:1086,first:24,regions:dynastyRegions},
 'polar-odyssey':{background:'/art/polar-background-v22.png',atlas:'/art/polar-atlas-v22.png',width:1448,height:1086,first:32,regions:polarRegions}
};
export const speciesWorld=(species:number)=>Object.values(fishWorlds).find(w=>species>=w.first&&species<w.first+8);
