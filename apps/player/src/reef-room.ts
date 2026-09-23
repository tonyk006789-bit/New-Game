export interface ReefRoom {
 id:string;seat:number;score:number;seats:{seat:number;display_name:string}[];
 targets:{target_id:number;captured:boolean}[];startedAt:string;serverTime:number;
}
export interface ReefTable {id:string;number:number;capacity:number;seats:{seat:number;display_name:string;yours:boolean}[]}
