import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const sharp=createRequire(import.meta.url)(process.env.SHARP_MODULE||'sharp');
const root=path.resolve(import.meta.dirname,'..');
const out=path.join(root,'apps/player/public/art/identity-v47');
await fs.mkdir(out,{recursive:true});
const groups=[
 ['classics',6,['neon-sevens','ruby-rush','disco-diamonds','outlaw-sevens']],
 ['wilds',8,['jade-fortune','sapphire-crown','midnight-express','celestial-wilds']],
 ['collectors',6,['coin-carnival','solar-fortune','pirate-gold','temple-lights']],
 ['features',6,['aurora-vault','ember-relics','clockwork-vault','phoenix-falls']]
];
const manifest={};
async function save(id,buffer,columns,host){
 const hash=createHash('sha256').update(buffer).digest('hex'),filename=`${id}-${hash.slice(0,12)}.webp`;
 await fs.writeFile(path.join(out,filename),buffer);
 manifest[id]={url:`/art/identity-v47/${filename}`,width:columns*256,height:256,columns,host,bytes:buffer.length,sha256:hash};
}
for(const [sheet,columns,games] of groups){
 const input=path.join(root,'design/identity-v47',`${sheet}.png`),meta=await sharp(input).metadata();
 // The painted rows have slightly asymmetric vertical gutters. Keep complete silhouettes.
 const y=sheet==='wilds'?[0,.25,.5,.745,1]:[0,250/1024,500/1024,740/1024,1];
 for(let row=0;row<games.length;row++){
  const cells=[];
  for(let col=0;col<columns;col++){
   const left=Math.round(col*meta.width/columns),right=Math.round((col+1)*meta.width/columns);
   const top=Math.round(y[row]*meta.height),bottom=Math.round(y[row+1]*meta.height);
   const inputCell=await sharp(input).extract({left,top,width:right-left,height:bottom-top}).resize(256,256,{fit:'contain',background:'#090c18'}).png().toBuffer();
   cells.push({input:inputCell,left:col*256,top:0});
  }
  const buffer=await sharp({create:{width:columns*256,height:256,channels:3,background:'#090c18'}}).composite(cells).webp({quality:84,effort:6}).toBuffer();
  await save(games[row],buffer,columns,columns-1);
 }
}
const keno=['orchard-numbers','neon-numbers','pearl-keno','meteor-keno','bamboo-keno'];
const input=path.join(root,'design/identity-v47/keno.png'),meta=await sharp(input).metadata();
for(let col=0;col<5;col++){
 const cells=[];
 for(let row=0;row<2;row++){
  const left=Math.round(col*meta.width/5),right=Math.round((col+1)*meta.width/5),top=Math.round(row*meta.height/2),bottom=Math.round((row+1)*meta.height/2);
  cells.push({input:await sharp(input).extract({left,top,width:right-left,height:bottom-top}).resize(256,256,{fit:'contain',background:'#090c18'}).png().toBuffer(),left:(1-row)*256,top:0});
 }
 await save(keno[col],await sharp({create:{width:512,height:256,channels:3,background:'#090c18'}}).composite(cells).webp({quality:84,effort:6}).toBuffer(),2,1);
}
await fs.writeFile(path.join(root,'apps/player/src/identity-art.json'),JSON.stringify(manifest,null,2)+'\n');
console.log(JSON.stringify({games:Object.keys(manifest).length,bytes:Object.values(manifest).reduce((n,m)=>n+m.bytes,0),largest:Math.max(...Object.values(manifest).map(m=>m.bytes))}));
