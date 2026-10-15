// Raster fallback renders exported from the local DealerCheck fixture's visible
// Rendered dealer PNG link. Same MIT models, materials and renderer as the game.
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),sharp=require('C:/Users/kcdre/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const manifest={creator:'Microsoft / Rocketbox; New Game render',license:'MIT',source:'reports/dealer-models-v41.json',assets:[]};
for(const [key,source] of [['royal-blackjack','royal'],['double-deck-blackjack','double'],['european-blackjack','european']]){
 const bytes=await sharp(`.cache/rocketbox/${source}-poster.png`).trim({threshold:1}).resize({height:600}).webp({quality:88,alphaQuality:95}).toBuffer();
 const sha256=createHash('sha256').update(bytes).digest('hex'),url=`/art/dealers/${key}-poster-${sha256.slice(0,12)}.webp`;
 await fs.writeFile('apps/player/public'+url,bytes);manifest.assets.push({key,url,bytes:bytes.length,sha256});
}
await fs.writeFile('reports/dealer-posters-v41.json',JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile('apps/player/src/dealer-posters.json',JSON.stringify(Object.fromEntries(manifest.assets.map(a=>[a.key,a.url])),null,2)+'\n');
console.log(manifest.assets.map(a=>`${a.key}: ${a.bytes} bytes`).join('\n'));
