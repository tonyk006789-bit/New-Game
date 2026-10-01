import type {FishGame} from '@new-game/game-math';
export type ReefImpact={id:string;seat:number;targetId:number;captured:boolean;award:string;flight:{firedAt:number;impactAt:number;angle:number;x:number;y:number}};
export interface ReefRoom {
 game:FishGame;impacts?:ReefImpact[];
 id:string;seat:number;score:number;seats:{seat:number;display_name:string}[];
 targets:{target_id:number;captured:boolean}[];startedAt:string;serverTime:number;
}
export interface ReefTable {id:string;game?:FishGame;number:number;capacity:number;seats:{seat:number;display_name:string;yours:boolean}[]}
