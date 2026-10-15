// Microsoft Rocketbox MIT assets. Download manifest/provenance: reports/dealer-models-v41.json.
// Asset-only FBX conversion; no code from the source repository is executed.
import fs from 'node:fs/promises';
import path from 'node:path';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import * as T from 'three';
import {FBXLoader} from 'three/addons/loaders/FBXLoader.js';
import {TGALoader} from 'three/addons/loaders/TGALoader.js';
import {GLTFExporter} from 'three/addons/exporters/GLTFExporter.js';
import {mergeVertices} from 'three/addons/utils/BufferGeometryUtils.js';
const require=createRequire(import.meta.url);
const sharp=require('C:/Users/kcdre/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
// GLTFExporter's buffer-only path needs FileReader, not a browser or image canvas.
globalThis.FileReader=class{readAsArrayBuffer(blob){blob.arrayBuffer().then(b=>{this.result=b;this.onloadend?.();});}readAsDataURL(blob){blob.arrayBuffer().then(b=>{this.result=`data:${blob.type};base64,${Buffer.from(b).toString('base64')}`;this.onloadend?.();});}};
const picks={'royal-blackjack':'Business_Female_04','double-deck-blackjack':'Business_Male_03','european-blackjack':'Business_Female_02'};
const output='apps/player/public/art/dealers';
const manifest={creator:'Microsoft / Rocketbox',source:'https://github.com/microsoft/Microsoft-Rocketbox',license:'MIT',changes:'Game-ready GLB conversion; selected facial shapes; indexed geometry; compressed skin/fabric/normal maps; original dealing animation and lighting.',assets:[]};
const ab=b=>b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength);
for(const [key,name] of Object.entries(picks)){
 const source=`.cache/rocketbox/${name}`,input=await fs.readFile(`${source}/Export/${name}_facial.fbx`);
 const manager=new T.LoadingManager();manager.addHandler(/\.tga$/i,{path:'',setPath(p){this.path=p;return this;},load(file){const t=new T.Texture();t.userData.file=file;return t;}});
 const body=new FBXLoader(manager).parse(ab(input),'');body.animations=[];body.scale.setScalar(.01);body.name='Dealer';
 const materialSources=new Map();
 body.traverse(o=>{if(!o.isMesh)return;
  const geo=o.geometry,names=o.morphTargetDictionary||{};
  const wanted=Object.keys(names).filter(n=>/AK_09_EyeBlinkLeft|AK_10_EyeBlinkRight|AK_11_EyeLookDownLeft|AK_12_EyeLookDownRight|AK_\d+_MouthSmile(Left|Right)/.test(n));
  const old=geo.morphAttributes.position;geo.morphAttributes={};
  if(old)geo.morphAttributes.position=wanted.map(n=>{const a=old[names[n]];a.name=n.split('.').pop();return a;});
  o.morphTargetDictionary=Object.fromEntries(wanted.map((n,i)=>[n.split('.').pop(),i]));o.morphTargetInfluences=wanted.map(()=>0);
  for(const attr of Object.keys(geo.attributes))if(!['position','normal','uv','skinIndex','skinWeight'].includes(attr))geo.deleteAttribute(attr);
  const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,1-uv.getY(i));
  o.geometry=mergeVertices(geo,1e-5);o.geometry.morphAttributes.position?.forEach((a,i)=>{a.name=wanted[i].split('.').pop();});o.updateMorphTargets();
  const replace=m=>{materialSources.set(m.name,{color:m.map?.userData.file,normal:m.normalMap?.userData.file});return new T.MeshStandardMaterial({name:m.name,color:0xffffff,roughness:m.name.includes('head')?.58:.82,metalness:0,side:m.name.includes('opacity')?T.DoubleSide:T.FrontSide});};
  o.material=Array.isArray(o.material)?o.material.map(replace):replace(o.material);
 });
 body.updateMatrixWorld(true);
 const j=await new GLTFExporter().parseAsync(body,{binary:false,onlyVisible:true,trs:true});
 const chunks=[],sourceHashes=[],images=[],textures=[];let length=0;
 const append=b=>{const offset=length,pad=Buffer.alloc((4-b.length%4)%4);chunks.push(b,pad);length+=b.length+pad.length;return offset;};
 append(Buffer.from(j.buffers[0].uri.split(',')[1],'base64'));
 async function texture(file,normal=false){
  if(!file)return undefined;
  const raw=await fs.readFile(path.join(source,'Textures',path.basename(file)));
  sourceHashes.push({file,sha256:createHash('sha256').update(raw).digest('hex')});
  const tga=new TGALoader().parse(ab(raw)),alpha=/opacity/.test(file),size=/head/.test(file)&&!normal?2048:/glasses/.test(file)?512:1024;
  let im=sharp(tga.data,{raw:{width:tga.width,height:tga.height,channels:4}}).resize({width:size,height:size,fit:'inside',withoutEnlargement:true});
  // Keep transparency in hair/glasses; ordinary skin and normals need no alpha.
  const bytes=await(alpha?im.png({compressionLevel:9,palette:true,quality:95,colors:256}):im.removeAlpha().jpeg({quality:normal?88:88,chromaSubsampling:normal?'4:4:4':'4:2:0'})).toBuffer();
  const view=j.bufferViews.length;j.bufferViews.push({buffer:0,byteOffset:append(bytes),byteLength:bytes.length});
  const idx=textures.length;textures.push({source:images.length,sampler:0});images.push({name:file,bufferView:view,mimeType:alpha?'image/png':'image/jpeg'});return idx;
 }
 for(const m of j.materials){const refs=materialSources.get(m.name);m.pbrMetallicRoughness.baseColorTexture={index:await texture(refs.color)};
  if(refs.normal)m.normalTexture={index:await texture(refs.normal,true),scale:.65};
  if(m.name.includes('opacity')){m.alphaMode='MASK';m.alphaCutoff=.38;m.doubleSided=true;m.pbrMetallicRoughness.roughnessFactor=.72;}
  if(m.name.includes('glasses')){m.alphaMode='BLEND';delete m.alphaCutoff;m.pbrMetallicRoughness.roughnessFactor=.22;}
 }
 j.images=images;j.textures=textures;j.samplers=[{magFilter:9729,minFilter:9987,wrapS:10497,wrapT:10497}];j.buffers=[{byteLength:length}];j.asset.copyright='Copyright (c) 2020 Microsoft. MIT License; see ROCKETBOX-LICENSE.txt.';
 const json=Buffer.from(JSON.stringify(j)),pad=Buffer.alloc((4-json.length%4)%4,32),bin=Buffer.concat(chunks),header=Buffer.alloc(20),bh=Buffer.alloc(8);
 header.writeUInt32LE(0x46546c67);header.writeUInt32LE(2,4);header.writeUInt32LE(28+json.length+pad.length+bin.length,8);header.writeUInt32LE(json.length+pad.length,12);header.writeUInt32LE(0x4e4f534a,16);bh.writeUInt32LE(bin.length);bh.writeUInt32LE(0x004e4942,4);
 const glb=Buffer.concat([header,json,pad,bh,bin]),sha256=createHash('sha256').update(glb).digest('hex'),file=`${key}-v41-${sha256.slice(0,12)}.glb`;
 await fs.writeFile(`${output}/${file}`,glb);manifest.assets.push({key,url:`/art/dealers/${file}`,bytes:glb.length,sha256,original:`Assets/Avatars/Professions/${name}`,sourceFbxSha256:createHash('sha256').update(input).digest('hex'),sourceTextures:sourceHashes});
 console.log(`${key}: ${(glb.length/1048576).toFixed(2)} MiB, ${j.meshes.reduce((n,m)=>n+m.primitives.length,0)} primitives`);
}
await fs.copyFile('.cache/rocketbox/LICENSE.md',`${output}/ROCKETBOX-LICENSE.txt`);
await fs.writeFile('reports/dealer-models-v41.json',JSON.stringify(manifest,null,2)+'\n');
await fs.writeFile('apps/player/src/dealer-models.json',JSON.stringify(Object.fromEntries(manifest.assets.map(a=>[a.key,a.url])),null,2)+'\n');
