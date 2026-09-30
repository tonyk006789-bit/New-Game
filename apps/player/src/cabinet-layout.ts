import type {GameId} from '@new-game/contracts';

export const portraitGames:readonly GameId[]=['sapphire-crown','aurora-vault'];
export const portraitRotationQuery='(orientation: landscape) and (max-width: 1000px) and (max-height: 600px)';
export function isPortraitGame(game:string){return portraitGames.includes(game as GameId);}
// Solar's existing award only depends on the middle coin row. Showing that row
// does not discard any paying symbol or alter the server's persisted sequence.
export function displayedReelGrid(game:string,grid:string[][]){return game==='solar-fortune'?[grid[1]]:grid;}
