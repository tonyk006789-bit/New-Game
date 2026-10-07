// Owner-approved smaller stakes for exactly half of the 30-game test catalog.
// Preserve all previous choices so pending/historical rounds remain recoverable.
export const lowStakeGames = [
 'neon-sevens','ruby-rush','disco-diamonds','outlaw-sevens','temple-lights',
 'jade-fortune','celestial-wilds','ember-relics','clockwork-vault',
 'orchard-numbers','meteor-keno','bamboo-keno',
 'reef-party','polar-odyssey','cosmic-tides'
] as const;
const originalStakes=Array.from({length:80},(_,i)=>String((i+1)*25));
export const stakePolicy={id:'stage-stakes-v32',lowStakeGames,additionalUnits:['10','20'],maximumUnits:'2000'} as const;
export const hasLowStake=(game:string)=>(lowStakeGames as readonly string[]).includes(game);
export function stakesForGame(game:string):readonly string[]{
 if(['royal-blackjack','double-deck-blackjack','european-blackjack'].includes(game))return Array.from({length:40},(_,i)=>String((i+1)*50));
 return hasLowStake(game)?['10','20',...originalStakes]:originalStakes;
}
export function validGameStake(game:string,value:string){return stakesForGame(game).includes(value);}
