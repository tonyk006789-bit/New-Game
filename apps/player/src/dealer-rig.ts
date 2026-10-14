import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import type {BlackjackGame,Card} from '@new-game/game-math';
import models from './dealer-models.json';
import {dealerPose,CARD_PICKUP,HAND_RELEASE,type Point3} from './dealer-motion';
import {CARD_RELEASE,CARD_LAND} from './blackjack-dealing';

export type DealerDelivery={id:number;startedAt?:number;kind:'deal'|'turn';card:Card|null;target:{x:number;y:number;width:number;height:number}};
const identity={
 'royal-blackjack':{body:'female',hair:['Hair_Long'],vest:0x161423,hairColor:0x73503b,tie:0xe9c778},
 'double-deck-blackjack':{body:'male',hair:['Hair_SimpleParted','Hair_Beard'],vest:0x521b38,hairColor:0x2b2229,tie:0xdfb177},
 'european-blackjack':{body:'female',hair:['Hair_Buns'],vest:0x172a48,hairColor:0x201c2a,tie:0x8bc3e7}
} as const;
const X=new T.Vector3(1,0,0),Y=new T.Vector3(0,1,0);
/** Two-bone IK with a stable elbow pole; the wrist cannot stretch the arm. */
export function elbowFor(shoulder:T.Vector3,target:T.Vector3,pole:T.Vector3,upper:number,lower:number){
 const axis=target.clone().sub(shoulder),distance=T.MathUtils.clamp(axis.length(),Math.abs(upper-lower)+.001,upper+lower-.001);axis.normalize();
 const along=(upper*upper-lower*lower+distance*distance)/(2*distance);
 const side=pole.clone().sub(shoulder);side.addScaledVector(axis,-side.dot(axis)).normalize();
 return {elbow:shoulder.clone().addScaledVector(axis,along).addScaledVector(side,Math.sqrt(Math.max(0,upper*upper-along*along))),wrist:shoulder.clone().addScaledVector(axis,distance)};
}
type Arm={upper:T.Object3D;lower:T.Object3D;hand:T.Object3D;upperLength:number;lowerLength:number;upperRest:T.Quaternion;lowerRest:T.Quaternion;upperAxis:T.Vector3;lowerAxis:T.Vector3};
export class DealerRig{
 readonly scene=new T.Scene();readonly camera=new T.OrthographicCamera();readonly renderer:T.WebGLRenderer;
 private body?:T.Group;private arms:Arm[]=[];private head?:T.Object3D;private headRest?:T.Quaternion;
 private spine?:T.Object3D;private spineRest?:T.Quaternion;private shadows:T.Mesh[]=[];
 private fingers:{bone:T.Object3D;rest:T.Quaternion;name:string}[]=[];
 private disposed=false;private width=1280;private height=500;
 private card:T.Mesh<T.PlaneGeometry,T.MeshStandardMaterial>;private cardFace?:T.CanvasTexture;private back:T.CanvasTexture;
 private target=new T.Vector3();private release=new T.Vector3();private reach:Point3=[...HAND_RELEASE];
 private heldQuaternion=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2);
 private delivery:DealerDelivery|null=null;
 constructor(private host:HTMLElement,private game:BlackjackGame){
  this.renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));this.renderer.setClearColor(0,0);this.renderer.outputColorSpace=T.SRGBColorSpace;
  this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.35;this.renderer.localClippingEnabled=true;host.append(this.renderer.domElement);
  this.camera.position.set(0,3,6.25);this.camera.lookAt(0,1,.25);
  this.scene.add(new T.HemisphereLight(0xe8efff,0x62526a,2.1));
  const key=new T.DirectionalLight(0xffeed7,3.2);key.position.set(-2,4,4);this.scene.add(key);
  const fill=new T.DirectionalLight(0xa4c8ff,1.3);fill.position.set(3,2,2);this.scene.add(fill);
  const rim=new T.DirectionalLight(identity[game].tie,2);rim.position.set(0,3,-2);this.scene.add(rim);
  this.back=this.cardTexture(null);
  this.card=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshStandardMaterial({map:this.back,roughness:.65,side:T.DoubleSide}));
  this.card.visible=false;this.card.renderOrder=3;this.scene.add(this.card);
  const deck=new T.Mesh(new T.BoxGeometry(.08,.025,.12),new T.MeshStandardMaterial({color:0xe8dbc0,roughness:.8}));deck.position.set(.38,1.135,.27);this.scene.add(deck);
  const top=new T.Mesh(new T.PlaneGeometry(.078,.118),new T.MeshStandardMaterial({map:this.back,side:T.DoubleSide}));top.rotation.x=-Math.PI/2;top.position.set(.38,1.149,.27);this.scene.add(top);
  const shoe=new T.Mesh(new T.BoxGeometry(.092,.014,.135),new T.MeshStandardMaterial({color:0x252136,metalness:.35,roughness:.45}));shoe.position.set(.38,1.117,.27);this.scene.add(shoe);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const c=canvas.getContext('2d')!,g=c.createRadialGradient(32,32,4,32,32,31);g.addColorStop(0,'#0008');g.addColorStop(1,'#0000');c.fillStyle=g;c.fillRect(0,0,64,64);const shadowTexture=new T.CanvasTexture(canvas);
  for(let i=0;i<2;i++){const shadow=new T.Mesh(new T.PlaneGeometry(.20,.23),new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=1.111;this.scene.add(shadow);this.shadows.push(shadow);}
 }
 async load(){
  const style=identity[this.game],loader=new GLTFLoader();
  // Embedded images use <img> decoding under img-src blob:, not bitmap fetch
  // under connect-src. Keep the hosted CSP unchanged.
  loader.register(parser=>({name:'DEALER_CSP_IMAGES',beforeRoot:async()=>{parser.textureLoader=new T.TextureLoader(parser.options.manager);}}));
  const loaded=await Promise.allSettled([loader.loadAsync(models[style.body]),...style.hair.map(h=>loader.loadAsync(models[h]))]);
  if(this.disposed||loaded.some(r=>r.status==='rejected')){for(const r of loaded)if(r.status==='fulfilled')this.disposeObject(r.value.scene);if(!this.disposed)throw new Error('Dealer model unavailable');return;}
  const results=loaded.map(r=>(r as PromiseFulfilledResult<Awaited<ReturnType<GLTFLoader['loadAsync']>>>).value);
  let missingTexture=false;
  for(const g of results)g.scene.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof T.MeshStandardMaterial&&!m.map)missingTexture=true;});
  // GLTFLoader can resolve a model after swallowing a failed image. Never show
  // that incomplete white character as a successfully loaded dealer.
  if(missingTexture){for(const g of results)this.disposeObject(g.scene);throw new Error('Dealer textures unavailable');}
  this.body=results[0].scene;this.scene.add(this.body);this.body.updateMatrixWorld(true);
  const clip=new T.Plane(new T.Vector3(0,1,0),-1.105);
  this.body.traverse(o=>{if(!(o instanceof T.Mesh))return;o.frustumCulled=false;
   for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!(m instanceof T.MeshStandardMaterial))continue;m.clippingPlanes=[clip];m.roughness=.85;
    if(m.name.startsWith('MI_Superhero')){
     // A rest-space cloth mask stays crisp across triangles and follows the skeleton.
     m.onBeforeCompile=shader=>{shader.uniforms.dealerVest={value:new T.Color(style.vest)};
      shader.vertexShader='varying vec3 vDealerRest;\n'+shader.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nvDealerRest=position;');
      shader.fragmentShader='varying vec3 vDealerRest; uniform vec3 dealerVest;\n'+shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
       float ax=abs(vDealerRest.x);float h=vDealerRest.y;
       if((h<${style.body==='male'?'1.535':'1.47'}||ax>.10)&&ax<${style.body==='male'?'.69':'.625'}){
        diffuseColor.rgb=vec3(.87,.89,.94);
        float edge=${style.body==='male'?'.225':'.17'};
        if(ax<edge&&h<${style.body==='male'?'1.51':'1.465'}&&!(h>1.24&&ax<(h-1.24)*.37))diffuseColor.rgb=dealerVest;
       }`);
     };m.customProgramCacheKey=()=>`dealer-cloth-${this.game}`;
    }
   }
  });
  this.head=this.body.getObjectByName('Head')!;this.headRest=this.head.quaternion.clone();
  this.spine=this.body.getObjectByName('spine_02')!;this.spineRest=this.spine.quaternion.clone();
  for(const g of results.slice(1)){this.scene.add(g.scene);this.head.attach(g.scene);g.scene.traverse(o=>{if(o instanceof T.Mesh){const m=o.material as T.MeshStandardMaterial;m.color.setHex(style.hairColor);m.roughness=.9;}});}
  for(const side of ['l','r']){
   const upper=this.body.getObjectByName(`upperarm_${side}`)!,lower=this.body.getObjectByName(`lowerarm_${side}`)!,hand=this.body.getObjectByName(`hand_${side}`)!;
   const a=upper.getWorldPosition(new T.Vector3()),b=lower.getWorldPosition(new T.Vector3()),c=hand.getWorldPosition(new T.Vector3());
   this.arms.push({upper,lower,hand,upperLength:a.distanceTo(b),lowerLength:b.distanceTo(c),upperRest:upper.getWorldQuaternion(new T.Quaternion()),lowerRest:lower.getWorldQuaternion(new T.Quaternion()),upperAxis:b.clone().sub(a).normalize(),lowerAxis:c.sub(b).normalize()});
   for(const name of ['index','middle','ring','pinky','thumb'])for(const n of ['01','02','03']){const bone=this.body.getObjectByName(`${name}_${n}_${side}`);if(bone)this.fingers.push({bone,rest:bone.quaternion.clone(),name:`${name}_${n}_${side}`});}
  }
  this.addUniform();this.resize();this.render(0);
 }
 private addUniform(){
  const style=identity[this.game],male=style.body==='male',chest=this.body!.getObjectByName('spine_03')!;
  const add=(mesh:T.Mesh)=>{this.scene.add(mesh);chest.attach(mesh);};
  const satin=new T.MeshStandardMaterial({color:style.tie,roughness:.55,metalness:.1});
  const knot=new T.Mesh(new T.SphereGeometry(.018,12,8),satin);knot.position.set(0,male?1.475:1.422,male?.115:.073);knot.scale.set(1,.7,.55);add(knot);
  for(const sign of [-1,1]){const bow=new T.Mesh(new T.ConeGeometry(.027,.042,3),satin);bow.rotation.z=sign*Math.PI/2;bow.position.set(sign*.027,male?1.475:1.422,male?.115:.073);bow.scale.z=.32;add(bow);}
  for(let i=0;i<3;i++){const button=new T.Mesh(new T.SphereGeometry(.006,10,6),new T.MeshStandardMaterial({color:0xd6b671,metalness:.7,roughness:.35}));button.position.set(0,1.27-i*.055,male?.133:.12);button.scale.z=.45;add(button);}
 }
 resize(){this.width=this.host.clientWidth||1280;this.height=this.host.clientHeight||500;const aspect=this.width/this.height;this.camera.left=-aspect;this.camera.right=aspect;this.camera.top=1;this.camera.bottom=-1;this.camera.updateProjectionMatrix();this.renderer.setSize(this.width,this.height,false);}
 private orient(bone:T.Object3D,world:T.Quaternion){const parent=bone.parent!.getWorldQuaternion(new T.Quaternion());bone.quaternion.copy(parent.invert().multiply(world));bone.updateWorldMatrix(false,true);}
 private arm(arm:Arm,target:T.Vector3,side:number,grip:number){
  const shoulder=arm.upper.getWorldPosition(new T.Vector3()),solution=elbowFor(shoulder,target,new T.Vector3(side*.28,.95,-.08),arm.upperLength,arm.lowerLength);
  this.orient(arm.upper,new T.Quaternion().setFromUnitVectors(arm.upperAxis,solution.elbow.clone().sub(shoulder).normalize()).multiply(arm.upperRest));
  this.orient(arm.lower,new T.Quaternion().setFromUnitVectors(arm.lowerAxis,solution.wrist.clone().sub(solution.elbow).normalize()).multiply(arm.lowerRest));
  const basis=new T.Matrix4().makeBasis(new T.Vector3(0,-side,0),new T.Vector3(0,0,1),new T.Vector3(-side,0,0));
  this.orient(arm.hand,new T.Quaternion().setFromRotationMatrix(basis).premultiply(new T.Quaternion().setFromAxisAngle(Y,side*.12*(1-grip))));
 }
 private fingerPose(grip:number){
  for(const f of this.fingers){const dealing=f.name.endsWith('_l'),g=dealing?grip:.22,thumb=f.name.startsWith('thumb');
   const angle=thumb?g*.28:(f.name.includes('_01')?.08:g*(f.name.startsWith('index')?.43:.61)+.08);
   f.bone.quaternion.copy(f.rest).multiply(new T.Quaternion().setFromAxisAngle(X,angle));
  }
 }
 private heldPosition(){return this.arms[0].hand.localToWorld(new T.Vector3(.025,this.game==='double-deck-blackjack'?.17:.15,.012));}
 start(delivery:DealerDelivery){
  this.delivery=delivery;this.cardFace?.dispose();this.cardFace=this.cardTexture(delivery.card);this.card.material.map=this.cardFace;this.card.material.needsUpdate=true;
  const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(delivery.target.x*2-1,1-delivery.target.y*2),this.camera);ray.ray.intersectPlane(new T.Plane(Y,-1.115),this.target);
  this.reach=[T.MathUtils.clamp(this.target.x,-.06,.26),1.16,.34];
  this.pose(CARD_RELEASE);this.release.copy(this.heldPosition());this.pose(0);
 }
 private pose(ms:number){if(!this.body)return;const p=dealerPose(ms,this.reach,this.delivery?.kind==='turn');this.spine!.quaternion.copy(this.spineRest!).multiply(new T.Quaternion().setFromAxisAngle(X,p.follow*3));this.body.updateMatrixWorld(true);
  this.arm(this.arms[0],new T.Vector3(...p.wrist),1,p.grip);this.arm(this.arms[1],new T.Vector3(-.29,1.155,.19),-1,.2);
  this.fingerPose(p.grip);this.head!.quaternion.copy(this.headRest!).multiply(new T.Quaternion().setFromEuler(new T.Euler(p.follow*4,p.follow*2,0)));this.body.updateMatrixWorld(true);
  for(let i=0;i<2;i++){const hand=this.arms[i].hand.getWorldPosition(new T.Vector3());this.shadows[i].position.set(hand.x,1.111,hand.z+.08);}
 }
 render(ms:number){
  if(this.disposed)return;this.pose(ms);const p=dealerPose(ms),d=this.delivery;
  this.card.visible=!!d&&d.kind==='deal'&&ms>=CARD_PICKUP&&ms<CARD_LAND;
  if(this.card.visible){
   if(ms<CARD_RELEASE){this.card.position.copy(this.heldPosition());this.card.quaternion.copy(this.heldQuaternion);this.card.scale.set(.076,.108,1);}
   else{this.card.position.lerpVectors(this.release,this.target,p.flight);this.card.position.y+=.035*Math.sin(p.flight*Math.PI);this.card.quaternion.slerpQuaternions(this.heldQuaternion,this.camera.quaternion,p.flight);const finalW=d!.target.width*2*this.width/this.height,finalH=d!.target.height*2;this.card.scale.set(T.MathUtils.lerp(.076,finalW,p.flight),T.MathUtils.lerp(.108,finalH,p.flight),1);}
  }
  this.renderer.render(this.scene,this.camera);
 }
 rest(){this.delivery=null;this.render(0);}
 private cardTexture(card:Card|null){
  const canvas=document.createElement('canvas');canvas.width=192;canvas.height=272;const c=canvas.getContext('2d')!;
  c.fillStyle=card?'#f7f1df':'#332340';c.fillRect(0,0,192,272);c.strokeStyle='#d5bb7e';c.lineWidth=5;c.strokeRect(6,6,180,260);
  if(card){const suit=['♠','♥','♦','♣'][card.suit],rank=card.rank===1?'A':card.rank>10?['J','Q','K'][card.rank-11]:String(card.rank);c.fillStyle=card.suit===1||card.suit===2?'#a51e36':'#242134';c.font='bold 37px Georgia';c.fillText(rank,16,44);c.font='30px Georgia';c.fillText(suit,16,77);c.font='80px Georgia';c.textAlign='center';c.fillText(suit,96,165);c.save();c.translate(192,272);c.rotate(Math.PI);c.font='bold 37px Georgia';c.textAlign='left';c.fillText(rank,16,44);c.font='30px Georgia';c.fillText(suit,16,77);c.restore();}
  else{c.strokeStyle='#bb9f6b66';c.lineWidth=1;for(let n=-272;n<192;n+=12){c.beginPath();c.moveTo(n,0);c.lineTo(n+272,272);c.stroke();}c.fillStyle='#e3cd96';c.font='66px Georgia';c.textAlign='center';c.fillText('♠',96,158);}
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return texture;
 }
 private disposeObject(object:T.Object3D){const textures=new Set<T.Texture>();object.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const value of Object.values(m))if(value instanceof T.Texture)textures.add(value);m.dispose();}}});for(const texture of textures)texture.dispose();}
 dispose(){if(this.disposed)return;this.disposed=true;this.cardFace?.dispose();this.back.dispose();this.disposeObject(this.scene);this.renderer.dispose();this.renderer.domElement.remove();}
}
