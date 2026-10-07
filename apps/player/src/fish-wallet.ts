export type FishWallet={available:string;version:string};
type Receipt={before:FishWallet;after:FishWallet;award:bigint;readyAt:number};
// Costs of received shots show immediately, even with out-of-order responses.
// Only awards wait for their catch reveal. Polls cannot leak an unseen award.
export class FishWalletPresentation {
 private receipts=new Map<string,Receipt>();
 private base:FishWallet;
 constructor(public wallet:FishWallet){this.base={...wallet};}
 accept(before:FishWallet,after:FishWallet,award:string,now:number){
  if(BigInt(after.version)<=BigInt(this.base.version)||this.receipts.has(after.version))return;
  this.receipts.set(after.version,{before,after,award:BigInt(award),readyAt:now+(BigInt(award)>0n?900:0)});
 }
 advance(now:number){
  const ordered=[...this.receipts.values()].sort((a,b)=>BigInt(a.after.version)<BigInt(b.after.version)?-1:1);
  for(const receipt of ordered){
   if(BigInt(receipt.before.version)>BigInt(this.base.version)||now<receipt.readyAt)break;
   this.base=receipt.after;this.receipts.delete(receipt.after.version);
  }
  let available=BigInt(this.base.available),version=BigInt(this.base.version);
  for(const r of this.receipts.values()){
   available+=BigInt(r.after.available)-BigInt(r.before.available)-(now<r.readyAt?r.award:0n);
   if(BigInt(r.after.version)>version)version=BigInt(r.after.version);
  }
  this.wallet={available:(available<0n?0n:available).toString(),version:version.toString()};return this.wallet;
 }
 reconcile(wallet:FishWallet,now:number,idle:boolean){
  this.advance(now);
  if(idle&&[...this.receipts.values()].every(r=>r.readyAt<=now)&&BigInt(wallet.version)>=BigInt(this.wallet.version)){
   this.base={...wallet};this.wallet=wallet;this.receipts.clear();
  }
  return this.wallet;
 }
}
