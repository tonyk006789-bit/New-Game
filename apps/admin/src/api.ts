export type Wallet={settled:string;reserved:string;available:string;version:string};
export type Account={id:string;username:string;displayName:string;role:'MAIN_ADMIN'|'SUB_DISTRIBUTOR'|'AGENT'|'PLAYER';csrf:string;wallet:Wallet};
export type Member=Omit<Account,'csrf'> & {active:boolean;archived:boolean;branchEnabled:boolean;branch:string;createdAt:string;canManage:boolean;canRedeem:boolean;canTransfer:boolean;canAdjust:boolean;publicId:string;registeredIp:string|null;loginCount:string;lastLogin:string|null;lastIp:string|null;manager:string|null};
export type Page<T>={items:T[];total:string;page:number;pageSize:number};
export type Entry={id:string;public_id:string;origin_ip:string|null;kind:string;account_id:string;username:string;display_name:string;actor:string;reason:string;request_id:string;related_id:string|null;created_at:string;units:string;before_units:string;after_units:string;wallet_version:string;round_id:string|null;game_id:string|null;profile_id:string|null;stake_units:string|null;award_units:string|null};
export type Receipt=Entry&{postings:{username:string;units:string;before_units:string;after_units:string;wallet_version:string}[]};
let csrf='';
export class ApiError extends Error{constructor(message:string,public status:number,public code:string){super(message);}}
export async function api<T>(path:string,body?:unknown):Promise<T>{
 let response:Response;
 try{response=await fetch(`/v1/${path}`,{method:body===undefined?'GET':'POST',credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json','X-CSRF-Token':csrf},...(body===undefined?{}:{body:JSON.stringify(body)})});}catch{throw new ApiError('Connection interrupted. Retry the same request to check its result.',0,'NETWORK_ERROR');}
 const data=await response.json().catch(()=>null);
 if(!response.ok)throw new ApiError(data?.message||data?.code||'The service is unavailable.',response.status,data?.code||'SERVICE_UNAVAILABLE');
 return data as T;
}
export async function signIn(username:string,password:string){const result=await api<{csrf?:string;deviceReviewRequired?:boolean}>('auth/login',{username,password});if(result.deviceReviewRequired)throw new ApiError('This device is awaiting approval. Use an approved device to review it, then sign in again.',403,'DEVICE_REVIEW_REQUIRED');csrf=result.csrf!;}
export async function refreshAccount(){const result=await api<Account>('me');csrf=result.csrf;return result;}
export function clearSession(){csrf='';}
