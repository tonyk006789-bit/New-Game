// Bake model-specific contact solves outside the player's rendering thread.
import {build} from 'esbuild';
import * as T from 'three';
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL} from 'node:url';
import path from 'node:path';
const temporary=path.resolve('.local/dealer-hand-calibration.mjs');
await build({entryPoints:['apps/player/src/dealer-hand.ts'],outfile:temporary,bundle:true,platform:'node',format:'esm',packages:'external'});
const {DealerHand}=await import(pathToFileURL(temporary));
const models=JSON.parse(await fs.readFile('apps/player/src/dealer-models.json','utf8')),result={};
for(const [game,url] of Object.entries(models)){
 const b=await fs.readFile('apps/player/public'+url),j=JSON.parse(b.toString('utf8',20,20+b.readUInt32LE(12)));
 const nodes=j.nodes.map(n=>{const o=new T.Object3D();o.name=n.name;if(n.matrix)o.applyMatrix4(new T.Matrix4().fromArray(n.matrix));else{if(n.translation)o.position.fromArray(n.translation);if(n.rotation)o.quaternion.fromArray(n.rotation);if(n.scale)o.scale.fromArray(n.scale);}return o;});
 j.nodes.forEach((n,i)=>n.children?.forEach(c=>nodes[i].add(nodes[c])));const root=new T.Group();j.scenes[j.scene||0].nodes.forEach(i=>root.add(nodes[i]));root.updateMatrixWorld(true);
 result[game]={sha256:createHash('sha256').update(b).digest('hex')};
 for(const side of ['L','R'])result[game][side]=new DealerHand(root.getObjectByName('Bip01_'+side+'_Hand'),root,side).calibration();
}
await fs.writeFile('apps/player/src/dealer-hands.json',JSON.stringify(result,null,2)+'\n');
console.log('Baked six hand calibrations for three unchanged dealer assets.');
