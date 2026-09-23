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
