export const characterGames=['clockwork-vault','phoenix-falls','outlaw-sevens','celestial-wilds','meteor-keno','bamboo-keno','double-deck-blackjack','european-blackjack'];
export const characterNames=['Orin · Clockmaker','Solara · Phoenix','Rhea · Sheriff','Selene · Star guide','Pip · Navigator','Ember · Explorer','Nico · Dealer','Camille · Dealer'];
export const characterCell=(game:string)=>characterGames.indexOf(game);
export const characterBox=(game:string)=>{const cell=characterCell(game);return `${cell%4*384} ${Math.floor(cell/4)*512} 384 512`;};
export const expansionSymbolNames:Record<string,Record<string,string>>={
 'outlaw-sevens':{seven:'Gold seven',cherry:'Ruby cherries',bell:'Sheriff bell',bar:'Saloon BAR',gem:'Turquoise star'},
 'celestial-wilds':{dragon:'Moon scepter · WILD',coin:'Star coin',lotus:'Constellation lotus',gem:'Violet diamond',bell:'Silver bell',leaf:'Feather',seven:'Celestial seven'}
};
