export type FishWallet={available:string;version:string};
type Receipt={before:FishWallet;after:FishWallet;readyAt:number};
// Present consecutive committed wallet versions only, after their catch was shown.
// A later HTTP response must not reveal an earlier, still-unseen award.
export class FishWalletPresentation {
 private receipts:Receipt[]=[];
 constructor(public wallet:FishWallet){}
 accept(before:FishWallet,after:FishWallet,award:string,now:number){
  if(BigInt(after.version)<=BigInt(this.wallet.version))return;
  this.receipts.push({before,after,readyAt:now+(BigInt(award)>0n?900:0)});
 }
 advance(now:number){
  this.receipts.sort((a,b)=>BigInt(a.after.version)<BigInt(b.after.version)?-1:1);
  while(this.receipts.length){const receipt=this.receipts[0];
   if(BigInt(receipt.after.version)<=BigInt(this.wallet.version)){this.receipts.shift();continue;}
   if(BigInt(receipt.before.version)>BigInt(this.wallet.version)||now<receipt.readyAt)break;
   this.wallet=receipt.after;this.receipts.shift();
  }
  return this.wallet;
 }
 // Account for manual transfers once no unknown shot receipts remain. All known
 // wins still finish first; this also bridges an external wallet-version gap.
 reconcile(wallet:FishWallet,now:number,idle:boolean){
  this.advance(now);
  if(idle&&this.receipts.every(r=>r.readyAt<=now)&&BigInt(wallet.version)>=BigInt(this.wallet.version)){this.wallet=wallet;this.receipts=[];}
  return this.wallet;
 }
}
