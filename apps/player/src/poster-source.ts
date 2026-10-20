import type {GameId} from '@new-game/contracts';
import posters from './poster-assets.json';
// sizes describes CSS pixels; the browser chooses a sharper source on high-DPR phones.
export const posterSizes={shelf:'(max-width: 650px) calc((100vw - 62px) / 2), (max-width: 1440px) calc((100vw - 120px) / 4), 330px',floor:'(max-width: 650px) 20vw, 180px'};
export function posterSource(id:GameId){
 const variants=posters[id].variants;
 return {src:variants.at(-1)!.url,srcset:variants.map(v=>`${v.url} ${v.width}w`).join(', ')};
}
