// Delivery compression only; original ImageGen PNG sources remain intact.
import {createRequire} from 'node:module';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const sharp=process.env.SHARP_MODULE?require(process.env.SHARP_MODULE):require('sharp');
const root='apps/player/public/art/';
const entries=JSON.parse(await readFile('apps/player/src/presentation-assets.json','utf8'));
for(const [id,source,width,quality] of [['coral-rush','coral-cover-v46.png',440,76],['coral-background','coral-background-v46.png',1672,84]]){
 const data=await sharp(root+source).resize({width,withoutEnlargement:true}).webp({quality,effort:6}).toBuffer();
 const sha256=createHash('sha256').update(data).digest('hex');
 const name=id==='coral-rush'?`delivery/coral-rush-${sha256.slice(0,12)}.webp`:'coral-background-v46.webp';
 await writeFile(root+name,data);
 entries[id]={url:`/art/${name}`,bytes:data.length,sha256,source:root+source};
 console.log(`${id}: ${data.length} bytes`);
}
await writeFile('apps/player/src/presentation-assets.json',JSON.stringify(entries,null,2)+'\n');
