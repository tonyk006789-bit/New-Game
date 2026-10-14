// CC0 Quaternius source archive: see reports/dealer-models-v40.json.
// Repack only the used body/hair meshes and compact licensed textures into GLB.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const sharp=require('C:/Users/kcdre/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const source='.cache/dealer-models/Universal Base Characters[Standard]';
const output='apps/player/public/art/dealers';await fs.mkdir(output,{recursive:true});
const manifest={creator:'Quaternius',source:'https://quaternius.com/packs/universalbasecharacters.html',download:'https://quaternius.itch.io/universal-base-characters',license:'CC0-1.0',changes:'Compact GLB delivery, shirt/waistcoat materials, original casino styling and procedural joint animation',assets:[]};
for(const [key,relative] of [
 ['female','Base Characters/Godot - UE/Superhero_Female_FullBody.gltf'],['male','Base Characters/Godot - UE/Superhero_Male_FullBody.gltf'],
 ...['Hair_Long','Hair_Buns','Hair_SimpleParted','Hair_Beard'].map(n=>[n,`Hairstyles/Origin at 0/glTF (Godot)/${n}.gltf`])
]){
 const file=path.join(source,relative),dir=path.dirname(file),j=JSON.parse(await fs.readFile(file,'utf8'));
 const chunks=[];let length=0;
 const append=(b)=>{const pad=Buffer.alloc((4-b.length%4)%4);const offset=length;chunks.push(b,pad);length+=b.length+pad.length;return offset;};
 const old=await fs.readFile(path.join(dir,j.buffers[0].uri));append(old);
 for(const mesh of j.meshes){
  for(const p of mesh.primitives){for(const attr of Object.keys(p.attributes))if(attr.startsWith('COLOR')||(/TEXCOORD_/.test(attr)&&attr!=='TEXCOORD_0'))delete p.attributes[attr];}

 }
 // Keep diffuse maps, omit large normal/roughness maps. Soft lights supply form.
 const used=new Set();for(const m of j.materials){delete m.normalTexture;delete m.occlusionTexture;delete m.emissiveTexture;if(m.pbrMetallicRoughness){delete m.pbrMetallicRoughness.metallicRoughnessTexture;m.pbrMetallicRoughness.roughnessFactor=.8;if(m.pbrMetallicRoughness.baseColorTexture)used.add(m.pbrMetallicRoughness.baseColorTexture.index);}}
 const textures=[],images=[],remap=new Map();
 for(const t of used){const tex=j.textures[t],im=j.images[tex.source];const b=await sharp(path.join(dir,im.uri)).resize(im.name.includes('Superhero')?1024:256).png({palette:false,compressionLevel:9}).toBuffer();const view=j.bufferViews.length;j.bufferViews.push({buffer:0,byteOffset:append(b),byteLength:b.length});remap.set(t,textures.length);textures.push({source:images.length});images.push({name:im.name,bufferView:view,mimeType:'image/png'});}
 for(const m of j.materials){const t=m.pbrMetallicRoughness?.baseColorTexture;if(t)t.index=remap.get(t.index);}
 j.textures=textures;j.images=images;delete j.samplers;delete j.animations;j.buffers=[{byteLength:length}];
 const json=Buffer.from(JSON.stringify(j)),jsonPad=Buffer.alloc((4-json.length%4)%4,32),bin=Buffer.concat(chunks);
 const header=Buffer.alloc(20);header.writeUInt32LE(0x46546c67,0);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+jsonPad.length+bin.length,8);header.writeUInt32LE(json.length+jsonPad.length,12);header.writeUInt32LE(0x4e4f534a,16);
 const bh=Buffer.alloc(8);bh.writeUInt32LE(bin.length,0);bh.writeUInt32LE(0x004e4942,4);
 const glb=Buffer.concat([header,json,jsonPad,bh,bin]),sha256=createHash('sha256').update(glb).digest('hex');const name=`${key}-${sha256.slice(0,12)}.glb`;await fs.writeFile(`${output}/${name}`,glb);manifest.assets.push({key,url:`/art/dealers/${name}`,bytes:glb.length,sha256,original:relative});
}
await fs.copyFile(path.join(source,'License_Standard.txt'),`${output}/LICENSE.txt`);
await fs.writeFile('reports/dealer-models-v40.json',JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile('apps/player/src/dealer-models.json',JSON.stringify(Object.fromEntries(manifest.assets.map(a=>[a.key,a.url])),null,2)+'\n');
console.log(manifest.assets.map(a=>`${a.key}: ${Math.round(a.bytes/1024)} KiB`).join('\n'));
