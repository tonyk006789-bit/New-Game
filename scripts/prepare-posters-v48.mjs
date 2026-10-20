// Preserve the original full-cover composition. Only resize/re-encode delivery copies.
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const require=createRequire(import.meta.url);
const sharp=require(process.env.SHARP_MODULE||'sharp');
const originals=JSON.parse(await readFile('apps/player/src/presentation-assets.json','utf8'));
const folder='apps/player/public/art/delivery',entries={};
await mkdir(folder,{recursive:true});
for(const [id,asset] of Object.entries(originals)){
 if(id.startsWith('dealer-')||['lobby-hall','coral-background'].includes(id))continue;
 const variants=[];
 for(const width of [240,480]){
  const data=await sharp(`apps/player/public${asset.url}`).resize(width,width,{fit:'inside',withoutEnlargement:true}).webp({quality:width===240?76:80,effort:6}).toBuffer();
  const hash=createHash('sha256').update(data).digest('hex'),file=`${id}-${width}-${hash.slice(0,12)}.webp`;
  await writeFile(`${folder}/${file}`,data);
  const meta=await sharp(data).metadata();
  variants.push({url:`/art/delivery/${file}`,width:meta.width,height:meta.height,bytes:data.length,sha256:hash});
 }
 entries[id]={source:asset.url,originalBytes:asset.bytes,variants};
}
await writeFile('apps/player/src/poster-assets.json',JSON.stringify(entries,null,2)+'\n');
// The walking-floor sprite was another 1.8 MB image competing with cabinet covers.
// Lossless WebP keeps its green-key colors exact after resizing to 2x display detail.
const avatarSource='apps/player/public/art/arcade-host-v7.png';
const avatar=await sharp(avatarSource).resize(768,512).webp({lossless:true,effort:6}).toBuffer();
const avatarHash=createHash('sha256').update(avatar).digest('hex'),avatarFile=`floor-host-${avatarHash.slice(0,12)}.webp`;
await writeFile(`${folder}/${avatarFile}`,avatar);
await writeFile('apps/player/src/floor-avatar.json',JSON.stringify({url:`/art/delivery/${avatarFile}`,bytes:avatar.length,sha256:avatarHash,source:avatarSource,sourceBytes:(await readFile(avatarSource)).length},null,2)+'\n');
console.log(JSON.stringify({games:Object.keys(entries).length,oldCovers:Object.values(entries).reduce((s,e)=>s+e.originalBytes,0),small:Object.values(entries).reduce((s,e)=>s+e.variants[0].bytes,0),large:Object.values(entries).reduce((s,e)=>s+e.variants[1].bytes,0)}));
