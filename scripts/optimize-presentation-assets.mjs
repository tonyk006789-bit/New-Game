// Lossy delivery copies of existing original artwork, never replacements for sources.
// Capture tools/poster-export.html with CUA before running; preserves the full-card
// compositions instead of loading multi-megabyte game atlases in the lobby.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const sharp=process.env.SHARP_MODULE?require(process.env.SHARP_MODULE):require('sharp');
const root='apps/player/public/art/delivery',entries={};
await mkdir(root,{recursive:true});
async function save(id,pipeline,source){
 const data=await pipeline.webp({quality:83,effort:6,alphaQuality:100}).toBuffer();
 const hash=createHash('sha256').update(data).digest('hex');
 const file=`${id}-${hash.slice(0,12)}.webp`;
 await writeFile(`${root}/${file}`,data);
 entries[id]={url:`/art/delivery/${file}`,bytes:data.length,sha256:hash,source};
}
const source='reports/screenshots/v39/poster-source.png';
for(const {id,...box} of JSON.parse(await readFile('reports/screenshots/v39/poster-tiles.json','utf8'))){
 await save(id,sharp(source).extract(box),source);
}
for(const [id,file] of Object.entries({'dealer-royal':'blackjack-dealer-v37.png','dealer-double':'blackjack-double-dealer-v38.png','dealer-european':'blackjack-european-dealer-v38.png'})){
 const src=`apps/player/public/art/${file}`,meta=await sharp(src).metadata();
 await save(id,sharp(src).extract({left:meta.width/2,top:meta.height/2,width:meta.width/2,height:meta.height/2}).resize(640,640),src);
}
await save('lobby-hall',sharp('apps/player/public/art/arcade-hall-v7.png').resize({width:1440,withoutEnlargement:true}),'apps/player/public/art/arcade-hall-v7.png');
await writeFile('apps/player/src/presentation-assets.json',JSON.stringify(entries,null,2)+'\n');
await writeFile('reports/presentation-assets-v39.json',JSON.stringify({sourceBytes:(await stat(source)).size,entries},null,2)+'\n');
console.log(`${Object.keys(entries).length} delivery assets, ${Object.values(entries).reduce((n,e)=>n+e.bytes,0)} bytes total.`);
