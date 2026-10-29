import {catalog,type GameId} from '@new-game/contracts';
import {blackjackCreditApproved,blackjackProfileFor,isBlackjackGame,isCabinetGame,cabinetGames,cabinetBase,hasLowStake} from '@new-game/game-math';
import {isPortraitGame} from './cabinet-layout';
export function gameFacts(id:GameId){
 const game=catalog.find(g=>g.id===id)!;
 const preview=isBlackjackGame(id)&&!blackjackCreditApproved(id);
 let mechanic:string=game.detail;
 if(isCabinetGame(id))mechanic=cabinetBase(id)==='coin-carnival'?'Collect all five center symbols':`${cabinetGames[id].columns} reels · ${cabinetGames[id].lines.length} active lines`;
 if(id==='temple-lights')mechanic='5 reels · 3 horizontal lines';
 if(game.category==='Keno')mechanic='4–10 picks · 20 of 80 numbers';
 if(game.category==='Fish')mechanic='4 seats · Independent capture attempts';
 if(isBlackjackGame(id)){const profile=blackjackProfileFor(id);mechanic=`${profile.decks} decks · ${profile.standSoft17?'Stands on all 17s':'Hits soft 17'}`;}
 return {preview,mode:preview?'Free preview':'Play credits',orientation:isPortraitGame(id)?'Portrait · 9:16':'Landscape · 16:9',minimum:isBlackjackGame(id)?'0.50':hasLowStake(id)?'0.10':'0.25',mechanic};
}
