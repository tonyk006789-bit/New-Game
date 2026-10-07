import {reactive} from 'vue';
// This holds only a displayed number; authoritative wallets are never delayed or edited.
export const creditPresentation=reactive({game:'',accountId:'',held:null as string|null});
export function holdCredits(game:string,accountId:string,available:string){
 creditPresentation.game=game;creditPresentation.accountId=accountId;creditPresentation.held=available;
}
export function revealCredits(game?:string){
 if(game&&game!==creditPresentation.game)return;
 creditPresentation.held=null;creditPresentation.game='';creditPresentation.accountId='';
}
// Display a submitted stake immediately. The server still decides acceptance;
// rejection restores its wallet, never a local grant.
export function holdStake(game:string,accountId:string,available:string,stake:string){
 holdCredits(game,accountId,(BigInt(available)>BigInt(stake)?BigInt(available)-BigInt(stake):0n).toString());
}
export function holdAward(game:string,accountId:string,after:string,award:string){holdStake(game,accountId,after,award);}
