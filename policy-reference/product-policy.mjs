/** Pure planning/validation references only. No authentication, database, durable
 * idempotency, audit persistence, network API or production approval is implemented.
 * principal fields must come from trusted server authentication, never a request body.
 */
export const MAX_UNITS = (1n << 63n) - 1n;
const fail=(code)=>{const error=new Error(code);error.code=code;throw error;};
function text(value,min,max,code){if(typeof value!=='string'||value.trim().length<min||value.length>max)fail(code);return value.trim();}
function units(value,minimum,code){if(typeof value!=='bigint'||value<minimum||value>MAX_UNITS)fail(code);return value;}
export function newPlayerWallet(id){
 text(id,1,128,'BAD_WALLET_ID');
 return Object.freeze({id,settledUnits:0n,reservedUnits:0n,version:0});
}
export function availableUnits(wallet){
 units(wallet?.settledUnits,0n,'BAD_BALANCE');units(wallet?.reservedUnits,0n,'BAD_RESERVED');
 if(wallet.reservedUnits>wallet.settledUnits)fail('BAD_RESERVED');
 return wallet.settledUnits-wallet.reservedUnits;
}
/** Produces a proposed balanced posting; caller must atomically authorize/recheck/commit. */
export function planManualAdjustment({principal,wallet,direction,amountUnits,reason,idempotencyKey,expectedWalletVersion}){
 if(principal?.role!=='MAIN_ADMIN'||principal?.active!==true)fail('FORBIDDEN');
 const actorId=text(principal.id,1,128,'BAD_ACTOR');
 if(principal.stepUpVerified!==true)fail('STEP_UP_REQUIRED');
 const walletId=text(wallet?.id,1,128,'BAD_WALLET_ID');
 const available=availableUnits(wallet);
 if(!Number.isSafeInteger(wallet.version)||wallet.version<0||wallet.version===Number.MAX_SAFE_INTEGER)fail('BAD_VERSION');
 if(!Number.isSafeInteger(expectedWalletVersion)||expectedWalletVersion!==wallet.version)fail('STALE_WALLET');
 if(direction!=='ADD'&&direction!=='REMOVE')fail('BAD_DIRECTION');
 units(amountUnits,1n,'BAD_AMOUNT');
 const why=text(reason,5,500,'REASON_REQUIRED');
 const key=text(idempotencyKey,8,128,'BAD_IDEMPOTENCY_KEY');
 if(direction==='REMOVE'&&amountUnits>available)fail('INSUFFICIENT_AVAILABLE');
 const delta=direction==='ADD'?amountUnits:-amountUnits;
 const after=wallet.settledUnits+delta;
 units(after,0n,'BALANCE_OVERFLOW');
 const counter=direction==='ADD'?'SYSTEM_MANUAL_ISSUANCE':'SYSTEM_MANUAL_REMOVAL';
 return {
  status:'PROPOSED_NOT_COMMITTED',
  actorId,walletId,direction,reason:why,idempotencyKey:key,expectedWalletVersion,
  beforeUnits:wallet.settledUnits.toString(),afterUnits:after.toString(),
  reservedUnits:wallet.reservedUnits.toString(),availableAfterUnits:(after-wallet.reservedUnits).toString(),
  entries:[{account:walletId,changeUnits:delta.toString()},{account:counter,changeUnits:(-delta).toString()}],
  nextVersion:wallet.version+1,
 };
}
/** Only validates decision-record completeness; not authenticated approval or math proof. */
export function assertApprovedSlotDecision(record){
 if(record?.status!=='APPROVED')fail('SLOT_MATH_NOT_APPROVED');
 if(!['HIT_RATE','RTP','NET_WIN_RATE'].includes(record.metric))fail('METRIC_REQUIRED');
 for(const k of ['approvedProfileId','approvalRef'])text(record[k],1,200,'APPROVAL_FIELDS_REQUIRED');
 if(typeof record.approvedMathHash!=='string'||!/^[a-f0-9]{64}$/i.test(record.approvedMathHash))fail('MATH_HASH_REQUIRED');
 const field=record.metric==='RTP'?'targetRtp':record.metric==='HIT_RATE'?'targetHitRate':'targetNetWinRate';
 const target=record[field];
 if(typeof target!=='number'||!Number.isFinite(target)||target<0||(record.metric!=='RTP'&&target>1))fail('TARGET_REQUIRED');
 return record.approvedProfileId;
}
