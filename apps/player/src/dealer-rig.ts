import * as T from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RectAreaLightUniformsLib} from 'three/addons/lights/RectAreaLightUniformsLib.js';
import type {BlackjackGame,Card} from '@new-game/game-math';
import models from './dealer-models.json';
import {dealerPose,dealerLife,dealerExpression,cardFlight,CARD_PICKUP,HAND_RELEASE,type Point3} from './dealer-motion';
import {CARD_RELEASE,CARD_LAND} from './blackjack-dealing';
import {DealerHand} from './dealer-hand';
import handCalibrations from './dealer-hands.json';
import {createBlackjackTable} from './blackjack-table';
import {drawPlayingCard} from './blackjack-cards';

export type DealerDelivery={id:number;startedAt?:number;kind:'deal'|'turn';card:Card|null;target:{x:number;y:number;width:number;height:number}};
const identity={
 'royal-blackjack':{rim:0xe9c778,phase:0},
 'double-deck-blackjack':{rim:0xdfb177,phase:1.7},
 'european-blackjack':{rim:0x8bc3e7,phase:3.1}
} as const;
const Y=new T.Vector3(0,1,0);
const VIEW_HEIGHT=1.5;
let areaLightReady=false;
/** Two-bone IK with a stable elbow pole; the wrist cannot stretch the arm. */
export function elbowFor(shoulder:T.Vector3,target:T.Vector3,pole:T.Vector3,upper:number,lower:number){
 const axis=target.clone().sub(shoulder),distance=T.MathUtils.clamp(axis.length(),Math.abs(upper-lower)+.001,upper+lower-.001);axis.normalize();
 const along=(upper*upper-lower*lower+distance*distance)/(2*distance);
 const side=pole.clone().sub(shoulder);side.addScaledVector(axis,-side.dot(axis)).normalize();
 return {elbow:shoulder.clone().addScaledVector(axis,along).addScaledVector(side,Math.sqrt(Math.max(0,upper*upper-along*along))),wrist:shoulder.clone().addScaledVector(axis,distance)};
}
type Arm={upper:T.Object3D;lower:T.Object3D;hand:T.Object3D;upperLength:number;lowerLength:number;upperRest:T.Quaternion;lowerRest:T.Quaternion;upperAxis:T.Vector3;lowerAxis:T.Vector3;handOffset:T.Quaternion};
export class DealerRig{
 readonly scene=new T.Scene();readonly camera=new T.OrthographicCamera();readonly renderer:T.WebGLRenderer;
 private body?:T.Group;private arms:Arm[]=[];private head?:T.Object3D;private headRest?:T.Quaternion;
 private spine?:T.Object3D;private spineRest?:T.Quaternion;private shadows:T.Mesh[]=[];
 readonly hands:DealerHand[]=[];
 private faces:T.Mesh[]=[];
 private environment?:T.WebGLRenderTarget;
 private disposed=false;private width=1280;private height=500;
 private card:T.Mesh<T.PlaneGeometry,T.MeshStandardMaterial>;private cardFace?:T.CanvasTexture;private back:T.CanvasTexture;
 private target=new T.Vector3();private release=new T.Vector3();private reach:Point3=[...HAND_RELEASE];
 private releaseVelocity=new T.Vector3();
 private flightShadow:T.Mesh<T.PlaneGeometry,T.MeshBasicMaterial>;
 private heldQuaternion=new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),-Math.PI/2);
 private delivery:DealerDelivery|null=null;
 constructor(private host:HTMLElement,private game:BlackjackGame){
  this.renderer=new T.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
  this.renderer.setPixelRatio(Math.min(devicePixelRatio,2));this.renderer.setClearColor(0,0);this.renderer.outputColorSpace=T.SRGBColorSpace;
  this.renderer.toneMapping=T.ACESFilmicToneMapping;this.renderer.toneMappingExposure=1.03;this.renderer.localClippingEnabled=true;host.append(this.renderer.domElement);
  this.renderer.shadowMap.enabled=true;this.renderer.shadowMap.type=T.PCFShadowMap;
  this.camera.position.set(0,3.14,6.25);this.camera.lookAt(0,1.14,.25);
  // Prefilter room illumination once per renderer; a broad softbox supplements
  // the shadow-casting key without bloom or full-screen postprocessing.
  const room=new RoomEnvironment(),pmrem=new T.PMREMGenerator(this.renderer);
  this.environment=pmrem.fromScene(room,.04,.1,100,{size:128});this.scene.environment=this.environment.texture;this.scene.environmentIntensity=.30;room.dispose();pmrem.dispose();
  this.scene.add(new T.HemisphereLight(0xe8efff,0x463538,.22));
  const key=new T.DirectionalLight(0xfff0e2,1.25);key.position.set(-2.2,3.1,3);key.target.position.set(0,1.4,0);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-1.6;key.shadow.camera.right=1.6;key.shadow.camera.top=1.3;key.shadow.camera.bottom=-1.3;key.shadow.camera.near=.1;key.shadow.camera.far=7;key.shadow.normalBias=.002;key.shadow.bias=-.0001;this.scene.add(key,key.target);
  if(!areaLightReady){RectAreaLightUniformsLib.init();areaLightReady=true;}
  const softbox=new T.RectAreaLight(0xffecdf,2.3,1.6,1.2);softbox.position.set(-.7,2.3,2);softbox.lookAt(0,1.4,0);this.scene.add(softbox);
  const fill=new T.DirectionalLight(0xdce8ff,.32);fill.position.set(3,2,2);this.scene.add(fill);
  const rim=new T.DirectionalLight(identity[game].rim,.48);rim.position.set(0,3,-2);this.scene.add(rim);
  this.scene.add(createBlackjackTable(game));
  this.back=this.cardTexture(null);
  // The held and DOM faces use the same neutral paper colors, without a light
  // exposure jump when ownership passes to the accessible table card.
  this.card=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshStandardMaterial({map:this.back,roughness:.9,side:T.DoubleSide}));
  this.card.visible=false;this.card.renderOrder=3;this.scene.add(this.card);
  const deck=new T.Mesh(new T.BoxGeometry(.08,.025,.12),new T.MeshStandardMaterial({color:0xe8dbc0,roughness:.8}));deck.position.set(.38,1.135,.27);this.scene.add(deck);
  const top=new T.Mesh(new T.PlaneGeometry(.078,.118),new T.MeshStandardMaterial({map:this.back,side:T.DoubleSide}));top.rotation.x=-Math.PI/2;top.position.set(.38,1.149,.27);this.scene.add(top);
  const shoe=new T.Mesh(new T.BoxGeometry(.092,.014,.135),new T.MeshStandardMaterial({color:0x252136,metalness:.35,roughness:.45}));shoe.position.set(.38,1.117,.27);this.scene.add(shoe);
  const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const c=canvas.getContext('2d')!,g=c.createRadialGradient(32,32,4,32,32,31);g.addColorStop(0,'#0008');g.addColorStop(1,'#0000');c.fillStyle=g;c.fillRect(0,0,64,64);const shadowTexture=new T.CanvasTexture(canvas);
  for(let i=0;i<2;i++){const shadow=new T.Mesh(new T.PlaneGeometry(.20,.23),new T.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false}));shadow.rotation.x=-Math.PI/2;shadow.position.y=1.111;this.scene.add(shadow);this.shadows.push(shadow);}
  this.flightShadow=new T.Mesh(new T.PlaneGeometry(1,1),new T.MeshBasicMaterial({map:shadowTexture,transparent:true,opacity:.4,depthWrite:false}));this.flightShadow.rotation.x=-Math.PI/2;this.flightShadow.visible=false;this.scene.add(this.flightShadow);
 }
 async load(){
  const loader=new GLTFLoader();
  loader.register(parser=>({name:'DEALER_CSP_IMAGES',beforeRoot:async()=>{parser.textureLoader=new T.TextureLoader(parser.options.manager);}}));
  const result=await loader.loadAsync(models[this.game]);
  if(this.disposed){this.disposeObject(result.scene);return;}
  let missingTexture=false;
  result.scene.traverse(o=>{if(o instanceof T.Mesh)for(const m of Array.isArray(o.material)?o.material:[o.material])if(m instanceof T.MeshStandardMaterial&&!m.map)missingTexture=true;});
  if(missingTexture){this.disposeObject(result.scene);throw new Error('Dealer textures unavailable');}
  this.body=result.scene;this.scene.add(this.body);this.body.updateMatrixWorld(true);
  const clip=new T.Plane(new T.Vector3(0,1,0),-1.105);
  this.body.traverse(o=>{if(!(o instanceof T.Mesh))return;o.frustumCulled=false;o.castShadow=true;o.receiveShadow=true;
   if(o.morphTargetDictionary)this.faces.push(o);
   for(const m of Array.isArray(o.material)?o.material:[o.material]){if(!(m instanceof T.MeshStandardMaterial))continue;
    m.clippingPlanes=[clip];m.clipShadows=true;m.envMapIntensity=1;
    for(const texture of [m.map,m.normalMap,m.roughnessMap])if(texture)texture.anisotropy=Math.min(4,this.renderer.capabilities.getMaxAnisotropy());
    if(m.name.includes('opacity')){m.alphaToCoverage=true;m.depthWrite=true;}
    if(m.name.includes('glasses')){m.transparent=true;m.depthWrite=false;m.alphaToCoverage=false;m.alphaTest=0;}
    if(m instanceof T.MeshPhysicalMaterial&&m.name.includes('head')){m.specularIntensity=.6;m.roughness=1;m.normalScale.multiplyScalar(.85);}
   }
  });
  this.head=this.body.getObjectByName('Bip01_Head')!;this.headRest=this.head.quaternion.clone();
  this.spine=this.body.getObjectByName('Bip01_Spine2')!;this.spineRest=this.spine.quaternion.clone();
  for(const side of ['L','R'] as const){
   const bone=(suffix:string)=>this.body!.getObjectByName('Bip01_'+side+'_'+suffix)!;
   const upper=bone('UpperArm'),lower=bone('Forearm'),hand=bone('Hand');
   const a=upper.getWorldPosition(new T.Vector3()),b=lower.getWorldPosition(new T.Vector3()),c=hand.getWorldPosition(new T.Vector3());
   const index=bone('Finger1').getWorldPosition(new T.Vector3()),pinky=bone('Finger4').getWorldPosition(new T.Vector3()),middle=bone('Finger2').getWorldPosition(new T.Vector3());
   const forward=middle.clone().sub(c).normalize(),lateral=index.clone().sub(pinky);lateral.addScaledVector(forward,-lateral.dot(forward)).normalize();
   const normal=forward.clone().cross(lateral).normalize();
   const palm=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(lateral,normal,forward));
   const handOffset=palm.invert().multiply(hand.getWorldQuaternion(new T.Quaternion()));
   this.arms.push({upper,lower,hand,upperLength:a.distanceTo(b),lowerLength:b.distanceTo(c),upperRest:upper.getWorldQuaternion(new T.Quaternion()),lowerRest:lower.getWorldQuaternion(new T.Quaternion()),upperAxis:b.clone().sub(a).normalize(),lowerAxis:c.clone().sub(b).normalize(),handOffset});
   this.hands.push(new DealerHand(hand,this.body,side,handCalibrations[this.game][side]));
  }
  this.resize();this.pose(0,0);await this.renderer.compileAsync(this.scene,this.camera);if(!this.disposed)this.render(0,0);
 }
 resize(){this.width=this.host.clientWidth||1280;this.height=this.host.clientHeight||500;const aspect=this.width/this.height;this.camera.left=-aspect*VIEW_HEIGHT/2;this.camera.right=aspect*VIEW_HEIGHT/2;this.camera.top=VIEW_HEIGHT/2;this.camera.bottom=-VIEW_HEIGHT/2;this.camera.updateProjectionMatrix();
  const displayedScale=this.host.getBoundingClientRect().width/this.width||1;
  this.renderer.setPixelRatio(Math.min(2,Math.sqrt(2_100_000/(this.width*this.height)),Math.max(1,devicePixelRatio*displayedScale)));this.renderer.setSize(this.width,this.height,false);
 }
 private orient(bone:T.Object3D,world:T.Quaternion){const parent=bone.parent!.getWorldQuaternion(new T.Quaternion());bone.quaternion.copy(parent.invert().multiply(world));bone.updateWorldMatrix(false,true);}
 private arm(arm:Arm,target:T.Vector3,side:number,roll:number){
  const shoulder=arm.upper.getWorldPosition(new T.Vector3()),solution=elbowFor(shoulder,target,new T.Vector3(side*.30,1.04,-.08),arm.upperLength,arm.lowerLength);
  this.orient(arm.upper,new T.Quaternion().setFromUnitVectors(arm.upperAxis,solution.elbow.clone().sub(shoulder).normalize()).multiply(arm.upperRest));
  this.orient(arm.lower,new T.Quaternion().setFromUnitVectors(arm.lowerAxis,solution.wrist.clone().sub(solution.elbow).normalize()).multiply(arm.lowerRest));
  const forward=new T.Vector3(-side*.15,-.08,1).normalize(),lateral=new T.Vector3(-side,0,0);lateral.addScaledVector(forward,-lateral.dot(forward)).normalize();
  const normal=forward.clone().cross(lateral).normalize(),q=new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(lateral,normal,forward));
  q.premultiply(new T.Quaternion().setFromAxisAngle(forward,roll*side));
  this.orient(arm.hand,q.multiply(arm.handOffset));
 }
 private heldPosition(){return this.hands[0].cardPosition();}
 start(delivery:DealerDelivery){
  this.delivery=delivery;this.cardFace?.dispose();this.cardFace=this.cardTexture(delivery.card);this.card.material.map=this.cardFace;this.card.material.needsUpdate=true;
  const ray=new T.Raycaster();ray.setFromCamera(new T.Vector2(delivery.target.x*2-1,1-delivery.target.y*2),this.camera);ray.ray.intersectPlane(new T.Plane(Y,-1.115),this.target);
  this.reach=delivery.kind==='turn'?[T.MathUtils.clamp(this.target.x,-.12,.30),1.16,T.MathUtils.clamp(this.target.z-.06,.25,.43)]:[T.MathUtils.clamp(this.target.x,-.06,.26),1.16,.34];
  const clock=delivery.startedAt??0;
  this.pose(CARD_RELEASE-1,clock+CARD_RELEASE-1);this.releaseVelocity.copy(this.heldPosition());
  this.pose(CARD_RELEASE,clock+CARD_RELEASE);this.release.copy(this.heldPosition());this.releaseVelocity.subVectors(this.release,this.releaseVelocity);this.heldQuaternion.copy(this.hands[0].cardQuaternion());this.pose(0,clock);
 }
 private pose(ms:number,clock:number){if(!this.body)return;const p=dealerPose(ms,this.reach,this.delivery?.kind==='turn'),life=dealerLife(clock,identity[this.game].phase);
  this.spine!.quaternion.copy(this.spineRest!).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,0,1),p.follow*.5+life.breath));this.body.updateMatrixWorld(true);
  this.arm(this.arms[0],new T.Vector3(...p.wrist),1,p.roll);this.arm(this.arms[1],new T.Vector3(-.27,1.155+life.breath*.6,.19+p.follow*.1),-1,-.04);
  this.hands[0].pose(ms,!!this.delivery,1.108);this.hands[1].pose(0,false,1.108);
  this.head!.quaternion.copy(this.headRest!).multiply(new T.Quaternion().setFromEuler(new T.Euler(life.look*.3,p.follow*2,life.look+p.follow)));
  for(const face of this.faces)for(const [name,index] of Object.entries(face.morphTargetDictionary!)){
   face.morphTargetInfluences![index]=dealerExpression(name,clock,identity[this.game].phase,p.grip);
  }
  this.body.updateMatrixWorld(true);
  for(let i=0;i<2;i++){const hand=this.arms[i].hand.getWorldPosition(new T.Vector3());this.shadows[i].position.set(hand.x,1.111,hand.z+.08);}
 }
 render(ms:number,clock=0){
  if(this.disposed)return;this.pose(ms,clock);const p=dealerPose(ms),d=this.delivery;
  this.card.visible=!!d&&ms>=(d.kind==='turn'?CARD_RELEASE:CARD_PICKUP)&&ms<CARD_LAND;
  this.flightShadow.visible=this.card.visible;
  if(this.card.visible){
   const finalW=d!.target.width*VIEW_HEIGHT*this.width/this.height,finalH=d!.target.height*VIEW_HEIGHT;
   if(d!.kind==='turn'){
    const u=p.flight;this.card.material.map=u<.5?this.back:this.cardFace!;this.card.position.copy(this.target);this.card.position.y+=.018*Math.sin(Math.PI*u);
    this.card.quaternion.copy(this.camera.quaternion).multiply(new T.Quaternion().setFromAxisAngle(Y,Math.PI*(u<.5?u:u-1)));this.card.scale.set(finalW,finalH,1);
   }else if(ms<CARD_RELEASE){this.card.position.copy(this.heldPosition());this.card.quaternion.copy(this.hands[0].cardQuaternion());this.card.scale.set(.076,.108,1);}
   else{this.card.position.fromArray(cardFlight(this.release.toArray(),this.target.toArray(),this.releaseVelocity.toArray(),ms));this.card.quaternion.slerpQuaternions(this.heldQuaternion,this.camera.quaternion,p.flight);this.card.scale.set(T.MathUtils.lerp(.076,finalW,p.flight),T.MathUtils.lerp(.108,finalH,p.flight),1);}
   this.flightShadow.position.set(this.card.position.x,1.112,this.card.position.z);this.flightShadow.scale.set(this.card.scale.x*1.5,this.card.scale.y*1.4,1);this.flightShadow.material.opacity=T.MathUtils.clamp(.46-(this.card.position.y-1.115)*2,.12,.46);
  }
  this.renderer.render(this.scene,this.camera);
 }
 rest(clock=0){this.delivery=null;this.render(0,clock);}
 private cardTexture(card:Card|null){
  const canvas=document.createElement('canvas');canvas.width=240;canvas.height=336;drawPlayingCard(canvas.getContext('2d')!,card);
  const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;return texture;
 }
 private disposeObject(object:T.Object3D){const textures=new Set<T.Texture>();object.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const value of Object.values(m))if(value instanceof T.Texture)textures.add(value);m.dispose();}}});for(const texture of textures)texture.dispose();}
 dispose(){if(this.disposed)return;this.disposed=true;this.cardFace?.dispose();this.back.dispose();this.disposeObject(this.scene);this.scene.traverse(o=>{if(o instanceof T.DirectionalLight)o.shadow.dispose();});this.environment?.dispose();this.scene.environment=null;this.renderer.dispose();this.renderer.domElement.remove();}
}
